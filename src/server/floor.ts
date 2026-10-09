// The Floor: one provider, many agents, a mod runtime and the hive.
// Every state change goes through the bus so mods can observe/rewrite/deny it.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Bus } from '../core/bus.ts';
import { ModRuntime } from '../core/runtime.ts';
import { KeyValueStore, SessionState } from '../core/store.ts';
import type { AgentEvent, AgentInfo, AgentStatus, ModContext, ModToolDef, ModToolHandler, ProviderId, SpawnSpec, Task, ToolDecision } from '../core/types.ts';
import { getProvider, type Provider } from '../providers/index.ts';
import type { ProviderSession } from '../providers/types.ts';
import { makeContext } from './context.ts';
import { Hive } from './hive.ts';
import { instructionsFor } from './instructions.ts';
import { discoverSkills } from './skills.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export interface FloorOptions {
  dataDir: string;
  provider: ProviderId;
  modDirs: string[];
  url: string;
  token: string;
  broadcast: (msg: Record<string, unknown>) => void;
  log?: (...a: unknown[]) => void;
}

export interface Question {
  id: string;
  agentId: string;
  question: string;
  ts: number;
  resolve: (answer: string) => void;
}

export class Floor {
  readonly hive: Hive;
  readonly bus: Bus;
  readonly runtime: ModRuntime;
  readonly provider: Provider;
  readonly kv: KeyValueStore;
  readonly sessionState = new SessionState();
  readonly contexts = new Map<string, ModContext>();
  readonly commands = new Map<string, { mod: string; description: string }>();
  readonly modTools = new Map<string, { mod: string; def: ModToolDef; handler: ModToolHandler }>();
  readonly questions = new Map<string, Question>();
  status = new Map<string, string>();
  halted = false;
  private sessions = new Map<string, ProviderSession>();
  private queues = new Map<string, { text: string; from: string }[]>();

  constructor(readonly o: FloorOptions) {
    this.hive = new Hive(o.dataDir);
    this.provider = getProvider(o.provider);
    this.kv = new KeyValueStore(path.join(o.dataDir, 'store'));
    this.bus = new Bus(
      (mod) => this.contexts.get(mod) ?? makeContext(this, mod, new Set()),
      (mod, ev, err) => this.log(`[mod ${mod}] ${ev} hook threw:`, err),
    );
    this.runtime = new ModRuntime({
      modDirs: o.modDirs,
      dataDir: o.dataDir,
      provider: o.provider,
      bus: this.bus,
      makeContext: (mod, timers) => {
        const c = makeContext(this, mod, timers);
        this.contexts.set(mod, c);
        return c;
      },
      onChange: (mod, kind) => {
        if (kind !== 'loaded') this.forgetMod(mod);
        this.o.broadcast({ type: 'mods', mods: this.runtime.list(), changed: mod, kind });
        if (kind === 'loaded') void this.bus.emit('session.start', { provider: o.provider, dataDir: o.dataDir }, () => undefined, { only: mod });
      },
      log: (...a) => this.log(...a),
    });
  }

  /** Drop commands and agent tools a mod registered (it is unloading or reloading). */
  private forgetMod(mod: string) {
    for (const [k, v] of this.commands) if (v.mod === mod) this.commands.delete(k);
    for (const [k, v] of this.modTools) if (v.mod === mod) this.modTools.delete(k);
    this.o.broadcast({ type: 'commands', commands: [...this.commands].map(([n, c]) => ({ name: n, ...c })) });
  }

  log(...a: unknown[]) {
    (this.o.log ?? console.log)(...a);
  }

  async boot() {
    await this.runtime.loadAll();
    this.runtime.watch();
  }

  skills() {
    return discoverSkills(this.o.modDirs, this.o.dataDir);
  }

  // ── agents ────────────────────────────────────────────────────────────
  list(): AgentInfo[] {
    return [...this.hive.agents.values()].filter((a) => !a.archived);
  }

  get(id: string) {
    return this.hive.agents.get(id) ?? [...this.hive.agents.values()].find((a) => a.name.toLowerCase() === id.toLowerCase());
  }

  private must(id: string) {
    const a = this.get(id);
    if (!a) throw new Error(`no agent "${id}"`);
    return a;
  }

  private touch(a: AgentInfo) {
    this.hive.saveAgents();
    this.o.broadcast({ type: 'agent', agent: a });
  }

