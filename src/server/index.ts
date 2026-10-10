// universalMods server entry.
//   npm run dev -- [--provider claude|codex] [--data ./data] [--port 4477] [--host 127.0.0.1] [--mods ./more-mods]
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProviderId } from '../core/types.ts';
import { providers } from '../providers/index.ts';
import { Floor } from './floor.ts';
import { Hive } from './hive.ts';
import { createServer } from './http.ts';
import { webAssets } from './web-build.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function args() {
  const a = process.argv.slice(2);
  const get = (k: string) => {
    const i = a.indexOf(`--${k}`);
    return i >= 0 ? a[i + 1] : undefined;
  };
  return {
    provider: get('provider') as ProviderId | undefined,
    data: path.resolve(get('data') ?? process.env.UM_DATA ?? path.join(ROOT, 'data')),
    port: Number(get('port') ?? process.env.PORT ?? 4477),
    host: get('host') ?? '127.0.0.1',
    agentMode: (get('agent-mode') === 'stream' ? 'stream' : 'pty') as 'pty' | 'stream',
    workspace: get('workspace') ? path.resolve(get('workspace')!) : undefined,
    mods: (get('mods') ?? '').split(',').filter(Boolean).map((p) => path.resolve(p)),
    token: process.env.UM_TOKEN ?? randomBytes(16).toString('hex'),
  };
}

async function main() {
  const o = args();
  if (o.provider && !providers[o.provider]) throw new Error(`--provider must be claude or codex`);
  const url = `http://${o.host === '0.0.0.0' ? '127.0.0.1' : o.host}:${o.port}`;
  let floor: Floor | undefined;
  let broadcast: (m: Record<string, unknown>) => void = () => {};

  const getFloor = () => {
    if (!floor) throw new Error('floor not set up yet: POST /api/setup {provider}');
    return floor;
  };

  const startFloor = async (provider: ProviderId) => {
    const existing = Hive.readFloor(o.data);
    // One provider per floor: never mix Claude and Codex in the same data dir.
    if (existing && existing.provider !== provider) {
      throw new Error(`data dir ${o.data} is a ${existing.provider} floor; use --data <other dir> for a ${provider} floor`);
    }
    if (!existing) Hive.writeFloor(o.data, { provider, name: path.basename(o.data), createdAt: Date.now() });
    floor = new Floor({ dataDir: o.data, provider, modDirs: [path.join(ROOT, 'mods'), path.join(o.data, 'mods'), ...o.mods], url, token: o.token, workspace: o.workspace, agentMode: o.agentMode, broadcast: (m) => broadcast(m) });
    await floor.boot();
    console.log(`[floor] ${provider} floor ready (${o.data})`);
  };

  const assets = webAssets(path.join(ROOT, 'src/web'), console.log);
  const { server, broadcast: b } = createServer(
    () => {
      return getFloor();
    },
    o.token,
    assets,
    {
      setupState: async () =>
        floor
          ? undefined
          : {
              setup: true,
              dataDir: o.data,
              checks: { claude: await providers.claude.check(), codex: await providers.codex.check() },
            },
      setup: async (provider: string) => {
        if (floor) throw new Error(`floor already running (${floor.o.provider})`);
        if (!providers[provider as ProviderId]) throw new Error('provider must be claude or codex');
        await startFloor(provider as ProviderId);
        broadcast({ type: 'reload' });
      },
    },
  );
  broadcast = b;

  const preset = o.provider ?? Hive.readFloor(o.data)?.provider;
  if (preset) await startFloor(preset);

  server.listen(o.port, o.host, () => {
    console.log(`\n  universalMods → ${url}/?token=${o.token}\n`);
    if (o.host !== '127.0.0.1' && o.host !== 'localhost')
      console.log('  ⚠ listening beyond localhost: agents run with no limits; anyone with the token controls this machine.\n');
  });

  const stop = async () => {
    await floor?.shutdown();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
