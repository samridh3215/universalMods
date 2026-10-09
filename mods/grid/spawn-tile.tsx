// The "+" tile at the end of the agent grid. Click it to turn the tile into a spawn form.
import { useState } from 'react';
import { floor, useFloor } from 'universal-mods';

const EMPTY = { name: '', role: '', model: '', effort: '', cwd: '', worktree: false, prompt: '', skills: [] as string[] };

export function SpawnTile() {
  const provider = useFloor((s) => s.provider);
  const skills = useFloor((s) => s.skills);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });

  if (!open)
    return (
      <button className="spawn-tile" onClick={() => setOpen(true)} title={`Spawn a ${provider} agent`}>
        <span className="spawn-plus">+</span>
        <span className="small muted">Spawn a {provider} agent</span>
      </button>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await floor.spawn({
        name: f.name || undefined,
        role: f.role || undefined,
        model: f.model || undefined,
        effort: f.effort || undefined,
        cwd: f.cwd || undefined,
        worktree: f.worktree,
        prompt: f.prompt || undefined,
        skills: f.skills,
      });
      setF(EMPTY);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="spawn-tile open" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <div className="row" style={{ alignItems: 'center', padding: 0 }}>
        <strong>New {provider} agent</strong>
        <span className="spacer" />
        <button type="button" onClick={() => setOpen(false)} title="cancel (Esc)">
          ×
        </button>
      </div>
      <div className="grid2">
        <input autoFocus placeholder="name (e.g. Dwight)" value={f.name} onChange={(e) => set('name', e.target.value)} />
        <input placeholder="role (e.g. reviewer)" value={f.role} onChange={(e) => set('role', e.target.value)} />
        <input placeholder={provider === 'codex' ? 'model (e.g. gpt-5-codex)' : 'model (e.g. sonnet, opus)'} value={f.model} onChange={(e) => set('model', e.target.value)} />
        <select value={f.effort} onChange={(e) => set('effort', e.target.value)}>
          <option value="">effort: default</option>
          {['low', 'medium', 'high', 'xhigh'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <input placeholder="working dir (blank = private scratch dir)" value={f.cwd} onChange={(e) => set('cwd', e.target.value)} />
      <label className="row small">
        <input type="checkbox" checked={f.worktree} onChange={(e) => set('worktree', e.target.checked)} /> own git worktree of that dir
      </label>
      {skills.length > 0 && (
        <details>
          <summary className="small">skills ({f.skills.length} selected)</summary>
          <div className="skill-list">
            {skills.map((s) => (
              <label key={s.name} className="row small" title={s.description}>
                <input type="checkbox" checked={f.skills.includes(s.name)} onChange={(e) => set('skills', e.target.checked ? [...f.skills, s.name] : f.skills.filter((x) => x !== s.name))} />
                {s.name} <span className="muted">{s.source}</span>
              </label>
            ))}
          </div>
        </details>
      )}
      <textarea rows={3} placeholder="first prompt (optional)" value={f.prompt} onChange={(e) => set('prompt', e.target.value)} />
      <button className="primary" disabled={busy}>
        {busy ? 'spawning…' : 'Spawn'}
      </button>
    </form>
  );
}