  setStatus(a: AgentInfo, status: AgentStatus) {
    const prev = a.status;
    if (prev === status) return;
    a.status = status;
    this.touch(a);
    void this.bus.emit('agent.status', { agent: a, status, prev }, () => undefined);
  }

  spawn(spec: SpawnSpec, by = 'user'): Promise<AgentInfo> {
    return this.bus.emit('agent.spawn', { spec, by }, async ({ spec }) => {
      const base = (spec.name ?? `agent-${this.hive.agents.size + 1}`).trim();
      const id = `${base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agent'}-${randomUUID().slice(0, 4)}`;
      const agentDir = this.hive.agentDir(id);
      fs.mkdirSync(agentDir, { recursive: true });
      let cwd = spec.cwd ? path.resolve(spec.cwd.replace(/^~(?=\/|$)/, process.env.HOME ?? '~')) : path.join(agentDir, 'work');
      fs.mkdirSync(cwd, { recursive: true });
      if (spec.worktree) cwd = this.makeWorktree(cwd, agentDir, id);
      const agent: AgentInfo = {
        id,
        name: base,
        role: spec.role ?? 'generalist',
        provider: this.o.provider,
        model: spec.model,
        cwd,
        status: 'starting',
        createdAt: Date.now(),
        usage: { input: 0, output: 0, cached: 0, costUsd: 0 },
        turns: 0,
        held: false,
        skills: spec.skills ?? [],
      };
      this.hive.agents.set(id, agent);
      this.hive.log('spawn', { id, by, spec });
      await this.configure(agent, spec);
      this.touch(agent);
      await this.startSession(agent);
      if (spec.prompt) await this.send(id, spec.prompt, by);
      return agent;
    });
  }

  private makeWorktree(repo: string, agentDir: string, id: string): string {
    const dest = path.join(agentDir, 'worktree');
    try {
      execFileSync('git', ['-C', repo, 'worktree', 'add', '-b', `um/${id}`, dest], { stdio: 'pipe' });
      return dest;
    } catch (e: any) {
      this.log(`[floor] worktree failed for ${id}, using ${repo}:`, e.stderr?.toString() ?? e.message);
      return repo;
    }
  }

  /** Config adapter → config.build mods → files on disk. */
  private async configure(agent: AgentInfo, spec: SpawnSpec) {
    const all = this.skills();
    const skills = (spec.skills ?? []).map((n) => all.find((s) => s.name === n)?.path).filter(Boolean) as string[];
    const input = {
      agent,
      spec,
      agentDir: this.hive.agentDir(agent.id),
      instructions: instructionsFor(agent, this.o.provider),
      mcp: { command: process.execPath, args: [path.join(ROOT, 'bin/hive-mcp.mjs')], env: this.agentEnv(agent) },
      hookCommand: `"${process.execPath}" "${path.join(ROOT, 'bin/um-hook.mjs')}"`,
      skills,
    };
    let config = this.provider.buildConfig(input);
    if (spec.extra) config = deepMerge(config, spec.extra);
    config = await this.bus.emit('config.build', { provider: this.o.provider, agent, spec, config }, (e) => e.config);
    const files = this.provider.writeConfig(input, config);
    fs.writeFileSync(path.join(input.agentDir, 'config.json'), JSON.stringify({ config, files }, null, 2));
    return config;
  }

  agentConfig(id: string): { config: Record<string, any>; files: string[] } {
    const raw = fs.readFileSync(path.join(this.hive.agentDir(id), 'config.json'), 'utf8');
    return JSON.parse(raw);
  }

  private agentEnv(a: AgentInfo): Record<string, string> {
    return { UM_URL: this.o.url, UM_TOKEN: this.o.token, UM_AGENT_ID: a.id, UM_AGENT_NAME: a.name };
  }

  private async startSession(agent: AgentInfo) {
    const { config } = this.agentConfig(agent.id);
    try {
      const s = await this.provider.start({
        agent,
        agentDir: this.hive.agentDir(agent.id),
        config,
        env: this.agentEnv(agent),
        resume: agent.sessionId,
        emit: (ev) => this.onEvent(agent, ev),
        approve: (tool, input) => this.approve(agent.id, tool, input, 'approval'),
        onExit: (code) => {
          this.sessions.delete(agent.id);
          if (agent.status !== 'stopped') this.setStatus(agent, 'stopped');
          void this.bus.emit('agent.exit', { agent, code }, () => undefined);
        },
        log: (...a) => this.log(...a),
      });
      this.sessions.set(agent.id, s);
      this.setStatus(agent, agent.held ? 'held' : 'idle');
    } catch (e: any) {
      this.onEvent(agent, { kind: 'error', message: `start failed: ${e.message}` });
      this.setStatus(agent, 'error');
    }
  }

