import { useEffect, useRef, useState } from 'react';
import { EventLine, StatusBadge, floor, fmtUsage, registerView, useAgentEvents, useFloor, type AgentInfo, type ViewProps } from 'universal-mods';

/** Stable hue per agent name, so each agent keeps its colour. */
const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

function AgentCard({ a }: { a: AgentInfo }) {
  const events = useAgentEvents(a.id, 300);
  const queued = useFloor((s) => s.queued[a.id] ?? 0);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);

  useEffect(() => {
    if (stick) end.current?.scrollIntoView({ block: 'end' });
  }, [events.length, stick]);

  const submit = (mode: 'send' | 'steer') => {
    if (!text.trim()) return;
    void (mode === 'send' ? floor.send(a.id, text) : floor.steer(a.id, text));
    setText('');
  };

  return (
    <div className="agent-card" data-status={a.status}>
      <div className="agent-head">
        <span className="avatar" style={{ '--h': hue(a.name) } as React.CSSProperties}>
          {a.name.slice(0, 1).toUpperCase()}
        </span>
        <strong>{a.name}</strong>
        <span className="muted small">{a.role}</span>
        <StatusBadge status={a.status} />
        {queued > 0 && <span className="small warn">{queued} queued</span>}
        <span className="spacer" />
        <span className="muted small" title={a.cwd}>
          {fmtUsage(a)}
        </span>
      </div>
      <div className="agent-controls">
        <button disabled={a.status !== 'working'} onClick={() => floor.interrupt(a.id)}>
          Interrupt
        </button>
        <button onClick={() => floor.hold(a.id, !a.held)}>{a.held ? 'Release' : 'Hold'}</button>
        <button className="danger-outline" onClick={() => floor.kill(a.id)} disabled={a.status === 'stopped'}>
          Stop
        </button>
        <button onClick={() => confirm(`Archive ${a.name}?`) && floor.archive(a.id)}>Archive</button>
        <span className="muted small" title={a.cwd}>
          {a.cwd.split('/').slice(-2).join('/')}
        </span>
      </div>
      <div
        className="agent-stream"
        onScroll={(e) => {
          const el = e.currentTarget;
          setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
        }}
      >
        {events.map((e) => (
          <EventLine key={e.seq} e={e} />
        ))}
        <div ref={end} />
      </div>
      <form
        className="agent-input"
        onSubmit={(e) => {
          e.preventDefault();
          submit('send');
        }}
      >
        <textarea
          rows={2}
          value={text}
          placeholder={a.status === 'working' ? 'Enter = queue next turn · ⌘/Ctrl+Enter = steer now' : 'message… (Enter to send)'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e.metaKey || e.ctrlKey ? 'steer' : 'send');
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
  const shown = only?.length ? agents.filter((a) => only.includes(a.id)) : agents;
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
      {shown.length === 0 && <div className="muted pad">No agents yet. Use the Spawner view.</div>}
      <div className="grid-cards" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {shown.map((a) => (
          <AgentCard key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}

registerView({ id: 'grid', title: 'Agent grid', render: (p) => <Grid {...p} /> });
