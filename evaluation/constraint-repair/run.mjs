import { writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { cases } from './fixtures.mjs';
import { compareCase, summarize } from './compare.mjs';

const root = new URL('../../', import.meta.url);
const started = performance.now();
const rows = cases.map(compareCase);
const elapsedMs = performance.now() - started;
const summary = Object.fromEntries(['development', 'held-out'].map(split => [split, summarize(rows.filter(r => r.split === split))]));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = {};
for (const name of ['constraint-repair.mjs', 'constraint_repair.py', 'constraint-repair.test.mjs', 'evaluation/constraint-repair/PROTOCOL.md', 'evaluation/constraint-repair/fixtures.mjs', 'evaluation/constraint-repair/compare.mjs', 'evaluation/constraint-repair/run.mjs']) sources[name] = hash(await readFile(new URL(name, root)));
const corpus = JSON.stringify(cases, null, 2) + '\n';
const held = summary['held-out'];
const retained = rows.every(r => r.feasibilityCorrect && r.optimal && r.conflictCorrect && !r.candidate.lockViolation && (!r.candidate.proposal || r.candidate.valid)) &&
  held.candidate.validRepairs === held.repairable && held.candidate.validRepairs > held.local.validRepairs && held.irrelevantConstraintsRemoved > 0;
const git = (...args) => execFileSync('git', args, { cwd: fileURLToPath(root), encoding: 'utf8' }).trim();
const result = { experiment: 'constraint-repair-1', scope: 'synthetic-finite-domain-engineering-only', releaseEligible: false,
  sourceRevision: git('rev-parse', 'HEAD'), workingTree: git('status', '--short'), sources,
  corpusSha256: hash(corpus), elapsedMs, node: process.version,
  timingScope: 'one local JS comparison pass including reference enumeration; not a cross-machine benchmark',
  retention: retained ? 'retain-experimentally-subject-to-abstention-and-parity-tests' : 'reject', summary, rows };
await writeFile(new URL('cases.json', import.meta.url), corpus);
await writeFile(new URL('report.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ retention: result.retention, elapsedMs, summary }, null, 2));
if (!retained) process.exitCode = 1;
