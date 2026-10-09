// Mod runtime: discovers mods, loads server halves (bundled with esbuild so
// TS/TSX just works), bundles client halves for the browser, and hot-reloads
// a mod when any file under its folder changes.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { Bus } from './bus.ts';
import { readJson, writeJson } from './store.ts';
import type { ModContext, ModManifest, On, ProviderId, Register } from './types.ts';

export interface LoadedMod {
  manifest: ModManifest;
  dir: string;
  enabled: boolean;
  loadedAt: number;
  error?: string;
  hasClient: boolean;
}

export interface RuntimeOptions {
  modDirs: string[];
  dataDir: string;
  provider: ProviderId;
  bus: Bus;
  /** Builds the `$` handed to hooks; runtime only needs it for timer cleanup bookkeeping. */
  makeContext: (mod: string, timers: Set<NodeJS.Timeout>) => ModContext;
  onChange?: (mod: string, kind: 'loaded' | 'unloaded' | 'error') => void;
  log?: (...a: unknown[]) => void;
}

// Client mods import from 'universal-mods' / 'react'; both resolve to globals the shell exposes.
const CLIENT_SHIMS: Record<string, string> = {
  'universal-mods': 'module.exports = window.__UM__;',
  react: 'module.exports = window.__UM__.React;',
  'react/jsx-runtime': 'module.exports = window.__UM__.jsxRuntime;',
  'react-dom': 'module.exports = window.__UM__.ReactDOM;',
};

export class ModRuntime {
  mods = new Map<string, LoadedMod>();
  private timers = new Map<string, Set<NodeJS.Timeout>>();
  private clientCache = new Map<string, string>();
  private watchers: fs.FSWatcher[] = [];
  private debounce = new Map<string, NodeJS.Timeout>();
  private enabledFile: string;
  private buildDir: string;

  constructor(private o: RuntimeOptions) {
    this.enabledFile = path.join(o.dataDir, 'mods.json');
    this.buildDir = path.join(o.dataDir, '.build');
  }

  discover(): ModManifest[] {
    const out: ModManifest[] = [];
    for (const root of this.o.modDirs) {
      if (!fs.existsSync(root)) continue;
      for (const name of fs.readdirSync(root)) {
        const dir = path.join(root, name);
        const mf = path.join(dir, 'mod.json');
        if (!fs.existsSync(mf)) continue;
        const m = readJson<ModManifest | null>(mf, null);
        if (!m?.id) continue;
        if (m.provider && m.provider !== this.o.provider) continue;
        out.push({ ...m, server: m.server ?? (exists(dir, 'server.ts') ?? exists(dir, 'server.js')), client: m.client ?? (exists(dir, 'client.tsx') ?? exists(dir, 'client.jsx')) });
        (out[out.length - 1] as any).__dir = dir;
      }
    }
    return out;
  }

  private overrides(): Record<string, boolean> {
    return readJson(this.enabledFile, {});
  }

  async loadAll(): Promise<void> {
    const ov = this.overrides();
    for (const m of this.discover()) {
      const dir = (m as any).__dir as string;
      const enabled = ov[m.id] ?? m.enabled ?? true;
      this.mods.set(m.id, { manifest: m, dir, enabled, loadedAt: 0, hasClient: !!m.client });
      if (enabled) await this.load(m.id);
    }
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const mod = this.mods.get(id);
    if (!mod) throw new Error(`unknown mod ${id}`);
    const ov = this.overrides();
    ov[id] = enabled;
    writeJson(this.enabledFile, ov);
    mod.enabled = enabled;
    if (enabled) await this.load(id);
    else this.unload(id);
  }

  unload(id: string): void {
    this.o.bus.unregisterMod(id);
    for (const t of this.timers.get(id) ?? []) clearTimeout(t), clearInterval(t);
    this.timers.delete(id);
    this.clientCache.delete(id);
    this.o.onChange?.(id, 'unloaded');
  }

