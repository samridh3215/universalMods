// The shell is deliberately thin: setup screen, top bar, a pane layout that
// hosts views registered by mods, toasts and the "needs you" question tray.
import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { _internal, floor, useFloor, type ViewDef } from './mod-api.ts';
import { api, refresh, setToken } from './store.ts';
import { builtinViews } from './builtin-views.tsx';

type Pane = { view: string; params?: Record<string, any> };
type Layout = Pane[][];

const PRESETS: Record<string, Layout> = {
  ops: [[{ view: 'spawner' }, { view: 'mods' }], [{ view: 'grid' }], [{ view: 'timeline' }]],
  plan: [[{ view: 'kanban' }], [{ view: 'board' }, { view: 'timeline' }]],
  focus: [[{ view: 'grid', params: { columns: 1 } }]],
};

function loadLayouts(): Record<string, Layout> {
  try {
    return { ...PRESETS, ...JSON.parse(localStorage.getItem('um.layouts') ?? '{}') };
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
        <button>Connect</button>
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
            <div key={p} className="card">
              <h2>{p === 'claude' ? 'Claude Code' : 'Codex'}</h2>
              <p className={c.ok ? 'ok' : 'bad'}>{c.ok ? `found ${c.version ?? ''}` : c.error}</p>
              <button disabled={busy || !c.ok} onClick={() => pick(p)}>
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
  const [name, setName] = useState(() => localStorage.getItem('um.layout') ?? 'ops');
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
  const setPane = (c: number, p: number, pane: Pane | null) => {
    const next = layout.map((col) => [...col]);
    if (pane) next[c][p] = pane;
    else next[c].splice(p, 1);
    update(next.filter((col) => col.length));
  };

  return (
    <div className="shell">
      <header className="topbar">
        <strong className="topbar-brand"><img src="/logo.svg" alt="" /> universalMods</strong>
        <span className={`pill ${s.provider}`}>{s.provider}</span>
        <span className={`dot ${s.connected ? 'on' : 'off'}`} title={s.connected ? 'connected' : 'reconnecting'} />
        <select value={name} onChange={(e) => setName(e.target.value)}>
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
        <button onClick={() => update([...layout, [{ view: 'grid' }]])}>+ column</button>
        {name in PRESETS && JSON.stringify(layout) !== JSON.stringify(PRESETS[name]) && (
          <button onClick={() => update(PRESETS[name])}>reset</button>
        )}
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
        <button className={s.halted ? 'danger' : ''} onClick={() => floor.halt(!s.halted)}>
          {s.halted ? 'Resume floor' : 'Halt floor'}
        </button>
      </header>
      <Questions />
      <main className="layout">
        {layout.map((col, c) => (
          <div className="column" key={c}>
            {col.map((pane, p) => {
              const v = views.get(pane.view);
              return (
                <section className="pane" key={p}>
                  <div className="pane-head">
                    <select value={pane.view} onChange={(e) => setPane(c, p, { view: e.target.value })}>
                      {!v && <option value={pane.view}>{pane.view} (not loaded)</option>}
                      {[...views.values()].map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.title}
                        </option>
                      ))}
                    </select>
                    <span className="spacer" />
                    <button title="split below" onClick={() => update(layout.map((col2, i) => (i === c ? [...col2.slice(0, p + 1), { view: pane.view }, ...col2.slice(p + 1)] : col2)))}>
                      ⊟
                    </button>
                    <button title="close pane" onClick={() => setPane(c, p, null)}>
                      ×
                    </button>
                  </div>
                  <div className="pane-body">
                    {v ? (
                      <ErrorBoundary key={`${v.id}:${s.mods.find((m) => m.id === v.mod)?.version ?? 0}`}>
                        {v.render({ params: pane.params ?? {}, setParams: (params) => setPane(c, p, { ...pane, params }) })}
                      </ErrorBoundary>
                    ) : (
                      <div className="muted pad">View “{pane.view}” is not registered. Enable its mod in the Mods view.</div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ))}
      </main>
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
          <strong>{agents.find((a) => a.id === q.agentId)?.name ?? q.agentId} needs you:</strong> {q.question}
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
