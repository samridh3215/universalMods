// LeetCode-style workspace: resizable columns and panes, drag a pane by its header
// onto any other pane's edge (left/right/top/bottom) to dock it there or its centre
// to swap, collapse panes to their title bar (a column whose panes are all collapsed
// folds into a thin vertical strip), and maximize any pane.
import { useRef, useState, type ReactNode } from 'react';
import type { ViewDef } from './mod-api.ts';

export interface PaneNode {
  id: string;
  view: string;
  params?: Record<string, any>;
  size?: number;
  collapsed?: boolean;
}
export interface ColNode {
  id: string;
  size?: number;
  panes: PaneNode[];
}
export type Layout = ColNode[];
type Zone = 'left' | 'right' | 'top' | 'bottom' | 'center';

const uid = () => Math.random().toString(36).slice(2, 9);
/** Views that used to be panes but now live elsewhere (top bar, grid tile). */
const RETIRED = new Set(['mods', 'spawner']);

/** Accepts the old `{view}[][]` format as well as the current one. */
export function normalize(raw: unknown): Layout {
  if (!Array.isArray(raw)) return [];
  const cols: Layout = raw.map((c: any) =>
    Array.isArray(c) ? { id: uid(), panes: c.map((p: any) => ({ ...p, id: p.id ?? uid() })) } : { ...c, id: c.id ?? uid(), panes: (c.panes ?? []).map((p: any) => ({ ...p, id: p.id ?? uid() })) },
  );
  return cols.map((c) => ({ ...c, panes: c.panes.filter((p) => !RETIRED.has(p.view)) })).filter((c) => c.panes.length);
}

export function fromViews(cols: (string | { view: string; params?: Record<string, any> })[][]): Layout {
  return normalize(cols.map((c) => c.map((p) => (typeof p === 'string' ? { view: p } : p))));
}

export function removePane(l: Layout, id: string): [Layout, PaneNode | undefined] {
  let found: PaneNode | undefined;
  const next = l
    .map((c) => ({ ...c, panes: c.panes.filter((p) => (p.id === id ? ((found = p), false) : true)) }))
    .filter((c) => c.panes.length);
  return [next, found];
}

export function movePane(l: Layout, srcId: string, targetId: string, zone: Zone): Layout {
  if (srcId === targetId) return l;
  if (zone === 'center') {
    // Swap the two panes in place.
    const all = l.flatMap((c) => c.panes);
    const a = all.find((p) => p.id === srcId);
    const b = all.find((p) => p.id === targetId);
    if (!a || !b) return l;
    return l.map((c) => ({ ...c, panes: c.panes.map((p) => (p.id === srcId ? { ...b, size: p.size } : p.id === targetId ? { ...a, size: p.size } : p)) }));
  }
  const [without, pane] = removePane(l, srcId);
  if (!pane) return l;
  const moved = { ...pane, size: undefined, collapsed: false };
  const ci = without.findIndex((c) => c.panes.some((p) => p.id === targetId));
  if (ci < 0) return l;
  if (zone === 'left' || zone === 'right') {
    const col: ColNode = { id: uid(), panes: [moved] };
    const at = zone === 'left' ? ci : ci + 1;
    return [...without.slice(0, at), col, ...without.slice(at)];
  }
  return without.map((c, i) => {
    if (i !== ci) return c;
    const pi = c.panes.findIndex((p) => p.id === targetId);
    const at = zone === 'top' ? pi : pi + 1;
    return { ...c, panes: [...c.panes.slice(0, at), moved, ...c.panes.slice(at)] };
  });
}

function zoneFor(e: React.DragEvent, el: HTMLElement): Zone {
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  const d = { left: x, right: 1 - x, top: y, bottom: 1 - y };
  const [edge, dist] = Object.entries(d).sort((a, b) => a[1] - b[1])[0];
  return dist < 0.25 ? (edge as Zone) : 'center';
}

