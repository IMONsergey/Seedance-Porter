#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const [ui, bootstrap, sidebar, schema] = await Promise.all([
  readFile('studio/deep-review-ui.js', 'utf8'),
  readFile('studio/deep-review-bootstrap.js', 'utf8'),
  readFile('studio/sidebar.js', 'utf8'),
  readFile('schemas/case-review.schema.json', 'utf8')
]);

const failures = [];
const requireText = (source, token, message) => {
  if (!source.includes(token)) failures.push(message);
};
const requireMatch = (source, pattern, message) => {
  if (!pattern.test(source)) failures.push(message);
};

requireText(ui, "fetchJson('./case-review-queue.json')", 'Workspace must load the generated deep-review queue');
requireText(ui, "fetchJson('./case-candidates.json')", 'Workspace must load candidate metadata');
requireText(ui, "const STORAGE_PREFIX = 'porterDeepReviewDraft:'", 'Workspace must isolate local draft storage');
requireText(ui, 'localStorage.setItem', 'Workspace must autosave drafts locally');
requireText(ui, 'localStorage.getItem', 'Workspace must restore local drafts');
requireText(ui, 'completeVideoWatched', 'Workspace must require full-video viewing attestation');
requireText(ui, 'sourceVideoUrl', 'Workspace must record the full source video URL');
requireText(ui, 'observedShots', 'Workspace must capture observed shots');
requireText(ui, 'observedTransitions', 'Workspace must capture observed transitions');
requireText(ui, 'observedMotion', 'Workspace must capture observed motion');
requireText(ui, 'observedArtifacts', 'Workspace must capture observed artifacts');
requireText(ui, 'observedContinuity', 'Workspace must capture continuity');
requireText(ui, 'verifiedSignatureMove', 'Workspace must verify the signature move from observed evidence');
requireText(ui, 'whyItWorked', 'Workspace must record observed reasons the output works');
requireText(ui, 'doTransfer', 'Workspace must extract transferable mechanics');
requireText(ui, 'doNotTransfer', 'Workspace must explicitly separate source-specific material');
requireText(ui, 'navigator.clipboard.writeText', 'Workspace must support copying completed review JSON');
requireText(ui, 'new Blob', 'Workspace must support exporting completed review JSON');
requireText(ui, "reviewStatus: 'draft'", 'Local workspace state must remain draft before evidence completion');

const deepStatusAssignments = [...ui.matchAll(/reviewStatus:\s*['"]deep-reviewed['"]/g)].length;
if (deepStatusAssignments !== 1) {
  failures.push(`reviewStatus deep-reviewed must be assigned in exactly one gated finalization path; found ${deepStatusAssignments}`);
}
requireMatch(ui, /function buildFinalReview\(draft\)[\s\S]*?const validation = validateDraft\(draft\);[\s\S]*?if \(!validation\.ok\) throw new Error/, 'Final deep-reviewed JSON must be blocked by validateDraft');
requireMatch(ui, /requireCheck\(draft\.evidenceAttestation\?\.completeVideoWatched/, 'Evidence gate must explicitly require complete-video viewing');
requireMatch(ui, /observedShots\.every\(shot => shot\.observedFraming && shot\.observedCamera && shot\.observedAction/, 'Every observed shot must require framing, camera and action evidence');
requireMatch(ui, /\['strong','partial','weak','invented'\]\.includes\(shot\.promptMatch\)/, 'Every observed shot must compare output behavior against the prompt');
requireMatch(ui, /copy\.disabled = !validation\.ok/, 'Copy action must remain disabled until evidence gate passes');
requireMatch(ui, /exportButton\.disabled = !validation\.ok/, 'Export action must remain disabled until evidence gate passes');

if (ui.includes('#digestGrid') || ui.includes('MULTI_SOURCE_CASES') || ui.includes('mountCaseBatch')) {
  failures.push('Deep Review Workspace must remain isolated from the curated Digest renderer');
}
if (/fetch\([^)]*api\.github|github\.com\/repos/i.test(ui)) {
  failures.push('Static Deep Review Workspace must not silently write review state to GitHub');
}

requireText(bootstrap, "await import('./deep-review-ui.js')", 'Deep Review bootstrap must load the workspace runtime');
requireText(bootstrap, "link.href = './deep-review.css'", 'Deep Review bootstrap must load isolated workspace styles');
requireText(sidebar, "import './deep-review-bootstrap.js';", 'Sidebar shell must mount Deep Review Workspace');

const parsedSchema = JSON.parse(schema);
const requiredTop = new Set(parsedSchema.required || []);
for (const key of ['candidateId','reviewStatus','reviewedAt','sourceVideoUrl','evidenceAttestation','promptAnatomy','visualReview','transfer']) {
  if (!requiredTop.has(key)) failures.push(`Deep-review schema must require top-level field: ${key}`);
}
if (parsedSchema.properties?.reviewStatus?.const !== 'deep-reviewed') failures.push('Schema reviewStatus must be const deep-reviewed');
if (parsedSchema.properties?.evidenceAttestation?.properties?.completeVideoWatched?.const !== true) failures.push('Schema must require completeVideoWatched=true');
if (parsedSchema.properties?.evidenceAttestation?.properties?.method?.const !== 'manual-complete-video-review') failures.push('Schema must preserve manual complete-video review provenance');
if ((parsedSchema.properties?.visualReview?.properties?.whyItWorked?.minItems || 0) < 2) failures.push('Schema must require at least two observed reasons why the result works');
if ((parsedSchema.properties?.visualReview?.properties?.observedMotion?.minItems || 0) < 1) failures.push('Schema must require observed motion evidence');
if ((parsedSchema.properties?.visualReview?.properties?.observedContinuity?.minItems || 0) < 1) failures.push('Schema must require observed continuity evidence');

for (const phrase of ['Я просмотрел полное исходное видео', 'Наблюдаемый визуальный разбор', 'Переносимый production-паттерн']) {
  if (!ui.includes(phrase)) failures.push(`Russian Deep Review UI copy missing: ${phrase}`);
}
for (const phrase of ['I watched the complete source video', 'Observed visual review', 'Transferable production pattern']) {
  if (!ui.includes(phrase)) failures.push(`English Deep Review UI copy missing: ${phrase}`);
}

if (failures.length) {
  console.error('Deep Review Workspace contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  stateBeforeCompletion: 'draft',
  completionGate: 'manual complete-video review + structured observed evidence',
  finalStatus: 'deep-reviewed',
  localAutosave: true,
  copyExport: true,
  writesToCuratedDigest: false,
  writesToGitHub: false,
  bilingual: true
}, null, 2));
