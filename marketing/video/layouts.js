// Layouts flashed in the montage, in order. kind: technical | detail | dashboard | quirky | minimal.
// Paths are relative to this folder. Built-in layouts open live with ?layout=<name>.
const D = '../../docs/screenshots/layouts/';
window.LAYOUTS = [
  { file: D + 'mission.png', label: 'Mission control', kind: 'technical', desc: 'Live terminals side by side, timeline and cost.' },
  { file: D + 'deepdive.png', label: 'Deep dive', kind: 'detail', desc: 'One agent up close.' },
  { file: D + 'dashboard.png', label: 'Dashboard', kind: 'dashboard', desc: 'Clock, cost, agent graph, kanban.' },
  { file: D + 'arcade.png', label: 'Arcade', kind: 'quirky', desc: 'A giant clock, centre stage.' },
  { file: D + 'planner.png', label: 'Planner', kind: 'dashboard', desc: 'Roadmap over kanban, plus the sprint board.' },
  { file: D + 'zen.png', label: 'Zen', kind: 'minimal', desc: 'One terminal. Everything else folded away.' },
  { file: 'captures/hive.png', label: 'The hive', kind: 'technical', desc: 'Orchestrator, kanban and agent graph.' },
  { file: D + 'dashboard-light.png', label: 'Daylight', kind: 'dashboard', desc: 'Same floor, light mode.' },
  { file: 'captures/newmod-cost.png', label: 'Mod lab', kind: 'quirky', desc: 'The Mod Builder and the panel it wrote.' },
  { file: D + 'planner-light.png', label: 'Planner, light', kind: 'detail', desc: 'Every roadmap card, in daylight.' },
];
