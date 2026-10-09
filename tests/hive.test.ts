import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Hive } from '../src/server/hive.ts';

describe('Hive', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'um-hive-'));

  it('persists tasks, board and messages across instances', () => {
    const h = new Hive(dir);
    const t = h.addTask({ title: 'ship it', status: 'todo', createdBy: 'user' });
    h.updateTask(t.id, { status: 'doing', id: 'hacked' } as any);
    h.setBoard('# plan');
    h.addMessage({ from: 'a', to: 'b', text: 'hi' });

    const h2 = new Hive(dir);
    expect(h2.tasks).toHaveLength(1);
    expect(h2.tasks[0]).toMatchObject({ id: t.id, status: 'doing' });
    expect(h2.board).toBe('# plan');
    expect(h2.messages[0]).toMatchObject({ from: 'a', to: 'b', text: 'hi' });
    expect(h2.deleteTask(t.id)).toBe(true);
  });

  it('stores events per agent, skipping streaming deltas, with increasing seqs across restarts', () => {
    const h = new Hive(dir);
    const a = h.pushEvent('x', { kind: 'text', text: 'a', delta: true });
    const b = h.pushEvent('x', { kind: 'text', text: 'full' });
    expect(h.eventsFor('x').map((e) => e.event)).toEqual([{ kind: 'text', text: 'full' }]);
    expect(b.seq).toBeGreaterThan(a.seq);
    const h2 = new Hive(dir);
    const c = h2.pushEvent('x', { kind: 'notice', text: 'later' });
    expect(c.seq).toBeGreaterThan(b.seq);
    expect(h2.eventsFor('x')).toHaveLength(2);
  });

  it('agents come back stopped after a restart', () => {
    const h = new Hive(dir);
    h.agents.set('z', { id: 'z', name: 'Z', status: 'working' } as any);
    h.saveAgents();
    expect(new Hive(dir).agents.get('z')!.status).toBe('stopped');
  });
});