  async load(id: string): Promise<void> {
    const mod = this.mods.get(id);
    if (!mod) return;
    this.unload(id);
    mod.error = undefined;
    const timers = new Set<NodeJS.Timeout>();
    this.timers.set(id, timers);
    try {
      if (mod.manifest.server) {
        const entry = path.join(mod.dir, mod.manifest.server);
        const outfile = path.join(this.buildDir, `${id}.${Date.now()}.mjs`);
        await esbuild.build({
          entryPoints: [entry],
          outfile,
          bundle: true,
          platform: 'node',
          format: 'esm',
          packages: 'external',
          logLevel: 'silent',
        });
        const exp = await import(pathToFileURL(outfile).href);
        fs.rmSync(outfile, { force: true });
        const register: Register | undefined = exp.register ?? exp.default;
        if (typeof register !== 'function') throw new Error('server module must export register(on, options)');
        // Make sure the context exists before hooks fire.
        this.o.makeContext(id, timers);
        const on: On = ((event: any, a: any, b?: any) =>
          b ? this.o.bus.register(id, event, a, b) : this.o.bus.register(id, event, undefined, a)) as On;
        await register(on, mod.manifest.options ?? {});
      }
      if (mod.manifest.client) await this.buildClient(id);
      mod.loadedAt = Date.now();
      this.o.onChange?.(id, 'loaded');
    } catch (err: any) {
      mod.error = String(err?.message ?? err);
      this.o.log?.(`[mods] ${id} failed:`, mod.error);
      this.o.bus.unregisterMod(id);
      this.o.onChange?.(id, 'error');
    }
  }

  async buildClient(id: string): Promise<string> {
    const mod = this.mods.get(id);
    if (!mod?.manifest.client) throw new Error(`mod ${id} has no client`);
    const cached = this.clientCache.get(id);
    if (cached) return cached;
    const res = await esbuild.build({
      entryPoints: [path.join(mod.dir, mod.manifest.client)],
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'browser',
      jsx: 'automatic',
      logLevel: 'silent',
      plugins: [
        {
          name: 'um-shims',
          setup(b) {
            b.onResolve({ filter: /^(universal-mods|react|react\/jsx-runtime|react-dom)$/ }, (a) => ({ path: a.path, namespace: 'um-shim' }));
            b.onLoad({ filter: /.*/, namespace: 'um-shim' }, (a) => ({ contents: CLIENT_SHIMS[a.path], loader: 'js' }));
          },
        },
      ],
    });
    const code = res.outputFiles[0].text;
    this.clientCache.set(id, code);
    return code;
  }

  watch(): void {
    for (const root of this.o.modDirs) {
      if (!fs.existsSync(root)) continue;
      const w = fs.watch(root, { recursive: true }, (_ev, file) => {
        if (!file) return;
        const folder = String(file).split(path.sep)[0];
        const mod = [...this.mods.values()].find((m) => path.basename(m.dir) === folder && path.dirname(m.dir) === root);
        if (!mod) {
          // New mod folder: rediscover.
          clearTimeout(this.debounce.get(`new:${folder}`));
          this.debounce.set(`new:${folder}`, setTimeout(() => this.rediscover(), 300));
          return;
        }
        const id = mod.manifest.id;
        clearTimeout(this.debounce.get(id));
        this.debounce.set(
          id,
          setTimeout(async () => {
            const fresh = readJson<ModManifest | null>(path.join(mod.dir, 'mod.json'), null);
            if (fresh) mod.manifest = { ...mod.manifest, ...fresh };
            if (mod.enabled) {
              this.o.log?.(`[mods] reloading ${id}`);
              await this.load(id);
            }
          }, 200),
        );
      });
      this.watchers.push(w);
    }
  }

  private async rediscover() {
    const ov = this.overrides();
    for (const m of this.discover()) {
      if (this.mods.has(m.id)) continue;
      const dir = (m as any).__dir as string;
      const enabled = ov[m.id] ?? m.enabled ?? true;
      this.mods.set(m.id, { manifest: m, dir, enabled, loadedAt: 0, hasClient: !!m.client });
      if (enabled) await this.load(m.id);
      else this.o.onChange?.(m.id, 'unloaded');
    }
  }

  list() {
    return [...this.mods.values()].map((m) => ({
      id: m.manifest.id,
      name: m.manifest.name,
      description: m.manifest.description,
      enabled: m.enabled,
      error: m.error,
      hasClient: m.hasClient,
      hasServer: !!m.manifest.server,
      version: m.loadedAt,
    }));
  }

  close(): void {
    for (const w of this.watchers) w.close();
    for (const id of this.mods.keys()) this.unload(id);
  }
}

function exists(dir: string, f: string): string | undefined {
  return fs.existsSync(path.join(dir, f)) ? f : undefined;
}
