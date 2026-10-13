// Projects page: workspaces + reference files that agents can be assigned to.
import { useEffect, useState } from 'react';
import { ConfirmButton } from './components.tsx';
import { floor, useFloor } from './mod-api.ts';
import { api, toast } from './store.ts';
import type { ProjectRow } from './store.ts';

type Kind = 'dir' | 'file' | 'missing';
const KIND_ICON: Record<Kind, string> = { dir: '📂', file: '📄', missing: '⚠' };

const fail = (e: any) => toast(String(e?.message ?? e), 'error');
/** Open the system file dialog (on the machine running the floor) and return the chosen paths. */
async function pickPaths(mode: 'folder' | 'files'): Promise<string[]> {
  try {
    const r = await api<{ paths?: string[] }>('/api/fs/pick', 'POST', { mode });
    return r.paths ?? [];
  } catch (e) {
    fail(e);
    return [];
  }
}

/** "Browse…" for a single folder. */
function BrowseButton({ onPick }: { onPick(path: string): void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      title="Choose a folder with the system dialog"
      onClick={async () => {
        setBusy(true);
        const [p] = await pickPaths('folder');
        setBusy(false);
        if (p) onPick(p);
      }}
    >
      {busy ? 'Choosing…' : 'Browse…'}
    </button>
  );
}

const patch = (id: string, body: Partial<ProjectRow>) => api(`/api/projects/${encodeURIComponent(id)}`, 'PATCH', body).catch(fail);

export function ProjectsButton() {
  const [open, setOpen] = useState(() => new URLSearchParams(location.search).has('projects'));
  const count = useFloor((s) => s.projects.length);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);
  return (
    <>
      <button className={open ? 'active' : ''} onClick={() => setOpen(true)} title="Projects">
        📁 Projects{count > 0 && <span className="count">{count}</span>}
      </button>
      {open && (
        <div className="settings-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <section className="settings-page" role="dialog" aria-modal="true" aria-labelledby="projects-title">
            <header>
              <h1 id="projects-title">Projects</h1>
              <button onClick={() => setOpen(false)} aria-label="Close projects">
                ✕
              </button>
            </header>
            <ProjectsPage />
          </section>
        </div>
      )}
    </>
  );
}

function ProjectsPage() {
  const projects = useFloor((s) => s.projects);
  return (
    <>
      <p className="muted">
        A project is a workspace folder plus reference files. Agents on a project work in its workspace, and their instructions list the references to read.
        Agents can also look them up live with <code>project_info</code>.
      </p>
      {projects.map((p) => (
        <ProjectCard key={p.id} p={p} />
      ))}
      <NewProject first={projects.length === 0} />
    </>
  );
}

/** Text input for a path on this machine, with a live "folder / file / not found" check. */
function PathInput({ value, onChange, placeholder, onEnter }: { value: string; onChange(v: string): void; placeholder: string; onEnter?(): void }) {
  const kind = usePathKind(value);
  return (
    <span className="path-input">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        onKeyDown={(e) => e.key === 'Enter' && onEnter && (e.preventDefault(), onEnter())}
      />
      {value.trim() && kind && (
        <span className={`path-kind ${kind}`} title={kind === 'missing' ? 'Not found' : kind === 'dir' ? 'Folder' : 'File'}>
          {KIND_ICON[kind]}
        </span>
      )}
    </span>
  );
}

function usePathKind(p: string): Kind | undefined {
  const [kind, setKind] = useState<Kind>();
  useEffect(() => {
    if (!p.trim()) return setKind(undefined);
    const t = setTimeout(() => {
      api<{ kind: Kind }>(`/api/fs/inspect?path=${encodeURIComponent(p)}`)
        .then((r) => setKind(r.kind))
        .catch(() => setKind(undefined));
    }, 250);
    return () => clearTimeout(t);
  }, [p]);
  return kind;
}

function NewProject({ first }: { first: boolean }) {
  const [open, setOpen] = useState(first);
  const [f, setF] = useState({ name: '', workspace: '', notes: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => setOpen((o) => o || first), [first]);
  if (!open)
    return (
      <button className="new-project" onClick={() => setOpen(true)}>
        ＋ New project
      </button>
    );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/projects', 'POST', f);
      setF({ name: '', workspace: '', notes: '' });
      setOpen(false);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="project-card new" onSubmit={submit}>
      <strong>New project</strong>
      <input autoFocus placeholder="name (e.g. Billing API)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <span className="row">
        <PathInput placeholder="workspace folder (e.g. ~/code/billing-api)" value={f.workspace} onChange={(v) => setF({ ...f, workspace: v })} />
        <BrowseButton
          onPick={(v) =>
            setF((x) => ({
              ...x,
              workspace: v,
              name: x.name || v.split('/').pop() || '',
            }))
          }
        />
      </span>
      <textarea
        rows={2}
        placeholder="notes for agents (optional): goals, conventions, what not to touch"
        value={f.notes}
        onChange={(e) => setF({ ...f, notes: e.target.value })}
      />
      <span className="row">
        <button className="primary" disabled={busy || !f.name.trim() || !f.workspace.trim()}>
          {busy ? 'Creating…' : 'Create project'}
        </button>
        {!first && (
          <button type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        )}
      </span>
    </form>
  );
}

