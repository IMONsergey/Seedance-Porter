export const FINAL_EVIDENCE_PACKAGE_KIND = 'seedance-porter-final-evidence-package';
export const FINAL_EVIDENCE_PACKAGE_VERSION = 1;

export async function buildFinalEvidencePackage(input) {
  const deepReview = cloneJson(input?.deepReview || {});
  const candidateId = String(deepReview.candidateId || input?.candidate?.id || '').trim();
  const candidate = sanitizeCandidate(input?.candidate || {}, candidateId);
  const mediaEvidence = input?.mediaEvidence ? cloneJson(input.mediaEvidence) : null;

  const preflight = validateFinalEvidenceInputs({ candidate, deepReview, mediaEvidence });
  if (!preflight.ok) throw new Error(preflight.errors.join('; '));

  const components = {
    candidate: await hashJson(candidate),
    deepReview: await hashJson(deepReview),
    ...(mediaEvidence ? { mediaEvidence: await hashJson(mediaEvidence) } : {})
  };

  const packageCore = {
    schemaVersion: FINAL_EVIDENCE_PACKAGE_VERSION,
    kind: FINAL_EVIDENCE_PACKAGE_KIND,
    candidateId,
    createdAt: new Date(input?.createdAt || Date.now()).toISOString(),
    source: {
      app: 'Seedance Porter',
      purpose: 'final-evidence-handoff',
      autoCurate: false,
      autoPublish: false,
      autoGitHubWrite: false
    },
    candidate,
    deepReview,
    mediaEvidence,
    evidenceState: {
      reviewStatus: 'deep-reviewed',
      completeVideoWatched: true,
      reviewMethod: deepReview.evidenceAttestation.method,
      reviewedAt: deepReview.reviewedAt,
      attestedAt: deepReview.evidenceAttestation.attestedAt
    },
    integrity: {
      algorithm: 'SHA-256',
      canonicalization: 'stable-json-v1',
      components
    },
    packageBoundary: 'This package proves transport integrity and binds final Deep Review evidence to candidate/source metadata. It does not approve rights, clear risk flags, create a curated case, publish content, or mutate GitHub.'
  };

  const packageHash = await hashJson(packageCore);
  return {
    ...packageCore,
    integrity: {
      ...packageCore.integrity,
      packageHash
    }
  };
}

export async function verifyFinalEvidencePackage(value) {
  const errors = [];
  const warnings = [];
  const pkg = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  if (!pkg) return result(false, ['Package must be a JSON object.'], warnings, null);
  if (pkg.kind !== FINAL_EVIDENCE_PACKAGE_KIND) errors.push(`kind must equal ${FINAL_EVIDENCE_PACKAGE_KIND}`);
  if (Number(pkg.schemaVersion) !== FINAL_EVIDENCE_PACKAGE_VERSION) errors.push(`schemaVersion must equal ${FINAL_EVIDENCE_PACKAGE_VERSION}`);
  const inputValidation = validateFinalEvidenceInputs({ candidate:pkg.candidate, deepReview:pkg.deepReview, mediaEvidence:pkg.mediaEvidence });
  errors.push(...inputValidation.errors);
  warnings.push(...inputValidation.warnings);
  if (String(pkg.candidateId || '') !== String(pkg.deepReview?.candidateId || '')) errors.push('Package candidateId must match deepReview candidateId.');
  if (pkg.candidate?.id && String(pkg.candidate.id) !== String(pkg.candidateId || '')) errors.push('Candidate metadata ID must match package candidateId.');
  if (pkg.source?.autoCurate !== false || pkg.source?.autoPublish !== false || pkg.source?.autoGitHubWrite !== false) errors.push('Package source policy must explicitly disable autoCurate, autoPublish and autoGitHubWrite.');
  if (pkg.evidenceState?.reviewStatus !== 'deep-reviewed' || pkg.evidenceState?.completeVideoWatched !== true) errors.push('Package evidenceState must preserve final Deep Review evidence state.');
  if (pkg.integrity?.algorithm !== 'SHA-256' || pkg.integrity?.canonicalization !== 'stable-json-v1') errors.push('Unsupported or missing integrity metadata.');

  if (!errors.length) {
    const expectedCandidate = await hashJson(pkg.candidate);
    const expectedReview = await hashJson(pkg.deepReview);
    const expectedMedia = pkg.mediaEvidence ? await hashJson(pkg.mediaEvidence) : null;
    if (pkg.integrity?.components?.candidate !== expectedCandidate) errors.push('Candidate integrity hash mismatch.');
    if (pkg.integrity?.components?.deepReview !== expectedReview) errors.push('Deep Review integrity hash mismatch.');
    if (pkg.mediaEvidence && pkg.integrity?.components?.mediaEvidence !== expectedMedia) errors.push('Media evidence integrity hash mismatch.');
    if (!pkg.mediaEvidence && pkg.integrity?.components?.mediaEvidence) errors.push('Integrity metadata contains mediaEvidence hash without mediaEvidence component.');

    const core = cloneJson(pkg);
    const claimedHash = core.integrity?.packageHash;
    if (core.integrity) delete core.integrity.packageHash;
    const expectedPackage = await hashJson(core);
    if (claimedHash !== expectedPackage) errors.push('Package integrity hash mismatch.');
  }

  if ((pkg.candidate?.riskFlags || []).length) warnings.push(`Candidate carries research risk flags: ${(pkg.candidate.riskFlags || []).join(', ')}`);
  if (!pkg.mediaEvidence) warnings.push('No Review Player companion media evidence is attached. This is allowed; formal Deep Review remains authoritative.');
  return result(errors.length === 0, errors, warnings, pkg.candidateId || null);
}