  private onEvent(agent: AgentInfo, ev: AgentEvent) {
    if (ev.kind === 'session' && agent.sessionId !== ev.sessionId) {
      agent.sessionId = ev.sessionId;
      this.hive.saveAgents();
    }
    if (ev.kind === 'usage') {
      const u = ev.usage;
      agent.usage.input += u.input ?? 0;
      agent.usage.output += u.output ?? 0;
      agent.usage.cached += u.cached ?? 0;
      agent.usage.costUsd += u.costUsd ?? 0;
    }
    if (ev.kind === 'tool' && ev.status === 'started') agent.lastActivity = `${ev.tool} ${summarize(ev.input)}`.slice(0, 120);
    if (ev.kind === 'text' && !ev.delta) agent.lastActivity = ev.text.slice(0, 120);
    if (ev.kind === 'turn') {
      if (ev.phase === 'start') this.setStatus(agent, 'working');
      else {
        agent.turns += 1;
        this.setStatus(agent, agent.held ? 'held' : 'idle');
        setImmediate(() => this.drain(agent.id));
      }
    }
    const se = this.hive.pushEvent(agent.id, ev);
    this.o.broadcast({ type: 'event', ...se });
    if (ev.kind === 'usage' || ev.kind === 'tool') this.touch(agent);
    void this.bus.emit('agent.event', { agent, event: ev }, () => undefined);
  }

  /** Queue-aware send: runs prompt.submit hooks, then starts a turn when the agent is free. */
  async send(id: string, text: string, from = 'user'): Promise<void> {
    const a = this.must(id);
    const out = await this.bus.emit('prompt.submit', { agentId: a.id, text, from }, (e) => ({ text: e.text }));
    if (!out) return;
    const q = this.queues.get(a.id) ?? [];
    q.push({ text: out.text, from });
    this.queues.set(a.id, q);
    await this.drain(a.id);
  }

  queued(id: string) {
    return this.queues.get(id)?.length ?? 0;
  }

  private async drain(id: string) {
    const a = this.hive.agents.get(id);
    const q = this.queues.get(id);
    if (!a || !q?.length || this.halted || a.held || a.status === 'working' || a.status === 'starting') return;
    if (!this.sessions.has(id)) {
      this.setStatus(a, 'starting');
      await this.startSession(a);
      if (!this.sessions.has(id)) return;
    }
    const item = q.shift()!;
    this.o.broadcast({ type: 'agent', agent: a, queued: q.length });
    this.onEvent(a, { kind: 'user', text: item.text, from: item.from });
    this.setStatus(a, 'working');
    await this.sessions.get(id)!.send(item.from === 'user' ? item.text : `[message from ${item.from}]\n${item.text}`);
  }

  async steer(id: string, text: string) {
    const a = this.must(id);
    const s = this.sessions.get(a.id);
    if (!s || a.status !== 'working') return this.send(a.id, text);
    this.onEvent(a, { kind: 'user', text: `(steer) ${text}`, from: 'user' });
    await s.steer(text);
  }

  async interrupt(id: string) {
    const a = this.must(id);
    await this.sessions.get(a.id)?.interrupt();
  }

  async kill(id: string) {
    const a = this.must(id);
    this.queues.delete(a.id);
    this.setStatus(a, 'stopped');
    await this.sessions.get(a.id)?.kill();
    this.sessions.delete(a.id);
  }

  hold(id: string, held: boolean) {
    const a = this.must(id);
    a.held = held;
    if (a.status !== 'working') this.setStatus(a, held ? 'held' : this.sessions.has(a.id) ? 'idle' : 'stopped');
    this.touch(a);
    if (!held) void this.drain(a.id);
  }

  async archive(id: string) {
    const a = this.must(id);
    await this.kill(a.id);
    a.archived = true;
    this.touch(a);
  }

  /** Global pause: nothing new starts until resumed; running turns are interrupted. */
  async halt(on: boolean) {
    this.halted = on;
    if (on) await Promise.all(this.list().filter((a) => a.status === 'working').map((a) => this.interrupt(a.id)));
    else for (const a of this.list()) void this.drain(a.id);
    this.o.broadcast({ type: 'floor', halted: on });
  }

