// Diff mod: what an agent changed in its working directory.
// - "scan" lists changed files (git status) and pushes the result to the view.
// - "diff" returns the unified diff of one file.
// - Scans run again when an agent changes files or finishes a turn.
// - Agents can ask for review through the review_request tool.
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import type { ModContext, Register } from 'universal-mods/server';

const run = promisify(execFile);
const MAX_DIFF = 200_000;
const SCAN_DELAY_MS = 800;

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

const git = (cwd: string, args: string[], okCodes = [0]) =>
  run('git', ['-C', cwd, ...args], { maxBuffer: MAX_DIFF * 5 }).then(
    (r) => r.stdout,
    (err: { code?: number; stdout?: string; message: string }) => {
      if (typeof err.code === 'number' && okCodes.includes(err.code)) return err.stdout ?? '';
      throw new Error(err.message.split('\n')[0]);
    },
  );

/** Maps the two-letter porcelain code to one badge. */
function badge(code: string): Change['status'] {
  if (code === '??') return '?';
  if (code.includes('A')) return 'A';
  if (code.includes('D')) return 'D';
  if (code.includes('R')) return 'R';
  return 'M';
}

async function scan($: ModContext, agentId: string): Promise<Tree> {
  const agent = $.agent.get(agentId);
  const tree: Tree = { agentId, cwd: agent?.cwd ?? '', files: [], at: Date.now() };
  if (!agent) return { ...tree, error: 'unknown agent' };
  try {
    // Git reports paths from the repo root. "-- ." limits the list to this agent's folder, and the prefix
    // turns the paths back into folder-relative ones for display.
    const prefix = (await git(agent.cwd, ['rev-parse', '--show-prefix'])).trim();
    // -z: NUL-separated, no quoting of unusual paths. A rename adds one extra entry for the old path.
    const entries = (await git(agent.cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', '.'])).split('\0');
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.length < 4) continue;
      const code = e.slice(0, 2);
      const file = e.slice(3);
      tree.files.push({ path: file.startsWith(prefix) ? file.slice(prefix.length) : file, status: badge(code) });
      if (code.includes('R') || code.includes('C')) i++;
    }
  } catch (err) {
    tree.error = (err as Error).message;
  }
  $.ui.publish('tree', tree);
  return tree;
}

/** Diff for one file in the agent's folder. Git commands run from the repo root, where the paths are relative. */
async function diff($: ModContext, agentId: string, file: string) {
  const agent = $.agent.get(agentId);
  if (!agent) throw new Error('unknown agent');
  const abs = path.resolve(agent.cwd, file);
  if (!abs.startsWith(path.resolve(agent.cwd) + path.sep)) throw new Error('path is outside the agent folder');
  const top = (await git(agent.cwd, ['rev-parse', '--show-toplevel'])).trim();
  const rel = path.relative(top, abs);
  const tracked = (await git(top, ['ls-files', '--error-unmatch', '--', rel], [0, 1])).length > 0;
  // Tracked files diff against HEAD; new files diff against /dev/null (git exits 1 when there are differences).
  const text = tracked
    ? await git(top, ['diff', 'HEAD', '--no-color', '--', rel])
    : await git(top, ['diff', '--no-index', '--no-color', '--', '/dev/null', rel], [0, 1]);
  return { path: file, diff: text.length > MAX_DIFF ? `${text.slice(0, MAX_DIFF)}\n… diff truncated` : text };
}

export const register: Register = (on) => {
  // Debounce: many file events in a burst cause one scan per agent.
  const pending = new Map<string, boolean>();
  const queue = ($: ModContext, agentId: string) => {
    if (pending.get(agentId)) return;
    pending.set(agentId, true);
    $.clock.after(SCAN_DELAY_MS, () => {
      pending.delete(agentId);
      void scan($, agentId);
    });
  };

  on('session.start', ($, _e, next) => {
    $.tool.register(
      {
        name: 'review_request',
        description: 'Ask the human to review your changes. Say what changed and what to look at.',
        inputSchema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] },
      },
      (args, caller) => {
        const message = String(args.message ?? '').slice(0, 2000);
        $.ui.publish('review', { agentId: caller.agentId, message, at: Date.now() });
        $.ui.toast(`${caller.agentName} asked for review`, 'info');
        void scan($, caller.agentId);
        return 'review requested';
      },
    );
    return next();
  });

  on('agent.event', (e) => e.event.kind === 'file' || (e.event.kind === 'turn' && e.event.phase !== 'start'), ($, e, next) => {
    queue($, e.agent.id);
    return next();
  });

  on('ui.press', { mod: 'diff' }, async ($, e) => {
    const p = (e.payload ?? {}) as { agentId?: string; path?: string };
    if (!p.agentId) throw new Error('agentId is required');
    if (e.key === 'scan') return scan($, p.agentId);
    if (e.key === 'diff') return diff($, p.agentId, String(p.path ?? ''));
    throw new Error(`unknown key ${e.key}`);
  });
};
