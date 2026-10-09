// HTTP + WebSocket API. Browser UI, mods' client halves, and the agent-side
// bridges (bin/hive-mcp.mjs, bin/um-hook.mjs) all talk to this.
import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import type { Floor } from './floor.ts';
import { handleHook } from './hookbridge.ts';
import { HIVE_TOOLS, handleMcpTool } from './mcp-tools.ts';
import type { WebAssets } from './web-build.ts';

type Handler = (req: http.IncomingMessage, body: any, params: string[], url: URL) => Promise<unknown> | unknown;

export interface SetupHooks {
  setupState(): Promise<Record<string, unknown> | undefined>;
  setup(provider: string): Promise<void>;
}

export function createServer(getFloor: () => Floor, token: string, assets: WebAssets, setup: SetupHooks) {
  const routes: [string, RegExp, Handler][] = [];
  const route = (method: string, pattern: string, h: Handler) =>
    routes.push([method, new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$'), h]);
  const F = getFloor;

  route('POST', '/api/setup', (_q, b) => setup.setup(String(b.provider)));
  route('GET', '/api/state', async () => {
    const pending = await setup.setupState();
    if (pending) return pending;
    const f = F();
    return {
      floor: { provider: f.o.provider, dataDir: f.o.dataDir, halted: f.halted, check: await f.provider.check() },
      agents: f.list(),
      tasks: f.hive.tasks,
      board: f.hive.board,
      messages: f.hive.messages.slice(-200),
      mods: f.runtime.list(),
      skills: f.skills(),
      status: Object.fromEntries(f.status),
      questions: f.questionList(),
      commands: [...f.commands].map(([name, c]) => ({ name, ...c })),
    };
  });
  route('GET', '/api/agents/:id/events', (_q, _b, [id], url) => F().hive.eventsFor(id, Number(url.searchParams.get('limit') ?? 500)));
  route('GET', '/api/agents/:id/config', (_q, _b, [id]) => F().agentConfig(id));
  route('POST', '/api/agents', (_q, b) => F().spawn(b ?? {}, 'user'));
  route('POST', '/api/agents/:id/send', (_q, b, [id]) => F().send(id, String(b.text ?? ''), 'user'));
  route('POST', '/api/agents/:id/steer', (_q, b, [id]) => F().steer(id, String(b.text ?? '')));
  route('POST', '/api/agents/:id/interrupt', (_q, _b, [id]) => F().interrupt(id));
  route('POST', '/api/agents/:id/kill', (_q, _b, [id]) => F().kill(id));
  route('POST', '/api/agents/:id/hold', (_q, b, [id]) => F().hold(id, !!b.held));
  route('POST', '/api/agents/:id/archive', (_q, _b, [id]) => F().archive(id));
  route('POST', '/api/tasks', (_q, b) => F().addTask(b, 'user'));
  route('PATCH', '/api/tasks/:id', (_q, b, [id]) => F().updateTask(id, b, 'user'));
  route('DELETE', '/api/tasks/:id', (_q, _b, [id]) => {
    F().hive.deleteTask(id);
    F().o.broadcast({ type: 'tasks', tasks: F().hive.tasks });
  });
  route('PUT', '/api/board', (_q, b) => F().setBoard(String(b.text ?? ''), 'user'));
  route('POST', '/api/messages', (_q, b) => F().message('user', String(b.to), String(b.text ?? '')));
  route('POST', '/api/questions/:id', (_q, b, [id]) => F().answer(id, String(b.answer ?? '')));
  route('POST', '/api/floor/halt', (_q, b) => F().halt(!!b.on));
  route('POST', '/api/mods/:id', (_q, b, [id]) => F().runtime.setEnabled(id, !!b.enabled));
  route('POST', '/api/mods/:id/press', (_q, b, [id]) => F().bus.emit('ui.press', { mod: id, key: String(b.key), payload: b.payload }, () => null, { only: id }));
  route('POST', '/api/commands/:name', (_q, b, [name]) => F().runCommand(decodeURIComponent(name), String(b.args ?? ''), 'user'));
  // Agent-side bridges.
  route('GET', '/api/hive-tools', () => ({ tools: HIVE_TOOLS }));
  route('POST', '/api/hook', (_q, b) => handleHook(F(), b));
  route('POST', '/api/mcp/:tool', (_q, b, [tool]) => handleMcpTool(F(), tool, b.agentId, b.args ?? {}));

  const authed = (req: http.IncomingMessage, url: URL) => {
    const got = String(req.headers['x-um-token'] ?? url.searchParams.get('token') ?? '');
    return got.length === token.length && timingSafeEqual(Buffer.from(got), Buffer.from(token));
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    try {
      // Static shell (token is checked by the API, the shell itself is not secret).
      if (req.method === 'GET' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/mods/')) {
        const asset = await assets.get(url.pathname);
        if (asset) return send(res, 200, asset.body, asset.type);
        return send(res, 404, 'not found', 'text/plain');
      }
      if (!authed(req, url)) return send(res, 401, { error: 'bad or missing token' });
      const m = url.pathname.match(/^\/mods\/([^/]+)\/client\.js$/);
      if (m && req.method === 'GET') {
        return send(res, 200, await F().runtime.buildClient(decodeURIComponent(m[1])), 'text/javascript');
      }
      for (const [method, re, h] of routes) {
        const mm = req.method === method && url.pathname.match(re);
        if (!mm) continue;
        const body = req.method === 'GET' ? undefined : await readBody(req);
        const out = await h(req, body, mm.slice(1).map(decodeURIComponent), url);
        return send(res, 200, out ?? { ok: true });
      }
      send(res, 404, { error: 'no route' });
    } catch (e: any) {
      send(res, 400, { error: String(e?.message ?? e) });
    }
  });

  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<WebSocket>();
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://x');
    if (url.pathname !== '/ws' || !authed(req, url)) return socket.destroy();
    wss.handleUpgrade(req, socket, head, (ws) => {
      clients.add(ws);
      ws.on('close', () => clients.delete(ws));
    });
  });

  const broadcast = (msg: Record<string, unknown>) => {
    const s = JSON.stringify(msg);
    for (const c of clients) if (c.readyState === 1) c.send(s);
  };

  return { server, broadcast };
}

function send(res: http.ServerResponse, code: number, body: unknown, type = 'application/json') {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (d) => {
      s += d;
      if (s.length > 10_000_000) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolve(s ? JSON.parse(s) : {});
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
  });
}
