import { EventLine, registerView, useAgentEvents, useFloor, type ViewProps } from 'universal-mods';

const KINDS = ['user', 'text', 'tool', 'file', 'turn', 'error', 'reasoning', 'notice'];

function Timeline({ params, setParams }: ViewProps) {
  const agents = useFloor((s) => s.agents);
  const messages = useFloor((s) => s.messages);
  const events = useAgentEvents(undefined, 800);
  const hidden: string[] = params.hidden ?? ['reasoning', 'text'];
  const names = Object.fromEntries(agents.map((a) => [a.id, a.name]));
  const shown = events.filter((e) => !hidden.includes(e.event.kind) && (!params.agent || e.agentId === params.agent)).slice(-400).reverse();
  return (
    <div className="pad">
      <div className="chips">
        {KINDS.map((k) => (
          <label key={k} className={`chip k-${k}`}>
            <input type="checkbox" checked={!hidden.includes(k)} onChange={(e) => setParams({ ...params, hidden: e.target.checked ? hidden.filter((x) => x !== k) : [...hidden, k] })} /> {k}
          </label>
        ))}
        <select value={params.agent ?? ''} onChange={(e) => setParams({ ...params, agent: e.target.value || undefined })}>
          <option value="">all agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <details>
        <summary className="small">hive messages ({messages.length})</summary>
        {messages
          .slice(-50)
          .reverse()
          .map((m) => (
            <div key={m.id} className="ev small">
              <span className="muted">{new Date(m.ts).toLocaleTimeString()}</span> <strong>{names[m.from] ?? m.from}</strong> → <strong>{names[m.to] ?? m.to}</strong>: {m.text}
            </div>
          ))}
      </details>
      {shown.map((e) => (
        <EventLine key={e.seq} e={e} agentName={names[e.agentId] ?? e.agentId} />
      ))}
    </div>
  );
}

registerView({ id: 'timeline', title: 'Timeline', render: (p) => <Timeline {...p} /> });
