#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = parseArgs(process.argv.slice(2));
const INPUT = resolve(args.input || 'studio/case-candidates.json');
const OUTPUT = resolve(args.output || 'studio/case-review-queue.json');
const LIMIT = Math.max(10, Math.min(200, Number(args.limit || 90)));

const corpus = JSON.parse(await readFile(INPUT, 'utf8'));
const runtime = await import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href);
const multiSource = await import(pathToFileURL(resolve('studio/multi-source-index.js')).href);
const planner = await import(pathToFileURL(resolve('studio/coverage-planner-engine.js')).href);
const { CASE_INTELLIGENCE, COLLECTION_GROUPS } = runtime;
const { MULTI_SOURCE_CASES } = multiSource;
const { buildCoveragePlan, slugCollection } = planner;

const collectionNames = COLLECTION_GROUPS.flatMap(group => group.items);
const collectionMap = new Map(collectionNames.map(name => [slugCollection(name), name]));

const curatedCases = dedupeById([
  ...CASE_INTELLIGENCE.map(item => ({
    id: item.id,
    title: item.title,
    sourcePlatform: 'x',
    collections: item.intelligence?.collections || []
  })),
  ...MULTI_SOURCE_CASES.map(item => ({
    id: item.id,
    title: item.title,
    sourcePlatform: item.sourcePlatform,
    collections: item.collections || []
  }))
]);

const candidates = [...(corpus.candidates || [])]
  .filter(item => item.reviewStatus === 'candidate' && !(item.riskFlags || []).length)
  .sort((a, b) =>
    Number(b.score || 0) - Number(a.score || 0)
    || Number(b.metrics?.sourceTraceability || 0) - Number(a.metrics?.sourceTraceability || 0)
    || String(a.title).localeCompare(String(b.title))
  );

const plan = buildCoveragePlan({
  collectionGroups: COLLECTION_GROUPS,
  curatedCases,
  candidates,
  queue: []
}, {
  backlogSize: LIMIT
});

const candidateById = new Map(candidates.map(item => [item.id, item]));
const selected = [];
const used = new Set();
const sourceUse = new Map();

for (const backlogItem of plan.backlog) {
  if (selected.length >= LIMIT) break;
  const candidate = candidateById.get(backlogItem.candidateId);
  if (!candidate || used.has(candidate.id)) continue;
  used.add(candidate.id);
  sourceUse.set(candidate.sourcePool || 'unknown', (sourceUse.get(candidate.sourcePool || 'unknown') || 0) + 1);
  selected.push(queueItem(candidate, backlogItem.targetCollection, selected.length + 1, {
    strategicRank: backlogItem.rank,
    collectionPriority: backlogItem.collectionPriority,
    selectionReasons: backlogItem.reasons,
    action: backlogItem.action
  }));
}

// The strategic backlog intentionally focuses on weak Collections. Fill any remaining
// queue capacity with the strongest safe candidates while applying a soft penalty to
// already overrepresented source pools. This keeps long-term depth growing without
// letting one scrapeable corpus dominate the review workload.
while (selected.length < LIMIT) {
  const remaining = candidates
    .filter(item => !used.has(item.id))
    .map(item => {
      const sourcePool = item.sourcePool || 'unknown';
      const sourceCount = sourceUse.get(sourcePool) || 0;
      const traceability = Number(item.metrics?.sourceTraceability || 0);
      const collectionPriority = Math.max(0, ...(item.collections || []).map(id => plan.index.collections[id]?.priority || 0));
      const value = Number(item.score || 0)
        + traceability * 2
        + (item.previewUrl ? 2 : 0)
        + collectionPriority * 0.25
        - sourceCount * 3;
      return { item, value, collectionPriority, sourceCount };
    })
    .sort((a, b) => b.value - a.value || Number(b.item.score || 0) - Number(a.item.score || 0));

  const pick = remaining[0];
  if (!pick) break;
  const targetCollection = [...(pick.item.collections || [])]
    .sort((a, b) => (plan.index.collections[b]?.priority || 0) - (plan.index.collections[a]?.priority || 0))[0]
    || 'camera';
  used.add(pick.item.id);
  const sourcePool = pick.item.sourcePool || 'unknown';
  sourceUse.set(sourcePool, (sourceUse.get(sourcePool) || 0) + 1);
  selected.push(queueItem(pick.item, targetCollection, selected.length + 1, {
    strategicRank: null,
    collectionPriority: pick.collectionPriority,
    selectionReasons: ['high-value depth candidate', pick.sourceCount ? 'source diversity penalty applied' : 'source pool not yet represented in fallback'],
    action: 'expand-depth'
  }));
}

