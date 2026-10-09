// Renders the roadmap as a live Mermaid flowchart:
// lanes are subgraphs (Shipped → Now → Next → Later), items are nodes with a
// progress bar, depends_on are arrows. Re-renders whenever the roadmap changes.
import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export interface FlowItem {
  id: string;
  title: string;
  lane: 'now' | 'next' | 'later' | 'shipped';
  theme?: string;
  owner?: string;
  progress: number;
  dependsOn?: string[];
}

const ORDER = ['shipped', 'now', 'next', 'later'] as const;
const LABEL: Record<string, string> = { shipped: '✅ Shipped', now: '🚧 Now', next: '⏭ Next', later: '🔭 Later' };

const dark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/** Mermaid-safe label text. */
const esc = (s: string) => s.replace(/"/g, '#quot;').replace(/[<>]/g, '').replace(/[{}[\]|]/g, ' ');

function bar(p: number) {
  const n = Math.round(p / 10);
  return '█'.repeat(n) + '░'.repeat(10 - n);
}

export function toMermaid(items: FlowItem[]): string {
  const d = dark();
  const pal: Record<string, [string, string, string]> = d
    ? { shipped: ['#12301f', '#34ad68', '#c8f0d8'], now: ['#2a2145', '#a48bf0', '#e6defc'], next: ['#14283d', '#5fb2f0', '#d6ebfb'], later: ['#33270f', '#f0b74c', '#fbe9c6'] }
    : { shipped: ['#e3f5ea', '#197a43', '#0f3d22'], now: ['#efeafc', '#7c5cd6', '#2e1f66'], next: ['#e4f1fb', '#2b8fd9', '#0e3a5c'], later: ['#fbf1dc', '#c98a12', '#5a3d05'] };
  const ids = new Set(items.map((i) => i.id));
  const lines = ['flowchart LR'];
  for (const lane of ORDER) {
    const [fill, stroke, text] = pal[lane];
    lines.push(`  classDef ${lane} fill:${fill},stroke:${stroke},color:${text},stroke-width:1.5px,rx:6,ry:6`);
  }
  for (const lane of ORDER) {
    const inLane = items.filter((i) => i.lane === lane);
    lines.push(`  subgraph L_${lane}["${LABEL[lane]} (${inLane.length})"]`, '    direction TB');
    if (!inLane.length) lines.push(`    E_${lane}[" "]:::${lane}`);
    for (const i of inLane) {
      const meta = [i.theme, i.owner && `@${i.owner}`].filter(Boolean).join(' · ');
      const label = `<b>${i.id}</b> ${esc(i.title)}${meta ? `<br/><small>${esc(meta)}</small>` : ''}<br/><code>${bar(i.progress)}</code> ${i.progress}%`;
      lines.push(`    ${i.id}["${label}"]:::${lane}`);
    }
    lines.push('  end');
  }
  // Lane order as faint arrows, then dependency arrows.
  lines.push('  L_shipped ~~~ L_now ~~~ L_next ~~~ L_later');
  for (const i of items) for (const dep of i.dependsOn ?? []) if (ids.has(dep)) lines.push(`  ${dep} --> ${i.id}`);
  for (const lane of ORDER) {
    const [, stroke] = pal[lane];
    lines.push(`  style L_${lane} fill:transparent,stroke:${stroke},stroke-width:2px,stroke-dasharray:4 3,color:${stroke}`);
  }
  return lines.join('\n');
}

let seq = 0;

export function Flow({ items, onSelect, selected }: { items: FlowItem[]; onSelect: (id: string) => void; selected?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string>();
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  // 0 = fit to pane; otherwise a multiple of the diagram's natural size.
  const [zoom, setZoom] = useState(0);
  const natural = useRef(0);

  const applyZoom = () => {
    const svg = host.current?.querySelector('svg');
    if (!svg) return;
    if (!zoom) {
      svg.style.width = '100%';
      svg.style.maxWidth = '100%';
    } else {
      svg.style.width = `${natural.current * zoom}px`;
      svg.style.maxWidth = 'none';
    }
  };
  useEffect(applyZoom, [zoom]);

  useEffect(() => {
    const src = toMermaid(items);
    setCode(src);
    let alive = true;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: dark() ? 'dark' : 'default',
      flowchart: { htmlLabels: true, curve: 'basis', nodeSpacing: 18, rankSpacing: 48, padding: 10 },
      themeVariables: { fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '13px' },
    });
    mermaid
      .render(`um-roadmap-${++seq}`, src)
      .then(({ svg }) => {
        if (!alive || !host.current) return;
        host.current.innerHTML = svg;
        const el = host.current.querySelector('svg');
        natural.current = el?.viewBox.baseVal.width || el?.getBoundingClientRect().width || 800;
        applyZoom();
        setErr(undefined);
        // Click a node to open its card.
        host.current.querySelectorAll<SVGGElement>('g.node').forEach((g) => {
          const m = g.id.match(/flowchart-(R\d+)-/);
          if (!m) return;
          g.style.cursor = 'pointer';
          if (m[1] === selected) g.classList.add('rm-node-selected');
          g.addEventListener('click', () => onSelect(m[1]));
        });
      })
      .catch((e) => alive && setErr(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [JSON.stringify(items), selected]);

  return (
    <div className="rm-flow">
      <div className="rm-zoom">
        <button className={zoom === 0 ? 'active' : ''} onClick={() => setZoom(0)} title="fit to pane">
          fit
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.5, +((z || 1) - 0.25).toFixed(2)))} title="zoom out">
          −
        </button>
        <span className="small muted">{zoom ? `${Math.round(zoom * 100)}%` : ''}</span>
        <button onClick={() => setZoom((z) => Math.min(3, +((z || 1) + 0.25).toFixed(2)))} title="zoom in">
          +
        </button>
      </div>
      <div ref={host} className="rm-flow-svg" />
      {err && <pre className="bad small">{err}</pre>}
      <details open={showCode} onToggle={(e) => setShowCode((e.target as HTMLDetailsElement).open)}>
        <summary className="small muted">mermaid source</summary>
        <pre className="small rm-code">{code}</pre>
      </details>
    </div>
  );
}