export function validateFinalEvidenceInputs({ candidate, deepReview, mediaEvidence }) {
  const errors = [];
  const warnings = [];
  const review = deepReview && typeof deepReview === 'object' && !Array.isArray(deepReview) ? deepReview : {};
  const candidateId = String(review.candidateId || candidate?.id || '').trim();
  if (!candidateId) errors.push('Final Deep Review must contain candidateId.');
  if (String(review.reviewStatus || '') !== 'deep-reviewed') errors.push('Final evidence package requires reviewStatus=deep-reviewed.');
  if (!isIsoDate(review.reviewedAt)) errors.push('Final Deep Review requires reviewedAt timestamp.');
  if (!isAbsoluteUrl(review.sourceVideoUrl)) errors.push('Final Deep Review requires an absolute sourceVideoUrl/source URL.');
  if (review.evidenceAttestation?.completeVideoWatched !== true) errors.push('Final Deep Review requires evidenceAttestation.completeVideoWatched=true.');
  if (review.evidenceAttestation?.method !== 'manual-complete-video-review') errors.push('Final Deep Review requires manual-complete-video-review attestation method.');
  if (!isIsoDate(review.evidenceAttestation?.attestedAt)) errors.push('Final Deep Review requires evidence attestation timestamp.');

  validatePromptAnatomy(review.promptAnatomy, errors);
  validateVisualReview(review.visualReview, errors);
  validateTransfer(review.transfer, errors);

  if (candidate?.id && String(candidate.id) !== candidateId) errors.push('Candidate metadata ID does not match Deep Review candidateId.');
  if (!candidate?.sourceUrl && !candidate?.archiveUrl && !review.sourceVideoUrl) warnings.push('No independent candidate/source provenance URL is available beyond the review source URL.');

  if (mediaEvidence != null) {
    const media = mediaEvidence && typeof mediaEvidence === 'object' && !Array.isArray(mediaEvidence) ? mediaEvidence : {};
    if (media.kind !== 'seedance-porter-review-media-evidence') errors.push('Attached media evidence kind is invalid.');
    if (String(media.candidateId || '') !== candidateId) errors.push('Attached media evidence candidateId does not match Deep Review.');
    const coverage = Number(media.playback?.coveragePercent || 0);
    if (!Number.isFinite(coverage) || coverage < 0 || coverage > 100) errors.push('Attached media evidence playback coverage must be between 0 and 100.');
    if (!Array.isArray(media.markers)) errors.push('Attached media evidence markers must be an array.');
    if (media.evidenceAttestation?.completeVideoWatched === true || media.completeVideoWatched === true) errors.push('Companion media evidence must not carry complete-video attestation.');
  }

  return result(errors.length === 0, errors, warnings, candidateId || null);
}

