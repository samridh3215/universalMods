// Builds the `$` object handed to server-mod hooks.
import type { ModContext } from '../core/types.ts';
import type { Floor } from './floor.ts';
import { HIVE_TOOLS } from './mcp-tools.ts';

export function makeContext(floor: Floor, mod: string, timers: Set<NodeJS.Timeout>): ModContext {
  return {
    mod,
    provider: floor.o.provider,
    dataDir: floor.o.dataDir,
    agent: {
      list: () => floor.list(),
      get: (id) => floor.get(id),
      spawn: (spec) => floor.spawn(spec, `mod:${mod}`),
      send: (id, text, from) => floor.send(id, text, from ?? `mod:${mod}`),
      steer: (id, text) => floor.steer(id, text),
      interrupt: (id) => floor.interrupt(id),
      kill: (id) => floor.kill(id),
      hold: (id, held) => floor.hold(id, held),
      events: (id, limit) => floor.hive.eventsFor(id, limit),
    },
    hive: {
      tasks: () => floor.hive.tasks,
      addTask: (t) => floor.addTask(t, `mod:${mod}`),
      updateTask: (id, patch) => floor.updateTask(id, patch, `mod:${mod}`),
      board: () => floor.hive.board,
      setBoard: (text) => floor.setBoard(text, `mod:${mod}`),
      message: (from, to, text) => floor.message(from, to, text),
    },
    ui: {
      toast: (text, level = 'info') => floor.o.broadcast({ type: 'toast', mod, text, level }),
      status: (text) => {
        if (text === undefined) floor.status.delete(mod);
        else floor.status.set(mod, text);
        floor.o.broadcast({ type: 'status', status: Object.fromEntries(floor.status) });
      },
      publish: (channel, data) => floor.o.broadcast({ type: 'publish', mod, channel, data }),
    },
    state: {
      get: (k, init) => floor.sessionState.get(mod, k, init),
      set: (k, v) => floor.sessionState.set(mod, k, v),
    },
    store: {
      get: (k, init) => floor.kv.get(mod, k, init),
      set: (k, v) => floor.kv.set(mod, k, v),
    },
    clock: {
      every: (ms, fn) => void timers.add(setInterval(fn, ms)),
      after: (ms, fn) => void timers.add(setTimeout(fn, ms)),
    },
    command: {
      register: (name, description) => {
        floor.commands.set(name, { mod, description });
        floor.o.broadcast({ type: 'commands', commands: [...floor.commands].map(([n, c]) => ({ name: n, ...c })) });
      },
    },
    tool: {
      register: (def, handler) => {
        if (!/^[a-z][a-z0-9_]{1,48}$/.test(def.name)) throw new Error(`invalid tool name "${def.name}" (use snake_case)`);
        if (HIVE_TOOLS.some((t) => t.name === def.name)) throw new Error(`tool "${def.name}" is a built-in hive tool`);
        const owner = floor.modTools.get(def.name)?.mod;
        if (owner && owner !== mod) throw new Error(`tool "${def.name}" is already registered by mod ${owner}`);
        floor.modTools.set(def.name, { mod, def, handler });
      },
    },
    log: (...a) => floor.log(`[${mod}]`, ...a),
  };
}
