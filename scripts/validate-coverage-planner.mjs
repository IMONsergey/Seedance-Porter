#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildCoveragePlan } from '../studio/coverage-planner-engine.js';

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const collectionGroups = [
  { id: 'group-a', title: 'Group A', items: ['Alpha', 'Beta'] },
  { id: 'group-b', title: 'Group B', items: ['Gamma'] }
];

const curatedCases = [
  ...Array.from({ length: 5 }, (_, index) => ({ id: `alpha-${index}`, collections: ['Alpha'] })),
  ...Array.from({ length: 2 }, (_, index) => ({ id: `gamma-${index}`, collections: ['Gamma'] }))
];

const candidates = [
  {
    id: 'beta-local-draft', title: 'Beta exact candidate', author: '@beta', sourceUrl: 'https://example.com/beta/1', previewUrl: 'https://example.com/beta.jpg', sourcePool: 'pool-one', sourcePoolLabel: 'Pool One', score: 88,
    metrics: { sourceTraceability: 5 }, collections: ['beta'], riskFlags: []
  },
  {
    id: 'beta-risky', title: 'Risky Beta', author: '@risk', sourceUrl: 'https://example.com/beta/risk', sourcePool: 'pool-two', score: 99,
    metrics: { sourceTraceability: 5 }, collections: ['beta'], riskFlags: ['named-ip-or-celebrity']
  },
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `gamma-${index}`, title: `Gamma ${index}`, author: `@g${index}`, sourceUrl: `https://example.com/gamma/${index}`, previewUrl: index % 2 ? '' : `https://example.com/gamma/${index}.jpg`, sourcePool: index % 3 === 0 ? 'pool-one' : index % 3 === 1 ? 'pool-two' : 'pool-three', sourcePoolLabel: 'Gamma Pool', score: 72 + index,
    metrics: { sourceTraceability: 4 }, collections: ['gamma'], riskFlags: []
  }))
];

const queue = [
  { candidateId: 'gamma-9', targetCollection: 'gamma', collectionCandidates: ['gamma'], score: 81, sourcePool: 'pool-one' },
  { candidateId: 'gamma-8', targetCollection: 'gamma', collectionCandidates: ['gamma'], score: 80, sourcePool: 'pool-three' }
];

const plan = buildCoveragePlan({
  collectionGroups,
  curatedCases,
  candidates,
  queue,
  localDraftCandidateIds: ['beta-local-draft']
}, { backlogSize: 12 });

const alpha = plan.collections.find(item => item.id === 'alpha');
const beta = plan.collections.find(item => item.id === 'beta');
const gamma = plan.collections.find(item => item.id === 'gamma');

assert(alpha && beta && gamma, 'All collection definitions must survive normalization.');
assert(beta.priority > alpha.priority, 'A starved Collection must rank above a fully curated Collection.');
assert(beta.nextAction === 'finish-review', `A local review draft should produce finish-review, got ${beta.nextAction}.`);
assert(beta.research === 1, `Risk-flagged candidate must be excluded from safe research supply; expected 1, got ${beta.research}.`);
assert(gamma.sourcePools >= 3, 'Source-pool diversity must be counted per Collection.');
assert(plan.backlog.some(item => item.candidateId === 'beta-local-draft'), 'High-priority local-draft candidate should appear in strategic backlog.');
assert(!plan.backlog.some(item => item.candidateId === 'beta-risky'), 'Risk-flagged candidate must never enter strategic backlog.');
assert(plan.sourcePools.length >= 3, 'Source-pool acquisition intelligence must be produced.');
assert(plan.summary.topPriorityCollection === 'beta', `Expected Beta to be top priority, got ${plan.summary.topPriorityCollection}.`);

const [runtime, multiSource] = await Promise.all([
  import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href),
  import(pathToFileURL(resolve('studio/multi-source-index.js')).href)
]);
const unifiedCuratedIds = new Set([
  ...runtime.CASE_INTELLIGENCE.map(item => item.id),
  ...multiSource.MULTI_SOURCE_CASES.map(item => item.id)
]);
assert(unifiedCuratedIds.size === 100, `Coverage Planner queue strategy must currently see the same 100 curated cases as the protected renderer; got ${unifiedCuratedIds.size}.`);

