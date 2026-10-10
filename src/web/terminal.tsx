// Live agent terminal: replays the PTY scrollback, then streams output over the
// socket; keystrokes and size changes go back to the agent's PTY.
import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import xtermCss from '@xterm/xterm/css/xterm.css';
import { api, onPty, sendWs } from './store.ts';

let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  cssInjected = true;
  const el = document.createElement('style');
  el.textContent = xtermCss;
  document.head.appendChild(el);
}

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function theme() {
  const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return {
    background: dark ? '#0c0c0b' : '#fbfbf9',
    foreground: cssVar('--text') || (dark ? '#ececea' : '#191918'),
    cursor: cssVar('--accent') || '#2b65d9',
    selectionBackground: dark ? '#3a4a6b' : '#c9d8f7',
  };
}

export function AgentTerminal({ agentId, fontSize = 12 }: { agentId: string; fontSize?: number }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectCss();
    const term = new Terminal({
      fontSize,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      cursorBlink: true,
      scrollback: 5000,
      allowProposedApi: true,
      theme: theme(),
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host.current!);
    let alive = true;
    let lastSize = '';

    const sendSize = () => {
      try {
        fit.fit();
      } catch {
        return;
      }
      const key = `${term.cols}x${term.rows}`;
      if (key === lastSize) return;
      lastSize = key;
      sendWs({ type: 'pty-resize', agentId, cols: term.cols, rows: term.rows });
    };

    // Replay what the agent has printed so far, then follow live output.
    const pending: string[] = [];
    let replayed = false;
    const offData = onPty((m) => {
      if (m.agentId !== agentId) return;
      if (replayed) term.write(m.data);
      else pending.push(m.data);
    });
    api<{ buffer: string; alive: boolean }>(`/api/agents/${encodeURIComponent(agentId)}/pty`)
      .then((snap) => {
        if (!alive) return;
        term.write(snap.buffer || (snap.alive ? '' : '\x1b[2m[terminal not running: press Start or send a message]\x1b[0m\r\n'));
        for (const d of pending) term.write(d);
        replayed = true;
        sendSize();
      })
      .catch(() => (replayed = true));

    const input = term.onData((data) => sendWs({ type: 'pty-in', agentId, data }));
    const ro = new ResizeObserver(() => requestAnimationFrame(sendSize));
    ro.observe(host.current!);
    const scheme = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onScheme = () => (term.options.theme = theme());
    scheme?.addEventListener?.('change', onScheme);

    return () => {
      alive = false;
      offData();
      input.dispose();
      ro.disconnect();
      scheme?.removeEventListener?.('change', onScheme);
      term.dispose();
    };
  }, [agentId, fontSize]);

  return <div className="agent-term" ref={host} onMouseDown={(e) => e.stopPropagation()} />;
}
