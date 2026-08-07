#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import {
  buildCuratedImplementationDraft,
  buildPromotionAnalysis,
  scoreCurationReadiness,
  validateDeepReviewRecord,
  validateEditorialGate
} from '../studio/promotion-engine.js';

const failures = [];
const fail = message => failures.push(message);
const assert = (condition, message) => { if (!condition) fail(message); };

const validReview = {
  candidateId: 'candidate-contract-test',
  reviewStatus: 'deep-reviewed',
  reviewedAt: '2026-08-07T17:00:00.000Z',
  sourceVideoUrl: 'https://example.com/video.mp4',
  evidenceAttestation: {
    completeVideoWatched: true,
    attestedAt: '2026-08-07T17:00:00.000Z',
    method: 'manual-complete-video-review'
  },
  promptAnatomy: {
    thesis: 'The requested sequence uses one visible physical cause to connect the product setup, motion event and final commercial endpoint.',
    signatureMove: 'Locked product geometry survives a single controlled material transformation.',
    shotBreakdown: [{ n: 1, requested: 'Establish product, transform material state, resolve to hero.' }],
    causalMechanics: [
      'A stable first composition gives the viewer a baseline before the transformation begins.',
      'One explicit trigger makes the resulting state change causally readable instead of decorative.'
    ],
    referenceStrategy: 'Use one exact product reference for geometry and one optional material-motion reference for behavior only.',
    motionLanguage: ['static establish', 'controlled material transition', 'slow hero push'],
    failureRisks: ['product silhouette may drift', 'material transition may introduce duplicate geometry']
  },
  visualReview: {
    observedShots: [
      {
        n: 1,
        observedFraming: 'three-quarter product medium',
        observedCamera: 'locked then slow push',
        observedAction: 'product remains fixed while one material state changes and settles',
        promptMatch: 'strong',
        attentionMechanic: 'the unchanged silhouette makes the material state change easy to inspect'
      },
      {
        n: 2,
        observedFraming: 'tight hero detail',
        observedCamera: 'slow push-in',
        observedAction: 'transformed material settles around the same product geometry',
        promptMatch: 'partial',
        attentionMechanic: 'motion decelerates into a stable endpoint suitable for branding in post'
      }
    ],
    observedTransitions: ['continuous state transition with no hard scene reset'],
    observedMotion: ['single controlled material transformation', 'restrained camera push'],
    observedArtifacts: [],
    observedContinuity: ['product silhouette and orientation remain stable across the complete clip'],
    verifiedSignatureMove: 'Stable product silhouette remains invariant while the material state transforms and resolves.',
    whyItWorked: [
      'The unchanged product geometry gives the viewer a strong continuity anchor during the transformation.',
      'The motion resolves into a calm hero frame instead of continuing to add unrelated visual events.'
    ],
    whatDidNotWork: []
  },
  transfer: {
    transferablePattern: 'Keep one exact commercial object invariant while a single surrounding material or environmental state changes causally around it, then resolve into a stable hero endpoint.',
    doTransfer: ['stable hero geometry as the continuity anchor', 'one explicit trigger and one dominant material state change'],
    doNotTransfer: ['the source product identity', 'source wording or branded graphics'],
    bestFor: ['packshot', 'beauty', 'electronics', 'website hero']
  }
};

const validCandidate = {
  id: 'candidate-contract-test',
  title: 'Contract Test Product Transformation',
  author: '@sourcecreator',
  authorUrl: 'https://example.com/creator',
  sourceUrl: 'https://example.com/source-post',
  archiveUrl: 'https://example.com/archive',
  previewUrl: 'https://example.com/preview.jpg',
  sourcePool: 'contract-source',
  sourcePoolLabel: 'Contract Source',
  license: 'Source-specific editorial verification required',
  published: '2026-08-01',
  excerpt: 'Short attributed candidate excerpt for the contract test.',
  score: 90,
  metrics: { sourceTraceability: 5, designCommercial: 5, motionSpecificity: 5, shotStructure: 4, referenceStrategy: 4 },
  collections: ['packshot', 'material'],
  riskFlags: []
};

const reviewValidation = validateDeepReviewRecord(validReview);
assert(reviewValidation.ok, `Valid deep-review fixture must pass: ${reviewValidation.blockers.join('; ')}`);

const readiness = scoreCurationReadiness(validReview, validCandidate);
assert(readiness.eligibleForEditorialReview, 'Valid review + candidate must be eligible for editorial review.');
assert(readiness.score >= 85, `High-quality evidence fixture should score >=85, got ${readiness.score}.`);
assert(readiness.tier === 'strong-editorial-candidate', `Expected strong-editorial-candidate, got ${readiness.tier}.`);

const analysis = buildPromotionAnalysis(validReview, validCandidate);
assert(analysis.kind === 'seedance-porter-curation-readiness', 'Promotion analysis kind must be stable.');
assert(analysis.evidence.attestation.completeVideoWatched === true, 'Promotion analysis must preserve full-video attestation.');
assert(analysis.adaptationBrief.constraints.some(value => /do not copy the source prompt wording/i.test(value)), 'Independent-adaptation constraint is required.');

