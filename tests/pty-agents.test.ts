import { afterEach, describe, expect, it } from 'vitest';
import type { AgentEvent, AgentInfo } from '../src/core/types.ts';
import { CLAUDE_TURN_ERRORS } from '../src/providers/claude/index.ts';
import { CODEX_TURN_ERRORS } from '../src/providers/codex/index.ts';
import { TurnErrorWatch, type TurnError } from '../src/providers/pty.ts';
import { PtyAgents } from '../src/server/pty-agents.ts';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('TurnErrorWatch', () => {
  it('matches Claude login / limit / API errors, even split across chunks and with ANSI codes', () => {
    const w = new TurnErrorWatch(CLAUDE_TURN_ERRORS);
    expect(w.feed('\x1b[31m  ⎿  Login exp')).toBeUndefined();
    expect(w.feed('ired · Please run /login\x1b[0m\r\n')).toMatchObject({ message: expect.stringMatching(/not logged in/) });
    expect(new TurnErrorWatch(CLAUDE_TURN_ERRORS).feed("You've hit your limit · resets 3pm")).toMatchObject({ message: expect.stringMatching(/limit/) });
    expect(new TurnErrorWatch(CLAUDE_TURN_ERRORS).feed('API Error: 500 {"type":"error"}')).toMatchObject({ message: expect.stringMatching(/API error/) });
  });

  it('matches Codex errors', () => {
    expect(new TurnErrorWatch(CODEX_TURN_ERRORS).feed("■ You've hit your usage limit. Upgrade to Pro")).toMatchObject({ message: expect.stringMatching(/limit/) });
    expect(new TurnErrorWatch(CODEX_TURN_ERRORS).feed('■ unexpected status 401 Unauthorized')).toMatchObject({ message: expect.stringMatching(/not logged in/) });
  });

  it('ignores the echoed prompt, full-screen repaints, and errors the CLI is still working past', () => {
    const w = new TurnErrorWatch(CLAUDE_TURN_ERRORS);
    w.expectPrompt('Why does it say API Error: 500 and\nLogin expired?');
    expect(w.feed('> Why does it say API Error: 500 and\r\n  Login expired?')).toBeUndefined();
    expect(new TurnErrorWatch(CLAUDE_TURN_ERRORS).feed('\x1b[2J\x1b[3JLogin expired · Please run /login')).toBeUndefined();
    expect(new TurnErrorWatch(CLAUDE_TURN_ERRORS).feed('API Error (Request timed out.) · Retrying in 5 seconds…')).toBe('busy');
    const busy = new TurnErrorWatch(CLAUDE_TURN_ERRORS);
    expect(busy.feed('the code prints "API Error: 500" there')).toBeTruthy();
    expect(busy.feed('✻ Thinking… (12s · esc to interrupt)')).toBe('busy');
  });
});

/** Minimal floor: the turn → status rules of Floor.onEvent in pty mode. */
function fakeFloor(turnErrors: TurnError[]) {
  const events: AgentEvent[] = [];
  const floor: any = {
    provider: { ptyCommand: () => ({ bin: '/bin/cat', args: [], turnErrors }) },
    o: { broadcast() {} },
    emitAgentEvent(a: AgentInfo, ev: AgentEvent) {
      events.push(ev);
      if (ev.kind !== 'turn') return;
      if (ev.phase === 'start') a.status = 'working';
      else {
        a.turns += 1;
        a.status = ev.phase === 'fail' ? 'error' : 'idle';
      }
    },
    agentReady() {},
  };
  return { floor, events };
}

describe('PtyAgents turn guards (real PTY running cat)', () => {
  let pa: PtyAgents | undefined;
  afterEach(() => pa?.shutdown());

  const setup = (turnErrors = CLAUDE_TURN_ERRORS) => {
    const { floor, events } = fakeFloor(turnErrors);
    pa = new PtyAgents(floor);
    const agent = { id: 'a', status: 'idle', turns: 0, cwd: process.cwd() } as AgentInfo;
    const session = pa.start({ agent, env: {}, onExit() {} } as any);
    pa.onHook(agent, 'UserPromptSubmit', { prompt: 'hi' });
    return { agent, events, session, pa };
  };
  const turns = (events: AgentEvent[]) => events.filter((e) => e.kind === 'turn').map((e: any) => [e.phase, e.error ?? '']);

  it('fails the turn (status error + notice) when the CLI prints a fatal error and goes quiet', async () => {
    const { agent, events, pa } = setup();
    pa.write('a', 'Login expired · Please run /login\r');
    await wait(2600);
    expect(agent.status).toBe('error');
    expect(events.some((e) => e.kind === 'notice' && /not logged in/.test(e.text))).toBe(true);
    expect(turns(events).at(-1)?.[0]).toBe('fail');
  });

  it('a hook after the error line cancels it (the CLI kept going)', async () => {
    const { agent, events, pa } = setup();
    pa.write('a', 'Login expired · Please run /login\r');
    await wait(500);
    pa.onHook(agent, 'PreToolUse', { tool_name: 'Bash', tool_use_id: 't1' });
    await wait(2200);
    expect(agent.status).toBe('working');
    expect(turns(events)).toEqual([['start', '']]);
  });

  it('interrupt closes the turn when no hook confirms, but not a turn that started after it', async () => {
    const { agent, events, session, pa } = setup(CODEX_TURN_ERRORS);
    await session.interrupt();
    await wait(2700);
    expect(agent.status).toBe('idle');
    expect(turns(events).at(-1)).toEqual(['abort', 'interrupted']);

    pa.onHook(agent, 'UserPromptSubmit', { prompt: 'again' });
    await session.interrupt();
    pa.onHook(agent, 'Stop', {});
    pa.onHook(agent, 'UserPromptSubmit', { prompt: 'next' });
    await wait(2700);
    expect(agent.status).toBe('working');
  }, 10_000);

  it("Claude's idle notification ends a turn that never got Stop", () => {
    const { agent, events, pa } = setup();
    pa.onHook(agent, 'Notification', { message: 'Claude is waiting for your input', notification_type: 'idle_prompt' });
    expect(agent.status).toBe('idle');
    expect(turns(events).at(-1)).toEqual(['abort', 'turn ended without a Stop hook']);
  });
});
