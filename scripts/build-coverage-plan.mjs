#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = parseArgs(process.argv.slice(2));
const CORPUS = resolve(args.corpus || 'studio/case-candidates.json');
const QUEUE = resolve(args.queue || 'studio/case-review-queue.json');
const OUTPUT = resolve(args.output || 'studio/coverage-plan.json');
const BACKLOG = Math.max(10, Math.min(100, Number(args.backlog || 30)));

const [corpus, queue, runtime, multiSource, planner] = await Promise.all([
  readJson(CORPUS),
  readJson(QUEUE),
  import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href),
  import(pathToFileURL(resolve('studio/multi-source-index.js')).href),
  import(pathToFileURL(resolve('studio/coverage-planner-engine.js')).href)
]);

const curatedCases = dedupeById([
  ...runtime.CASE_INTELLIGENCE.map(item => ({
    id: item.id,
    title: item.title,
    sourcePlatform: 'x',
    collections: item.intelligence?.collections || []
  })),
  ...multiSource.MULTI_SOURCE_CASES.map(item => ({
    id: item.id,
    title: item.title,
    sourcePlatform: item.sourcePlatform,
    collections: item.collections || []
  }))
]);

const plan = planner.buildCoveragePlan({
  collectionGroups: runtime.COLLECTION_GROUPS,
  curatedCases,
  candidates: corpus.candidates || [],
  queue: queue.queue || [],
  localDraftCandidateIds: []
}, {
  backlogSize: BACKLOG
});

const payload = {
  ...plan,
  generatedAt: new Date().toISOString(),
  baselineMode: 'repository-snapshot-without-browser-local-review-drafts',
  inputs: {
    corpus: CORPUS,
    queue: QUEUE,
    curatedCases: curatedCases.length
  },
  index: undefined
};

delete payload.index;
await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output: OUTPUT,
  curatedCases: curatedCases.length,
  researchCandidates: plan.summary.researchCandidates,
  queuedCandidates: plan.summary.queuedCandidates,
  criticalCollections: plan.summary.criticalCollections,
  highPriorityCollections: plan.summary.highPriorityCollections,
  backlog: plan.backlog.length,
  topPriority: plan.collections.slice(0, 8).map(item => ({ id: item.id, priority: item.priority, action: item.nextAction }))
}, null, 2));

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function dedupeById(items) {
  return [...new Map(items.filter(item => item?.id).map(item => [item.id, item])).values()];
}

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
