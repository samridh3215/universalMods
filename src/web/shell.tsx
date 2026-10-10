// The shell is deliberately thin: setup screen, top bar, a pane layout that
// hosts views registered by mods, toasts and the "needs you" question tray.
import { Component, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { _internal, floor, useFloor, type ViewDef } from './mod-api.ts';
import { api, refresh, setToken } from './store.ts';
import { ModsPanel, builtinViews } from './builtin-views.tsx';
import { Markdown } from './markdown.tsx';
import { fromViews, normalize, Workspace, type Layout } from './layout.tsx';

// Built-in layouts. Users rearrange them freely; changes are saved per layout name.
const PRESETS: Record<string, Layout> = {
  ops: fromViews([['grid'], ['timeline']]),
  plan: fromViews([['kanban'], ['board', 'timeline']]),
  focus: fromViews([[{ view: 'grid', params: { columns: 1 } }]]),
  roadmap: fromViews([[{ view: 'roadmap', params: { mode: 'flow' } }], [{ view: 'grid', params: { columns: 1 } }, 'kanban']]),
  // Everything at a glance: agent tiles + live terminal | roadmap flowchart over the kanban.
  showcase: [
    { id: 'show-a', size: 1.1, panes: [{ id: 'show-grid', view: 'grid', params: { mode: 'tabs' } }] },
    {
      id: 'show-b',
      size: 1,
      panes: [
        { id: 'show-roadmap', view: 'roadmap', size: 1.25, params: { mode: 'flow' } },
        { id: 'show-kanban', view: 'kanban', size: 1 },
      ],
    },
  ],
  // Live terminals of several agents side by side, with the event stream and token spend.
  mission: [
    { id: 'mc-a', size: 1.75, panes: [{ id: 'mc-grid', view: 'grid', params: { mode: 'grid', columns: 2 } }] },
    {
      id: 'mc-b',
      size: 1,
      panes: [
        { id: 'mc-timeline', view: 'timeline', size: 1.6 },
        { id: 'mc-cost', view: 'cost-panel', size: 0.75 },
      ],
    },
  ],
  // One agent, up close: its terminal huge, with token spend and the timeline beside it.
  deepdive: [
    { id: 'dd-a', size: 2.2, panes: [{ id: 'dd-term', view: 'grid', params: { mode: 'tabs' } }] },
    {
      id: 'dd-b',
      size: 1,
      panes: [
        { id: 'dd-cost', view: 'cost-panel', size: 0.6 },
        { id: 'dd-timeline', view: 'timeline', size: 1.6 },
      ],
    },
  ],
  // Status at a glance: time, spend, who talks to whom, and the task board.
  dashboard: [
    {
      id: 'db-a',
      size: 0.85,
      panes: [
        { id: 'db-clock', view: 'clock', size: 0.6 },
        { id: 'db-cost', view: 'cost-panel', size: 0.75 },
      ],
    },
    {
      id: 'db-b',
      size: 1.35,
      panes: [
        { id: 'db-graph', view: 'agent-graph', size: 0.6 },
        { id: 'db-kanban', view: 'kanban', size: 1.4 },
      ],
    },
    { id: 'db-c', size: 0.9, panes: [{ id: 'db-timeline', view: 'timeline' }] },
  ],
  // Planning room: the roadmap as a flowchart and as columns, the kanban and the shared board.
  planner: [
    {
      id: 'pl-a',
      size: 1.45,
      panes: [
        { id: 'pl-flow', view: 'roadmap', size: 1.35, params: { mode: 'flow' } },
        { id: 'pl-kanban', view: 'kanban', size: 1 },
      ],
    },
    {
      id: 'pl-b',
      size: 1,
      panes: [
        { id: 'pl-columns', view: 'roadmap', size: 1.5, params: { mode: 'board' } },
        { id: 'pl-board', view: 'board', size: 1 },
      ],
    },
  ],
  // The fun one: the agent graph centre stage under a giant clock, flanked by folded strips.
  arcade: [
    {
      id: 'ar-a',
      panes: [
        { id: 'ar-kanban', view: 'kanban', collapsed: true },
        { id: 'ar-board', view: 'board', collapsed: true },
      ],
    },
    {
      id: 'ar-b',
      size: 2,
      panes: [
        { id: 'ar-clock', view: 'clock', size: 1.1 },
        { id: 'ar-graph', view: 'agent-graph', size: 0.9 },
      ],
    },
    {
      id: 'ar-c',
      size: 0.75,
      panes: [
        { id: 'ar-cost', view: 'cost-panel', size: 0.6 },
        { id: 'ar-timeline', view: 'timeline', size: 1.4 },
      ],
    },
  ],
  // Nothing but the agent tiles and one terminal, with everything else folded away at the edges.
  zen: [
    { id: 'zen-l', panes: [{ id: 'zen-kanban', view: 'kanban', collapsed: true }] },
    { id: 'zen-m', size: 3, panes: [{ id: 'zen-term', view: 'grid', params: { mode: 'tabs' } }] },
    { id: 'zen-r', panes: [{ id: 'zen-timeline', view: 'timeline', collapsed: true }] },
  ],
};

function loadLayouts(): Record<string, Layout> {
  try {
    const saved = JSON.parse(localStorage.getItem('um.layouts') ?? '{}') as Record<string, unknown>;
    const custom = Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, normalize(v)]).filter(([, v]) => (v as Layout).length));
    return { ...PRESETS, ...custom };
  } catch {
    return { ...PRESETS };
  }
}

