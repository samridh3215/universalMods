import { useEffect, useState } from 'react';
import { floor, registerView, useFloor, useModChannel, type ViewProps } from 'universal-mods';
import { Flow } from './flow.tsx';
import { injectStyles } from './styles.ts';

injectStyles();

type Lane = 'now' | 'next' | 'later' | 'shipped';
const LANES: { id: Lane; label: string; hint: string }[] = [
  { id: 'now', label: 'Now', hint: 'in progress' },
  { id: 'next', label: 'Next', hint: 'up next' },
  { id: 'later', label: 'Later', hint: 'exploring' },
  { id: 'shipped', label: 'Shipped', hint: 'done' },
];

interface Item {
  id: string;
  title: string;
  detail?: string;
  lane: Lane;
  theme?: string;
  owner?: string;
  progress: number;
  updatedAt: number;
  updatedBy: string;
  dependsOn?: string[];
  tasks: { id: string; title: string; status: string }[];
}
interface State {
  title: string;
  vision?: string;
  items: Item[];
  activity: { ts: number; by: string; text: string }[];
}

const press = (key: string, payload?: unknown) => floor.press('roadmap', key, payload) as Promise<State>;
const hue = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 200);
const ago = (ts: number) => {
  const s = Math.round((Date.now() - ts) / 1000);
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : `${Math.round(s / 3600)}h ago`;
};

