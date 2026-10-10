import { useState } from 'react';
import { SpawnTile } from './spawn-tile.tsx';
import { AgentTerminal, StatusBadge, floor, fmtUsage, registerView, useFloor, type AgentInfo, type ViewProps } from 'universal-mods';

/** Stable hue per agent name, so each agent keeps its colour. */
const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

function AgentCard({ a, collapsed, focused, onToggle, onFocus }: { a: AgentInfo; collapsed: boolean; focused: boolean; onToggle(): void; onFocus?(): void }) {
  const queued = useFloor((s) => s.queued[a.id] ?? 0);
  const [text, setText] = useState('');

  const submit = (mode: 'send' | 'steer') => {
    if (!text.trim()) return;
    void (mode === 'send' ? floor.send(a.id, text) : floor.steer(a.id, text));
    setText('');
  };

  return (
    <div className={`agent-card${a.master ? ' master' : ''}${collapsed ? ' card-collapsed' : ''}${focused ? ' card-focused' : ''}`} data-status={a.status}>
      <div className="agent-head" onDoubleClick={onToggle} title="Double-click to collapse or expand">
        <button className="icon" onClick={onToggle} title={collapsed ? 'Expand terminal' : 'Collapse to header'}>
          {collapsed ? '▸' : '▾'}
        </button>
        <span className="avatar" style={{ '--h': hue(a.name) } as React.CSSProperties}>
          {a.name.slice(0, 1).toUpperCase()}
        </span>
        <strong>{a.name}</strong>
        {a.master && <span className="master-badge" title="Master orchestrator: always present, cannot be deleted">★ master</span>}
        <span className="muted small">{a.role}</span>
        <StatusBadge status={a.status} />
        {queued > 0 && <span className="small warn">{queued} queued</span>}
        <span className="spacer" />
        <span className="muted small" title={a.cwd}>
          {fmtUsage(a)}
        </span>
        {onFocus && (
          <button className="icon" onClick={onFocus} title={focused ? 'Back to all agents' : 'Focus this agent'}>
            {focused ? '⤡' : '⤢'}
          </button>
        )}
      </div>
      {collapsed && a.lastActivity && <div className="card-activity small muted">{a.lastActivity}</div>}
      <div className="agent-controls">
        {a.status === 'stopped' || a.status === 'error' ? (
          <button className="primary" onClick={() => floor.start(a.id)} title="Launch the agent's terminal">
            Start
          </button>
        ) : (
          <button disabled={a.status !== 'working'} onClick={() => floor.interrupt(a.id)} title="Interrupt (sends Esc)">
            Interrupt
          </button>
        )}
        <button onClick={() => floor.hold(a.id, !a.held)}>{a.held ? 'Release' : 'Hold'}</button>
        <button className="danger-outline" onClick={() => floor.kill(a.id)} disabled={a.status === 'stopped'}>
          Stop
        </button>
        {!a.master && <button onClick={() => confirm(`Archive ${a.name}?`) && floor.archive(a.id)}>Archive</button>}
        <span className="muted small" title={a.cwd}>
          {a.cwd.split('/').slice(-2).join('/')}
        </span>
      </div>
      {/* The agent's real CLI, live. Click into it to type directly. */}
      {!collapsed && <AgentTerminal agentId={a.id} />}
      {!collapsed && <form
        className="agent-input"
        onSubmit={(e) => {
          e.preventDefault();
          submit('send');
        }}
      >
        <input
          value={text}
          placeholder={a.status === 'working' ? 'queue a message for its next turn (⌘/Ctrl+Enter: send now)…' : 'message (starts the agent if stopped)…'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit('steer');
            }
          }}
        />
      </form>}
    </div>
  );
}

