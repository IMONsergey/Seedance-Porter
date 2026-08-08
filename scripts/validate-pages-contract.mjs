#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { join, normalize, posix } from 'node:path';
import {
  workflowPublishesStudioAsset,
  workflowPublishesResearchSnapshots,
  workflowRunsValidator,
  workflowUsesBulkStudioPublication
} from './pages-publish-policy.mjs';

const WORKFLOW_PATH = '.github/workflows/pages.yml';
const workflow = await readFile(WORKFLOW_PATH, 'utf8');
const html = await readFile('studio/library.html', 'utf8');
const failures = [];
const fail = message => failures.push(message);

if (!workflowUsesBulkStudioPublication(workflow)) {
  fail('Pages workflow must bulk-publish top-level Studio JS and CSS assets.');
}

const htmlAssets = [
  ...[...html.matchAll(/href=["']\/([^"']+\.css)["']/g)].map(match => match[1]),
  ...[...html.matchAll(/src=["']\/([^"']+\.js)["']/g)].map(match => match[1])
];

for (const asset of htmlAssets) {
  if (!workflowPublishesStudioAsset(workflow, asset)) fail(`Pages workflow does not publish root HTML asset: ${asset}`);
  const absolute = asset.endsWith('.css') ? `href="/${asset}"` : `src="/${asset}"`;
  const relative = asset.endsWith('.css') ? `href="./${asset}"` : `src="./${asset}"`;
  if (!workflow.includes(`s|${absolute}|${relative}|g`)) fail(`Pages workflow does not rewrite Project Pages path for ${asset}`);
}

const roots = ['library.js', 'sidebar.js', 'case-ui.js'];
const visited = new Set();

