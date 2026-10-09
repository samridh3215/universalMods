import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** Serialise a JSON value as an inline TOML value (for `codex -c key=value`). */
export function toToml(v: unknown): string {
  if (v === null || v === undefined) return '""';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return `[${v.map(toToml).join(', ')}]`;
  if (typeof v === 'object') {
    const parts = Object.entries(v as Record<string, unknown>)
      .filter(([, x]) => x !== undefined)
      .map(([k, x]) => `${tomlKey(k)} = ${toToml(x)}`);
    return `{ ${parts.join(', ')} }`;
  }
  return JSON.stringify(String(v));
}

export function tomlKey(k: string): string {
  return /^[A-Za-z0-9_-]+$/.test(k) ? k : JSON.stringify(k);
}

/** Render a flat { 'a.b': value } map as a config.toml document (for inspection files). */
export function toTomlDoc(overrides: Record<string, unknown>): string {
  return Object.entries(overrides)
    .map(([k, v]) => `${k.split('.').map(tomlKey).join('.')} = ${toToml(v)}`)
    .join('\n') + '\n';
}

/** Split a JSONL stream into parsed objects. Non-JSON lines go to onText. */
export function lineReader(onJson: (o: any) => void, onText?: (s: string) => void) {
  let buf = '';
  return (chunk: Buffer | string) => {
    buf += chunk.toString();
    let i: number;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      try {
        onJson(JSON.parse(line));
      } catch {
        onText?.(line);
      }
    }
  };
}

/** Resolve a binary on PATH (plus ./node_modules/.bin). */
export function which(bin: string): string | undefined {
  if (path.isAbsolute(bin)) return fs.existsSync(bin) ? bin : undefined;
  const dirs = [...(process.env.PATH ?? '').split(path.delimiter), path.resolve('node_modules/.bin')];
  for (const d of dirs) {
    const p = path.join(d, bin);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export function versionOf(bin: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const p = spawn(bin, ['--version'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('error', () => resolve(undefined));
    p.on('close', () => resolve(out.trim() || undefined));
  });
}

/** Expose skills by symlinking each skill folder into `dest` (falls back to copy). */
export function linkSkills(skills: string[], dest: string): string[] {
  fs.mkdirSync(dest, { recursive: true });
  const written: string[] = [];
  for (const src of skills) {
    const target = path.join(dest, path.basename(src));
    try {
      fs.rmSync(target, { recursive: true, force: true });
      fs.symlinkSync(src, target, 'dir');
    } catch {
      fs.cpSync(src, target, { recursive: true });
    }
    written.push(target);
  }
  return written;
}

export function writeFile(file: string, content: string): string {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}
