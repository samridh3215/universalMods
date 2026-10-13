// Server side of the "hive" MCP tools (bin/hive-mcp.mjs forwards calls here).
import type { Floor } from './floor.ts';
import { FLOOR_TOOLS, handleFloorTool } from './floor-tools.ts';
import { CAPABILITIES } from './settings.ts';

export const HIVE_TOOLS = [
  { name: 'list_agents', description: 'List agents on the floor with role, status and current activity.', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'send_message',
    description: 'Send a message to another agent (by name or id) or to "user". It is delivered as a new turn for that agent.',
    inputSchema: { type: 'object', properties: { to: { type: 'string' }, text: { type: 'string' } }, required: ['to', 'text'] },
  },
  {
    name: 'spawn_agent',
    description: 'Create a new agent on the floor. Optionally give it a first prompt. It joins your project unless you name another (project_list).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        role: { type: 'string' },
        prompt: { type: 'string' },
        model: { type: 'string' },
        project: { type: 'string', description: 'Project name or id; "none" for a private scratch folder.' },
        cwd: { type: 'string', description: 'Only when there is no project.' },
      },
      required: ['name'],
    },
  },
  { name: 'task_list', description: 'List kanban tasks.', inputSchema: { type: 'object', properties: { status: { type: 'string' } } } },
  {
    name: 'task_add',
    description: 'Add a kanban task. If assignee is set, that agent is notified.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, detail: { type: 'string' }, assignee: { type: 'string' } }, required: ['title'] },
  },
  {
    name: 'task_update',
    description: 'Update a task: status (todo|doing|review|done), assignee, title or detail.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, status: { type: 'string', enum: ['todo', 'doing', 'review', 'done'] }, assignee: { type: 'string' }, title: { type: 'string' }, detail: { type: 'string' } },
      required: ['id'],
    },
  },
  { name: 'board_read', description: 'Read the shared plan board (markdown).', inputSchema: { type: 'object', properties: {} } },
  { name: 'board_write', description: 'Replace the shared plan board (markdown). Read it first and keep what others wrote.', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'ask_user', description: 'Ask the human supervisor a question and wait for the answer.', inputSchema: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] } },
];

/** Built-in hive tools plus any registered by mods, minus what Settings withholds from this agent. */
export function hiveTools(floor: Floor, agentId?: string) {
  const all = [...HIVE_TOOLS, ...FLOOR_TOOLS, ...[...floor.modTools.values()].map((t) => t.def)];
  if (!agentId) return all;
  const me = floor.get(agentId);
  return all.filter((t) => floor.settings.allowed(me, t.name));
}

export async function handleMcpTool(floor: Floor, tool: string, agentId: string, a: Record<string, any>): Promise<{ text: string }> {
  const me = floor.get(agentId);
  if (!me) throw new Error(`unknown agent ${agentId}`);
  // Checked on every call: the tool list an agent saw at start may be stale.
  if (!floor.settings.allowed(me, tool)) {
    const cap = floor.settings.capabilityOf(tool)!;
    const scope = floor.settings.get().capabilities[cap] === 'master' ? 'the Orchestrator only' : 'no agents';
    throw new Error(`${tool} is turned off for ${me.name}: Settings → "${CAPABILITIES[cap].label}" allows ${scope}. Ask the user to change it; don't retry.`);
  }
  const json = (v: unknown) => ({ text: JSON.stringify(v, null, 2) });
  const modTool = floor.modTools.get(tool);
  if (modTool) {
    const out = await modTool.handler(a, { agentId: me.id, agentName: me.name });
    return typeof out === 'string' ? { text: out } : json(out ?? { ok: true });
  }
  const floorTool = await handleFloorTool(floor, me, tool, a);
  if (floorTool) return floorTool;
  switch (tool) {
    case 'list_agents':
      return json(floor.list().map((x) => ({ id: x.id, name: x.name, role: x.role, status: x.status, activity: x.lastActivity, you: x.id === me.id })));
    case 'send_message': {
      const r = await floor.message(me.id, String(a.to), String(a.text));
      return { text: r.delivered ? `delivered to ${a.to}` : `no agent named ${a.to}; use list_agents` };
    }
    case 'spawn_agent': {
      // Teammates join the spawner's project by default; without one they share its folder as before.
      const project = a.project === 'none' ? undefined : (a.project ?? me.project);
      const ag = await floor.spawn({ name: a.name, role: a.role, prompt: a.prompt, model: a.model, project, cwd: project ? undefined : (a.cwd ?? me.cwd) }, me.name);
      const p = floor.projects.get(ag.project);
      return { text: `spawned ${ag.name} (${ag.id})${p ? ` on project ${p.name}` : ''}` };
    }
    case 'task_list':
      return json(floor.hive.tasks.filter((t) => !a.status || t.status === a.status));
    case 'task_add':
      return json(await floor.addTask({ title: a.title, detail: a.detail, assignee: a.assignee }, me.name));
    case 'task_update': {
      const { id, ...patch } = a;
      const t = await floor.updateTask(String(id), patch, me.name);
      return t ? json(t) : { text: `no task ${id}` };
    }
    case 'board_read':
      return { text: floor.hive.board };
    case 'board_write':
      await floor.setBoard(String(a.text), me.name);
      return { text: 'board updated' };
    case 'ask_user':
      return { text: await floor.ask(me.id, String(a.question)) };
  }
  throw new Error(`unknown hive tool ${tool}`);
}