const curatedCoverage = Object.fromEntries(plan.collections.map(item => [item.id, item.curated]));
const researchCoverage = Object.fromEntries(plan.collections.map(item => [item.id, item.research]));
const highQualityCoverage = Object.fromEntries(plan.collections.map(item => [item.id, item.highQualityResearch]));
const sourceDiversityCoverage = Object.fromEntries(plan.collections.map(item => [item.id, item.sourcePools]));
const queueCoverage = Object.fromEntries([...collectionMap.keys()].map(id => [id, selected.filter(item => item.targetCollection === id || item.collectionCandidates?.includes(id)).length]));
const deepCoverage = Object.fromEntries([...collectionMap.keys()].map(id => [id, 0]));
for (const item of CASE_INTELLIGENCE) {
  if (item.intelligence?.reviewStatus !== 'deep-reviewed') continue;
  for (const name of item.intelligence?.collections || []) {
    const id = slugCollection(name);
    deepCoverage[id] = (deepCoverage[id] || 0) + 1;
  }
}

const payload = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  policy: {
    stateMachine: 'candidate -> prompt-reviewed -> deep-reviewed -> curated',
    selectionStrategy: 'Coverage Planner 2.0: all 100 curated cases + research supply + high-quality candidate supply + source diversity + Collection gaps, with source-pool balancing for fallback depth.',
    curatedCoverageSource: 'CASE_INTELLIGENCE + MULTI_SOURCE_CASES unified curated runtime',
    visualEvidenceRule: 'Do not mark deep-reviewed until the complete source video has been visually inspected. Prompt text and thumbnails are insufficient.',
    minimumPromptAnalysis: ['shotBreakdown','causalMechanics','signatureMove','referenceStrategy','motionLanguage','transferablePattern','failureRisks'],
    minimumVisualReview: ['observedShots','observedTransitions','observedMotion','observedArtifacts','observedContinuity','verifiedSignatureMove']
  },
  planner: {
    targets: plan.targets,
    summary: plan.summary,
    pipeline: plan.pipeline,
    collectionPriorities: Object.fromEntries(plan.collections.map(item => [item.id, {
      title: item.title,
      group: item.groupTitle,
      priority: item.priority,
      health: item.health,
      nextAction: item.nextAction
    }]))
  },
  currentCoverage: {
    curated: curatedCoverage,
    deepReviewed: deepCoverage,
    research: researchCoverage,
    highQualityResearch: highQualityCoverage,
    sourcePools: sourceDiversityCoverage,
    queued: queueCoverage
  },
  stats: {
    queue: selected.length,
    curatedCasesConsidered: curatedCases.length,
    collectionsRepresented: new Set(selected.flatMap(item => [item.targetCollection, ...(item.collectionCandidates || [])])).size,
    targetCollectionsRepresented: new Set(selected.map(item => item.targetCollection)).size,
    sourcePoolsRepresented: new Set(selected.map(item => item.sourcePool).filter(Boolean)).size,
    averageCandidateScore: Math.round(selected.reduce((sum, item) => sum + Number(item.score || 0), 0) / Math.max(1, selected.length)),
    averageSourceTraceability: Number((selected.reduce((sum, item) => sum + Number(item.sourceTraceability || 0), 0) / Math.max(1, selected.length)).toFixed(1)),
    strategicBacklogSelections: selected.filter(item => item.strategy?.strategicRank != null).length
  },
  queue: selected
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: OUTPUT, ...payload.stats, weakestCollections: plan.collections.slice(0, 8).map(item => ({ id: item.id, priority: item.priority, action: item.nextAction })) }, null, 2));

function queueItem(item, targetCollection, priority, strategy) {
  return {
    priority,
    candidateId: item.id,
    title: item.title,
    author: item.author,
    sourceUrl: item.sourceUrl,
    archiveUrl: item.archiveUrl,
    previewUrl: item.previewUrl,
    sourcePool: item.sourcePool,
    sourcePoolLabel: item.sourcePoolLabel || item.sourcePool,
    score: Number(item.score || 0),
    sourceTraceability: Number(item.metrics?.sourceTraceability || 0),
    targetCollection,
    targetCollectionTitle: collectionMap.get(targetCollection) || targetCollection,
    collectionCandidates: item.collections || [],
    reviewStatus: 'candidate',
    strategy,
    checklist: {
      promptAnatomy: [
        'Identify the requested shot count and the function of every shot or continuous beat.',
        'Separate camera movement from subject/object movement.',
        'Identify continuity locks, reference jobs and physical constraints.',
        'Write a causal hypothesis for why each instruction should affect the output.',
        'Extract one transferable production pattern without copying source subject matter.'
      ],
      visualReview: [
        'Watch the complete source video, not only its thumbnail or prompt.',
        'Record observed shot boundaries and actual framing/camera behavior.',
        'Record what the model followed, compressed, ignored or invented.',
        'Record transitions, pacing, material/physics behavior and continuity.',
        'Record visible artifacts and compromises.',
        'Verify or revise the signature move using observed evidence.',
        'Only then change reviewStatus to deep-reviewed.'
      ]
    }
  };
}

function dedupeById(items) {
  return [...new Map(items.filter(item => item?.id).map(item => [item.id, item])).values()];
}

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    out[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
  }
  return out;
}