export function Workspace({
  layout,
  onChange,
  views,
  renderBody,
}: {
  layout: Layout;
  onChange: (l: Layout) => void;
  views: Map<string, ViewDef>;
  renderBody: (pane: PaneNode, setParams: (p: Record<string, any>) => void) => ReactNode;
}) {
  const [draft, setDraft] = useState<Layout | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [hover, setHover] = useState<{ id: string; zone: Zone } | null>(null);
  const [maxed, setMaxed] = useState<string | null>(null);
  const colRefs = useRef(new Map<string, HTMLDivElement>());
  const paneRefs = useRef(new Map<string, HTMLElement>());
  const l = draft ?? layout;

  const patchPane = (id: string, patch: Partial<PaneNode>) => onChange(l.map((c) => ({ ...c, panes: c.panes.map((p) => (p.id === id ? { ...p, ...patch } : p)) })));
  const closePane = (id: string) => onChange(removePane(l, id)[0]);

  /** Drag a divider: redistribute weight between two neighbours (columns or panes). */
  const startResize = (e: React.PointerEvent, kind: 'col' | 'pane', a: string, b: string, colId?: string) => {
    e.preventDefault();
    const refs = kind === 'col' ? colRefs.current : paneRefs.current;
    const ea = refs.get(a)!.getBoundingClientRect();
    const eb = refs.get(b)!.getBoundingClientRect();
    const pa = kind === 'col' ? ea.width : ea.height;
    const pb = kind === 'col' ? eb.width : eb.height;
    const items = kind === 'col' ? l : l.find((c) => c.id === colId)!.panes;
    const wa = items.find((x) => x.id === a)!.size ?? 1;
    const wb = items.find((x) => x.id === b)!.size ?? 1;
    const start = kind === 'col' ? e.clientX : e.clientY;
    let latest = l;
    const move = (ev: PointerEvent) => {
      const delta = (kind === 'col' ? ev.clientX : ev.clientY) - start;
      const frac = Math.min(0.9, Math.max(0.1, (pa + delta) / (pa + pb)));
      const na = (wa + wb) * frac;
      const nb = wa + wb - na;
      const set = <T extends { id: string; size?: number }>(x: T) => (x.id === a ? { ...x, size: na } : x.id === b ? { ...x, size: nb } : x);
      latest = kind === 'col' ? l.map(set) : l.map((c) => (c.id === colId ? { ...c, panes: c.panes.map(set) } : c));
      setDraft(latest);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.classList.remove('resizing', 'resizing-row');
      setDraft(null);
      onChange(latest);
    };
    document.body.classList.add(kind === 'col' ? 'resizing' : 'resizing-row');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const head = (p: PaneNode, collapsedCol = false) => {
    const v = views.get(p.view);
    return (
      <div
        className="pane-head"
        draggable={!maxed}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/um-pane', p.id);
          e.dataTransfer.effectAllowed = 'move';
          setDrag(p.id);
        }}
        onDragEnd={() => (setDrag(null), setHover(null))}
        onDoubleClick={() => patchPane(p.id, { collapsed: !p.collapsed })}
        onClick={collapsedCol ? () => patchPane(p.id, { collapsed: false }) : undefined}
        title="Drag to move · double-click to collapse"
      >
        <span className="grip" aria-hidden>
          ⠿
        </span>
        <button className="icon" title={p.collapsed ? 'Expand' : 'Collapse'} onClick={() => patchPane(p.id, { collapsed: !p.collapsed })}>
          {p.collapsed ? (collapsedCol ? '▸' : '▸') : '▾'}
        </button>
        {collapsedCol ? (
          <span className="vtitle">{v?.title ?? p.view}</span>
        ) : (
          <>
            <select value={p.view} onChange={(e) => patchPane(p.id, { view: e.target.value, params: undefined })} onMouseDown={(e) => e.stopPropagation()}>
              {!v && <option value={p.view}>{p.view} (not loaded)</option>}
              {[...views.values()].map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
            <span className="spacer" />
            <button className="icon" title={maxed === p.id ? 'Restore' : 'Maximize'} onClick={() => setMaxed(maxed === p.id ? null : p.id)}>
              {maxed === p.id ? '⤡' : '⤢'}
            </button>
            {!maxed && (
              <button className="icon" title="Close pane" onClick={() => closePane(p.id)}>
                ×
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  const paneEl = (p: PaneNode, flex: string, collapsedCol = false) => (
    <section
      key={p.id}
      ref={(el) => void (el ? paneRefs.current.set(p.id, el) : paneRefs.current.delete(p.id))}
      className={`pane${p.collapsed ? ' collapsed' : ''}${drag === p.id ? ' dragging' : ''}`}
      style={{ flex }}
      onDragOver={(e) => {
        if (!drag || drag === p.id) return;
        e.preventDefault();
        const zone = zoneFor(e, e.currentTarget);
        if (hover?.id !== p.id || hover.zone !== zone) setHover({ id: p.id, zone });
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover((h) => (h?.id === p.id ? null : h));
      }}
      onDrop={(e) => {
        e.preventDefault();
        const src = e.dataTransfer.getData('text/um-pane');
        if (src && hover?.id === p.id) onChange(movePane(l, src, p.id, hover.zone));
        setDrag(null);
        setHover(null);
      }}
    >
      {head(p, collapsedCol)}
      {!p.collapsed && <div className="pane-body">{renderBody(p, (params) => patchPane(p.id, { params }))}</div>}
      {hover?.id === p.id && <div className={`drop-zone z-${hover.zone}`} />}
    </section>
  );

  if (maxed) {
    const p = l.flatMap((c) => c.panes).find((x) => x.id === maxed);
    if (p) return <main className="layout maxed">{paneEl({ ...p, collapsed: false }, '1 1 0')}</main>;
  }

  return (
    <main className={`layout${drag ? ' is-dragging' : ''}`}>
      {l.map((c, ci) => {
        // Fold a column into a strip only while some other pane is open to take the space.
        const anyOpen = l.some((col) => col.panes.some((p) => !p.collapsed));
        const allCollapsed = anyOpen && c.panes.every((p) => p.collapsed);
        return [
          ci > 0 && !allCollapsed && !(anyOpen && l[ci - 1].panes.every((p) => p.collapsed)) && (
            <div key={`h${c.id}`} className="divider col-divider" onPointerDown={(e) => startResize(e, 'col', l[ci - 1].id, c.id)} />
          ),
          <div
            key={c.id}
            ref={(el) => void (el ? colRefs.current.set(c.id, el) : colRefs.current.delete(c.id))}
            className={`column${allCollapsed ? ' col-collapsed' : ''}`}
            style={{ flex: allCollapsed ? '0 0 38px' : `${c.size ?? 1} 1 0` }}
          >
            {c.panes.map((p, pi) => [
              pi > 0 && !p.collapsed && !c.panes[pi - 1].collapsed && (
                <div key={`v${p.id}`} className="divider row-divider" onPointerDown={(e) => startResize(e, 'pane', c.panes[pi - 1].id, p.id, c.id)} />
              ),
              paneEl(p, p.collapsed ? (allCollapsed ? '1 1 0' : '0 0 auto') : `${p.size ?? 1} 1 0`, allCollapsed),
            ])}
          </div>,
        ];
      })}
    </main>
  );
}
