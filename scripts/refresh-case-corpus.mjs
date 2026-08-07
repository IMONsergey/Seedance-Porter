#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const limit = clamp(Number(args.limit || 750), 100, 1000);
const min = clamp(Number(args.min || 500), 1, limit);
const queueLimit = clamp(Number(args.queue || 90), 10, 200);
const backlogLimit = clamp(Number(args.backlog || 30), 10, 100);
const output = resolve(args.output || 'studio/case-candidates.json');
const queueOutput = resolve(args['queue-output'] || 'studio/case-review-queue.json');
const planOutput = resolve(args['plan-output'] || 'studio/coverage-plan.json');
const healthOutput = resolve(args['health-output'] || 'studio/source-health.json');
const strict = args.strict === true || String(args.strict || '').toLowerCase() === 'true';

await runNode([
  'scripts/import-case-candidates.mjs',
  '--limit', String(limit),
  '--min', String(min),
  '--output', output
], new Set([0, 2]));

await runNode([
  'scripts/augment-case-candidates.mjs',
  '--input', output,
  '--output', output,
  '--limit', String(limit)
]);

await runNode([
  'scripts/expand-case-candidates.mjs',
  '--input', output,
  '--output', output,
  '--limit', String(limit)
]);

await runNode([
  'scripts/build-case-review-queue.mjs',
  '--input', output,
  '--limit', String(queueLimit),
  '--output', queueOutput
]);

await runNode([
  'scripts/build-coverage-plan.mjs',
  '--corpus', output,
  '--queue', queueOutput,
  '--output', planOutput,
  '--backlog', String(backlogLimit)
]);

await runNode([
  'scripts/build-source-health.mjs',
  '--corpus', output,
  '--plan', planOutput,
  '--output', healthOutput
]);

const corpus = JSON.parse(await readFile(output, 'utf8'));
const queue = JSON.parse(await readFile(queueOutput, 'utf8'));
const plan = JSON.parse(await readFile(planOutput, 'utf8'));
const health = JSON.parse(await readFile(healthOutput, 'utf8'));
const candidates = Number(corpus.stats?.candidates || 0);
const queueSize = Number(queue.stats?.queue || 0);
const targetReached = candidates >= min;
const respondingPools = Number(health.summary?.responding || 0);
const totalPools = Number(health.summary?.enabled || 0);

if (queueSize < 10) {
  console.error('[case-corpus] Deep-review queue was not populated.');
  process.exit(3);
}

const summary = {
  output,
  queueOutput,
  planOutput,
  healthOutput,
  candidates,
  minimumTarget: min,
  limit,
  targetReached,
  deepReviewQueue: queueSize,
  coveragePlanner: {
    criticalCollections: Number(plan.summary?.criticalCollections || 0),
    highPriorityCollections: Number(plan.summary?.highPriorityCollections || 0),
    backlog: Number(plan.backlog?.length || 0),
    topPriorityCollection: plan.summary?.topPriorityCollection || null
  },
  sourceHealth: health.summary,
  respondingSourcePools: `${respondingPools}/${totalPools}`,
  sourceStats: corpus.sourceStats,
  augmentation: corpus.augmentation || null,
  expansion: corpus.expansion || null
};

if (!targetReached) {
  console.error(`[case-corpus] PARTIAL SNAPSHOT: ${candidates}/${min} candidates after dedupe/risk filtering and source expansion.`);
  console.error('[case-corpus] Keep expanding discovery adapters; do not present this as a completed 500+ corpus.');
}

console.log(JSON.stringify(summary, null, 2));

if (strict && !targetReached) process.exit(2);

async function runNode(scriptArgs, allowedCodes = new Set([0])) {
  const code = await new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, scriptArgs, {
      stdio: 'inherit',
      env: process.env
    });
    child.on('error', rejectRun);
    child.on('close', resolveRun);
  });
  if (!allowedCodes.has(code)) {
    throw new Error(`Command failed with exit code ${code}: node ${scriptArgs.join(' ')}`);
  }
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, Number.isFinite(value) ? value : minValue));
}

function parseArgs(argv) {
  const outputArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    outputArgs[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
  }
  return outputArgs;
}