function ProjectCard({ p }: { p: ProjectRow }) {
  const agents = useFloor((s) => s.agents);
  const [ref, setRef] = useState('');
  const [workspace, setWorkspace] = useState(p.workspace);
  const [notes, setNotes] = useState(p.notes);
  useEffect(() => setWorkspace(p.workspace), [p.workspace]);
  useEffect(() => setNotes(p.notes), [p.notes]);
  const members = agents.filter((a) => a.project === p.id);
  const others = agents.filter((a) => a.project !== p.id);

  const addRef = async () => {
    if (!ref.trim()) return;
    const ok = await patch(p.id, { references: [...p.references, ref] });
    if (ok) setRef('');
  };

  return (
    <div className="project-card">
      <div className="row project-title">
        <strong>📁 {p.name}</strong>
        <span className="spacer" />
        <ConfirmButton
          label="Delete"
          confirmLabel="Delete project?"
          title="Agents on it move back to their scratch folders"
          onConfirm={() => api(`/api/projects/${p.id}`, 'DELETE').catch(fail)}
        />
      </div>

      <label className="field">
        <span>Workspace</span>
        <PathInput value={workspace} onChange={setWorkspace} placeholder="workspace folder" onEnter={() => void patch(p.id, { workspace })} />
        {workspace !== p.workspace ? (
          <button onClick={() => void patch(p.id, { workspace })}>Save</button>
        ) : (
          <BrowseButton onPick={(v) => (setWorkspace(v), void patch(p.id, { workspace: v }))} />
        )}
      </label>

      <div className="field">
        <span>References</span>
        <ul className="ref-list">
          {p.references.map((r) => (
            <li key={r}>
              <RefKind path={r} /> <code title={r}>{r}</code>
              <button
                className="icon"
                title="Remove"
                aria-label={`Remove ${r}`}
                onClick={() =>
                  void patch(p.id, {
                    references: p.references.filter((x) => x !== r),
                  })
                }
              >
                ×
              </button>
            </li>
          ))}
          <li className="add">
            <PathInput value={ref} onChange={setRef} placeholder="add a file or folder (docs, specs, another repo…)" onEnter={() => void addRef()} />
            {ref.trim() ? (
              <button onClick={() => void addRef()}>Add</button>
            ) : (
              <>
                <button
                  title="Choose files with the system dialog"
                  onClick={async () => {
                    const add = await pickPaths('files');
                    if (add.length)
                      await patch(p.id, {
                        references: [...p.references, ...add],
                      });
                  }}
                >
                  Files…
                </button>
                <button
                  title="Choose a folder with the system dialog"
                  onClick={async () => {
                    const add = await pickPaths('folder');
                    if (add.length)
                      await patch(p.id, {
                        references: [...p.references, ...add],
                      });
                  }}
                >
                  Folder…
                </button>
              </>
            )}
          </li>
        </ul>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea
          rows={2}
          value={notes}
          placeholder="brief for agents on this project"
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== p.notes && void patch(p.id, { notes })}
        />
      </label>

      <div className="field">
        <span>Agents</span>
        <div className="row wrap">
          {members.map((a) => (
            <span key={a.id} className="agent-chip">
              {a.name}
              <button className="icon" title={`Remove ${a.name} from ${p.name}`} onClick={() => void floor.setProject(a.id, null).catch(fail)}>
                ×
              </button>
            </span>
          ))}
          {others.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && void floor.setProject(e.target.value, p.id).catch(fail)}
              title="Assign an agent (it restarts in the workspace if running)"
            >
              <option value="">＋ assign agent…</option>
              {others.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
          {members.length === 0 && others.length === 0 && <span className="muted small">No agents yet.</span>}
        </div>
      </div>
    </div>
  );
}

function RefKind({ path }: { path: string }) {
  const kind = usePathKind(path);
  return <span className={`path-kind ${kind ?? ''}`}>{kind ? KIND_ICON[kind] : '·'}</span>;
}