function GridCards({ params, setParams }: ViewProps) {
  const agents = useFloor((s) => s.agents);
  const cols = params.columns ?? 2;
  const only: string[] | undefined = params.only;
  // The master orchestrator is always pinned first.
  const collapsed: string[] = params.collapsed ?? [];
  const focus: string | undefined = params.focus && agents.some((a) => a.id === params.focus) ? params.focus : undefined;
  const toggle = (id: string) => setParams({ ...params, collapsed: collapsed.includes(id) ? collapsed.filter((x) => x !== id) : [...collapsed, id] });
  const all = (only?.length ? agents.filter((a) => only.includes(a.id)) : agents).slice().sort((x, y) => Number(!!y.master) - Number(!!x.master));
  const shown = focus ? all.filter((a) => a.id === focus) : all;
  return (
    <div className="grid-view">
      <div className="grid-tools small">
        columns{' '}
        {[1, 2, 3, 4].map((n) => (
          <button key={n} className={n === cols ? 'active' : ''} onClick={() => setParams({ ...params, columns: n })}>
            {n}
          </button>
        ))}
        <select
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v === '*') setParams({ ...params, only: undefined });
            else if (v) setParams({ ...params, only: [...new Set([...(only ?? []), v])] });
          }}
        >
          <option value="">{only?.length ? `showing ${only.length}` : 'showing all'} …</option>
          <option value="*">show all</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              + {a.name}
            </option>
          ))}
        </select>
        <span className="spacer" />
        {!focus && (
          <>
            <button onClick={() => setParams({ ...params, collapsed: all.map((a) => a.id) })} title="Collapse every agent to its header">
              collapse all
            </button>
            <button onClick={() => setParams({ ...params, collapsed: [] })} title="Show every agent's terminal">
              expand all
            </button>
          </>
        )}
        {focus && <button onClick={() => setParams({ ...params, focus: undefined })}>⤡ all agents</button>}
      </div>
      <div className={`grid-cards${focus ? ' focused' : ''}`} style={{ gridTemplateColumns: focus ? '1fr' : `repeat(${cols}, minmax(0, 1fr))` }}>
        {shown.map((a) => (
          <AgentCard
            key={a.id}
            a={a}
            collapsed={!focus && collapsed.includes(a.id)}
            focused={focus === a.id}
            onToggle={() => (focus ? setParams({ ...params, focus: undefined }) : toggle(a.id))}
            onFocus={() => setParams({ ...params, focus: focus ? undefined : a.id, collapsed: collapsed.filter((x) => x !== a.id) })}
          />
        ))}
        {!focus && <SpawnTile />}
      </div>
    </div>
  );
}

/** Tabs mode: a strip of agent tiles; the selected agent's terminal fills the rest of the pane. */
function AgentTabs({ params, setParams }: ViewProps) {
  const agents = useFloor((s) => s.agents);
  const queued = useFloor((s) => s.queued);
  const sorted = agents.slice().sort((x, y) => Number(!!y.master) - Number(!!x.master));
  // `selected` undefined = default to the master; null = everything collapsed to tiles.
  const sel: string | null = params.selected === null ? null : params.selected === '+' ? '+' : sorted.find((a) => a.id === params.selected)?.id ?? sorted[0]?.id ?? null;
  const pick = (id: string | null) => setParams({ ...params, selected: id });
  const current = sorted.find((a) => a.id === sel);
  return (
    <div className="agent-tabs">
      <div className="tile-strip">
        {sorted.map((a) => (
          <button
            key={a.id}
            className={`agent-tile${a.id === sel ? ' active' : ''}${a.master ? ' master' : ''}`}
            data-status={a.status}
            onClick={() => pick(a.id === sel ? null : a.id)}
            title={`${a.name} · ${a.role} · ${a.status}${a.id === sel ? ' (click to collapse)' : ''}`}
          >
            <span className="avatar" style={{ '--h': hue(a.name) } as React.CSSProperties}>
              {a.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="tile-text">
              <span className="tile-name">
                {a.master && <span className="tile-star">★</span>}
                {a.name}
              </span>
              <span className="tile-status">
                <span className="tile-dot" /> {a.status}
                {(queued[a.id] ?? 0) > 0 && ` · ${queued[a.id]} queued`}
              </span>
            </span>
          </button>
        ))}
        <button className={`agent-tile add${sel === '+' ? ' active' : ''}`} onClick={() => pick(sel === '+' ? null : '+')} title="Spawn a new agent">
          <span className="spawn-plus small-plus">+</span>
          <span className="tile-text">
            <span className="tile-name">New agent</span>
          </span>
        </button>
      </div>
      <div className="tab-body">
        {sel === '+' && <SpawnTile startOpen onDone={(id) => pick(id ?? sorted[0]?.id ?? null)} />}
        {current && <AgentCard key={current.id} a={current} collapsed={false} focused onToggle={() => pick(null)} />}
        {sel === null && <div className="muted pad small">All agents collapsed. Click a tile to open its terminal.</div>}
      </div>
    </div>
  );
}

function Grid(props: ViewProps) {
  const { params, setParams } = props;
  const mode: 'tabs' | 'grid' = params.mode ?? 'tabs';
  return (
    <div className="agents-view">
      <div className="mode-switch small">
        {(['tabs', 'grid'] as const).map((m) => (
          <button key={m} className={mode === m ? 'active' : ''} onClick={() => setParams({ ...params, mode: m })}>
            {m === 'tabs' ? 'Tabs' : 'Grid'}
          </button>
        ))}
      </div>
      {mode === 'tabs' ? <AgentTabs {...props} /> : <GridCards {...props} />}
    </div>
  );
}

registerView({ id: 'grid', title: 'Agent grid', render: (p) => <Grid {...p} /> });
