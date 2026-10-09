// Product roadmap mod.
// - State lives in $.store (persisted per floor) and is pushed live to the view.
// - Agents edit it through hive tools this mod registers (roadmap_get/_set/_upsert/_move/_remove).
// - Progress is live: kanban tasks tagged "[R3]" (title or detail) count toward item R3.
// - "Generate" spawns (or reuses) a PM agent that drafts the roadmap from a brief.
import type { ModContext, Register, Task } from 'universal-mods/server';

type Lane = 'now' | 'next' | 'later' | 'shipped';
const LANES: Lane[] = ['now', 'next', 'later', 'shipped'];

interface Item {
  id: string;
  title: string;
  detail?: string;
  lane: Lane;
  theme?: string;
  owner?: string;
  /** Manual progress 0–100, used when no kanban tasks are linked. */
  progress?: number;
  /** Ids of items this one depends on (drawn as arrows in the flowchart). */
  dependsOn?: string[];
  updatedAt: number;
  updatedBy: string;
}

interface Roadmap {
  title: string;
  vision?: string;
  items: Item[];
  seq: number;
  activity: { ts: number; by: string; text: string }[];
}

const EMPTY: Roadmap = { title: 'Product roadmap', items: [], seq: 0, activity: [] };

const load = ($: ModContext): Roadmap => structuredClone($.store.get<Roadmap>('roadmap', EMPTY));

function linked(item: Item, tasks: Task[]) {
  const tag = new RegExp(`\\[${item.id}\\]|roadmap:${item.id}\\b`, 'i');
  return tasks.filter((t) => tag.test(t.title) || tag.test(t.detail ?? ''));
}

/** Roadmap plus derived fields (live progress from linked tasks). */
function view($: ModContext, r = load($)) {
  const tasks = $.hive.tasks();
  return {
    ...r,
    items: r.items.map((it) => {
      const ts = linked(it, tasks);
      const done = ts.filter((t) => t.status === 'done').length;
      const progress = it.lane === 'shipped' ? 100 : ts.length ? Math.round((done / ts.length) * 100) : (it.progress ?? 0);
      return { ...it, progress, tasks: ts.map((t) => ({ id: t.id, title: t.title, status: t.status })) };
    }),
  };
}

function save($: ModContext, r: Roadmap, by: string, what: string) {
  r.activity = [{ ts: Date.now(), by, text: what }, ...r.activity].slice(0, 40);
  $.store.set('roadmap', r);
  publish($, r);
}

const publish = ($: ModContext, r?: Roadmap) => $.ui.publish('state', view($, r));

function lane(v: unknown): Lane | undefined {
  const s = String(v ?? '').toLowerCase();
  return (LANES as string[]).includes(s) ? (s as Lane) : undefined;
}

function upsert(r: Roadmap, a: Record<string, any>, by: string): Item {
  let it = a.id ? r.items.find((x) => x.id.toLowerCase() === String(a.id).toLowerCase()) : undefined;
  if (!it) {
    if (!a.title) throw new Error('title is required for a new item');
    it = { id: `R${++r.seq}`, title: String(a.title), lane: lane(a.lane) ?? 'next', updatedAt: 0, updatedBy: by };
    r.items.push(it);
  }
  if (a.title !== undefined) it.title = String(a.title);
  if (a.detail !== undefined) it.detail = String(a.detail);
  if (a.theme !== undefined) it.theme = String(a.theme);
  if (a.owner !== undefined) it.owner = a.owner ? String(a.owner) : undefined;
  if (lane(a.lane)) it.lane = lane(a.lane)!;
  if (a.depends_on !== undefined || a.dependsOn !== undefined) {
    const deps = (a.depends_on ?? a.dependsOn) as unknown;
    it.dependsOn = (Array.isArray(deps) ? deps : String(deps).split(/[,\s]+/)).map((d) => String(d).trim().toUpperCase()).filter((d) => d && d !== it!.id);
  }
  if (a.progress !== undefined) it.progress = Math.max(0, Math.min(100, Number(a.progress) || 0));
  it.updatedAt = Date.now();
  it.updatedBy = by;
  return it;
}

const ITEM_PROPS = {
  title: { type: 'string' },
  detail: { type: 'string', description: 'one line: the outcome / why' },
  lane: { type: 'string', enum: LANES },
  theme: { type: 'string', description: 'short grouping, e.g. "Onboarding", "Reliability"' },
  owner: { type: 'string', description: 'agent name or person' },
  progress: { type: 'number', description: '0-100; ignored when kanban tasks are tagged [Rn]' },
  depends_on: { type: 'array', items: { type: 'string' }, description: 'ids of items this depends on, e.g. ["R1"] (shown as arrows)' },
};

