// Views the shell always provides, so a floor stays recoverable even if every mod is off.
import { useEffect, useState } from 'react';
import { floor, useFloor, type ViewDef } from './mod-api.ts';

function ModsView() {
  const mods = useFloor((s) => s.mods);
  const skills = useFloor((s) => s.skills);
  const commands = useFloor((s) => s.commands);
  return (
    <div className="pad">
      <h3>Mods</h3>
      <p className="muted small">Edit files under mods/ (or data/mods/) and they hot-reload.</p>
      {mods.map((m) => (
        <label key={m.id} className="row">
          <input type="checkbox" checked={m.enabled} onChange={(e) => floor.setModEnabled(m.id, e.target.checked)} />
          <span>
            <strong>{m.name}</strong> <span className="muted small">{m.id}{m.hasServer ? ' · server' : ''}{m.hasClient ? ' · client' : ''}</span>
            <br />
            <span className="small">{m.description}</span>
            {m.error && <pre className="bad small">{m.error}</pre>}
          </span>
        </label>
      ))}
      {commands.length > 0 && (
        <>
          <h3>Commands</h3>
          {commands.map((c) => (
            <div key={c.name} className="row">
              <button
                onClick={async () => {
                  const args = prompt(`/${c.name} args`) ?? '';
                  const r = await floor.command(c.name, args);
                  if (r?.text) alert(r.text);
                }}
              >
                /{c.name}
              </button>
              <span className="small muted">{c.description}</span>
            </div>
          ))}
        </>
      )}
      <h3>Skills ({skills.length})</h3>
      <div className="small">
        {skills.map((s) => (
          <div key={s.name}>
            <strong>{s.name}</strong> <span className="muted">{s.source}</span> — {s.description.slice(0, 140)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigView({ params, setParams }: { params: Record<string, any>; setParams(p: Record<string, any>): void }) {
  const agents = useFloor((s) => s.agents);
  const id = params.agent ?? agents[0]?.id;
  const [cfg, setCfg] = useState<any>();
  useEffect(() => {
    if (id) floor.config(id).then(setCfg, () => setCfg(undefined));
  }, [id]);
  return (
    <div className="pad">
      <select value={id ?? ''} onChange={(e) => setParams({ agent: e.target.value })}>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      {cfg && (
        <>
          <h4>Files written</h4>
          <ul className="small">
            {cfg.files.map((f: string) => (
              <li key={f}>
                <code>{f}</code>
              </li>
            ))}
          </ul>
          <h4>Effective config (after config.build mods)</h4>
          <pre className="small">{JSON.stringify(cfg.config, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

export const builtinViews: ViewDef[] = [
  { id: 'mods', title: 'Mods & skills', render: () => <ModsView /> },
  { id: 'config', title: 'Agent config', render: (p) => <ConfigView {...p} /> },
];
