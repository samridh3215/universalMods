#!/usr/bin/env node
// Cut a release: bump the version, move CHANGELOG "Unreleased" notes under the new
// version, commit and tag. Push with `git push --follow-tags`; the tag triggers the
// GitHub Release workflow (.github/workflows/release.yml).
//   npm run release -- patch | minor | major | 1.2.3
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
const fail = (m) => {
  console.error(`release: ${m}`);
  process.exit(1);
};

const bump = process.argv[2];
if (!bump) fail('usage: npm run release -- <patch|minor|major|x.y.z>');
if (git('status', '--porcelain')) fail('working tree is not clean; commit or stash first');

const pkgFile = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
const next =
  bump === 'major' ? `${maj + 1}.0.0` : bump === 'minor' ? `${maj}.${min + 1}.0` : bump === 'patch' ? `${maj}.${min}.${pat + 1}` : /^\d+\.\d+\.\d+$/.test(bump) ? bump : fail(`bad version "${bump}"`);
if (git('tag', '--list', `v${next}`)) fail(`tag v${next} already exists`);

// CHANGELOG: "## [Unreleased]" body becomes "## [next] - date"; compare links updated.
const clFile = path.join(ROOT, 'CHANGELOG.md');
let cl = fs.readFileSync(clFile, 'utf8');
const m = cl.match(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[)/);
if (!m || !m[1].trim()) fail('CHANGELOG.md has no notes under ## [Unreleased]');
const date = new Date().toISOString().slice(0, 10);
cl = cl.replace(m[0], `## [Unreleased]\n\n## [${next}] - ${date}\n${m[1].replace(/^\n+/, '\n')}`);
const repo = 'https://github.com/samridh3215/universalMods';
cl = cl.replace(/\[Unreleased\]: .*\n/, `[Unreleased]: ${repo}/compare/v${next}...HEAD\n[${next}]: ${repo}/compare/v${pkg.version}...v${next}\n`);
fs.writeFileSync(clFile, cl);

pkg.version = next;
fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
const lockFile = path.join(ROOT, 'package-lock.json');
if (fs.existsSync(lockFile)) {
  const lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  lock.version = next;
  if (lock.packages?.['']) lock.packages[''].version = next;
  fs.writeFileSync(lockFile, JSON.stringify(lock, null, 2) + '\n');
}

git('add', 'package.json', 'package-lock.json', 'CHANGELOG.md');
git('commit', '-m', `Release v${next}`);
git('tag', '-a', `v${next}`, '-m', `v${next}`);
console.log(`Tagged v${next}. Publish it with:\n  git push --follow-tags`);