function validatePromptAnatomy(value, errors) {
  const data = value && typeof value === 'object' ? value : {};
  if (String(data.thesis || '').trim().length < 20) errors.push('promptAnatomy.thesis is too short.');
  if (String(data.signatureMove || '').trim().length < 10) errors.push('promptAnatomy.signatureMove is too short.');
  if (!Array.isArray(data.shotBreakdown) || !data.shotBreakdown.length) errors.push('promptAnatomy.shotBreakdown requires at least one item.');
  if (!Array.isArray(data.causalMechanics) || data.causalMechanics.length < 2) errors.push('promptAnatomy.causalMechanics requires at least two items.');
  if (!String(data.referenceStrategy || '').trim()) errors.push('promptAnatomy.referenceStrategy is required.');
  if (!Array.isArray(data.motionLanguage) || !data.motionLanguage.length) errors.push('promptAnatomy.motionLanguage requires at least one item.');
  if (!Array.isArray(data.failureRisks) || data.failureRisks.length < 2) errors.push('promptAnatomy.failureRisks requires at least two items.');
}

function validateVisualReview(value, errors) {
  const data = value && typeof value === 'object' ? value : {};
  if (!Array.isArray(data.observedShots) || !data.observedShots.length) errors.push('visualReview.observedShots requires at least one observed shot.');
  for (const [index, shot] of (data.observedShots || []).entries()) {
    for (const key of ['observedFraming','observedCamera','observedAction','attentionMechanic']) if (!String(shot?.[key] || '').trim()) errors.push(`visualReview.observedShots[${index}].${key} is required.`);
    if (!['strong','partial','weak','invented'].includes(String(shot?.promptMatch || ''))) errors.push(`visualReview.observedShots[${index}].promptMatch is invalid.`);
  }
  for (const key of ['observedTransitions','observedMotion','observedArtifacts','observedContinuity']) if (!Array.isArray(data[key]) || !data[key].length) errors.push(`visualReview.${key} requires at least one explicit observation (including none-observed statements).`);
  if (String(data.verifiedSignatureMove || '').trim().length < 10) errors.push('visualReview.verifiedSignatureMove is too short.');
  if (!Array.isArray(data.whyItWorked) || data.whyItWorked.length < 2) errors.push('visualReview.whyItWorked requires at least two observed reasons.');
}

function validateTransfer(value, errors) {
  const data = value && typeof value === 'object' ? value : {};
  if (String(data.transferablePattern || '').trim().length < 20) errors.push('transfer.transferablePattern is too short.');
  if (!Array.isArray(data.doTransfer) || !data.doTransfer.length) errors.push('transfer.doTransfer requires at least one item.');
  if (!Array.isArray(data.doNotTransfer) || !data.doNotTransfer.length) errors.push('transfer.doNotTransfer requires at least one item.');
}

function sanitizeCandidate(value, candidateId) {
  return {
    id: String(candidateId || value?.id || ''),
    title: String(value?.title || ''),
    author: String(value?.author || ''),
    authorUrl: String(value?.authorUrl || ''),
    sourcePool: String(value?.sourcePool || ''),
    sourcePoolLabel: String(value?.sourcePoolLabel || ''),
    sourceUrl: String(value?.sourceUrl || ''),
    archiveUrl: String(value?.archiveUrl || ''),
    previewUrl: String(value?.previewUrl || ''),
    sourceVideoUrl: String(value?.sourceVideoUrl || ''),
    collections: uniqueStrings(value?.collections || []),
    riskFlags: uniqueStrings(value?.riskFlags || []),
    score: numberOr(value?.score, 0),
    sourceTraceability: numberOr(value?.metrics?.sourceTraceability ?? value?.sourceTraceability, 0)
  };
}

export async function hashJson(value) {
  const bytes = new TextEncoder().encode(stableStringify(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]));
  return value;
}

function result(ok, errors, warnings, candidateId) { return { ok, errors, warnings, candidateId }; }
function cloneJson(value) { return JSON.parse(JSON.stringify(value)); }
function uniqueStrings(values) { return [...new Set((Array.isArray(values) ? values : []).map(value => String(value || '').trim()).filter(Boolean))]; }
function isIsoDate(value) { const date = new Date(value); return Boolean(value) && !Number.isNaN(date.getTime()); }
function isAbsoluteUrl(value) { try { const url = new URL(String(value || '')); return ['http:','https:'].includes(url.protocol); } catch { return false; } }
function numberOr(value, fallback) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
