import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { instructionsFor } from '../src/server/instructions.ts';
import { ProjectStore } from '../src/server/projects.ts';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'um-projects-'));

describe('ProjectStore', () => {
  it('creates, persists and finds projects by id or name', () => {
    const data = tmp();
    const ws = tmp();
    const p = new ProjectStore(data).create({ name: 'Billing', workspace: ws, notes: 'be careful' });
    const again = new ProjectStore(data);
    expect(again.get(p.id)?.workspace).toBe(ws);
    expect(again.get('billing')?.id).toBe(p.id);
  });

  it('rejects a missing workspace, missing references and duplicate names', () => {
    const s = new ProjectStore(tmp());
    const ws = tmp();
    expect(() => s.create({ name: 'A', workspace: path.join(ws, 'nope') })).toThrow(/existing folder/);
    const p = s.create({ name: 'A', workspace: ws });
    expect(() => s.create({ name: 'a', workspace: ws })).toThrow(/already exists/);
    expect(() => s.update(p.id, { references: [path.join(ws, 'missing.md')] })).toThrow(/not found/);
    fs.writeFileSync(path.join(ws, 'spec.md'), '# spec');
    expect(s.update(p.id, { references: [path.join(ws, 'spec.md'), path.join(ws, 'spec.md')] }).references).toEqual([path.join(ws, 'spec.md')]);
  });

  it("puts the workspace, references and notes into an assigned agent's instructions", () => {
    const ws = tmp();
    fs.writeFileSync(path.join(ws, 'spec.md'), '# spec');
    const p = new ProjectStore(tmp()).create({ name: 'Billing', workspace: ws, notes: 'Never touch prod.' });
    p.references = [path.join(ws, 'spec.md')];
    const text = instructionsFor({ id: 'a', name: 'Paul', role: 'dev', project: p.id } as any, 'claude', p);
    expect(text).toContain(`project "Billing"`);
    expect(text).toContain(ws);
    expect(text).toContain('spec.md');
    expect(text).toContain('Never touch prod.');
    expect(instructionsFor({ id: 'a', name: 'Paul', role: 'dev' } as any, 'claude')).not.toContain('assigned to the project');
  });
});
