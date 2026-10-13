// Live-terminal agents: each agent runs its CLI's real TUI in a PTY that browsers can
// watch and type into. With no JSON stream to read, the floor learns what the agent
// is doing from the CLI's hooks (SessionStart, UserPromptSubmit, Pre/PostToolUse, Stop …).
import fs from 'node:fs';
import type { AgentEvent, AgentInfo } from '../core/types.ts';
import { PtySession, TurnErrorWatch } from '../providers/pty.ts';
import type { ProviderSession, StartContext } from '../providers/types.ts';
import type { Floor } from './floor.ts';

const FLUSH_MS = 30;
/** An error line must stand this long (no hook, no busy spinner) before the turn is failed. */
const ERROR_CONFIRM_MS = 2000;
/** Esc with no hook confirming the turn ended within this long → close the turn ourselves. */
const INTERRUPT_MS = 2500;
/** After a resize the TUI repaints old lines; don't treat them as new errors. */
const RESIZE_QUIET_MS = 1000;

export class PtyAgents {
  readonly ptys = new Map<string, PtySession>();
  private out = new Map<string, string>();
  private flushTimer?: NodeJS.Timeout;
  /** Byte offset already read from each agent's transcript (for token usage). */
  private transcriptPos = new Map<string, number>();
  private watches = new Map<string, TurnErrorWatch>();
  private pendingError = new Map<string, NodeJS.Timeout>();
  private quietUntil = new Map<string, number>();

  constructor(private floor: Floor) {}

  start(ctx: StartContext): ProviderSession {
    const { agent } = ctx;
    const cmd = this.floor.provider.ptyCommand(ctx);
    const old = this.ptys.get(agent.id);
    old?.kill();
    const watch = new TurnErrorWatch(cmd.turnErrors ?? []);
    this.watches.set(agent.id, watch);
    const p = new PtySession({
      bin: cmd.bin,
      args: cmd.args,
      cwd: agent.cwd,
      env: ctx.env,
      autoAnswers: cmd.autoAnswers,
      cols: old?.cols,
      rows: old?.rows,
      onData: (d) => {
        this.queueOut(agent.id, d);
        if (this.ptys.get(agent.id) === p) this.observe(agent, d);
      },
      onExit: (code) => {
        if (this.ptys.get(agent.id) === p) {
          this.ptys.delete(agent.id);
          this.clearPendingError(agent.id);
        }
        this.queueOut(agent.id, `\r\n\x1b[2m[agent exited (${code}). Send a message or press Start to resume.]\x1b[0m\r\n`);
        ctx.onExit(code);
      },
    });
    this.ptys.set(agent.id, p);
    return {
      send: (text) => {
        watch.expectPrompt(text);
        return p.submit(text);
      },
      // TUIs accept input mid-turn (Claude queues it, Codex steers), so steering is just typing.
      steer: (text) => {
        watch.expectPrompt(text);
        return p.submit(text);
      },
      interrupt: async () => {
        p.interrupt();
        this.watchInterrupt(agent, () => this.ptys.get(agent.id) === p);
      },
      kill: async () => p.kill(),
    };
  }

  private queueOut(id: string, data: string) {
    this.out.set(id, (this.out.get(id) ?? '') + data);
    this.flushTimer ??= setTimeout(() => {
      this.flushTimer = undefined;
      for (const [agentId, chunk] of this.out) this.floor.o.broadcast({ type: 'pty', agentId, data: chunk });
      this.out.clear();
    }, FLUSH_MS);
  }

  /**
   * Scan terminal output during a turn for the CLI's fatal error lines (login expired, usage
   * limit, API error): the CLI prints them and goes idle without firing Stop, so the agent would
   * otherwise stay "working" forever.
   */
  observe(agent: AgentInfo, data: string) {
    const watch = this.watches.get(agent.id);
    if (!watch) return;
    if (agent.status !== 'working') {
      watch.reset();
      return this.clearPendingError(agent.id);
    }
    if (Date.now() < (this.quietUntil.get(agent.id) ?? 0)) return;
    const r = watch.feed(data);
    if (r === 'busy') return this.clearPendingError(agent.id);
    if (!r || this.pendingError.has(agent.id)) return;
    this.pendingError.set(
      agent.id,
      setTimeout(() => {
        this.pendingError.delete(agent.id);
        if (agent.status !== 'working') return;
        this.floor.emitAgentEvent(agent, { kind: 'notice', text: r.message });
        this.floor.emitAgentEvent(agent, { kind: 'turn', phase: 'fail', error: r.message });
      }, ERROR_CONFIRM_MS),
    );
  }

  private clearPendingError(id: string) {
    clearTimeout(this.pendingError.get(id));
    this.pendingError.delete(id);
  }

  /** Claude's TUI fires no hook when interrupted, so close the turn ourselves if nothing confirms. */
  private watchInterrupt(agent: AgentInfo, current: () => boolean) {
    const turns = agent.turns;
    setTimeout(() => {
      // Skip if the turn already ended (a later turn may be running now) or the PTY was replaced.
      if (agent.status !== 'working' || agent.turns !== turns || !current()) return;
      this.clearPendingError(agent.id);
      this.floor.emitAgentEvent(agent, { kind: 'turn', phase: 'abort', error: 'interrupted' });
    }, INTERRUPT_MS);
  }

