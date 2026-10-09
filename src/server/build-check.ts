// `npm run build`: after tsc, bundle the web shell and every mod's client/server half
// exactly as the runtime would, so a broken mod fails CI instead of the browser.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bus } from '../core/bus.ts';
import { ModRuntime } from '../core/runtime.ts';
import { webAssets } from './web-build.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'um-build-'));
let failed = 0;

const web = await webAssets(path.join(ROOT, 'src/web'), (...a) => {
  console.error(...a);
  failed++;
}).get('/app.js');
console.log(`web shell: ${((web?.body.length ?? 0) / 1024).toFixed(0)} KB`);

for (const provider of ['claude', 'codex'] as const) {
  const rt = new ModRuntime({
    modDirs: [path.join(ROOT, 'mods')],
    dataDir: tmp,
    provider,
    bus: new Bus(() => ({}) as any),
    makeContext: () => ({}) as any,
  });
  for (const m of rt.discover()) {
    const dir = (m as any).__dir as string;
    rt.mods.set(m.id, { manifest: m, dir, enabled: true, loadedAt: 0, hasClient: !!m.client });
    await rt.load(m.id);
    const loaded = rt.mods.get(m.id)!;
    if (loaded.error) {
      console.error(`✗ [${provider}] ${m.id}: ${loaded.error}`);
      failed++;
    } else console.log(`✓ [${provider}] ${m.id}`);
  }
  rt.close();
}
fs.rmSync(tmp, { recursive: true, force: true });
if (failed) process.exit(1);
process.exit(0);
