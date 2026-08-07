#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join, normalize, posix } from 'node:path';

const WORKFLOW_PATH = '.github/workflows/pages.yml';
const workflow = await readFile(WORKFLOW_PATH, 'utf8');
const html = await readFile('studio/library.html', 'utf8');
const failures = [];

const copied = new Set(
  [...workflow.matchAll(/cp\s+studio\/([^\s]+)\s+_site\/([^\s]+)/g)]
    .map(match => ({ source: match[1], target: match[2] }))
    .filter(item => item.source === item.target)
    .map(item => item.source)
);

function fail(message) { failures.push(message); }

const htmlAssets = [
  ...[...html.matchAll(/href=["']\/([^"']+\.(?:css))["']/g)].map(match => match[1]),
  ...[...html.matchAll(/src=["']\/([^"']+\.(?:js))["']/g)].map(match => match[1])
];

for (const asset of htmlAssets) {
  if (!copied.has(asset)) fail(`Pages workflow does not copy root HTML asset: ${asset}`);
  const absolute = asset.endsWith('.css') ? `href="/${asset}"` : `src="/${asset}"`;
  const relative = asset.endsWith('.css') ? `href="./${asset}"` : `src="./${asset}"`;
  const sedToken = `s|${absolute}|${relative}|g`;
  if (!workflow.includes(sedToken)) fail(`Pages workflow does not rewrite Project Pages path for ${asset}`);
}

const visited = new Set();
const roots = ['library.js', 'sidebar.js', 'case-ui.js'];

async function visit(modulePath, parent = null) {
  const clean = normalize(modulePath).replace(/\\/g, '/').replace(/^\.\//, '');
  if (visited.has(clean)) return;
  visited.add(clean);
  if (!copied.has(clean)) fail(`Pages workflow does not copy browser module${parent ? ` imported by ${parent}` : ''}: ${clean}`);

  let source;
  try { source = await readFile(join('studio', clean), 'utf8'); }
  catch { fail(`Browser module is referenced but missing from studio/: ${clean}`); return; }

  const staticImports = [...source.matchAll(/(?:import\s+(?:[^'";]*?\s+from\s+)?|export\s+[^'";]*?\s+from\s+)["'](\.\.?\/[^"']+)["']/g)].map(match => match[1]);
  const sideEffectImports = [...source.matchAll(/import\s*["'](\.\.?\/[^"']+)["']/g)].map(match => match[1]);
  const dynamicImports = [...source.matchAll(/import\(\s*["'](\.\.?\/[^"']+)["']\s*\)/g)].map(match => match[1]);
  const imports = [...new Set([...staticImports, ...sideEffectImports, ...dynamicImports])];
  for (const specifier of imports) {
    const resolved = posix.normalize(posix.join(posix.dirname(clean), specifier));
    if (resolved.endsWith('.js')) await visit(resolved, clean);
  }
}

for (const root of roots) await visit(root);

for (const required of [
  'workspace-router.js',
  'case-corpus-ui.js','case-corpus.css',
  'deep-review-bootstrap.js','deep-review-ui.js','deep-review.css',
  'promotion-bootstrap.js','promotion-engine.js','promotion-ui.js','promotion.css',
  'coverage-planner-bootstrap.js','coverage-planner-engine.js','coverage-planner-ui.js','coverage-planner.css',
  'source-health-bootstrap.js','source-health-ui.js','source-health.css',
  'unified-curated-ui.js','multi-source-index.js'
]) {
  if (!copied.has(required)) fail(`Critical production asset missing from Pages artifact: ${required}`);
}

if (!workflow.includes('npm run case:refresh')) fail('Pages build must attempt the full research operations refresh');
if (!workflow.includes('continue-on-error: true')) fail('External research generation must not take the curated live site down when an upstream source is unavailable');

const snapshotLoop = 'for snapshot in case-candidates.json case-review-queue.json coverage-plan.json source-health.json; do';
if (!workflow.includes(snapshotLoop)) fail('Pages workflow must publish candidates, strategic queue, coverage plan and source-health snapshots when generated');

for (const validator of [
  'validate-deep-review-workspace.mjs',
  'validate-promotion-workspace.mjs',
  'validate-coverage-planner.mjs',
  'validate-source-adapters.mjs'
]) {
  if (!workflow.includes(`node scripts/${validator}`)) fail(`Pages build must run ${validator} before deployment`);
}

if (failures.length) {
  console.error('GitHub Pages production contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  copiedAssets: copied.size,
  browserModulesInGraph: visited.size,
  htmlAssets,
  roots,
  researchSnapshotBuild: 'best-effort',
  deepReviewWorkspace: 'validated-and-published',
  promotionWorkspace: 'validated-and-published',
  coveragePlanner: 'validated-and-published',
  sourceAdapterHealth: 'validated-and-published',
  workspaceRouter: 'production-critical',
  machineReadableSnapshots: ['case-candidates.json','case-review-queue.json','coverage-plan.json','source-health.json'],
  autoCuratedDigestMutation: false,
  curatedSiteFailureMode: 'deploy remains available if external research generation fails'
}, null, 2));
