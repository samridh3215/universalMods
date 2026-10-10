import { useState } from 'react';
import { SpawnTile } from './spawn-tile.tsx';
import { AgentTerminal, StatusBadge, floor, fmtUsage, registerView, useFloor, type AgentInfo, type ViewProps } from 'universal-mods';

/** Stable hue per agent name, so each agent keeps its colour. */
const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

function AgentCard({ a }: { a: AgentInfo }) {
  const queued = useFloor((s) => s.queued[a.id] ?? 0);
  const [text, setText] = useState('');

  const submit = (mode: 'send' | 'steer') => {
    if (!text.trim()) return;
    void (mode === 'send' ? floor.send(a.id, text) : floor.steer(a.id, text));
    setText('');
  };

  return (
    <div className={`agent-card${a.master ? ' master' : ''}`} data-status={a.status}>
      <div className="agent-head">
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
      </div>
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
      <AgentTerminal agentId={a.id} />
      <form
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
      </form>
    </div>
  );
}

function Grid({ params, setParams }: ViewProps) {
  const agents = useFloor((s) => s.agents);
  const cols = params.columns ?? 2;
  const only: string[] | undefined = params.only;
  // The master orchestrator is always pinned first.
  const shown = (only?.length ? agents.filter((a) => only.includes(a.id)) : agents).slice().sort((x, y) => Number(!!y.master) - Number(!!x.master));
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
      </div>
      <div className="grid-cards" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {shown.map((a) => (
          <AgentCard key={a.id} a={a} />
        ))}
        <SpawnTile />
      </div>
    </div>
  );
}

registerView({ id: 'grid', title: 'Agent grid', render: (p) => <Grid {...p} /> });
