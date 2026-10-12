// Hive tools that let agents run the floor itself: other agents, mods and the UI.
// Each is gated by a capability in Settings (see settings.ts).
import type { AgentInfo } from '../core/types.ts';
import type { Floor } from './floor.ts';
import { createMod } from './mod-builder.ts';

const agentArg = { agent: { type: 'string', description: 'Agent name or id.' } };
const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required });

export const FLOOR_TOOLS = [
  { name: 'agent_start', description: "Start another agent's CLI session (if it is stopped).", inputSchema: obj(agentArg, ['agent']) },
  { name: 'agent_stop', description: "Stop another agent's CLI session. It keeps its history and can be started again.", inputSchema: obj(agentArg, ['agent']) },
  { name: 'agent_interrupt', description: "Interrupt another agent's current turn.", inputSchema: obj(agentArg, ['agent']) },
  {
    name: 'agent_hold',
    description: 'Hold an agent (queue its incoming messages) or release it.',
    inputSchema: obj({ ...agentArg, held: { type: 'boolean' } }, ['agent', 'held']),
  },
  { name: 'agent_archive', description: 'Stop an agent and remove it from the floor. The master orchestrator cannot be archived.', inputSchema: obj(agentArg, ['agent']) },
  {
    name: 'mod_list',
    description: "List the floor's mods (id, enabled, errors). Mods live in folders under the project's mods/ and <floor data>/mods/; edit their files and they hot-reload.",
    inputSchema: obj({}),
  },
  { name: 'mod_enable', description: 'Turn a mod on or off.', inputSchema: obj({ id: { type: 'string' }, enabled: { type: 'boolean' } }, ['id', 'enabled']) },
  {
    name: 'mod_create',
    description: 'Build a new mod from a plain-English description. A Mod Builder agent writes it, checks it loads, and it hot-reloads into the floor.',
    inputSchema: obj({ description: { type: 'string' }, target: { type: 'string', enum: ['floor', 'project'], description: 'floor (default): this floor only; project: the shared mods/ folder.' } }, ['description']),
  },
  {
    name: 'ui_layout',
    description: 'Switch the layout for everyone watching the floor. Built-ins: ops, plan, focus, roadmap, showcase, mission, deepdive, dashboard, planner, arcade, zen (viewers may also have saved their own).',
    inputSchema: obj({ name: { type: 'string' } }, ['name']),
  },
  {
    name: 'ui_add_panel',
    description: 'Add a panel to the current layout for everyone watching, by view id (e.g. grid, kanban, board, timeline, roadmap, or a view from a mod).',
    inputSchema: obj({ view: { type: 'string' } }, ['view']),
  },
];

/** Run a floor tool. Returns undefined if `tool` is not one of ours. */
export async function handleFloorTool(floor: Floor, me: AgentInfo, tool: string, a: Record<string, any>): Promise<{ text: string } | undefined> {
  const other = () => {
    const t = floor.get(String(a.agent ?? ''));
    if (!t || t.archived) throw new Error(`no agent "${a.agent}"; use list_agents`);
    if (t.id === me.id) throw new Error('that is you; this tool acts on other agents');
    return t;
  };
  switch (tool) {
    case 'agent_start': {
      const t = other();
      await floor.start(t.id);
      return { text: `started ${t.name}` };
    }
    case 'agent_stop': {
      const t = other();
      await floor.kill(t.id);
      return { text: `stopped ${t.name}` };
    }
    case 'agent_interrupt': {
      const t = other();
      await floor.interrupt(t.id);
      return { text: `interrupted ${t.name}` };
    }
    case 'agent_hold': {
      const t = other();
      floor.hold(t.id, !!a.held);
      return { text: `${a.held ? 'holding' : 'released'} ${t.name}` };
    }
    case 'agent_archive': {
      const t = other();
      await floor.archive(t.id);
      return { text: `archived ${t.name}` };
    }
    case 'mod_list':
      return { text: JSON.stringify(floor.runtime.list(), null, 2) };
    case 'mod_enable': {
      const id = String(a.id);
      if (!floor.runtime.list().some((m) => m.id === id)) throw new Error(`no mod "${id}"; use mod_list`);
      await floor.runtime.setEnabled(id, !!a.enabled);
      return { text: `${id} ${a.enabled ? 'enabled' : 'disabled'}` };
    }
    case 'mod_create': {
      const r = await createMod(floor, String(a.description ?? ''), a.target === 'project' ? 'project' : 'floor');
      return { text: `${r.agent} is building it in ${r.dir}/; it hot-reloads when done.` };
    }
    case 'ui_layout':
      floor.o.broadcast({ type: 'ui', action: 'layout', name: String(a.name), by: me.name });
      return { text: `asked viewers to switch to the "${a.name}" layout (ignored by viewers who don't have it)` };
    case 'ui_add_panel':
      floor.o.broadcast({ type: 'ui', action: 'panel', view: String(a.view), by: me.name });
      return { text: `asked viewers to add a "${a.view}" panel (ignored if no mod provides that view)` };
  }
  return undefined;
}
