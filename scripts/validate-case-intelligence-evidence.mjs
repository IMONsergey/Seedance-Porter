#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { CURATED_CASE_ANALYSIS } from '../studio/case-analysis-curated.js';

const [caseUi, locales, i18n] = await Promise.all([
  readFile('studio/case-ui.js', 'utf8'),
  readFile('studio/case-intelligence-locales.js', 'utf8'),
  readFile('studio/i18n.js', 'utf8')
]);

const failures = [];
const originalIds = CASE_INTELLIGENCE.map(item => item.id);
const overlayIds = Object.keys(CURATED_CASE_ANALYSIS);

if (CASE_INTELLIGENCE.length !== 24) {
  failures.push(`Expected 24 original attributed Digest cases in the evidence overlay runtime, got ${CASE_INTELLIGENCE.length}. If the base Digest grows, add bespoke analysis before changing this invariant.`);
}

const missingOverlays = originalIds.filter(id => !CURATED_CASE_ANALYSIS[id]);
const orphanOverlays = overlayIds.filter(id => !originalIds.includes(id));
if (missingOverlays.length) failures.push(`Missing bespoke analysis overlays: ${missingOverlays.join(', ')}`);
if (orphanOverlays.length) failures.push(`Analysis overlays reference unknown Digest IDs: ${orphanOverlays.join(', ')}`);

for (const item of CASE_INTELLIGENCE) {
  const intel = item.intelligence || {};
  const prefix = item.id;

  if (intel.reviewStatus !== 'prompt-reviewed') {
    failures.push(`${prefix}: must remain prompt-reviewed until a complete-video review record exists; got ${intel.reviewStatus}`);
  }
  if (intel.evidence?.prompt !== 'reviewed') failures.push(`${prefix}: prompt evidence must be reviewed`);
  if (intel.evidence?.fullVideo !== 'pending-visual-review') {
    failures.push(`${prefix}: fullVideo must remain pending-visual-review; got ${intel.evidence?.fullVideo}`);
  }
  if (!String(intel.evidence?.note || '').toLowerCase().includes('does not claim')) {
    failures.push(`${prefix}: evidence note must explicitly avoid unobserved full-video claims`);
  }
  if (!Array.isArray(intel.causalMechanics) || intel.causalMechanics.length < 2) {
    failures.push(`${prefix}: needs at least 2 causal mechanics`);
  }
  if (!Array.isArray(intel.motionLanguage) || intel.motionLanguage.length < 1) {
    failures.push(`${prefix}: needs motionLanguage`);
  }
  if (!Array.isArray(intel.shotBreakdown) || intel.shotBreakdown.length < 1) {
    failures.push(`${prefix}: needs shotBreakdown`);
  }
  if (String(intel.signatureMove || '').trim().length < 20) failures.push(`${prefix}: signatureMove is too shallow`);
  if (String(intel.rhythm || '').trim().length < 8) failures.push(`${prefix}: rhythm is missing or too shallow`);
  if (!Array.isArray(intel.referenceStrategy) || String(intel.referenceStrategy[0] || '').trim().length < 20) {
    failures.push(`${prefix}: needs a concrete reference strategy`);
  }
  if (String(intel.transferablePattern || '').trim().split(/\s+/).length < 10) {
    failures.push(`${prefix}: transferablePattern must contain enough reusable production logic`);
  }

  for (const shot of intel.shotBreakdown || []) {
    if (!shot.camera || !shot.action || !shot.whyThisShotExists || !shot.continuity) {
      failures.push(`${prefix}: every shot needs camera, action, reason and continuity`);
      break;
    }
  }
}

const requiredUiTokens = [
  'exactLocks',
  'referenceUrls',
  'referenceRole',
  'faceSource',
  "'reference-to-video'",
  "'image-to-video'",
  "'text-to-video'",
  "generatedLogo: referenceRole === 'logo'",
  "reviewStatus: intelligence.reviewStatus",
  'data-review-status'
];
for (const token of requiredUiTokens) {
  if (!caseUi.includes(token)) failures.push(`Pattern Adapter / evidence UI contract missing: ${token}`);
}

const requiredLocaleTokens = [
  'case.whyPrompt',
  'case.promptReviewed',
  'case.deepReviewed',
  'case.evidenceBoundary',
  'case.causalMechanics',
  'case.motionLanguage',
  'case.exactLocks',
  'case.referenceUrls',
  'case.referenceRole',
  'case.faceSource'
];
for (const token of requiredLocaleTokens) {
  if (!i18n.includes(`'${token}'`)) failures.push(`i18n missing ${token}`);
}

if (!locales.includes("window.addEventListener('porter-language-change'")) {
  failures.push('Advanced Case Intelligence localization must react to the shared language switch');
}
if (!locales.includes('[data-review-status]')) {
  failures.push('Advanced localization must distinguish prompt-reviewed and deep-reviewed status');
}

if (!/const deep = intel\.reviewStatus === ['"]deep-reviewed['"]/.test(caseUi)) {
  failures.push('Drawer must gate observed-video language on reviewStatus === deep-reviewed');
}
if (!/deep \? ['"]Why this video works['"] : ['"]Why this prompt is structured this way['"]/.test(caseUi)) {
  failures.push('Prompt-reviewed cases must not be titled as observed “Why this video works” analysis');
}

if (failures.length) {
  console.error('Evidence-aware Case Intelligence contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  originalDigestCases: CASE_INTELLIGENCE.length,
  bespokeOverlays: overlayIds.length,
  reviewStatus: 'prompt-reviewed',
  fullVideoEvidence: 'pending-visual-review',
  adapter: {
    exactLocks: true,
    referenceUrls: true,
    referenceRoles: true,
    faceProvenance: true,
    structuredPorterProject: true
  },
  bilingualAdvancedUi: true
}, null, 2));
