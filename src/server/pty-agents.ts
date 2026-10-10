// Live-terminal agents: each agent runs its CLI's real TUI in a PTY that browsers can
// watch and type into. With no JSON stream to read, the floor learns what the agent
// is doing from the CLI's hooks (SessionStart, UserPromptSubmit, Pre/PostToolUse, Stop …).
import fs from 'node:fs';
import type { AgentEvent, AgentInfo } from '../core/types.ts';
import { PtySession } from '../providers/pty.ts';
import type { ProviderSession, StartContext } from '../providers/types.ts';
import type { Floor } from './floor.ts';

const FLUSH_MS = 30;

export class PtyAgents {
  readonly ptys = new Map<string, PtySession>();
  private out = new Map<string, string>();
  private flushTimer?: NodeJS.Timeout;
  /** Byte offset already read from each agent's transcript (for token usage). */
  private transcriptPos = new Map<string, number>();

  constructor(private floor: Floor) {}

  start(ctx: StartContext): ProviderSession {
    const { agent } = ctx;
    const cmd = this.floor.provider.ptyCommand(ctx);
    const old = this.ptys.get(agent.id);
    old?.kill();
    const p = new PtySession({
      bin: cmd.bin,
      args: cmd.args,
      cwd: agent.cwd,
      env: ctx.env,
      autoAnswers: cmd.autoAnswers,
      cols: old?.cols,
      rows: old?.rows,
      onData: (d) => this.queueOut(agent.id, d),
      onExit: (code) => {
        if (this.ptys.get(agent.id) === p) this.ptys.delete(agent.id);
        this.queueOut(agent.id, `\r\n\x1b[2m[agent exited (${code}). Send a message or press Start to resume.]\x1b[0m\r\n`);
        ctx.onExit(code);
      },
    });
    this.ptys.set(agent.id, p);
    return {
      send: (text) => p.submit(text),
      // TUIs accept input mid-turn (Claude queues it, Codex steers), so steering is just typing.
      steer: (text) => p.submit(text),
      interrupt: async () => p.interrupt(),
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

  snapshot(id: string) {
    const p = this.ptys.get(id);
    return { alive: !!p?.alive, buffer: p?.buffer ?? '', cols: p?.cols ?? 120, rows: p?.rows ?? 32 };
  }

  write(id: string, data: string) {
    this.ptys.get(id)?.write(data);
  }

  resize(id: string, cols: number, rows: number) {
    this.ptys.get(id)?.resize(cols, rows);
  }

  /** Translate a CLI hook into floor state and timeline events. */
  onHook(agent: AgentInfo, event: string, p: Record<string, any>) {
    const emit = (ev: AgentEvent) => this.floor.emitAgentEvent(agent, ev);
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
