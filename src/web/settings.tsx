// Floor settings page: which agents may use which hive capabilities.
import { useEffect, useState } from 'react';
import { useFloor } from './mod-api.ts';
import { api, toast } from './store.ts';
import type { CapabilityInfo, Scope } from './store.ts';

const SCOPE_LABEL: Record<Scope, string> = { off: 'Off', master: 'Orchestrator', all: 'All agents' };

export function SettingsButton() {
  const [open, setOpen] = useState(() => new URLSearchParams(location.search).has('settings'));
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);
  return (
    <>
      <button className={open ? 'active' : ''} onClick={() => setOpen(true)} title="Settings">
        ⚙ Settings
      </button>
      {open && <SettingsPage onClose={() => setOpen(false)} />}
    </>
  );
}

function SettingsPage({ onClose }: { onClose: () => void }) {
  const caps = useFloor((s) => s.capabilities);
  const settings = useFloor((s) => s.settings);
  const [busy, setBusy] = useState('');

  const setScope = async (cap: string, scope: Scope) => {
    setBusy(cap);
    try {
      await api('/api/settings', 'PUT', { capabilities: { [cap]: scope } });
    } catch (e: any) {
      toast(`Couldn't save: ${e.message ?? e}`, 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="settings-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="settings-page" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header>
          <h1 id="settings-title">Settings</h1>
          <button onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </header>

        <h2>What agents can do</h2>
        <p className="muted">
          Let agents run the floor for you. Tell the Orchestrator "spin up a tester", "turn off the timeline mod" or "switch to the dashboard layout"
          and it does it with hive tools. Saved for this floor. Turning something off applies at once; agents pick up newly allowed tools the next time they start.
        </p>

        <div className="cap-list">
          {(Object.entries(caps) as [string, CapabilityInfo][]).map(([id, c]) => {
            const value = settings.capabilities[id] ?? c.default;
            return (
              <div key={id} className="cap-row">
                <div className="cap-text">
                  <strong>{c.label}</strong>
                  <span className="muted">{c.description}</span>
                  <span className="cap-tools">
                    {c.tools.map((t) => (
                      <code key={t}>{t}</code>
                    ))}
                  </span>
                </div>
                <div className="seg" role="radiogroup" aria-label={c.label}>
                  {(['off', 'master', 'all'] as Scope[]).map((s) => (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={value === s}
                      className={value === s ? `on ${s}` : ''}
                      disabled={busy === id}
                      onClick={() => value !== s && void setScope(id, s)}
                    >
                      {SCOPE_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="muted small">
          Kanban, board, messages and <code>ask_user</code> are always on. Mods can add more tools; those are always on too. These settings steer the agents; they are
          not a sandbox. Agents run with full access to your machine, so a determined agent could still change things itself.
        </p>
      </section>
    </div>
  );
}
