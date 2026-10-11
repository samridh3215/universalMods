// Diff view: an agent's changed files as a tree, with the unified diff of a clicked file.
// The server pushes a fresh tree whenever the agent changes files; "review" is pushed when an agent asks for review.
import { useEffect, useState } from 'react';
import { floor, registerView, useFloor, useModChannel, type ViewProps } from 'universal-mods';

interface Change {
  path: string;
  status: 'A' | 'M' | 'D' | 'R' | '?';
}
interface Tree {
  agentId: string;
  cwd: string;
  files: Change[];
  error?: string;
  at: number;
}
interface ReviewRequest {
  agentId: string;
  message: string;
  at: number;
}
interface FileDiff {
  path: string;
  diff: string;
}

const press = <T,>(key: string, payload: unknown) => floor.press('diff', key, payload) as Promise<T>;
const BADGE: Record<Change['status'], string> = { A: 'var(--ok)', '?': 'var(--ok)', M: 'var(--warn)', D: 'var(--bad)', R: 'var(--accent)' };

/** Nested folders for the changed files, so the tree reads like the repo. */
interface Dir {
  dirs: Map<string, Dir>;
  files: Change[];
}
function toTree(files: Change[]): Dir {
  const root: Dir = { dirs: new Map(), files: [] };
  for (const f of files) {
    const parts = f.path.split('/');
    let node = root;
    for (const part of parts.slice(0, -1)) {
      if (!node.dirs.has(part)) node.dirs.set(part, { dirs: new Map(), files: [] });
      node = node.dirs.get(part)!;
    }
    node.files.push(f);
  }
  return root;
}

function TreeNode({ dir, depth, onOpen, active }: { dir: Dir; depth: number; onOpen: (p: string) => void; active?: string }) {
  return (
    <>
      {[...dir.dirs].map(([name, child]) => (
        <div key={`d:${name}`}>
          <div className="small muted" style={{ paddingLeft: depth * 14 + 8, paddingTop: 4 }}>
            ▾ {name}/
          </div>
          <TreeNode dir={child} depth={depth + 1} onOpen={onOpen} active={active} />
        </div>
      ))}
      {dir.files.map((f) => (
        <div
          key={f.path}
          onClick={() => onOpen(f.path)}
          style={{
            paddingLeft: depth * 14 + 8,
            paddingTop: 3,
            paddingBottom: 3,
            cursor: 'pointer',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            background: active === f.path ? 'var(--accent-soft)' : undefined,
          }}
        >
          <span style={{ color: BADGE[f.status], fontFamily: 'var(--mono)', fontWeight: 600, width: 12 }}>{f.status}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.path.split('/').pop()}
          </span>
        </div>
      ))}
    </>
  );
}

function Diff({ text }: { text: string }) {
  return (
    <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre', overflow: 'auto' }}>
      {text.split('\n').map((line, i) => {
        const color =
          line.startsWith('+++') || line.startsWith('---') ? 'var(--muted)' : line.startsWith('+') ? 'var(--ok)' : line.startsWith('-') ? 'var(--bad)' : line.startsWith('@@') ? 'var(--accent)' : undefined;
        return (
          <div key={i} style={{ color, background: color === 'var(--ok)' ? 'var(--accent-soft)' : undefined }}>
            {line || ' '}
          </div>
        );
      })}
    </pre>
  );
}

function DiffView({ params, setParams }: ViewProps) {
  const agents = useFloor((s) => s.agents).filter((a) => !a.archived);
  const [agentId, setAgentId] = useState<string>(params.agentId ?? '');
  // Default to a worker agent: the master orchestrator rarely edits files itself.
  const selected = agents.find((a) => a.id === agentId) ?? agents.find((a) => !a.master) ?? agents[0];
  const [tree, setTree] = useState<Tree>();
  const [open, setOpen] = useState<FileDiff>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const live = useModChannel<Tree>('diff', 'tree');
  const review = useModChannel<ReviewRequest>('diff', 'review');
  const [asked, setAsked] = useState<ReviewRequest>();

  const scan = (id: string) => {
    setBusy(true);
    press<Tree>('scan', { agentId: id })
      .then((t) => {
        if (!Array.isArray(t?.files)) throw new Error('Could not read changes');
        setTree(t);
        setError(t.error);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setBusy(false));
  };

  // Changing agent: load its changes and close the open file.
  useEffect(() => {
    setOpen(undefined);
    setTree(undefined);
    if (selected) scan(selected.id);
  }, [selected?.id]);

  // Live updates from the server for the agent on screen.
  useEffect(() => {
    if (live && live.agentId === selected?.id) {
      setTree(live);
      setError(live.error);
    }
  }, [live]);

  // An agent asked for review: show it and switch to that agent.
  useEffect(() => {
    if (!review) return;
    setAsked(review);
    setAgentId(review.agentId);
    setParams({ agentId: review.agentId });
  }, [review]);

  const choose = (id: string) => {
    setAgentId(id);
    setParams({ agentId: id });
  };
  const openFile = (path: string) => {
    if (!selected) return;
    press<FileDiff>('diff', { agentId: selected.id, path })
      .then((d) => {
        if (typeof d?.diff !== 'string') throw new Error(`Could not read ${path}`);
        setOpen(d);
      })
      .catch((e) => setError(String(e?.message ?? e)));
  };

  const files = tree?.files ?? [];
  const folder = toTree(files);

  return (
    <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', minHeight: 0, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={selected?.id ?? ''} onChange={(e) => choose(e.target.value)} disabled={!agents.length}>
          {!agents.length && <option value="">no agents</option>}
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <span className="small muted">{files.length ? `${files.length} changed` : ''}</span>
        <span className="spacer" />
        <button onClick={() => selected && scan(selected.id)} disabled={!selected || busy}>
          {busy ? 'Scanning…' : 'Refresh'}
        </button>
      </div>

      {asked && (
        <div style={{ border: '1px solid var(--accent)', borderRadius: 6, padding: '6px 8px', background: 'var(--accent-soft)' }}>
          <div className="small">
            <strong>Review requested</strong> · {agents.find((a) => a.id === asked.agentId)?.name ?? 'an agent'}
          </div>
          <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
            {asked.message}
          </div>
          <button className="small" onClick={() => setAsked(undefined)} style={{ marginTop: 4 }}>
            Dismiss
          </button>
        </div>
      )}

      {error && <div className="small" style={{ color: 'var(--bad)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: open ? 'minmax(160px, 35%) 1fr' : '1fr', gap: 8, flex: 1, minHeight: 0 }}>
        <div style={{ overflow: 'auto', border: '1px solid var(--line)', borderRadius: 6, padding: '4px 0' }}>
          {!files.length && !error && <div className="small muted pad">{selected ? 'No changes yet.' : 'Spawn an agent to see its changes.'}</div>}
          <TreeNode dir={folder} depth={0} onOpen={openFile} active={open?.path} />
        </div>
        {open && (
          <div style={{ overflow: 'auto', border: '1px solid var(--line)', borderRadius: 6, padding: 8, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="small" style={{ fontFamily: 'var(--mono)' }}>{open.path}</span>
              <span className="spacer" />
              <button className="small" onClick={() => setOpen(undefined)}>
                Close
              </button>
            </div>
            {open.diff ? <Diff text={open.diff} /> : <div className="small muted">No diff for this file.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

registerView({ id: 'diff', title: 'Diff', render: (p) => <DiffView {...p} /> });
