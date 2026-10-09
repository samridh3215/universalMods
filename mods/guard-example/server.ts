// Example tool guard. Works on both platforms:
//  - Claude: tool.call comes from the bridged PreToolUse hook (tool "Bash", input.command)
//  - Codex:  tool.call comes from the bridged PreToolUse hook or an approval request (tool "shell")
// .catch() makes it fail closed: if this guard crashes, the call is denied.
import type { Register } from 'universal-mods/server';

export const register: Register = (on, options) => {
  const patterns = ((options.patterns as string[]) ?? []).map((p) => new RegExp(p, 'i'));

  on('tool.call', ($, e, next) => {
    const input = (e.input ?? {}) as Record<string, unknown>;
    const cmd = String(input.command ?? (Array.isArray(input.cmd) ? input.cmd.join(' ') : ''));
    const hit = cmd && patterns.find((re) => re.test(cmd));
    if (hit) {
      $.log(`denied for ${e.agentId}: ${cmd}`);
      return { decision: 'deny', reason: `guard-example: command matches ${hit}` };
    }
    return next();
  }).catch(($, _e, next) => (next.called ? next() : { decision: 'deny', reason: 'guard-example crashed; failing closed' }));
};
