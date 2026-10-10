import { useEffect, useState } from 'react';
import { Markdown, floor, registerView, useFloor, type Task } from 'universal-mods';

const COLS: Task['status'][] = ['todo', 'doing', 'review', 'done'];

function Kanban() {
  const tasks = useFloor((s) => s.tasks);
  const agents = useFloor((s) => s.agents);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const name = (id?: string) => agents.find((a) => a.id === id || a.name === id)?.name ?? id;

  return (
    <div className="pad">
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          void floor.addTask({ title, assignee: assignee || undefined });
          setTitle('');
        }}
      >
        <input style={{ flex: 1 }} placeholder="new task…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button className="primary">Add</button>
      </form>
      <p className="muted small">Assigning a task messages that agent. Agents move tasks themselves via the hive tools.</p>
      <div className="kanban">
        {COLS.map((col, ci) => (
          <div key={col} className="kanban-col" data-col={col}>
            <h4>
              {col} <span className="muted">{tasks.filter((t) => t.status === col).length}</span>
            </h4>
            {tasks
              .filter((t) => t.status === col)
              .map((t) => (
                <div key={t.id} className="kanban-card">
                  <div>
                    <strong>{t.title}</strong>
                  </div>
                  {t.detail && <Markdown className="small" text={t.detail} />}
                  <div className="small muted">
                    #{t.id} · by {name(t.createdBy)} {t.assignee ? `· ${name(t.assignee)}` : ''}
                  </div>
                  <div className="row small">
                    <button disabled={ci === 0} onClick={() => floor.updateTask(t.id, { status: COLS[ci - 1] })}>
                      ←
                    </button>
                    <button disabled={ci === COLS.length - 1} onClick={() => floor.updateTask(t.id, { status: COLS[ci + 1] })}>
                      →
                    </button>
                    <select value={t.assignee ?? ''} onChange={(e) => floor.updateTask(t.id, { assignee: e.target.value || undefined })}>
                      <option value="">—</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => floor.deleteTask(t.id)}>×</button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Board() {
  const board = useFloor((s) => s.board);
  const [text, setText] = useState(board);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!dirty) setText(board);
  }, [board, dirty]);
  return (
    <div className="pad board">
      <div className="row">
        <strong>Shared board</strong>
        <span className="muted small">{dirty ? 'unsaved' : 'agents read/write this via board_read / board_write'}</span>
        <span className="spacer" />
        <button onClick={() => setEditing(!editing)}>{editing ? 'Preview' : 'Edit'}</button>
        <button
          className="primary"
          disabled={!dirty}
          onClick={async () => {
            await floor.setBoard(text);
            setDirty(false);
            setEditing(false);
          }}
        >
          Save
        </button>
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
          }}
        />
      ) : (
        <div className="board-preview" onDoubleClick={() => setEditing(true)} title="Double-click to edit">
          <Markdown text={text || '_Empty board. Click Edit to write the plan._'} />
        </div>
      )}
    </div>
  );
}

registerView({ id: 'kanban', title: 'Kanban', render: () => <Kanban /> });
registerView({ id: 'board', title: 'Board', render: () => <Board /> });
