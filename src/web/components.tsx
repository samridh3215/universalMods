// Small building blocks exported to client mods via the SDK.
import { useState } from 'react';
import type { AgentInfo, StampedEvent } from '../core/types.ts';
import { Markdown } from './markdown.tsx';

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export function fmtUsage(a: AgentInfo) {
  const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  const cost = a.usage.costUsd ? ` · $${a.usage.costUsd.toFixed(3)}` : '';
  return `${k(a.usage.input)} in · ${k(a.usage.output)} out${cost}`;
}

function brief(input: unknown): string {
  if (input == null) return '';
  if (typeof input !== 'object') return String(input);
  const o = input as Record<string, any>;
  return String(o.command ?? o.file_path ?? o.path ?? o.pattern ?? o.query ?? o.url ?? o.description ?? JSON.stringify(o));
}

/** One normalized event, rendered compactly. Click tool rows to expand output. */
export function EventLine({ e, agentName }: { e: StampedEvent; agentName?: string }) {
  const [open, setOpen] = useState(false);
  const ev = e.event;
  const who = agentName ? <span className="muted small">{agentName} </span> : null;
  const time = <span className="muted small">{new Date(e.ts).toLocaleTimeString()} </span>;
  switch (ev.kind) {
    case 'user':
      return (
        <div className="ev ev-user">
          {time}
          {who}
          <strong>{ev.from && ev.from !== 'user' && ev.from !== 'terminal' ? `← ${ev.from}` : 'you'}:</strong> <Markdown text={ev.text} />
        </div>
      );
    case 'text':
      return (
        <div className="ev ev-text">
          {who}
          <Markdown text={ev.text} />
        </div>
      );
    case 'reasoning':
      return (
        <div className="ev muted small" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
          {who}💭 {open ? ev.text : ev.text.slice(0, 120) + (ev.text.length > 120 ? '…' : '')}
        </div>
      );
    case 'tool':
      return (
        <div className="ev ev-tool" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
          {who}
          <span className={ev.status === 'failed' ? 'bad' : ev.status === 'started' ? 'muted' : 'ok'}>{ev.status === 'started' ? '▸' : ev.status === 'failed' ? '✗' : '✓'}</span>{' '}
          <code>{ev.tool}</code> <span className="small">{brief(ev.input).slice(0, 160)}</span>
          {open && (
            <pre className="small ev-out">
              {JSON.stringify(ev.input, null, 2)}
              {ev.output ? `\n──\n${ev.output.slice(0, 5000)}` : ''}
            </pre>
          )}
        </div>
      );
    case 'file':
      return (
        <div className="ev small">
          {who}📝 {ev.changes.map((c) => `${c.kind} ${c.path}`).join(', ')}
        </div>
      );
    case 'turn':
      return (
        <div className={`ev small ${ev.phase === 'fail' ? 'bad' : 'muted'}`}>
          {time}
          {who}— turn {ev.phase}
          {ev.error ? `: ${ev.error}` : ''}
        </div>
      );
    case 'error':
      return (
        <div className="ev bad small">
          {who}⚠ {ev.message}
        </div>
      );
    case 'notice':
      return <div className="ev muted small">{who}ℹ {ev.text}</div>;
    default:
      return null;
  }
}
