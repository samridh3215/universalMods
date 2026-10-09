import { useState } from 'react';
import { floor, registerView, useFloor } from 'universal-mods';

function Spawner() {
  const provider = useFloor((s) => s.provider);
  const skills = useFloor((s) => s.skills);
  const [f, setF] = useState({ name: '', role: '', model: '', effort: '', cwd: '', worktree: false, prompt: '', skills: [] as string[] });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });

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
      setF({ ...f, name: '', prompt: '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="pad spawner" onSubmit={submit}>
      <h3>Spawn a {provider} agent</h3>
      <div className="grid2">
        <input placeholder="name (e.g. Dwight)" value={f.name} onChange={(e) => set('name', e.target.value)} />
        <input placeholder="role (e.g. reviewer)" value={f.role} onChange={(e) => set('role', e.target.value)} />
        <input placeholder={provider === 'codex' ? 'model (e.g. gpt-5-codex)' : 'model (e.g. sonnet, opus)'} value={f.model} onChange={(e) => set('model', e.target.value)} />
        <select value={f.effort} onChange={(e) => set('effort', e.target.value)}>
          <option value="">effort: default</option>
          {['low', 'medium', 'high', 'xhigh'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <input style={{ width: '100%', marginTop: 6 }} placeholder="working dir (blank = private scratch dir)" value={f.cwd} onChange={(e) => set('cwd', e.target.value)} />
      <label className="row small">
        <input type="checkbox" checked={f.worktree} onChange={(e) => set('worktree', e.target.checked)} /> give it its own git worktree of that dir
      </label>
      {skills.length > 0 && (
        <details>
          <summary className="small">skills ({f.skills.length} selected)</summary>
          <div className="skill-list">
            {skills.map((s) => (
              <label key={s.name} className="row small" title={s.description}>
                <input
                  type="checkbox"
                  checked={f.skills.includes(s.name)}
                  onChange={(e) => set('skills', e.target.checked ? [...f.skills, s.name] : f.skills.filter((x) => x !== s.name))}
                />
                {s.name} <span className="muted">{s.source}</span>
              </label>
            ))}
          </div>
        </details>
      )}
      <textarea rows={3} placeholder="first prompt (optional)" value={f.prompt} onChange={(e) => set('prompt', e.target.value)} />
      <button disabled={busy}>{busy ? 'spawning…' : 'Spawn'}</button>
      <p className="muted small">Agents run with no permission limits (Claude: bypassPermissions · Codex: danger-full-access + never ask). Guard mods can still block calls.</p>
    </form>
  );
}

registerView({ id: 'spawner', title: 'Spawner', render: () => <Spawner /> });
