// Hive: the floor's shared, file-backed state (Munder-Difflin-style).
//   data/floor.json      provider + floor settings
//   data/registry.json   agents
//   data/tasks.json      kanban
//   data/board.md        shared plan
//   data/log.jsonl       floor-level log (spawn, message, task, …)
//   data/agents/<id>/events.jsonl   per-agent normalized event stream
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readJson, writeJson } from '../core/store.ts';
import type { AgentInfo, HiveMessage, ProviderId, StampedEvent, Task } from '../core/types.ts';

export interface FloorConfig {
  provider: ProviderId;
  name: string;
  createdAt: number;
}

const RING = 2000;

export class Hive {
  readonly agentsDir: string;
  agents = new Map<string, AgentInfo>();
  tasks: Task[];
  board: string;
  messages: HiveMessage[] = [];
  private events = new Map<string, StampedEvent[]>();
  // Seeded from the clock so seqs stay increasing across server restarts.
  private seq = Date.now() * 100;

  constructor(readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
    this.agentsDir = path.join(dir, 'agents');
    for (const a of readJson<AgentInfo[]>(this.f('registry.json'), [])) {
      // Processes do not survive a restart; agents come back stopped and resume on demand.
      this.agents.set(a.id, { ...a, status: a.status === 'stopped' || a.archived ? a.status : 'stopped' });
    }
    this.tasks = readJson<Task[]>(this.f('tasks.json'), []);
    this.board = fs.existsSync(this.f('board.md')) ? fs.readFileSync(this.f('board.md'), 'utf8') : '# Board\n\nShared plan for this floor.\n';
    this.messages = readJson<HiveMessage[]>(this.f('messages.json'), []);
  }

  private f(name: string) {
    return path.join(this.dir, name);
  }

  static readFloor(dir: string): FloorConfig | undefined {
    return readJson<FloorConfig | undefined>(path.join(dir, 'floor.json'), undefined);
  }

  static writeFloor(dir: string, cfg: FloorConfig) {
    writeJson(path.join(dir, 'floor.json'), cfg);
  }

  agentDir(id: string) {
    return path.join(this.agentsDir, id);
  }

  saveAgents() {
    writeJson(this.f('registry.json'), [...this.agents.values()]);
  }

  log(kind: string, data: Record<string, unknown>) {
    fs.appendFileSync(this.f('log.jsonl'), JSON.stringify({ ts: Date.now(), kind, ...data }) + '\n');
  }

  // ── events ────────────────────────────────────────────────────────────
  pushEvent(agentId: string, event: StampedEvent['event']): StampedEvent {
    let ring = this.events.get(agentId);
    if (!ring) this.events.set(agentId, (ring = this.loadEvents(agentId)));
    // Never go backwards relative to what is already on disk (restart within the same ms).
    this.seq = Math.max(this.seq, ring.at(-1)?.seq ?? 0);
    const se: StampedEvent = { seq: ++this.seq, ts: Date.now(), agentId, event };
    // Coalesce streaming text deltas in memory/disk; live clients still get every delta.
    if (!(event.kind === 'text' && event.delta)) {
      ring.push(se);
      if (ring.length > RING) ring.splice(0, ring.length - RING);
      fs.mkdirSync(this.agentDir(agentId), { recursive: true });
      fs.appendFileSync(path.join(this.agentDir(agentId), 'events.jsonl'), JSON.stringify(se) + '\n');
    }
    return se;
  }

  private loadEvents(agentId: string): StampedEvent[] {
    const file = path.join(this.agentDir(agentId), 'events.jsonl');
    if (!fs.existsSync(file)) return [];
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n').slice(-RING);
    const out: StampedEvent[] = [];
    for (const l of lines) {
      try {
        out.push(JSON.parse(l));
      } catch {}
    }
    return out;
  }

  eventsFor(agentId: string, limit = 500): StampedEvent[] {
    let ring = this.events.get(agentId);
    if (!ring) this.events.set(agentId, (ring = this.loadEvents(agentId)));
    return ring.slice(-limit);
  }

  // ── tasks ─────────────────────────────────────────────────────────────
  addTask(t: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const task: Task = { ...t, id: randomUUID().slice(0, 8), createdAt: Date.now(), updatedAt: Date.now() };
    this.tasks.push(task);
    writeJson(this.f('tasks.json'), this.tasks);
    this.log('task.add', { task });
    return task;
  }

  updateTask(id: string, patch: Partial<Task>): Task | null {
    const t = this.tasks.find((x) => x.id === id);
    if (!t) return null;
    const { id: _i, createdAt: _c, ...rest } = patch;
    Object.assign(t, rest, { updatedAt: Date.now() });
    writeJson(this.f('tasks.json'), this.tasks);
    this.log('task.update', { id, patch: rest });
    return t;
  }

  deleteTask(id: string): boolean {
    const n = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    writeJson(this.f('tasks.json'), this.tasks);
    return this.tasks.length !== n;
  }

  setBoard(text: string) {
    this.board = text;
    fs.writeFileSync(this.f('board.md'), text);
    this.log('board.update', { bytes: text.length });
  }

  addMessage(m: Omit<HiveMessage, 'id' | 'ts'>): HiveMessage {
    const msg: HiveMessage = { ...m, id: randomUUID().slice(0, 8), ts: Date.now() };
    this.messages.push(msg);
    if (this.messages.length > 1000) this.messages.splice(0, this.messages.length - 1000);
    writeJson(this.f('messages.json'), this.messages);
    this.log('message', { ...msg });
    return msg;
  }
}
