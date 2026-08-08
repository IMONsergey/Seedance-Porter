#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { workflowPublishesStudioAsset, workflowRunsValidator } from './pages-publish-policy.mjs';

const [pages, sidebar, router, bootstrap, ui, engine] = await Promise.all([
  readFile('.github/workflows/pages.yml', 'utf8'),
  readFile('studio/sidebar.js', 'utf8'),
  readFile('studio/workspace-router.js', 'utf8'),
  readFile('studio/operations-bootstrap.js', 'utf8'),
  readFile('studio/operations-ui.js', 'utf8'),
  readFile('studio/operations-engine.js', 'utf8')
]);

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

for (const asset of ['operations.css','operations-bootstrap.js','operations-engine.js','operations-ui.js']) {
  assert(workflowPublishesStudioAsset(pages, asset), `Pages must publish ${asset}.`);
}
assert(workflowRunsValidator(pages,'validate-operations-command-center.mjs'), 'Pages must run Operations decision contract.');
assert(workflowRunsValidator(pages,'validate-operations-production.mjs'), 'Pages must run Operations production contract.');
assert(sidebar.includes("import './operations-bootstrap.js';"), 'Sidebar shell must mount Operations bootstrap.');
assert(router.includes("operations: 'operationsView'"), 'Central router must register Operations workspace.');
assert(bootstrap.includes("link.href = './operations.css'"), 'Operations bootstrap must load Operations CSS.');
assert(bootstrap.includes("await import('./operations-ui.js')"), 'Operations bootstrap must load Operations UI.');
assert(ui.includes("./case-candidates.json") && ui.includes("./case-review-queue.json") && ui.includes("./coverage-plan.json") && ui.includes("./source-health.json"), 'Operations must consume all four operational snapshots.');
assert(ui.includes('porterDeepReviewDraft:') && ui.includes('porterDeepReviewMediaEvidence:') && ui.includes('porterPromotionEditorial:'), 'Operations must monitor all local work namespaces.');
assert(!ui.includes("querySelector('#digestGrid')") && !ui.includes('CASE_INTELLIGENCE.push') && !ui.includes('MULTI_SOURCE_CASES.push'), 'Operations must not mutate or rebuild curated runtime.');
assert(engine.includes("status: 'critical'") || engine.includes("'critical'"), 'Operations engine must expose critical health state.');

const curated = [...CASE_INTELLIGENCE, ...MULTI_SOURCE_CASES];
assert(curated.length === 100, `Operations production contract must see exact 100 curated cases; got ${curated.length}.`);
assert(new Set(curated.map(item => item.id)).size === 100, 'Operations production contract requires 100 unique curated IDs.');

if (failures.length) {
  console.error('Operations production contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  curatedCases: curated.length,
  productionAssets: ['operations.css','operations-bootstrap.js','operations-engine.js','operations-ui.js'],
  snapshots: ['case-candidates.json','case-review-queue.json','coverage-plan.json','source-health.json'],
  localNamespaces: ['porterDeepReviewDraft:*','porterDeepReviewMediaEvidence:*','porterPromotionEditorial:*'],
  publicationPolicy:'shared',
  curatedMutation: false
}, null, 2));
