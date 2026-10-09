// Mod-scoped CSS, injected once (replaced on hot reload). Uses the shell's colour tokens.
const css = `
.rm { display: flex; flex-direction: column; gap: 8px; padding: 10px; min-height: 100%; }
.rm-head { display: flex; align-items: flex-end; gap: 8px 12px; flex-wrap: wrap; }
.rm-head > div:first-child { min-width: 220px; flex: 1 1 260px; }
.rm-head h3 { cursor: pointer; }
.rm-head .small.muted { cursor: pointer; }
.rm-overall { display: flex; align-items: center; gap: 6px; width: 160px; }
.rm-overall .rm-progress { flex: 1; }
.rm-gen { display: flex; gap: 6px; }
.rm-gen input { flex: 1; }
.rm-lanes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; align-items: start; }
.rm-lane { --c: var(--muted); background: var(--bg); border: 1px solid var(--line); border-top: 3px solid var(--c); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 8px; min-height: 120px; }
.rm-lane[data-lane="now"] { --c: var(--violet); } .rm-lane[data-lane="next"] { --c: var(--sky); }
.rm-lane[data-lane="later"] { --c: var(--amber); } .rm-lane[data-lane="shipped"] { --c: var(--ok); }
.rm-lane-head { display: flex; align-items: center; gap: 6px; }
.rm-lane-head strong { color: var(--c); text-transform: uppercase; font-size: 11px; letter-spacing: .06em; }
.rm-lane-head button { height: 20px; padding: 0 7px; }
.rm-count { background: color-mix(in srgb, var(--c) 15%, var(--panel)); color: var(--c); border-radius: 99px; padding: 0 7px; font-size: 10.5px; font-weight: 600; }
.rm-card { --h: 210; background: var(--panel); border: 1px solid var(--line); border-left: 3px solid hsl(var(--h) 55% 52%); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; gap: 4px; transition: box-shadow .3s, transform .3s; }
.rm-card.rm-fresh { box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 55%, transparent); transform: translateY(-1px); }
.rm-top { display: flex; align-items: center; gap: 6px; }
.rm-id { font-family: var(--mono); font-size: 10.5px; color: var(--muted); }
.rm-theme { font-size: 10.5px; padding: 0 7px; border-radius: 99px; color: hsl(var(--h) 55% 45%); background: hsl(var(--h) 60% 50% / .13); font-weight: 600; }
@media (prefers-color-scheme: dark) { .rm-theme { color: hsl(var(--h) 70% 70%); } }
.rm-title { font-weight: 600; cursor: pointer; line-height: 1.3; }
.rm-progress { height: 5px; background: color-mix(in srgb, var(--text) 9%, transparent); border-radius: 99px; overflow: hidden; }
.rm-progress > div { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--violet)); transition: width .6s ease; }
.rm-lane[data-lane="shipped"] .rm-progress > div { background: var(--ok); }
.rm-foot { display: flex; gap: 6px; }
.rm-detail { border-top: 1px dashed var(--line); margin-top: 4px; padding-top: 6px; display: flex; flex-direction: column; gap: 3px; }
.rm-detail button { height: 22px; padding: 0 7px; }
.rm-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
.rm-dot.s-doing { background: var(--violet); } .rm-dot.s-review { background: var(--amber); } .rm-dot.s-done { background: var(--ok); } .rm-dot.s-todo { background: var(--sky); }
.rm-activity { margin-top: 4px; }
.rm-toggle { display: inline-flex; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.rm-toggle button { border: none; border-radius: 0; height: 24px; background: transparent; }
.rm-toggle button.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.rm-flow { background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 8px; overflow: auto; }
.rm-flow { position: relative; }
.rm-flow-svg svg { height: auto; display: block; margin: 0 auto; }
.rm-zoom { position: sticky; left: 0; top: 0; z-index: 1; display: inline-flex; gap: 4px; align-items: center; margin-bottom: 6px; }
.rm-zoom button { height: 22px; padding: 0 8px; }
.rm-zoom button.active { color: var(--accent); border-color: var(--accent); }
.rm-toggle button { white-space: nowrap; }
.rm-flow-svg .rm-node-selected rect, .rm-flow-svg .rm-node-selected polygon { stroke-width: 3px !important; filter: drop-shadow(0 0 4px var(--accent)); }
.rm-flow-svg .node:hover rect { filter: brightness(1.06); }
.rm-flow-svg code { font-size: 10px; letter-spacing: -1px; opacity: .85; background: none; }
.rm-code { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 8px; max-height: 240px; overflow: auto; }
.rm-selected { max-width: 420px; }
`;

export function injectStyles() {
  let el = document.getElementById('um-roadmap-css');
  if (!el) {
    el = document.createElement('style');
    el.id = 'um-roadmap-css';
    document.head.appendChild(el);
  }
  el.textContent = css;
}
