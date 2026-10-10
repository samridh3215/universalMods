import { describe, expect, it } from 'vitest';
import { fromViews, movePane, normalize, removePane } from '../src/web/layout.tsx';

const views = (l: ReturnType<typeof normalize>) => l.map((c) => c.panes.map((p) => p.view));
const id = (l: ReturnType<typeof normalize>, view: string) => l.flatMap((c) => c.panes).find((p) => p.view === view)!.id;

describe('workspace layout', () => {
  it('migrates the old {view}[][] format and drops retired panes', () => {
    const l = normalize([[{ view: 'spawner' }, { view: 'mods' }], [{ view: 'grid' }], [{ view: 'timeline' }]]);
    expect(views(l)).toEqual([['grid'], ['timeline']]);
    expect(l.every((c) => c.id && c.panes.every((p) => p.id))).toBe(true);
  });

  it('docks a pane on the left/right edge as a new column', () => {
    const l = fromViews([['grid'], ['timeline', 'kanban']]);
    expect(views(movePane(l, id(l, 'kanban'), id(l, 'grid'), 'left'))).toEqual([['kanban'], ['grid'], ['timeline']]);
    expect(views(movePane(l, id(l, 'kanban'), id(l, 'grid'), 'right'))).toEqual([['grid'], ['kanban'], ['timeline']]);
  });

  it('docks above/below inside the target column and removes emptied columns', () => {
    const l = fromViews([['grid'], ['timeline']]);
    expect(views(movePane(l, id(l, 'timeline'), id(l, 'grid'), 'top'))).toEqual([['timeline', 'grid']]);
    expect(views(movePane(l, id(l, 'timeline'), id(l, 'grid'), 'bottom'))).toEqual([['grid', 'timeline']]);
  });

  it('swaps on the centre zone and ignores dropping on itself', () => {
    const l = fromViews([['grid'], ['timeline', 'kanban']]);
    expect(views(movePane(l, id(l, 'grid'), id(l, 'kanban'), 'center'))).toEqual([['kanban'], ['timeline', 'grid']]);
    expect(movePane(l, id(l, 'grid'), id(l, 'grid'), 'left')).toBe(l);
  });

  it('removePane returns the pane and prunes empty columns', () => {
    const l = fromViews([['grid'], ['timeline']]);
    const [next, p] = removePane(l, id(l, 'grid'));
    expect(p?.view).toBe('grid');
    expect(views(next)).toEqual([['timeline']]);
  });
});
