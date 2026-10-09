// Codex provider: one `codex app-server` (JSON-RPC over stdio) per agent, one thread each.
import { spawn, type ChildProcess } from 'node:child_process';
import type { Provider, ProviderSession, StartContext } from '../types.ts';
import { lineReader, toToml, versionOf, which } from '../util.ts';
import { buildCodexConfig, writeCodexConfig } from './config.ts';
import { newCodexState, normalizeCodex } from './normalize.ts';

const BIN = process.env.UM_CODEX_BIN ?? 'codex';

class RpcClient {
  private id = 0;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  constructor(
    private proc: ChildProcess,
    onNotify: (method: string, params: any) => void,
    onRequest: (method: string, params: any) => Promise<any>,
    log: (...a: unknown[]) => void,
  ) {
    proc.stdout!.on(
      'data',
      lineReader(
        async (msg) => {
          if (msg.id !== undefined && msg.method === undefined) {
            const p = this.pending.get(msg.id);
            if (!p) return;
            this.pending.delete(msg.id);
            if (msg.error) p.reject(new Error(msg.error.message ?? JSON.stringify(msg.error)));
            else p.resolve(msg.result);
          } else if (msg.id !== undefined && msg.method) {
            try {
              this.write({ id: msg.id, result: await onRequest(msg.method, msg.params) });
            } catch (e: any) {
              this.write({ id: msg.id, error: { code: -32603, message: String(e?.message ?? e) } });
            }
          } else if (msg.method) onNotify(msg.method, msg.params);
        },
        (line) => log('[codex]', line),
      ),
    );
    proc.on('close', () => {
      for (const p of this.pending.values()) p.reject(new Error('codex app-server exited'));
      this.pending.clear();
    });
  }
  private write(o: unknown) {
    if (this.proc.stdin?.writable) this.proc.stdin.write(JSON.stringify(o) + '\n');
  }
  request<T = any>(method: string, params: unknown): Promise<T> {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.write({ method, id, params });
    });
  }
  notify(method: string, params: unknown) {
    this.write({ method, params });
  }
}

const textInput = (text: string) => [{ type: 'text', text, text_elements: [] }];

export const codexProvider: Provider = {
  id: 'codex',

  async check() {
    const bin = which(BIN);
    if (!bin) return { ok: false, bin: BIN, error: '`codex` not found on PATH. Install: npm i -g @openai/codex && codex login' };
    return { ok: true, bin, version: await versionOf(bin) };
  },

  buildConfig: buildCodexConfig,
  writeConfig: writeCodexConfig,

  async start(ctx: StartContext): Promise<ProviderSession> {
    const c = ctx.config;
    const args: string[] = [];
    if (c.bypassHookTrust) args.push('--dangerously-bypass-hook-trust');
    args.push('app-server');
    for (const [k, v] of Object.entries(c.overrides ?? {})) args.push('-c', `${k}=${toToml(v)}`);
    args.push(...(c.extraArgs ?? []));

    const proc = spawn(BIN, args, { cwd: ctx.agent.cwd, env: { ...process.env, ...ctx.env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let errBuf = '';
    proc.stderr!.on('data', (d) => (errBuf = (errBuf + d).slice(-4000)));
    const st = newCodexState();
    let threadId: string | undefined;
    let turnId: string | undefined;
    let killed = false;

    const rpc = new RpcClient(
      proc,
      (method, params) => {
        if (params?.threadId && threadId && params.threadId !== threadId) return; // subagent threads
        for (const ev of normalizeCodex(method, params, st)) {
          if (ev.kind === 'turn') turnId = ev.phase === 'start' ? ev.turnId : undefined;
          ctx.emit(ev);
        }
      },
      async (method, params) => {
        // Only reached when a mod/config lowers approvalPolicy below "never".
        if (method === 'item/commandExecution/requestApproval' || method === 'execCommandApproval') {
          const d = await ctx.approve('shell', { command: params.command, cwd: params.cwd, reason: params.reason });
          if (method === 'execCommandApproval') return { decision: d.decision === 'allow' ? 'approved' : 'denied' };
          return { decision: d.decision === 'allow' ? 'accept' : 'decline' };
        }
        if (method === 'item/fileChange/requestApproval' || method === 'applyPatchApproval') {
          const d = await ctx.approve('apply_patch', params);
          if (method === 'applyPatchApproval') return { decision: d.decision === 'allow' ? 'approved' : 'denied' };
          return { decision: d.decision === 'allow' ? 'accept' : 'decline' };
        }
        throw new Error(`universalMods does not handle ${method}`);
      },
      ctx.log,
    );

    proc.on('error', (e) => ctx.emit({ kind: 'error', message: `codex failed to start: ${e.message}` }));
    proc.on('close', (code) => {
      if (turnId) ctx.emit({ kind: 'turn', phase: killed ? 'abort' : 'fail', error: errBuf.trim().split('\n').slice(-3).join('\n') || `exit ${code}` });
      else if (!killed && code) ctx.emit({ kind: 'error', message: errBuf.trim().split('\n').slice(-5).join('\n') || `codex exited ${code}` });
      turnId = undefined;
      ctx.onExit(code);
    });

    await rpc.request('initialize', { clientInfo: { name: 'universal_mods', title: 'universalMods', version: '0.1.0' }, capabilities: null });
    rpc.notify('initialized', {});
    const threadParams = { cwd: ctx.agent.cwd, ...c.thread };
    const res = ctx.resume
      ? await rpc.request('thread/resume', { threadId: ctx.resume, ...threadParams, excludeTurns: true })
      : await rpc.request('thread/start', threadParams);
    threadId = res.thread.id;
    // thread/resume emits no thread/started notification; report the id ourselves.
    if (ctx.resume) ctx.emit({ kind: 'session', sessionId: threadId! });

    const startTurn = async (text: string) => {
      const r = await rpc.request('turn/start', { threadId, input: textInput(text), ...(c.turn?.effort ? { effort: c.turn.effort } : {}) });
      turnId = r?.turn?.id ?? turnId;
    };

    const session: ProviderSession = {
      async send(text) {
        try {
          await startTurn(text);
        } catch (e: any) {
          ctx.emit({ kind: 'turn', phase: 'fail', error: e.message });
        }
      },
      async steer(text) {
        if (!turnId) return session.send(text);
        await rpc.request('turn/steer', { threadId, input: textInput(text), expectedTurnId: turnId }).catch((e) => ctx.emit({ kind: 'error', message: `steer failed: ${e.message}` }));
      },
      async interrupt() {
        if (turnId) await rpc.request('turn/interrupt', { threadId, turnId }).catch(() => proc.kill('SIGINT'));
      },
      async kill() {
        killed = true;
        proc.stdin?.end();
        proc.kill('SIGTERM');
        setTimeout(() => proc.exitCode === null && proc.kill('SIGKILL'), 3000);
      },
    };
    return session;
  },
};
