// Tiny JSON file helpers + a per-mod persisted key/value store.
import fs from 'node:fs';
import path from 'node:path';

export function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/** Atomic write: write to a temp file then rename, so readers never see half a file. */
export function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

export class KeyValueStore {
  private cache = new Map<string, Record<string, unknown>>();
  constructor(private dir: string) {}

  private file(mod: string) {
    return path.join(this.dir, `${mod.replace(/[^\w.-]/g, '_')}.json`);
  }

  private load(mod: string) {
    let m = this.cache.get(mod);
    if (!m) {
      m = readJson<Record<string, unknown>>(this.file(mod), {});
      this.cache.set(mod, m);
    }
    return m;
  }

  get<T>(mod: string, key: string, init: T): T {
    const m = this.load(mod);
    return (key in m ? m[key] : init) as T;
  }

  set<T>(mod: string, key: string, value: T): void {
    const m = this.load(mod);
    m[key] = value;
    writeJson(this.file(mod), m);
  }
}

/** Session-scoped (in-memory) state, survives mod hot reloads but not server restarts. */
export class SessionState {
  private data = new Map<string, unknown>();
  get<T>(mod: string, key: string, init: T): T {
    const k = `${mod}:${key}`;
    if (!this.data.has(k)) this.data.set(k, init);
    return this.data.get(k) as T;
  }
  set<T>(mod: string, key: string, value: T): void {
    this.data.set(`${mod}:${key}`, value);
  }
}
