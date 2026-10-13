// Projects: a named workspace folder plus reference files/folders and notes.
// Agents assigned to a project work in its workspace and are told about its references.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface Project {
  id: string;
  name: string;
  /** Absolute path of the folder agents work in. */
  workspace: string;
  /** Absolute paths of files or folders agents should read for context. */
  references: string[];
  /** Free-form brief for agents (markdown). */
  notes: string;
  createdAt: number;
}

export type ProjectInput = Partial<Pick<Project, 'name' | 'workspace' | 'references' | 'notes'>>;

const expand = (p: string) => path.resolve(p.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? '~'));

/** What is at a path: used to validate inputs and shown next to each reference. */
export function inspectPath(p: string): { path: string; kind: 'dir' | 'file' | 'missing' } {
  const abs = expand(p);
  try {
    return { path: abs, kind: fs.statSync(abs).isDirectory() ? 'dir' : 'file' };
  } catch {
    return { path: abs, kind: 'missing' };
  }
}

export class ProjectStore {
  private file: string;
  private items: Project[];

  constructor(dataDir: string) {
    this.file = path.join(dataDir, 'projects.json');
    try {
      this.items = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch {
      this.items = [];
    }
  }

  list(): Project[] {
    return this.items.map((p) => ({ ...p, references: [...p.references] }));
  }

  /** By id or (case-insensitive) name. */
  get(idOrName: string | undefined): Project | undefined {
    if (!idOrName) return undefined;
    const k = idOrName.toLowerCase();
    return this.items.find((p) => p.id === idOrName || p.name.toLowerCase() === k);
  }

  must(idOrName: string): Project {
    const p = this.get(idOrName);
    if (!p) throw new Error(`no project "${idOrName}"`);
    return p;
  }

  create(input: ProjectInput): Project {
    const p: Project = { id: `p-${randomUUID().slice(0, 8)}`, name: '', workspace: '', references: [], notes: '', createdAt: Date.now() };
    this.apply(p, input, true);
    this.items.push(p);
    this.save();
    return p;
  }

  update(id: string, input: ProjectInput): Project {
    const p = this.must(id);
    const next = { ...p, references: [...p.references] };
    this.apply(next, input, false);
    Object.assign(p, next);
    this.save();
    return p;
  }

  remove(id: string) {
    const p = this.must(id);
    this.items = this.items.filter((x) => x.id !== p.id);
    this.save();
  }

  private apply(p: Project, input: ProjectInput, creating: boolean) {
    if (input.name !== undefined || creating) {
      const name = String(input.name ?? '').trim();
      if (!name) throw new Error('give the project a name');
      if (this.items.some((x) => x.id !== p.id && x.name.toLowerCase() === name.toLowerCase())) throw new Error(`a project called "${name}" already exists`);
      p.name = name;
    }
    if (input.workspace !== undefined || creating) {
      const w = inspectPath(String(input.workspace ?? ''));
      if (!String(input.workspace ?? '').trim() || w.kind !== 'dir') throw new Error(`workspace must be an existing folder: ${w.path}`);
      p.workspace = w.path;
    }
    if (input.references !== undefined) {
      if (!Array.isArray(input.references)) throw new Error('references must be a list of paths');
      const refs = input.references.map(String).filter((r) => r.trim()).map(inspectPath);
      const missing = refs.filter((r) => r.kind === 'missing');
      if (missing.length) throw new Error(`not found: ${missing.map((r) => r.path).join(', ')}`);
      p.references = [...new Set(refs.map((r) => r.path))];
    }
    if (input.notes !== undefined) p.notes = String(input.notes);
  }

  private save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.items, null, 2) + '\n');
  }
}

/** The project part of an agent's instructions. */
export function projectBrief(p: Project, toolName: string): string {
  const refs = p.references.length ? p.references.map((r) => `- ${r}${inspectPath(r).kind === 'dir' ? '/' : ''}`).join('\n') : '- (none yet)';
  return `You are assigned to the project "${p.name}".
Workspace (your working directory): ${p.workspace}
Reference files and folders. Read what is relevant before you start; they are context, so don't edit them unless asked:
${refs}
${p.notes.trim() ? `Project notes:\n${p.notes.trim()}\n` : ''}References can change while you work; call ${toolName} for the current list.`;
}
