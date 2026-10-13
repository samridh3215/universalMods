// The "+" tile at the end of the agent grid. Click it to turn the tile into a spawn form.
import { useState } from 'react';
import { floor, useFloor } from 'universal-mods';

const EMPTY = { name: '', role: '', model: '', effort: '', project: '', worktree: false, prompt: '', skills: [] as string[] };

/** In grid mode it starts as a "+" tile; in tabs mode it is shown open and reports back via onDone. */
export function SpawnTile({ startOpen = false, onDone }: { startOpen?: boolean; onDone?(agentId?: string): void } = {}) {
  const provider = useFloor((s) => s.provider);
  const skills = useFloor((s) => s.skills);
  const projects = useFloor((s) => s.projects);
  const [open, setOpenRaw] = useState(startOpen);
  const setOpen = (v: boolean) => (v ? setOpenRaw(true) : onDone ? onDone() : setOpenRaw(false));
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
      const a = (await floor.spawn({
        name: f.name || undefined,
        role: f.role || undefined,
        model: f.model || undefined,
        effort: f.effort || undefined,
        project: f.project || undefined,
        worktree: !!f.project && f.worktree,
        prompt: f.prompt || undefined,
        skills: f.skills,
      })) as { id: string };
      setF(EMPTY);
      if (onDone) onDone(a.id);
      else setOpenRaw(false);
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
      <select value={f.project} onChange={(e) => set('project', e.target.value)} title="Project: the agent works in its workspace and reads its reference files">
        <option value="">project: none (private scratch folder)</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            project: {p.name}
          </option>
        ))}
      </select>
      {f.project ? (
        <label className="row small">
          <input type="checkbox" checked={f.worktree} onChange={(e) => set('worktree', e.target.checked)} /> own git worktree of the project folder
        </label>
      ) : (
        projects.length === 0 && <span className="small muted">Add a project from 📁 Projects in the top bar to give agents a workspace and reference files.</span>
      )}
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
