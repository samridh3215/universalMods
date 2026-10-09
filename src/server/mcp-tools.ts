// Server side of the "hive" MCP tools (bin/hive-mcp.mjs forwards calls here).
import type { Floor } from './floor.ts';

export const HIVE_TOOLS = [
  { name: 'list_agents', description: 'List agents on the floor with role, status and current activity.', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'send_message',
    description: 'Send a message to another agent (by name or id) or to "user". It is delivered as a new turn for that agent.',
    inputSchema: { type: 'object', properties: { to: { type: 'string' }, text: { type: 'string' } }, required: ['to', 'text'] },
  },
  {
    name: 'spawn_agent',
    description: 'Create a new agent on the floor. Optionally give it a first prompt.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string' }, role: { type: 'string' }, prompt: { type: 'string' }, model: { type: 'string' }, cwd: { type: 'string' } },
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

/** Built-in hive tools plus any registered by mods. */
export function hiveTools(floor: Floor) {
  return [...HIVE_TOOLS, ...[...floor.modTools.values()].map((t) => t.def)];
}

export async function handleMcpTool(floor: Floor, tool: string, agentId: string, a: Record<string, any>): Promise<{ text: string }> {
  const me = floor.get(agentId);
  if (!me) throw new Error(`unknown agent ${agentId}`);
  const json = (v: unknown) => ({ text: JSON.stringify(v, null, 2) });
  const modTool = floor.modTools.get(tool);
  if (modTool) {
    const out = await modTool.handler(a, { agentId: me.id, agentName: me.name });
    return typeof out === 'string' ? { text: out } : json(out ?? { ok: true });
  }
  switch (tool) {
    case 'list_agents':
      return json(floor.list().map((x) => ({ id: x.id, name: x.name, role: x.role, status: x.status, activity: x.lastActivity, you: x.id === me.id })));
    case 'send_message': {
      const r = await floor.message(me.id, String(a.to), String(a.text));
      return { text: r.delivered ? `delivered to ${a.to}` : `no agent named ${a.to}; use list_agents` };
    }
    case 'spawn_agent': {
      const ag = await floor.spawn({ name: a.name, role: a.role, prompt: a.prompt, model: a.model, cwd: a.cwd ?? me.cwd }, me.name);
      return { text: `spawned ${ag.name} (${ag.id})` };
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