const [queueBuilder, ui, router, sidebar, bootstrap] = await Promise.all([
  readFile('scripts/build-case-review-queue.mjs', 'utf8'),
  readFile('studio/coverage-planner-ui.js', 'utf8'),
  readFile('studio/workspace-router.js', 'utf8'),
  readFile('studio/sidebar.js', 'utf8'),
  readFile('studio/coverage-planner-bootstrap.js', 'utf8')
]);

assert(queueBuilder.includes("studio/multi-source-index.js"), 'Review queue builder must load multi-source curated cases.');
assert(queueBuilder.includes('MULTI_SOURCE_CASES'), 'Review queue builder must include unified multi-source curated coverage.');
assert(queueBuilder.includes("studio/coverage-planner-engine.js"), 'Review queue builder must use the shared Coverage Planner engine.');
assert(queueBuilder.includes('schemaVersion: 2'), 'Strategic review queue schema must be versioned at 2.');
assert(queueBuilder.includes('curatedCasesConsidered'), 'Review queue stats must expose the curated coverage population considered.');
assert(queueBuilder.includes('sourcePoolsRepresented'), 'Review queue stats must expose source-pool diversity.');

assert(sidebar.indexOf("import './workspace-router.js';") >= 0, 'Sidebar must mount the workspace router.');
assert(sidebar.indexOf("import './workspace-router.js';") < sidebar.indexOf("import './experience.js';"), 'Workspace router must mount before the rest of the experience modules.');
assert(router.includes("document.addEventListener('click'"), 'Workspace router must listen to nav transitions.');
assert(router.includes('}, true);'), 'Workspace router must coordinate views in capture phase before individual workspace handlers.');
assert(router.includes("promotion: 'promotionView'"), 'Workspace router must know the Promotion view.');
assert(router.includes("'deep-review': 'deepReviewView'"), 'Workspace router must know the Deep Review view.');
assert(router.includes("corpus: 'corpusView'"), 'Workspace router must know the Research Corpus view.');

assert(bootstrap.includes("link.href = './coverage-planner.css'"), 'Coverage Planner bootstrap must load its CSS.');
assert(bootstrap.includes("await import('./coverage-planner-ui.js')"), 'Coverage Planner bootstrap must lazy-mount the planner UI.');
assert(ui.includes("fetchJson('./case-candidates.json')"), 'Coverage Planner UI must consume the deployed Research Corpus snapshot.');
assert(ui.includes("fetchJson('./case-review-queue.json')"), 'Coverage Planner UI must consume the deployed Deep Review queue.');
assert(ui.includes("porterDeepReviewDraft:"), 'Coverage Planner UI must include browser-local in-progress review signal.');
assert(ui.includes('buildCoveragePlan'), 'Coverage Planner UI must use the shared planning engine.');
assert(ui.includes('data-plan-review'), 'Coverage Planner backlog must provide a Deep Review execution path for queued candidates.');
assert(!ui.includes('INDUSTRY_DIGEST.push') && !ui.includes('MULTI_SOURCE_CASES.push'), 'Coverage Planner UI must never mutate curated datasets.');
assert(!ui.includes('#digestGrid') && !ui.includes('digestGrid'), 'Coverage Planner UI must not write to the curated card grid.');

if (failures.length) {
  console.error('Coverage Planner contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  unifiedCuratedCases: unifiedCuratedIds.size,
  syntheticTopPriority: plan.summary.topPriorityCollection,
  riskyCandidateExcluded: !plan.backlog.some(item => item.candidateId === 'beta-risky'),
  localDraftSignal: beta.nextAction,
  sourcePoolsMeasured: plan.sourcePools.length,
  queueStrategy: 'coverage-planner-v2'
}, null, 2));
