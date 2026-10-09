// Skill discovery. A skill is a folder with SKILL.md (YAML frontmatter: name, description),
// the same format Claude Code and Codex both use, so one folder works on either floor.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface SkillInfo {
  name: string;
  description: string;
  path: string;
  source: string;
}

function frontmatter(md: string): Record<string, string> {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  const out: Record<string, string> = {};
  if (!m) return out;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

export function skillRoots(modDirs: string[], dataDir: string): { dir: string; source: string }[] {
  const roots: { dir: string; source: string }[] = [{ dir: path.join(dataDir, 'skills'), source: 'floor' }];
  for (const md of modDirs) {
    if (!fs.existsSync(md)) continue;
    for (const mod of fs.readdirSync(md)) roots.push({ dir: path.join(md, mod, 'skills'), source: `mod:${mod}` });
  }
  roots.push({ dir: path.join(os.homedir(), '.claude', 'skills'), source: '~/.claude' });
  roots.push({ dir: path.join(os.homedir(), '.agents', 'skills'), source: '~/.agents' });
  return roots;
}

export function discoverSkills(modDirs: string[], dataDir: string): SkillInfo[] {
  const seen = new Set<string>();
  const out: SkillInfo[] = [];
  for (const { dir, source } of skillRoots(modDirs, dataDir)) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const md = path.join(p, 'SKILL.md');
      if (!fs.existsSync(md)) continue;
      const fm = frontmatter(fs.readFileSync(md, 'utf8'));
      const skillName = fm.name || name;
      if (seen.has(skillName)) continue;
      seen.add(skillName);
      out.push({ name: skillName, description: fm.description ?? '', path: fs.realpathSync(p), source });
    }
  }
  return out;
}
