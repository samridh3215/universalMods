// Views the shell always provides, so a floor stays recoverable even if every mod is off.
import { useEffect, useState } from 'react';
import { floor, useFloor, type ViewDef } from './mod-api.ts';

/** Mods, commands and skills; shown in the top-bar pop-over. */
/** "New mod" from plain English: a Mod Builder agent writes it and checks that it loads. */
function NewMod() {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [target, setTarget] = useState<'floor' | 'project'>('floor');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string>();
  if (!open)
    return (
      <button className="primary new-mod-btn" onClick={() => (setOpen(true), setDone(undefined))}>
        ＋ New mod
      </button>
    );
  return (
    <form
      className="new-mod"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!desc.trim()) return;
        setBusy(true);
        try {
          const r = await floor.createMod(desc, target);
          setDone(`${r.agent} is building it in ${r.dir}. Watch its terminal in the agent pane; the mod appears here once it loads.`);
          setDesc('');
        } finally {
          setBusy(false);
        }
      }}
    >
      <strong>Describe the mod you want</strong>
      <textarea
        autoFocus
        rows={4}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder={'e.g. "A cost panel that shows tokens per agent as a bar chart and warns when any agent passes 200k tokens"'}
      />
      <div className="row" style={{ alignItems: 'center' }}>
        <select value={target} onChange={(e) => setTarget(e.target.value as 'floor' | 'project')} title="Where the mod is saved">
          <option value="floor">save to this floor (data/mods)</option>
          <option value="project">save to project mods/ (shareable)</option>
        </select>
        <span className="spacer" />
        <button type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button className="primary" disabled={busy || !desc.trim()}>
          {busy ? 'Starting…' : 'Build mod'}
        </button>
      </div>
      {done && <p className="ok small">{done}</p>}
    </form>
  );
}

export function ModsPanel() {
  const mods = useFloor((s) => s.mods);
  const skills = useFloor((s) => s.skills);
  const commands = useFloor((s) => s.commands);
  return (
    <div className="pad">
      <div className="row" style={{ alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Mods</h3>
        <span className="spacer" />
      </div>
      <NewMod />
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
  { id: 'config', title: 'Agent config', render: (p) => <ConfigView {...p} /> },
];