const editorial = {
  attributionVerified: true,
  sourceRightsChecked: true,
  previewVerified: true,
  namedIpRiskCleared: true,
  independentAdaptationConfirmed: true,
  sourceWordingNotCopied: true,
  title: 'Material State Product Hero',
  titleRu: 'Продуктовый герой через смену материала',
  category: 'Product',
  subcategory: 'Material transformation',
  collections: ['Packshot', 'Material'],
  tags: ['packshot', 'material', 'hero'],
  whyItWorks: 'The final editorial rationale is grounded in observed continuity: one unchanged product silhouette lets the viewer read the surrounding state change clearly, and the motion settles into a commercially useful endpoint.',
  porterAdaptation: 'Use an exact reference of the new product and keep its silhouette, proportions, material identity and camera-facing orientation locked. Start from a quiet hero composition. Trigger one surrounding material-state transformation only, keep the product itself unchanged, then decelerate the transformation into a clean stable end frame for exact typography and branding in post.',
  notes: 'Contract fixture.'
};

const gate = validateEditorialGate(analysis, editorial);
assert(gate.ok, `Complete editorial gate must pass: ${gate.blockers.join('; ')}`);
const draft = buildCuratedImplementationDraft(analysis, editorial);
assert(draft.status === 'ready-for-curated-implementation', 'Final output must be an implementation draft, not an auto-curated record.');
assert(/not an automatic write to Industry Digest/i.test(draft.implementationNote), 'Implementation draft must explicitly forbid automatic Digest writes.');
assert(draft.curation.editorialChecks.sourceWordingNotCopied === true, 'Final draft must preserve the no-source-wording editorial confirmation.');

const riskyCandidate = { ...validCandidate, riskFlags: ['named-ip-or-celebrity'] };
const riskyReadiness = scoreCurationReadiness(validReview, riskyCandidate);
assert(!riskyReadiness.eligibleForEditorialReview, 'Named-IP/risk flags must hard-block editorial eligibility even with otherwise high score.');
assert(riskyReadiness.blockers.some(value => /risk flags/i.test(value)), 'Risk blocker must be visible in readiness output.');

const unattestedReview = {
  ...validReview,
  evidenceAttestation: { ...validReview.evidenceAttestation, completeVideoWatched: false }
};
const unattestedValidation = validateDeepReviewRecord(unattestedReview);
assert(!unattestedValidation.ok, 'A deep-review without complete-video attestation must fail validation.');
const unattestedReadiness = scoreCurationReadiness(unattestedReview, validCandidate);
assert(!unattestedReadiness.eligibleForEditorialReview, 'Missing full-video attestation must hard-block promotion.');

const incompleteEditorial = { ...editorial, sourceRightsChecked: false };
const incompleteGate = validateEditorialGate(analysis, incompleteEditorial);
assert(!incompleteGate.ok, 'Missing editorial confirmation must block curated implementation draft.');
let threw = false;
try {
  buildCuratedImplementationDraft(analysis, incompleteEditorial);
} catch {
  threw = true;
}
assert(threw, 'buildCuratedImplementationDraft must throw when editorial gate is incomplete.');

const [ui, bootstrap, schema, sidebar] = await Promise.all([
  readFile('studio/promotion-ui.js', 'utf8'),
  readFile('studio/promotion-bootstrap.js', 'utf8'),
  readFile('schemas/curation-draft.schema.json', 'utf8'),
  readFile('studio/sidebar.js', 'utf8')
]);

assert(sidebar.includes("import './promotion-bootstrap.js';"), 'Sidebar shell must mount Promotion Workspace.');
assert(bootstrap.includes("await import('./promotion-ui.js')"), 'Promotion bootstrap must lazy-mount Promotion UI.');
assert(bootstrap.includes("link.href = './promotion.css'"), 'Promotion bootstrap must load Promotion styles.');
assert(ui.includes("fetch('./case-candidates.json'"), 'Promotion UI must join review JSON to the current Research Corpus snapshot.');
assert(ui.includes('buildPromotionAnalysis'), 'Promotion UI must use the shared promotion analysis engine.');
assert(ui.includes('buildCuratedImplementationDraft'), 'Promotion UI must use the gated curated draft builder.');
assert(ui.includes('validateEditorialGate'), 'Promotion UI must show the real editorial gate state.');
assert(ui.includes('porterPromotionEditorial:'), 'Promotion editorial drafts must autosave locally per candidate.');
assert(ui.includes('No automatic curation') && ui.includes('Никакого автокурейта'), 'Promotion UI must state the no-auto-curation boundary in RU/EN.');
assert(!ui.includes('#digestGrid') && !ui.includes('digestGrid'), 'Promotion UI must never mutate or query the curated Digest grid.');
assert(!ui.includes('INDUSTRY_DIGEST.push') && !ui.includes('MULTI_SOURCE_CASES.push'), 'Promotion UI must never append directly to curated runtime datasets.');
assert(schema.includes('ready-for-curated-implementation'), 'Curation draft schema must require implementation-draft status.');
assert(schema.includes('sourceWordingNotCopied'), 'Curation draft schema must persist no-source-wording editorial evidence.');
assert(schema.includes('independentAdaptationConfirmed'), 'Curation draft schema must persist independent-adaptation confirmation.');

if (failures.length) {
  console.error('Promotion Workspace contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  validDeepReviewEligible: readiness.eligibleForEditorialReview,
  readinessScore: readiness.score,
  readinessTier: readiness.tier,
  riskFlagHardBlock: !riskyReadiness.eligibleForEditorialReview,
  attestationHardBlock: !unattestedReadiness.eligibleForEditorialReview,
  editorialGateRequired: true,
  autoDigestMutation: false
}, null, 2));