  approve(agentId: string, tool: string, input: unknown, source: 'hook' | 'approval'): Promise<ToolDecision> {
    if (this.halted) return Promise.resolve({ decision: 'deny' as const, reason: 'floor is halted' });
    return this.bus.emit('tool.call', { agentId, tool, input, source, provider: this.o.provider }, () => ({ decision: 'allow' as const }));
  }

  // ── hive operations (all mod-hookable) ────────────────────────────────
  addTask(t: { title: string; detail?: string; assignee?: string; status?: Task['status'] }, by: string) {
    const assignee = t.assignee ? (this.get(t.assignee)?.id ?? t.assignee) : undefined;
    return this.bus.emit('task.add', { title: t.title, detail: t.detail, assignee, status: t.status ?? 'todo', createdBy: by }, (e) => {
      const task = this.hive.addTask(e);
      this.o.broadcast({ type: 'tasks', tasks: this.hive.tasks });
      if (task.assignee && this.get(task.assignee) && this.get(task.assignee)!.name !== by)
        void this.send(this.get(task.assignee)!.id, `New task assigned to you (id ${task.id}): ${task.title}\n${task.detail ?? ''}`.trim(), by);
      return task;
    });
  }

  updateTask(id: string, patch: Partial<Task>, by: string) {
    if (patch.assignee) patch = { ...patch, assignee: this.get(patch.assignee)?.id ?? patch.assignee };
    return this.bus.emit('task.update', { id, patch, by }, (e) => {
      const t = this.hive.updateTask(e.id, e.patch);
      this.o.broadcast({ type: 'tasks', tasks: this.hive.tasks });
      return t;
    });
  }

  async setBoard(text: string, by: string) {
    const r = await this.bus.emit('board.update', { text, by }, (e) => ({ text: e.text }));
    this.hive.setBoard(r.text);
    this.o.broadcast({ type: 'board', text: r.text, by });
  }

  message(from: string, to: string, text: string) {
    const target = to === 'user' ? undefined : this.get(to);
    const m = { id: '', ts: 0, from, to: target?.id ?? to, text };
    return this.bus.emit('message.send', m, async (e) => {
      const msg = this.hive.addMessage({ from: e.from, to: e.to, text: e.text });
      this.o.broadcast({ type: 'message', message: msg });
      if (e.to === 'user') return { delivered: true };
      const t = this.get(e.to);
      if (!t) return { delivered: false };
      await this.send(t.id, e.text, this.get(e.from)?.name ?? e.from);
      return { delivered: true };
    });
  }

  ask(agentId: string, question: string): Promise<string> {
    const a = this.must(agentId);
    return new Promise((resolve) => {
      const id = randomUUID().slice(0, 8);
      this.questions.set(id, { id, agentId: a.id, question, ts: Date.now(), resolve });
      this.setStatus(a, 'blocked');
      this.o.broadcast({ type: 'questions', questions: this.questionList() });
    });
  }

  answer(id: string, answer: string) {
    const q = this.questions.get(id);
    if (!q) throw new Error('no such question');
    this.questions.delete(id);
    const a = this.hive.agents.get(q.agentId);
    if (a?.status === 'blocked') this.setStatus(a, 'working');
    q.resolve(answer);
    this.o.broadcast({ type: 'questions', questions: this.questionList() });
  }

  questionList() {
    return [...this.questions.values()].map(({ resolve: _r, ...q }) => q);
  }

  async runCommand(name: string, args: string, by: string) {
    return this.bus.emit('command.run', { name, args, by }, () => null);
  }

  async shutdown() {
    this.runtime.close();
    await Promise.all([...this.sessions.values()].map((s) => s.kill().catch(() => {})));
  }
}

function summarize(input: unknown): string {
  if (!input || typeof input !== 'object') return String(input ?? '');
  const o = input as Record<string, unknown>;
  return String(o.command ?? o.file_path ?? o.path ?? o.pattern ?? o.query ?? o.url ?? JSON.stringify(o)).slice(0, 100);
}

function deepMerge(a: any, b: any): any {
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== 'object' || typeof b !== 'object' || !a || !b) return b ?? a;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in a ? deepMerge(a[k], v) : v;
  return out;
}