function Card({ it, onChange, fresh }: { it: Item; onChange: (s: State) => void; fresh: boolean }) {
  const [open, setOpen] = useState(false);
  const agents = useFloor((s) => s.agents);
  const idx = LANES.findIndex((l) => l.id === it.lane);
  const move = (d: number) => press('upsert', { id: it.id, lane: LANES[idx + d].id }).then(onChange);
  return (
    <div className={`rm-card${fresh ? ' rm-fresh' : ''}`} style={{ '--h': hue(it.theme) } as React.CSSProperties}>
      <div className="rm-top">
        <span className="rm-id">{it.id}</span>
        {it.theme && <span className="rm-theme">{it.theme}</span>}
        <span className="spacer" />
        {it.owner && <span className="muted small">@{it.owner}</span>}
      </div>
      <div className="rm-title" onClick={() => setOpen(!open)}>
        {it.title}
      </div>
      {it.detail && <div className="small muted">{it.detail}</div>}
      {!!it.dependsOn?.length && <div className="small muted">depends on {it.dependsOn.join(', ')}</div>}
      <div className="rm-progress" title={`${it.progress}%${it.tasks.length ? ` · ${it.tasks.filter((t) => t.status === 'done').length}/${it.tasks.length} tasks done` : ''}`}>
        <div style={{ width: `${it.progress}%` }} />
      </div>
      <div className="rm-foot small muted">
        <span>
          {it.progress}%{it.tasks.length ? ` · ${it.tasks.length} task${it.tasks.length > 1 ? 's' : ''}` : ''}
        </span>
        <span className="spacer" />
        <span title={new Date(it.updatedAt).toLocaleString()}>
          {it.updatedBy} · {ago(it.updatedAt)}
        </span>
      </div>
      {open && (
        <div className="rm-detail">
          {it.tasks.map((t) => (
            <div key={t.id} className="small">
              <span className={`rm-dot s-${t.status}`} /> {t.title} <span className="muted">({t.status})</span>
            </div>
          ))}
          <div className="row small">
            <button disabled={idx === 0} onClick={() => move(-1)}>
              ←
            </button>
            <button disabled={idx === LANES.length - 1} onClick={() => move(1)}>
              →
            </button>
            <button
              onClick={() => {
                const title = prompt(`Task for ${it.id}`, it.title);
                if (title) press('link-task', { id: it.id, title }).then(onChange);
              }}
            >
              + task
            </button>
            <select value="" onChange={(e) => e.target.value && press('upsert', { id: it.id, owner: e.target.value }).then(onChange)}>
              <option value="">owner…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className="spacer" />
            <button className="danger-outline" onClick={() => confirm(`Remove ${it.id}?`) && press('remove', { id: it.id }).then(onChange)}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Roadmap({ params, setParams }: ViewProps) {
  const mode: 'flow' | 'board' = params.mode ?? 'flow';
  const [selected, setSelected] = useState<string>();
  const live = useModChannel<State>('roadmap', 'state');
  const [state, setState] = useState<State>();
  const [prev, setPrev] = useState<Record<string, number>>({});
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [brief, setBrief] = useState('');
  const [adding, setAdding] = useState<Lane | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    press('get').then(setState).catch(() => {});
  }, []);
  useEffect(() => {
    if (live) setState(live);
  }, [live]);

  // Flash items that changed since the last update, so live edits are visible.
  useEffect(() => {
    if (!state) return;
    const changed = new Set(state.items.filter((i) => prev[i.id] !== undefined && prev[i.id] !== i.updatedAt).map((i) => i.id));
    setPrev(Object.fromEntries(state.items.map((i) => [i.id, i.updatedAt])));
    if (changed.size) {
      setFresh(changed);
      const t = setTimeout(() => setFresh(new Set()), 2500);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (!state) return <div className="pad muted">loading roadmap…</div>;
  const total = state.items.filter((i) => i.lane !== 'later');
  const overall = total.length ? Math.round(total.reduce((n, i) => n + i.progress, 0) / total.length) : 0;

  return (
    <div className="rm">
      <div className="rm-head">
        <div>
          <h3
            style={{ margin: 0 }}
            title="click to rename"
            onClick={() => {
              const title = prompt('Roadmap title', state.title);
              if (title) press('meta', { title }).then(setState);
            }}
          >
            {state.title}
          </h3>
          <div
            className="small muted"
            onClick={() => {
              const vision = prompt('Vision (one sentence)', state.vision ?? '');
              if (vision !== null) press('meta', { vision }).then(setState);
            }}
          >
            {state.vision || 'click to add a vision'}
          </div>
        </div>
        <span className="spacer" />
        <div className="rm-toggle">
          {(['flow', 'board'] as const).map((m) => (
            <button key={m} className={mode === m ? 'active' : ''} onClick={() => setParams({ ...params, mode: m })}>
              {m === 'flow' ? 'Flowchart' : 'Board'}
            </button>
          ))}
        </div>
        <div className="rm-overall" title="average progress of now + next + shipped">
          <div className="rm-progress">
            <div style={{ width: `${overall}%` }} />
          </div>
          <span className="small">{overall}%</span>
        </div>
      </div>
      <form
        className="rm-gen"
        onSubmit={(e) => {
          e.preventDefault();
          press('generate', { brief }).then(() => setBrief(''));
        }}
      >
        <input placeholder="Brief for the PM agent, e.g. “self-serve onboarding for universalMods”" value={brief} onChange={(e) => setBrief(e.target.value)} />
        <button className="primary">{state.items.length ? 'Re-plan with agent' : 'Generate with agent'}</button>
      </form>
      {mode === 'flow' && (
        <>
          {state.items.length ? (
            <Flow items={state.items} selected={selected} onSelect={(id) => setSelected(id === selected ? undefined : id)} />
          ) : (
            <div className="muted pad">No items yet. Generate with an agent, or switch to Board and add some.</div>
          )}
          {selected && state.items.find((i) => i.id === selected) && (
            <div className="rm-selected">
              <Card it={state.items.find((i) => i.id === selected)!} onChange={setState} fresh={fresh.has(selected)} />
            </div>
          )}
        </>
      )}
      {mode === 'board' && <div className="rm-lanes">
        {LANES.map((l) => {
          const items = state.items.filter((i) => i.lane === l.id);
          return (
            <div key={l.id} className="rm-lane" data-lane={l.id}>
              <div className="rm-lane-head">
                <strong>{l.label}</strong>
                <span className="rm-count">{items.length}</span>
                <span className="muted small">{l.hint}</span>
                <span className="spacer" />
                <button title="add item" onClick={() => setAdding(adding === l.id ? null : l.id)}>
                  +
                </button>
              </div>
              {adding === l.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.trim()) return;
                    press('upsert', { title: draft, lane: l.id }).then(setState);
                    setDraft('');
                    setAdding(null);
                  }}
                >
                  <input autoFocus style={{ width: '100%' }} placeholder="new item title" value={draft} onChange={(e) => setDraft(e.target.value)} />
                </form>
              )}
              {items.map((it) => (
                <Card key={it.id} it={it} onChange={setState} fresh={fresh.has(it.id)} />
              ))}
            </div>
          );
        })}
      </div>}
      {state.activity.length > 0 && (
        <details className="rm-activity">
          <summary className="small">activity ({state.activity.length})</summary>
          {state.activity.map((a, i) => (
            <div key={i} className="small">
              <span className="muted">{new Date(a.ts).toLocaleTimeString()}</span> <strong>{a.by}</strong> {a.text}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

registerView({ id: 'roadmap', title: 'Roadmap', render: (p) => <Roadmap {...p} /> });
