// Floor status line + a /broadcast command. Shows the server-mod API in ~40 lines.
import type { ModContext, Register } from 'universal-mods/server';

function refresh($: ModContext) {
  const agents = $.agent.list();
  const by = (s: string) => agents.filter((a) => a.status === s).length;
  const cost = agents.reduce((n, a) => n + a.usage.costUsd, 0);
  const tokens = agents.reduce((n, a) => n + a.usage.input + a.usage.output, 0);
  const parts = [`${by('working')} working`, `${by('idle')} idle`];
  if (by('blocked')) parts.push(`${by('blocked')} need you`);
  if (by('held')) parts.push(`${by('held')} held`);
  parts.push(`${(tokens / 1000).toFixed(1)}k tok`);
  if (cost) parts.push(`$${cost.toFixed(3)}`);
  $.ui.status(parts.join(' · '));
}

export const register: Register = (on) => {
  on('session.start', ($, _e, next) => {
    $.command.register('broadcast', 'Send a message to every agent on the floor');
    refresh($);
    return next();
  });

  on('agent.status', ($, e, next) => {
    refresh($);
    if (e.status === 'blocked') $.ui.toast(`${e.agent.name} needs you`, 'warn');
    return next();
  });

  on('agent.event', (e) => e.event.kind === 'usage', ($, _e, next) => (refresh($), next()));

  on('command.run', { name: 'broadcast' }, async ($, e) => {
    const agents = $.agent.list().filter((a) => a.status !== 'stopped');
    await Promise.all(agents.map((a) => $.agent.send(a.id, e.args, 'user')));
    return { text: `sent to ${agents.length} agents` };
  });
};