async function visit(modulePath, parent = null) {
  const clean = normalize(modulePath).replace(/\\/g, '/').replace(/^\.\//, '');
  if (visited.has(clean)) return;
  visited.add(clean);
  if (!workflowPublishesStudioAsset(workflow, clean)) {
    fail(`Pages workflow does not publish browser module${parent ? ` imported by ${parent}` : ''}: ${clean}`);
  }

  let source;
  try {
    source = await readFile(join('studio', clean), 'utf8');
  } catch {
    fail(`Browser module is referenced but missing from studio/: ${clean}`);
    return;
  }

  const staticImports = [...source.matchAll(/(?:import\s+(?:[^'";]*?\s+from\s+)?|export\s+[^'";]*?\s+from\s+)["'](\.\.?\/[^"']+)["']/g)].map(match => match[1]);
  const sideEffectImports = [...source.matchAll(/import\s*["'](\.\.?\/[^"']+)["']/g)].map(match => match[1]);
  const dynamicImports = [...source.matchAll(/import\(\s*["'](\.\.?\/[^"']+)["']\s*\)/g)].map(match => match[1]);

  for (const specifier of [...new Set([...staticImports, ...sideEffectImports, ...dynamicImports])]) {
    const resolved = posix.normalize(posix.join(posix.dirname(clean), specifier));
    if (resolved.endsWith('.js')) await visit(resolved, clean);
  }
}

for (const root of roots) await visit(root);

const criticalAssets = [
  'workspace-router.js',
  'operations.css','operations-bootstrap.js','operations-engine.js','operations-ui.js',
  'prompt-studio.css','prompt-studio-bridge.css','prompt-studio-preview.css',
  'prompt-studio-bootstrap.js','prompt-studio-engine.js','prompt-studio-store.js','prompt-studio-assets.js','prompt-studio-asset-lifecycle.js','prompt-studio-ai.js','prompt-studio-source-catalog.js','prompt-studio-source-bridge.js','prompt-studio-reference-preview.js','prompt-studio-ui.js',
  'prompt-studio-rule-packs.css','prompt-studio-rule-packs-bootstrap.js','prompt-studio-profiles.js','prompt-studio-profile-panel.js',
  'prompt-studio-production-tools.css','prompt-studio-production-tools-bootstrap.js','prompt-studio-production-tools.js','prompt-studio-variable-key-guard.js','prompt-studio-ingredients.js','prompt-studio-timeline.js','prompt-studio-ingredient-library.js',
  'command-palette.css','command-palette-bootstrap.js','command-palette-engine.js','command-palette-ui.js',
  'workspace-bundle.css','workspace-bundle-bootstrap.js','workspace-bundle-engine.js','workspace-bundle-ui.js',
  'case-corpus-ui.js','case-corpus.css',
  'deep-review-bootstrap.js','deep-review-ui.js','deep-review.css',
  'deep-review-player-bootstrap.js','deep-review-player.js','deep-review-player.css',
  'promotion-bootstrap.js','promotion-engine.js','promotion-ui.js','promotion.css',
  'rotation-bootstrap.js','rotation-engine.js','rotation-ui.js','rotation.css',
  'coverage-planner-bootstrap.js','coverage-planner-engine.js','coverage-planner-ui.js','coverage-planner.css',
  'source-health-bootstrap.js','source-health-ui.js','source-health.css',
  'unified-curated-ui.js','multi-source-index.js'
];

for (const asset of criticalAssets) {
  try { await access(join('studio', asset)); }
  catch { fail(`Critical Studio asset is missing from source tree: ${asset}`); continue; }
  if (!workflowPublishesStudioAsset(workflow, asset)) fail(`Critical production asset is not published by Pages: ${asset}`);
}

if (!workflow.includes('npm run case:refresh')) fail('Pages build must attempt the full research operations refresh.');
if (!workflow.includes('continue-on-error: true')) fail('External research generation must not take the curated live site down when an upstream source is unavailable.');
if (!workflowPublishesResearchSnapshots(workflow)) fail('Pages workflow must publish candidates, strategic queue, coverage plan and source-health snapshots when generated.');
if (!workflow.includes('npm run validate:render')) fail('Pages build must run the protected exact-100 browser renderer before deploy.');

const validators = [
  'validate-deep-review-workspace.mjs',
  'validate-review-player.mjs',
  'validate-promotion-workspace.mjs',
  'validate-coverage-planner.mjs',
  'validate-source-adapters.mjs',
  'validate-operations-command-center.mjs',
  'validate-operations-production.mjs',
  'validate-command-palette.mjs',
  'validate-command-palette-production.mjs',
  'validate-workspace-bundles.mjs',
  'validate-workspace-bundles-production.mjs',
  'validate-rotation-planner.mjs',
  'validate-rotation-production.mjs',
  'validate-prompt-studio.mjs',
  'validate-prompt-studio-production.mjs',
  'validate-prompt-studio-v2-rule-packs.mjs',
  'validate-prompt-studio-v2-production.mjs',
  'validate-prompt-studio-production-tools.mjs',
  'validate-prompt-studio-ingredient-library.mjs',
  'validate-prompt-studio-v3-production.mjs'
];
for (const validator of validators) {
  if (!workflowRunsValidator(workflow, validator)) fail(`Pages build must run ${validator} before deployment.`);
}

for (const builtAsset of ['sidebar.js','prompt-studio-ui.js','prompt-studio.css','prompt-studio-rule-packs-bootstrap.js','prompt-studio-production-tools-bootstrap.js']) {
  if (!workflow.includes(`test -f _site/${builtAsset}`)) fail(`Pages preparation must assert built artifact exists: ${builtAsset}`);
}

if (failures.length) {
  console.error('GitHub Pages production contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok:true,
  publicationMode:'bulk top-level Studio JS/CSS',
  browserModulesInGraph:visited.size,
  criticalAssets:criticalAssets.length,
  htmlAssets,
  validators:validators.length,
  researchSnapshotBuild:'best-effort',
  machineReadableSnapshots:['case-candidates.json','case-review-queue.json','coverage-plan.json','source-health.json'],
  exact100Render:'predeploy-required',
  promptStudio:'v1+v2+v3 production-critical',
  curatedSiteFailureMode:'deploy remains available if external research generation fails'
},null,2));