export const register: Register = (on) => {
  on('session.start', ($, _e, next) => {
    $.command.register('roadmap', 'Print the roadmap as text');

    $.tool.register(
      { name: 'roadmap_get', description: 'Read the product roadmap (lanes now/next/later/shipped, live progress from kanban tasks tagged [Rn]).', inputSchema: { type: 'object', properties: {} } },
      () => view($),
    );
    $.tool.register(
      {
        name: 'roadmap_set',
        description: 'Replace the whole roadmap. Use to draft it initially. Items get ids R1, R2, … in order.',
        inputSchema: {
          type: 'object',
          properties: { title: { type: 'string' }, vision: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: ITEM_PROPS, required: ['title', 'lane'] } } },
          required: ['items'],
        },
      },
      (a, c) => {
        const r: Roadmap = { ...load($), title: a.title ?? load($).title, vision: a.vision ?? load($).vision, items: [], seq: 0 };
        for (const x of a.items ?? []) upsert(r, { ...x, id: undefined }, c.agentName);
        save($, r, c.agentName, `drafted the roadmap (${r.items.length} items)`);
        return view($).items.map((i) => `${i.id} [${i.lane}] ${i.title}`).join('\n');
      },
    );
    $.tool.register(
      { name: 'roadmap_upsert', description: 'Add a roadmap item (omit id) or update one by id.', inputSchema: { type: 'object', properties: { id: { type: 'string' }, ...ITEM_PROPS } } },
      (a, c) => {
        const r = load($);
        const isNew = !a.id;
        const it = upsert(r, a, c.agentName);
        save($, r, c.agentName, `${isNew ? 'added' : 'updated'} ${it.id} “${it.title}”`);
        return `${it.id} saved`;
      },
    );
    $.tool.register(
      { name: 'roadmap_move', description: 'Move a roadmap item to another lane (e.g. to shipped when done).', inputSchema: { type: 'object', properties: { id: { type: 'string' }, lane: { type: 'string', enum: LANES } }, required: ['id', 'lane'] } },
      (a, c) => {
        const r = load($);
        const it = upsert(r, { id: a.id, lane: a.lane }, c.agentName);
        save($, r, c.agentName, `moved ${it.id} to ${it.lane}`);
        return `${it.id} → ${it.lane}`;
      },
    );
    $.tool.register(
      { name: 'roadmap_remove', description: 'Remove a roadmap item by id.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
      (a, c) => {
        const r = load($);
        r.items = r.items.filter((x) => x.id !== a.id);
        save($, r, c.agentName, `removed ${a.id}`);
        return `${a.id} removed`;
      },
    );

    publish($);
    return next();
  });

  // Live progress: any kanban change can move a progress bar.
  on('task.add', async ($, e, next) => {
    const out = await next(e);
    publish($);
    return out;
  });
  on('task.update', async ($, e, next) => {
    const out = await next(e);
    publish($);
    return out;
  });

  on('command.run', { name: 'roadmap' }, ($) => {
    const v = view($);
    const lines = LANES.flatMap((l) => {
      const items = v.items.filter((i) => i.lane === l);
      return items.length ? [`## ${l}`, ...items.map((i) => `- ${i.id} ${i.title} (${i.progress}%)`)] : [];
    });
    return { text: lines.join('\n') || 'Roadmap is empty.' };
  });

  // UI actions from the client view.
  on('ui.press', { mod: 'roadmap' }, async ($, e) => {
    const p = (e.payload ?? {}) as Record<string, any>;
    const r = load($);
    switch (e.key) {
      case 'get':
        return view($);
      case 'upsert': {
        const it = upsert(r, p, 'you');
        save($, r, 'you', `${p.id ? 'updated' : 'added'} ${it.id} “${it.title}”`);
        return view($);
      }
      case 'remove':
        r.items = r.items.filter((x) => x.id !== p.id);
        save($, r, 'you', `removed ${p.id}`);
        return view($);
      case 'meta':
        r.title = p.title ?? r.title;
        r.vision = p.vision ?? r.vision;
        save($, r, 'you', 'updated title/vision');
        return view($);
      case 'link-task': {
        const it = r.items.find((x) => x.id === p.id);
        if (!it) return view($);
        await $.hive.addTask({ title: `[${it.id}] ${p.title || it.title}`, assignee: p.assignee || undefined });
        save($, r, 'you', `added a task for ${it.id}`);
        return view($);
      }
      case 'generate':
        return generate($, String(p.brief ?? ''), p.agent ? String(p.agent) : undefined, p.cwd ? String(p.cwd) : undefined);
    }
    return null;
  });
};

async function generate($: ModContext, brief: string, agentId?: string, cwd?: string) {
  const prompt = `You are the product manager for this floor. Build a product roadmap${brief ? ` for: ${brief}` : ''}.

1. Gather context: hive board_read and task_list${cwd ? ', and skim the repository in your working directory (README, docs, recent structure)' : ''}.
2. Call roadmap_set with a title, a one-sentence vision, and 8–14 items across lanes now / next / later (use shipped only for things already done). Each item: short outcome-style title, one-line detail, a theme (3–5 themes total), an owner if obvious, and depends_on listing the ids (R1, R2, … in the order you give them) of items it truly builds on — the roadmap is rendered as a flowchart, so dependencies are the arrows.
3. For each "now" item, create 1–3 concrete kanban tasks with task_add whose titles start with the item tag, e.g. "[R1] …", so progress updates live.
4. Reply with a 3-line summary. Later, when work lands, keep the roadmap current with roadmap_move / roadmap_upsert.`;
  const existing = agentId ? $.agent.get(agentId) : $.agent.list().find((a) => /product|pm\b/i.test(a.role));
  if (existing) {
    await $.agent.send(existing.id, prompt, 'roadmap');
    $.ui.toast(`Asked ${existing.name} to draft the roadmap`);
    return { agent: existing.name };
  }
  const pm = await $.agent.spawn({ name: 'Pam', role: 'product manager (roadmap owner)', cwd: cwd || undefined, prompt });
  $.ui.toast(`Spawned ${pm.name} to draft the roadmap`);
  return { agent: pm.name };
}
