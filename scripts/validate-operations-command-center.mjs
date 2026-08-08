#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildOperationsState } from '../studio/operations-engine.js';

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const now = '2026-08-07T18:00:00.000Z';
const curated100 = Array.from({ length: 100 }, (_, index) => ({ id:`curated-${index}` }));
const freshCorpus = { generatedAt:now, target:{ min:500 }, stats:{ candidates:500 }, candidates:[] };
const freshQueue = { generatedAt:now, stats:{ queue:90 }, queue:[{ candidateId:'candidate-next', title:'Next strategic review' }] };
const freshCoverage = { generatedAt:now, summary:{ criticalCollections:0, highPriorityCollections:0 }, collections:[], backlog:[] };
const freshHealth = { generatedAt:now, summary:{ responding:9, enabled:9, needsRepair:0, highValue:2 }, adapters:[] };

const healthy = buildOperationsState({ curatedCases:curated100, corpus:freshCorpus, queue:freshQueue, coverage:freshCoverage, sourceHealth:freshHealth, local:{}, now });
assert(healthy.health === 'healthy', `Complete current fixture should be healthy, got ${healthy.health}.`);
assert(healthy.pipeline.curated === 100, 'Operations must preserve the exact curated runtime count.');
assert(!healthy.actions.some(action => action.type === 'curated-contract'), 'Healthy exact-100 fixture must not produce curated-contract action.');
assert(healthy.actions.some(action => action.type === 'continue-review'), 'Healthy system with queued work should still offer a low-priority continue-review action.');

const drift = buildOperationsState({ curatedCases:curated100.slice(0,99), corpus:freshCorpus, queue:freshQueue, coverage:freshCoverage, sourceHealth:freshHealth, local:{}, now });
assert(drift.health === 'critical', 'Curated count drift must make operations critical.');
assert(drift.actions[0]?.type === 'curated-contract' && drift.actions[0]?.priority === 100, 'Curated contract drift must be the top priority action.');

const missing = buildOperationsState({ curatedCases:curated100, corpus:null, queue:null, coverage:freshCoverage, sourceHealth:freshHealth, local:{}, now });
assert(missing.health === 'critical', 'Missing research snapshots must make operations critical.');
assert(missing.actions.some(action => action.type === 'missing-snapshots'), 'Missing snapshots action is required.');

const localWork = buildOperationsState({ curatedCases:curated100, corpus:freshCorpus, queue:freshQueue, coverage:freshCoverage, sourceHealth:freshHealth, local:{ deepReviewDrafts:['candidate-a','candidate-a','candidate-b'], mediaEvidenceDrafts:['candidate-a'], promotionDrafts:['candidate-c'] }, now });
const reviewAction = localWork.actions.find(action => action.type === 'finish-reviews');
const promotionAction = localWork.actions.find(action => action.type === 'finish-promotions');
assert(reviewAction?.priority === 94, 'Existing Deep Review drafts must get priority 94.');
assert(reviewAction?.data?.count === 2, 'Local draft IDs must be deduplicated.');
assert(promotionAction?.priority === 84, 'Existing Promotion drafts must surface as high-priority continuation work.');
assert(localWork.pipeline.mediaEvidenceDrafts === 1, 'Media evidence draft count must be surfaced separately.');

const brokenHealth = { ...freshHealth, summary:{ responding:7, enabled:9, needsRepair:2, highValue:2 }, adapters:[
  { id:'broken', label:'Broken Adapter', health:{ status:'failed', recommendation:'repair-adapter' } },
  { id:'zero', label:'Zero Yield', health:{ status:'zero-yield', recommendation:'inspect-duplicates-risk-and-parser-quality' } }
] };
const repair = buildOperationsState({ curatedCases:curated100, corpus:freshCorpus, queue:freshQueue, coverage:freshCoverage, sourceHealth:brokenHealth, local:{}, now });
assert(repair.health === 'attention', 'Adapter failures must set overall health to attention when curated/snapshots are stable.');
assert(repair.actions.some(action => action.type === 'source-repair' && action.priority === 91), 'Adapter failures must produce priority-91 repair action.');

const researchDeficit = buildOperationsState({ curatedCases:curated100, corpus:{ ...freshCorpus, stats:{ candidates:200 } }, queue:freshQueue, coverage:freshCoverage, sourceHealth:freshHealth, local:{}, now });
assert(researchDeficit.health === 'attention', 'Large research deficit must require attention.');
assert(researchDeficit.actions.some(action => action.type === 'research-deficit' && action.data.deficit === 300), 'Research target deficit must be quantified.');