function saveLayouts(all: Record<string, Layout>) {
  try {
    const custom = Object.fromEntries(Object.entries(all).filter(([k]) => !(k in PRESETS) || JSON.stringify(all[k]) !== JSON.stringify(PRESETS[k])));
    localStorage.setItem('um.layouts', JSON.stringify(custom));
  } catch {}
}

function useRegistry() {
  useSyncExternalStore(_internal.subscribe, () => _internal.registry.version);
  const views = new Map<string, ViewDef>([...builtinViews.map((v) => [v.id, v] as const), ..._internal.registry.views]);
  return { views, toolbar: [..._internal.registry.toolbar.values()] };
}

export function App() {
  const s = useFloor();
  if (s.authError) return <TokenPrompt message={s.authError} />;
  if (!s.ready) return <div className="center muted">connecting…</div>;
  if (s.setup) return <Setup />;
  return <Shell />;
}

function TokenPrompt({ message }: { message: string }) {
  const [t, setT] = useState('');
  return (
    <form
      className="setup"
      onSubmit={(e) => {
        e.preventDefault();
        if (t.trim()) setToken(t);
      }}
    >
      <div className="setup-brand">
        <img src="/logo.svg" alt="" />
        <h1>universalMods</h1>
      </div>
      <p className="bad">{message}</p>
      <p className="muted">
        Open the exact URL the server printed (<code>http://127.0.0.1:4477/?token=…</code>), or paste the token here.
      </p>
      <div className="row">
        <input autoFocus style={{ flex: 1 }} placeholder="token" value={t} onChange={(e) => setT(e.target.value)} />
        <button className="primary">Connect</button>
      </div>
    </form>
  );
}

function Setup() {
  const s = useFloor((x) => x.setup!);
  const [busy, setBusy] = useState(false);
  const pick = async (provider: string) => {
    setBusy(true);
    try {
      await api('/api/setup', 'POST', { provider });
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="setup">
      <div className="setup-brand">
        <img src="/logo.svg" alt="" />
        <h1>universalMods</h1>
      </div>
      <p className="muted">
        Pick the agent platform for this floor. A floor runs one platform only; start another floor with <code>--data</code> for the other one.
      </p>
      <div className="setup-cards">
        {(['claude', 'codex'] as const).map((p) => {
          const c = s.checks[p];
          return (
            <div key={p} className={`card ${p}`}>
              <h2>{p === 'claude' ? 'Claude Code' : 'Codex'}</h2>
              <p className={c.ok ? 'ok' : 'bad'}>{c.ok ? `found ${c.version ?? ''}` : c.error}</p>
              <button className="primary" disabled={busy || !c.ok} onClick={() => pick(p)}>
                Use {p}
              </button>
            </div>
          );
        })}
      </div>
      <p className="muted small">Data dir: {s.dataDir}</p>
    </div>
  );
}

function Shell() {
  const s = useFloor();
  const { views, toolbar } = useRegistry();
  const [layouts, setLayouts] = useState(loadLayouts);
  // ?layout=<name> picks a layout (handy for sharing a view); otherwise the last one used.
  const [name, setName] = useState(() => new URLSearchParams(location.search).get('layout') ?? localStorage.getItem('um.layout') ?? 'ops');
  const layout = layouts[name] ?? PRESETS.ops;

  useEffect(() => {
    try {
      localStorage.setItem('um.layout', name);
    } catch {}
  }, [name]);

  const update = (next: Layout) => {
    const all = { ...layouts, [name]: next };
    setLayouts(all);
    saveLayouts(all);
  };
  const addPanel = (view: string) => update([...layout, ...fromViews([[view]])]);

  return (
    <div className="shell">
      <header className="topbar">
        <strong className="topbar-brand"><img src="/logo.svg" alt="" /> universalMods</strong>
        {s.version && (
          <a className="version" href={`https://github.com/samridh3215/universalMods/releases/tag/v${s.version}`} target="_blank" rel="noopener noreferrer" title="Release notes">
            v{s.version}
          </a>
        )}
        <span className={`pill ${s.provider}`}>{s.provider}</span>
        <span className={`dot ${s.connected ? 'on' : 'off'}`} title={s.connected ? 'connected' : 'reconnecting'} />
        <select value={name} onChange={(e) => setName(e.target.value)} title="Layout">
          {Object.keys(layouts).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <button
          onClick={() => {
            const n = prompt('Save layout as', name === 'ops' ? 'my-layout' : name);
            if (!n) return;
            const all = { ...layouts, [n]: layout };
            setLayouts(all);
            saveLayouts(all);
            setName(n);
          }}
        >
          Save as…
        </button>
        <select value="" onChange={(e) => e.target.value && addPanel(e.target.value)} title="Add a panel">
          <option value="">+ Panel</option>
          {[...views.values()].map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
        {name in PRESETS && JSON.stringify(layout) !== JSON.stringify(PRESETS[name]) && <button onClick={() => update(PRESETS[name])}>reset</button>}
        {toolbar.map((t) => (
          <span key={t.id}>{t.render()}</span>
        ))}
        <span className="spacer" />
        {Object.entries(s.status).map(([mod, text]) => (
          <span key={mod} className="status" title={mod}>
            {text}
          </span>
        ))}
        {!s.check?.ok && <span className="bad">{s.check?.error}</span>}
        <ModsButton />
        <button className={s.halted ? 'danger' : 'danger-outline'} onClick={() => floor.halt(!s.halted)}>
          {s.halted ? 'Resume floor' : 'Halt floor'}
        </button>
      </header>
      <Questions />
      <Workspace
        layout={layout}
        onChange={update}
        views={views}
        renderBody={(pane, setParams) => {
          const v = views.get(pane.view);
          return v ? (
            <ErrorBoundary key={`${v.id}:${s.mods.find((m) => m.id === v.mod)?.version ?? 0}`}>{v.render({ params: pane.params ?? {}, setParams })}</ErrorBoundary>
          ) : (
            <div className="muted pad">View “{pane.view}” is not registered. Enable its mod from the Mods menu.</div>
          );
        }}
      />
      <div className="toasts">
        {s.toasts.map((t) => (
          <div key={t.id} className={`toast ${t.level}`}>
            <span className="muted small">{t.mod}</span> {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mods & skills live in a top-bar pop-over instead of taking pane space. */
function ModsButton() {
  const [open, setOpen] = useState(false);
  const mods = useFloor((s) => s.mods);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => (document.removeEventListener('mousedown', close), document.removeEventListener('keydown', esc));
  }, [open]);
  const errors = mods.filter((m) => m.error).length;
  return (
    <div className="popover-wrap" ref={ref}>
      <button className={open ? 'active' : ''} onClick={() => setOpen(!open)}>
        🧩 Mods & skills {errors > 0 && <span className="badge-err">{errors}</span>}
      </button>
      {open && (
        <div className="popover">
          <ModsPanel />
        </div>
      )}
    </div>
  );
}

function Questions() {
  const qs = useFloor((s) => s.questions);
  const agents = useFloor((s) => s.agents);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  if (!qs.length) return null;
  return (
    <div className="questions">
      {qs.map((q) => (
        <form
          key={q.id}
          onSubmit={(e) => {
            e.preventDefault();
            void floor.answer(q.id, answers[q.id] ?? '');
          }}
        >
          <strong>{agents.find((a) => a.id === q.agentId)?.name ?? q.agentId} needs you:</strong> <Markdown text={q.question} />
          <input autoFocus value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder="answer…" />
          <button>Answer</button>
        </form>
      ))}
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  render() {
    return this.state.err ? <pre className="bad pad">{String(this.state.err.stack ?? this.state.err)}</pre> : this.props.children;
  }
}
