// Middleware event bus with the same semantics as Claude Code mod hooks:
//   on(event, matcher?, ($, e, next) => ...)
// - return without calling next  → you answered the event
// - next({...e, x})               → rewrite what the rest of the chain sees
// - await next(e)                 → post-process the result
// - a throwing hook is skipped unless it has .catch(), which can fail closed
import type {
  CatchHook,
  EventIn,
  EventName,
  EventOut,
  Hook,
  HookHandle,
  Matcher,
  ModContext,
  Next,
} from './types.ts';

interface Entry {
  mod: string;
  event: EventName;
  matcher?: Matcher;
  hook: Hook<any>;
  onError?: CatchHook<any>;
}

export type Terminal<K extends EventName> = (e: EventIn<K>) => EventOut<K> | Promise<EventOut<K>>;

export function matches(matcher: Matcher | undefined, e: any): boolean {
  if (!matcher) return true;
  if (typeof matcher === 'function') return !!matcher(e);
  for (const [k, want] of Object.entries(matcher)) {
    const got = e?.[k];
    if (want instanceof RegExp ? !want.test(String(got ?? '')) : got !== want) return false;
  }
  return true;
}

export class Bus {
  private entries: Entry[] = [];
  constructor(private contextFor: (mod: string) => ModContext, private onHookError?: (mod: string, event: string, err: unknown) => void) {}

  register<K extends EventName>(mod: string, event: K, matcher: Matcher | undefined, hook: Hook<K>): HookHandle<K> {
    const entry: Entry = { mod, event, matcher, hook };
    this.entries.push(entry);
    const handle: HookHandle<K> = {
      catch(fn) {
        entry.onError = fn;
        return handle;
      },
    };
    return handle;
  }

  /** Remove every hook a mod registered (used on hot reload / disable). */
  unregisterMod(mod: string): void {
    this.entries = this.entries.filter((x) => x.mod !== mod);
  }

  hooksFor(event: EventName): { mod: string }[] {
    return this.entries.filter((x) => x.event === event).map((x) => ({ mod: x.mod }));
  }

  has(event: EventName): boolean {
    return this.entries.some((x) => x.event === event);
  }

  /** Run the hook chain for `event`; `terminal` is the built-in behaviour at the end of the chain. */
  async emit<K extends EventName>(
    event: K,
    input: EventIn<K>,
    terminal: Terminal<K>,
    opts: { only?: string } = {},
  ): Promise<EventOut<K>> {
    const chain = this.entries.filter((x) => x.event === event && (!opts.only || x.mod === opts.only));

    const run = async (i: number, e: EventIn<K>): Promise<EventOut<K>> => {
      // Skip hooks whose matcher does not match.
      while (i < chain.length && !matches(chain[i].matcher, e)) i++;
      if (i >= chain.length) return terminal(e);
      const entry = chain[i];
      const $ = this.contextFor(entry.mod);
      const frozen = Object.freeze({ ...(e as object) }) as EventIn<K>;

      const makeNext = (): Next<K> => {
        const fn = (async (next?: EventIn<K>) => {
          fn.called = true;
          return run(i + 1, next ?? e);
        }) as Next<K>;
        fn.called = false;
        return fn;
      };

      const next = makeNext();
      try {
        return await entry.hook($, frozen, next);
      } catch (err) {
        this.onHookError?.(entry.mod, event, err);
        if (entry.onError) {
          const next2 = makeNext();
          next2.called = next.called;
          return entry.onError($, frozen, next2, err);
        }
        // Throwing hook is skipped: continue the chain unless it already did.
        if (next.called) throw err;
        return run(i + 1, e);
      }
    };

    return run(0, input);
  }
}
