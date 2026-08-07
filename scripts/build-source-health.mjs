#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SOURCE_ADAPTERS, publicAdapterRecord } from './source-adapter-registry.mjs';
import { buildSourceHealth } from './source-health-engine.mjs';

const args = parseArgs(process.argv.slice(2));
const CORPUS = resolve(args.corpus || 'studio/case-candidates.json');
const PLAN = resolve(args.plan || 'studio/coverage-plan.json');
const OUTPUT = resolve(args.output || 'studio/source-health.json');
const HIGH_QUALITY = Number(args['high-quality'] || 70);

const corpus = JSON.parse(await readFile(CORPUS, 'utf8'));
let plan = null;
try { plan = JSON.parse(await readFile(PLAN, 'utf8')); } catch {}

const payload = buildSourceHealth({
  corpus,
  plan,
  adapters: SOURCE_ADAPTERS.map(publicAdapterRecord),
  highQualityThreshold: HIGH_QUALITY
});
payload.inputs = { corpus: CORPUS, coveragePlan: plan ? PLAN : null };

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  output: OUTPUT,
  summary: payload.summary,
  adapters: payload.adapters.map(item => ({
    id: item.id,
    status: item.health.status,
    score: item.health.score,
    selected: item.yield.selected,
    highQuality: item.yield.highQuality,
    weakCollections: item.yield.weakCollectionsServed
  }))
}, null, 2));

function parseArgs(argv) {
  const output = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    output[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
  }
  return output;
}
