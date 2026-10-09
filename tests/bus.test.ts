import { describe, expect, it } from 'vitest';
import { Bus } from '../src/core/bus.ts';

const ctx = (mod: string) => ({ mod }) as any;
const call = { agentId: 'a', tool: 'Bash', input: { command: 'ls' }, source: 'hook' as const, provider: 'claude' as const };
const allow = () => ({ decision: 'allow' as const });

describe('Bus hook chain', () => {
  it('runs terminal when no hooks', async () => {
    const bus = new Bus(ctx);
    expect(await bus.emit('tool.call', call, allow)).toEqual({ decision: 'allow' });
  });

  it('a hook that returns without next answers the event', async () => {
    const bus = new Bus(ctx);
    let terminal = false;
    bus.register('g', 'tool.call', undefined, (_$) => ({ decision: 'deny' as const, reason: 'no' }));
    const out = await bus.emit('tool.call', call, () => ((terminal = true), allow()));
    expect(out).toEqual({ decision: 'deny' as const, reason: 'no' });
    expect(terminal).toBe(false);
  });

  it('next(e) rewrites input for the rest of the chain', async () => {
    const bus = new Bus(ctx);
    bus.register('a', 'prompt.submit', undefined, (_$, e, next) => next({ ...e, text: e.text + '!' }));
    bus.register('b', 'prompt.submit', undefined, (_$, e, next) => next({ ...e, text: e.text.toUpperCase() }));
    const out = await bus.emit('prompt.submit', { agentId: 'x', text: 'hi', from: 'user' }, (e) => ({ text: e.text }));
    expect(out).toEqual({ text: 'HI!' });
  });

  it('await next() allows post-processing', async () => {
    const bus = new Bus(ctx);
    bus.register('a', 'board.update', undefined, async (_$, e, next) => {
      const r = await next(e);
      return { text: r.text + '\n-- signed' };
    });
    expect(await bus.emit('board.update', { text: 'x', by: 'u' }, (e) => ({ text: e.text }))).toEqual({ text: 'x\n-- signed' });
  });

  it('matchers filter hooks (string equality and RegExp)', async () => {
    const bus = new Bus(ctx);
    bus.register('a', 'tool.call', { tool: 'Write' }, (_$) => ({ decision: 'deny' as const, reason: 'w' }));
    bus.register('b', 'tool.call', { tool: /^Ba/ }, (_$) => ({ decision: 'deny' as const, reason: 'b' }));
    expect(await bus.emit('tool.call', call, allow)).toEqual({ decision: 'deny' as const, reason: 'b' });
  });

  it('a throwing hook is skipped', async () => {
    const bus = new Bus(ctx);
    bus.register('a', 'tool.call', undefined, () => {
      throw new Error('boom');
    });
    expect(await bus.emit('tool.call', call, allow)).toEqual({ decision: 'allow' });
  });

  it('.catch() lets a hook fail closed', async () => {
    const bus = new Bus(ctx);
    bus
      .register('a', 'tool.call', undefined, () => {
        throw new Error('boom');
      })
      .catch((_$, e, next) => (next.called ? next(e) : { decision: 'deny' as const, reason: 'guard crashed' }));
    expect(await bus.emit('tool.call', call, allow)).toEqual({ decision: 'deny' as const, reason: 'guard crashed' });
  });

  it('unregisterMod removes a mod’s hooks', async () => {
    const bus = new Bus(ctx);
    bus.register('a', 'tool.call', undefined, (_$) => ({ decision: 'deny' as const, reason: 'x' }));
    bus.unregisterMod('a');
    expect(await bus.emit('tool.call', call, allow)).toEqual({ decision: 'allow' });
  });

  it('frozen event cannot be mutated by hooks', async () => {
    const bus = new Bus(ctx);
    bus.register('a', 'board.update', undefined, (_$, e, next) => {
      expect(() => ((e as any).text = 'mut')).toThrow();
      return next(e);
    });
    await bus.emit('board.update', { text: 'x', by: 'u' }, (e) => ({ text: e.text }));
  });
});
