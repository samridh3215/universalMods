// Claude Code provider: one long-lived `claude -p` stream-json process per agent.
import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Provider, ProviderSession, StartContext } from '../types.ts';
import { lineReader, versionOf, which } from '../util.ts';
import { buildClaudeConfig, claudeArgs, writeClaudeConfig } from './config.ts';
import { newClaudeState, normalizeClaude } from './normalize.ts';

const BIN = process.env.UM_CLAUDE_BIN ?? 'claude';

const userMsg = (text: string) => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } }) + '\n';

export const claudeProvider: Provider = {
  id: 'claude',

  async check() {
    const bin = which(BIN);
    if (!bin) return { ok: false, bin: BIN, error: '`claude` not found on PATH. Install Claude Code: npm i -g @anthropic-ai/claude-code' };
    return { ok: true, bin, version: await versionOf(bin) };
  },

  buildConfig: buildClaudeConfig,
  writeConfig: writeClaudeConfig,

  ptyCommand(ctx) {
    const resume = !!ctx.resume;
    return {
      bin: BIN,
      args: claudeArgs(ctx.agentDir, ctx.config, { id: ctx.resume ?? randomUUID(), resume }, true),
      // New folders get a "Do you trust this folder?" prompt even in bypass mode; choose "Yes".
      autoAnswers: [{ pattern: /Yes,Itrustthisfolder/, keys: ['\x1b[B', '\r'], delayMs: 2000 }],
    };
  },

  async start(ctx: StartContext): Promise<ProviderSession> {
    const sessionId = ctx.resume ?? randomUUID();
    let resume = !!ctx.resume;
    let proc: ChildProcess | undefined;
    let busy = false;
    let killed = false;
    let interrupting = false;
    let pendingSteer: string | undefined;
    let stopTimer: NodeJS.Timeout | undefined;
    const st = newClaudeState();

    const launch = () => {
      const args = claudeArgs(ctx.agentDir, ctx.config, { id: sessionId, resume });
      // Every later launch of this agent resumes the same conversation.
      resume = true;
      st.lastCost = 0;
      interrupting = false;
      const p = spawn(BIN, args, { cwd: ctx.agent.cwd, env: { ...process.env, ...ctx.env }, stdio: ['pipe', 'pipe', 'pipe'] });
      proc = p;
      p.stdout!.on(
        'data',
        lineReader(
          (o) => {
            for (let ev of normalizeClaude(o, st)) {
              if (ev.kind === 'turn' && ev.phase !== 'start') {
                if (interrupting && ev.phase === 'fail') ev = { ...ev, phase: 'abort', error: 'interrupted' };
                busy = false;
                interrupting = false;
                clearTimeout(stopTimer);
              }
              ctx.emit(ev);
              if (ev.kind === 'turn' && ev.phase !== 'start' && pendingSteer !== undefined) {
                const text = pendingSteer;
                pendingSteer = undefined;
                void session.send(text);
              }
            }
          },
          (line) => ctx.log(`[claude ${ctx.agent.id}]`, line),
        ),
      );
      let errBuf = '';
      p.stderr!.on('data', (d) => (errBuf = (errBuf + d).slice(-4000)));
      p.on('error', (e) => ctx.emit({ kind: 'error', message: `claude failed to start: ${e.message}` }));
      p.on('close', (code) => {
        if (proc !== p) return;
        proc = undefined;
        if (busy) {
          busy = false;
          ctx.emit({ kind: 'turn', phase: killed || interrupting ? 'abort' : 'fail', error: errBuf.trim().split('\n').slice(-3).join('\n') || `exit ${code}` });
        } else if (code && !killed) {
          ctx.emit({ kind: 'error', message: errBuf.trim().split('\n').slice(-5).join('\n') || `claude exited ${code}` });
        }
        if (killed) return ctx.onExit(code);
        if (pendingSteer !== undefined) {
          const text = pendingSteer;
          pendingSteer = undefined;
          void session.send(text);
        }
      });
    };

    const write = (text: string) => {
      if (!proc || proc.exitCode !== null) launch();
      proc!.stdin!.write(userMsg(text));
    };

    const session: ProviderSession = {
      async send(text) {
        busy = true;
        ctx.emit({ kind: 'turn', phase: 'start' });
        write(text);
      },
      async steer(text) {
        // claude -p drops user messages written mid-turn, so steering = interrupt,
        // then continue the same session with the steer text as the next turn.
        if (!busy) return session.send(text);
        pendingSteer = pendingSteer ? `${pendingSteer}\n${text}` : text;
        await session.interrupt();
      },
      async interrupt() {
        if (!proc || !busy) return;
        interrupting = true;
        // Ask nicely via the SDK control protocol, then fall back to killing the process;
        // the next send() relaunches with --resume so the conversation continues.
        proc.stdin!.write(JSON.stringify({ type: 'control_request', request_id: randomUUID(), request: { subtype: 'interrupt' } }) + '\n');
        const p = proc;
        stopTimer = setTimeout(() => {
          if (busy && proc === p) p.kill('SIGTERM');
        }, 3000);
      },
      async kill() {
        killed = true;
        const p = proc;
        if (!p) return ctx.onExit(0);
        p.stdin!.end();
        p.kill('SIGTERM');
        setTimeout(() => p.exitCode === null && p.kill('SIGKILL'), 3000);
      },
    };
    return session;
  },
};