const criticalCoverage = { generatedAt:now, summary:{ criticalCollections:2, highPriorityCollections:3 }, collections:[
  { id:'packshot', title:'Packshot', priority:91, health:'critical', nextAction:'review-now' },
  { id:'saas-ui', title:'SaaS UI', priority:82, health:'critical', nextAction:'discover' }
], backlog:[{ candidateId:'candidate-packshot', title:'Packshot candidate', targetCollection:'packshot', queued:true }] };
const coveragePressure = buildOperationsState({ curatedCases:curated100, corpus:freshCorpus, queue:freshQueue, coverage:criticalCoverage, sourceHealth:freshHealth, local:{}, now });
const coverageAction = coveragePressure.actions.find(action => action.type === 'critical-coverage');
assert(coveragePressure.health === 'attention', 'Critical Collection coverage must set attention health.');
assert(coverageAction?.candidateId === 'candidate-packshot', 'Critical coverage should route to the first queued backlog candidate when available.');
assert(coverageAction?.targetView === 'deep-review', 'Queued critical backlog should route directly to Deep Review.');

const staleTime = '2026-07-20T00:00:00.000Z';
const stale = buildOperationsState({ curatedCases:curated100, corpus:{ ...freshCorpus, generatedAt:staleTime }, queue:{ ...freshQueue, generatedAt:staleTime }, coverage:{ ...freshCoverage, generatedAt:staleTime }, sourceHealth:{ ...freshHealth, generatedAt:staleTime }, local:{}, now });
assert(stale.health === 'watch', 'Stale but otherwise healthy snapshots must produce watch state.');
assert(stale.actions.some(action => action.type === 'stale-snapshots'), 'Stale snapshot action is required.');

for (const result of [healthy, drift, missing, localWork, repair, researchDeficit, coveragePressure, stale]) {
  const priorities = result.actions.map(action => action.priority);
  assert(priorities.every((value,index) => index === 0 || priorities[index - 1] >= value), 'Operations actions must always be sorted by descending priority.');
}

const [runtime, multiSource, ui, bootstrap, router, sidebar] = await Promise.all([
  import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href),
  import(pathToFileURL(resolve('studio/multi-source-index.js')).href),
  readFile('studio/operations-ui.js','utf8'),
  readFile('studio/operations-bootstrap.js','utf8'),
  readFile('studio/workspace-router.js','utf8'),
  readFile('studio/sidebar.js','utf8')
]);
const unifiedCurated = new Set([...runtime.CASE_INTELLIGENCE.map(item=>item.id), ...multiSource.MULTI_SOURCE_CASES.map(item=>item.id)]);
assert(unifiedCurated.size === 100, `Command Center must share the current exact-100 curated baseline; got ${unifiedCurated.size}.`);

for (const snapshot of ['case-candidates.json','case-review-queue.json','coverage-plan.json','source-health.json']) {
  assert(ui.includes(`./${snapshot}`), `Operations UI must load ${snapshot}.`);
}
for (const prefix of ['porterDeepReviewDraft:','porterDeepReviewMediaEvidence:','porterPromotionEditorial:']) {
  assert(ui.includes(prefix), `Operations UI must monitor local work prefix ${prefix}.`);
}
assert(ui.includes('data-case-view="operations"'), 'Operations UI must inject an Operations nav route.');
assert(ui.includes('data-ops-action'), 'Operations UI must render executable prioritized actions.');
assert(ui.includes('data-ops-review'), 'Operations UI must support direct Deep Review candidate routing.');
assert(!ui.includes('#digestGrid') && !ui.includes('digestGrid'), 'Operations UI must never query/mutate the curated card grid.');
assert(!ui.includes('INDUSTRY_DIGEST.push') && !ui.includes('MULTI_SOURCE_CASES.push'), 'Operations UI must never mutate curated datasets.');
assert(bootstrap.includes("link.href = './operations.css'"), 'Operations bootstrap must load its stylesheet.');
assert(bootstrap.includes("await import('./operations-ui.js')"), 'Operations bootstrap must lazy-mount UI.');
assert(router.includes("operations: 'operationsView'"), 'Central workspace router must route Operations.');
const routerIndex = sidebar.indexOf("import './workspace-router.js';");
const opsIndex = sidebar.indexOf("import './operations-bootstrap.js';");
assert(routerIndex >= 0 && opsIndex > routerIndex, 'Operations must mount after the central workspace router.');

if (failures.length) {
  console.error('Operations Command Center contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok:true,
  unifiedCuratedCases:unifiedCurated.size,
  healthyState:healthy.health,
  curatedDriftState:drift.health,
  localReviewPriority:reviewAction?.priority,
  sourceRepairPriority:repair.actions.find(action=>action.type==='source-repair')?.priority,
  staleState:stale.health,
  autoCuratedMutation:false
},null,2));