  snapshot(id: string) {
    const p = this.ptys.get(id);
    return { alive: !!p?.alive, buffer: p?.buffer ?? '', cols: p?.cols ?? 120, rows: p?.rows ?? 32 };
  }

  write(id: string, data: string) {
    this.ptys.get(id)?.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    const p = this.ptys.get(id);
    if (!p || (p.cols === cols && p.rows === rows)) return;
    this.quietUntil.set(id, Date.now() + RESIZE_QUIET_MS);
    this.watches.get(id)?.reset();
    p.resize(cols, rows);
  }

  /** Translate a CLI hook into floor state and timeline events. */
  onHook(agent: AgentInfo, event: string, p: Record<string, any>) {
    const emit = (ev: AgentEvent) => this.floor.emitAgentEvent(agent, ev);
    // A hook means the CLI is still making progress, so an error line seen before it wasn't fatal.
    if (event !== 'Notification') this.clearPendingError(agent.id);
    switch (event) {
      case 'SessionStart':
        if (p.session_id) emit({ kind: 'session', sessionId: String(p.session_id) });
        // Only count usage from turns that happen in this session (resumed transcripts hold old turns).
        if (p.transcript_path && fs.existsSync(p.transcript_path)) this.transcriptPos.set(agent.id, fs.statSync(p.transcript_path).size);
        else this.transcriptPos.set(agent.id, 0);
        this.ptys.get(agent.id)?.markReady();
        this.floor.agentReady(agent);
        break;
      case 'UserPromptSubmit':
        this.watches.get(agent.id)?.reset();
        if (p.prompt) this.watches.get(agent.id)?.expectPrompt(String(p.prompt));
        emit({ kind: 'user', text: String(p.prompt ?? ''), from: 'terminal' });
        emit({ kind: 'turn', phase: 'start' });
        break;
      case 'PreToolUse':
        emit({ kind: 'tool', itemId: String(p.tool_use_id ?? p.call_id ?? Date.now()), tool: String(p.tool_name ?? 'tool'), input: p.tool_input, status: 'started' });
        break;
      case 'PostToolUse': {
        const r = p.tool_response;
        const output = typeof r === 'string' ? r : r == null ? undefined : JSON.stringify(r);
        const failed = !!(r && typeof r === 'object' && (r.is_error || r.error || (typeof r.exit_code === 'number' && r.exit_code !== 0)));
        emit({ kind: 'tool', itemId: String(p.tool_use_id ?? p.call_id ?? Date.now()), tool: String(p.tool_name ?? 'tool'), input: p.tool_input, status: failed ? 'failed' : 'completed', output: output?.slice(0, 20000) });
        break;
      }
      case 'Stop': {
        const text = p.last_assistant_message ?? this.lastAssistantText(p.transcript_path);
        if (text) emit({ kind: 'text', text: String(text) });
        const usage = this.usageSince(agent.id, p.transcript_path);
        if (usage) emit({ kind: 'usage', usage });
        emit({ kind: 'turn', phase: 'complete' });
        break;
      }
      case 'Interrupt':
        emit({ kind: 'turn', phase: 'abort', error: 'interrupted' });
        break;
      case 'Notification':
        if (p.message) emit({ kind: 'notice', text: String(p.message) });
        // Claude says it's waiting for input only when idle: the turn ended without a Stop hook.
        if (agent.status === 'working' && (p.notification_type === 'idle_prompt' || /waiting for your input/i.test(String(p.message ?? '')))) {
          this.clearPendingError(agent.id);
          emit({ kind: 'turn', phase: 'abort', error: 'turn ended without a Stop hook' });
        }
        break;
      case 'PreCompact':
        emit({ kind: 'notice', text: 'compacting context…' });
        break;
    }
  }

  /** Sum token usage of assistant messages added to a Claude transcript since last time. */
  private usageSince(agentId: string, file?: string) {
    if (!file || !fs.existsSync(file)) return undefined;
    const start = this.transcriptPos.get(agentId) ?? 0;
    const size = fs.statSync(file).size;
    if (size <= start) return undefined;
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    this.transcriptPos.set(agentId, size);
    const seen = new Set<string>();
    const u = { input: 0, output: 0, cached: 0, costUsd: 0 };
    for (const line of buf.toString('utf8').split('\n')) {
      try {
        const o = JSON.parse(line);
        const m = o.message;
        if (o.type !== 'assistant' || !m?.usage || seen.has(m.id)) continue;
        seen.add(m.id);
        u.input += (m.usage.input_tokens ?? 0) + (m.usage.cache_creation_input_tokens ?? 0);
        u.output += m.usage.output_tokens ?? 0;
        u.cached += m.usage.cache_read_input_tokens ?? 0;
      } catch {}
    }
    return u.input || u.output ? u : undefined;
  }

  private lastAssistantText(file?: string): string | undefined {
    if (!file || !fs.existsSync(file)) return undefined;
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n').slice(-50).reverse();
    for (const line of lines) {
      try {
        const o = JSON.parse(line);
        if (o.type !== 'assistant') continue;
        const t = (o.message?.content ?? []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n');
        if (t) return t;
      } catch {}
    }
    return undefined;
  }

  shutdown() {
    for (const p of this.ptys.values()) p.kill();
  }
}
