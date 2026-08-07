const UNKNOWN_AUTHOR = /^(?:unknown|community creator|source creator|attributed creator|attributed x creator)$/i;

export function validateDeepReviewRecord(review) {
  const blockers = [];
  const p = review?.promptAnatomy || {};
  const v = review?.visualReview || {};
  const t = review?.transfer || {};
  const attestation = review?.evidenceAttestation || {};

  if (!review || typeof review !== 'object') blockers.push('Review JSON is missing or invalid.');
  if (review?.reviewStatus !== 'deep-reviewed') blockers.push('reviewStatus must be deep-reviewed.');
  if (!review?.candidateId) blockers.push('candidateId is required.');
  if (!isHttpUrl(review?.sourceVideoUrl)) blockers.push('A valid full source video URL is required.');
  if (attestation.completeVideoWatched !== true) blockers.push('completeVideoWatched must be true.');
  if (attestation.method !== 'manual-complete-video-review') blockers.push('Evidence method must be manual-complete-video-review.');
  if (!attestation.attestedAt) blockers.push('Evidence attestation timestamp is required.');
  if (!review?.reviewedAt) blockers.push('reviewedAt is required.');

  if (String(p.thesis || '').length < 20) blockers.push('Prompt-analysis thesis is incomplete.');
  if (String(p.signatureMove || '').length < 10) blockers.push('Requested signature move is incomplete.');
  if (!Array.isArray(p.shotBreakdown) || p.shotBreakdown.length < 1) blockers.push('Prompt shot/beat breakdown is required.');
  if (!Array.isArray(p.causalMechanics) || p.causalMechanics.length < 2) blockers.push('At least two causal mechanics are required.');
  if (String(p.referenceStrategy || '').length < 5) blockers.push('Reference strategy is incomplete.');
  if (!Array.isArray(p.motionLanguage) || p.motionLanguage.length < 1) blockers.push('Requested motion language is required.');
  if (!Array.isArray(p.failureRisks) || p.failureRisks.length < 2) blockers.push('At least two failure risks are required.');

  if (!Array.isArray(v.observedShots) || v.observedShots.length < 1) blockers.push('Observed shots are required.');
  else if (!v.observedShots.every(validObservedShot)) blockers.push('Every observed shot needs framing, camera, action, prompt match and attention mechanic.');
  if (!Array.isArray(v.observedTransitions)) blockers.push('observedTransitions must be an array.');
  if (!Array.isArray(v.observedMotion) || v.observedMotion.length < 1) blockers.push('Observed motion is required.');
  if (!Array.isArray(v.observedArtifacts)) blockers.push('observedArtifacts must be an array.');
  if (!Array.isArray(v.observedContinuity) || v.observedContinuity.length < 1) blockers.push('Observed continuity is required.');
  if (String(v.verifiedSignatureMove || '').length < 10) blockers.push('Verified signature move is incomplete.');
  if (!Array.isArray(v.whyItWorked) || v.whyItWorked.length < 2) blockers.push('At least two observed reasons why it worked are required.');
  if (!Array.isArray(v.whatDidNotWork)) blockers.push('whatDidNotWork must be an array.');

  if (String(t.transferablePattern || '').length < 20) blockers.push('Transferable pattern is incomplete.');
  if (!Array.isArray(t.doTransfer) || t.doTransfer.length < 1) blockers.push('doTransfer is required.');
  if (!Array.isArray(t.doNotTransfer) || t.doNotTransfer.length < 1) blockers.push('doNotTransfer is required.');
  if (!Array.isArray(t.bestFor)) blockers.push('bestFor must be an array.');

  return { ok: blockers.length === 0, blockers };
}

export function scoreCurationReadiness(review, candidate) {
  const reviewValidation = validateDeepReviewRecord(review);
  const blockers = [...reviewValidation.blockers];
  const advisories = [];

  if (!candidate) blockers.push('Candidate metadata was not found in the current Research Corpus snapshot.');
  if (candidate?.riskFlags?.length) blockers.push(`Candidate has unresolved risk flags: ${candidate.riskFlags.join(', ')}`);
  if (!candidate?.sourceUrl) blockers.push('Candidate source URL is missing.');
  if (candidate && Number(candidate.metrics?.sourceTraceability || 0) < 2) advisories.push('Source traceability is weak; verify the primary creator/source before curation.');
  if (candidate && (!candidate.author || UNKNOWN_AUTHOR.test(candidate.author))) advisories.push('Creator attribution is generic; resolve the original creator before final curation.');
  if (candidate && !candidate.previewUrl) advisories.push('No stable preview is stored; verify a preview/player strategy before publication.');
  if (candidate && !candidate.license) advisories.push('Source/license note is missing; perform an editorial rights/provenance check.');
  if ((review?.visualReview?.whatDidNotWork || []).length) advisories.push('The review records visible compromises; decide whether they weaken the case enough to reject curation.');

  let score = 0;
  const evidence = reviewValidation.ok ? 30 : Math.max(0, 30 - reviewValidation.blockers.length * 4);
  score += evidence;

  if (candidate) {
    score += Math.min(15, Math.max(0, Number(candidate.metrics?.sourceTraceability || 0) * 3));
    if (candidate.sourceUrl) score += 4;
    if (candidate.author && !UNKNOWN_AUTHOR.test(candidate.author)) score += 3;
    if (candidate.archiveUrl) score += 1;
    if (candidate.previewUrl) score += 2;
    score += Math.min(20, Math.round(Number(candidate.score || 0) * 0.2));
    if ((candidate.collections || []).length) score += 5;
  }

  const transfer = review?.transfer || {};
  if (String(transfer.transferablePattern || '').length >= 40) score += 5;
  if ((transfer.doTransfer || []).length >= 2) score += 5;
  if ((transfer.doNotTransfer || []).length >= 1) score += 5;
  if (String(review?.visualReview?.verifiedSignatureMove || '').length >= 20) score += 5;

  score = Math.max(0, Math.min(100, score));
  const tier = score >= 85 && blockers.length === 0
    ? 'strong-editorial-candidate'
    : score >= 70 && blockers.length === 0
      ? 'editorial-review'
      : 'needs-work';

  return {
    score,
    tier,
    blockers: unique(blockers),
    advisories: unique(advisories),
    eligibleForEditorialReview: blockers.length === 0
  };
}

export function buildPromotionAnalysis(review, candidate) {
  const readiness = scoreCurationReadiness(review, candidate);
  const observedShots = review?.visualReview?.observedShots || [];
  return {
    schemaVersion: 1,
    kind: 'seedance-porter-curation-readiness',
    createdAt: new Date().toISOString(),
    candidateId: review?.candidateId || candidate?.id || '',
    reviewStatus: review?.reviewStatus || 'invalid',
    source: candidate ? {
      title: candidate.title,
      author: candidate.author,
      authorUrl: candidate.authorUrl || '',
      sourceUrl: candidate.sourceUrl,
      archiveUrl: candidate.archiveUrl || '',
      previewUrl: candidate.previewUrl || '',
      sourcePool: candidate.sourcePool || '',
      sourcePoolLabel: candidate.sourcePoolLabel || '',
      license: candidate.license || '',
      published: candidate.published || '',
      excerpt: candidate.excerpt || ''
    } : null,
    research: candidate ? {
      score: candidate.score || 0,
      metrics: candidate.metrics || {},
      collections: candidate.collections || [],
      riskFlags: candidate.riskFlags || []
    } : null,
    evidence: {
      reviewedAt: review?.reviewedAt || '',
      sourceVideoUrl: review?.sourceVideoUrl || '',
      attestation: review?.evidenceAttestation || null,
      observedShotCount: observedShots.length,
      promptMatch: summarizePromptMatch(observedShots),
      observedWhyItWorked: review?.visualReview?.whyItWorked || [],
      observedCompromises: review?.visualReview?.whatDidNotWork || [],
      observedArtifacts: review?.visualReview?.observedArtifacts || [],
      observedContinuity: review?.visualReview?.observedContinuity || []
    },
    pattern: {
      requestedSignatureMove: review?.promptAnatomy?.signatureMove || '',
      verifiedSignatureMove: review?.visualReview?.verifiedSignatureMove || '',
      transferablePattern: review?.transfer?.transferablePattern || '',
      doTransfer: review?.transfer?.doTransfer || [],
      doNotTransfer: review?.transfer?.doNotTransfer || [],
      bestFor: review?.transfer?.bestFor || [],
      requestedMotionLanguage: review?.promptAnatomy?.motionLanguage || [],
      referenceStrategy: review?.promptAnatomy?.referenceStrategy || ''
    },
    adaptationBrief: {
      objective: 'Create an independent Porter adaptation of the verified production mechanism. Replace source-specific subject matter, products, identities, trademarks, locations and wording.',
      beatStructure: observedShots.map(shot => ({
        beat: shot.n,
        framing: shot.observedFraming,
        camera: shot.observedCamera,
        attentionMechanic: shot.attentionMechanic,
        promptMatch: shot.promptMatch
      })),
      movementLanguage: review?.promptAnatomy?.motionLanguage || [],
      referenceStrategy: review?.promptAnatomy?.referenceStrategy || '',
      constraints: [
        'do not copy the source prompt wording',
        'do not reuse source-specific characters, brands, products or trademarks',
        'do not claim a visual behavior that was not observed in the complete video',
        'write the Porter Adaptation independently from the transferable mechanism',
        'keep exact typography, UI and brand graphics in post unless supported by an explicit reference workflow'
      ]
    },
    readiness
  };
}

export function buildCuratedImplementationDraft(analysis, editorial) {
  const gate = validateEditorialGate(analysis, editorial);
  if (!gate.ok) throw new Error(`Editorial gate incomplete: ${gate.blockers.join('; ')}`);

  return {
    schemaVersion: 1,
    kind: 'seedance-porter-curated-case-draft',
    status: 'ready-for-curated-implementation',
    createdAt: new Date().toISOString(),
    candidateId: analysis.candidateId,
    source: analysis.source,
    evidence: analysis.evidence,
    research: analysis.research,
    curation: {
      readinessScore: analysis.readiness.score,
      readinessTier: analysis.readiness.tier,
      advisories: analysis.readiness.advisories,
      editorialChecks: {
        attributionVerified: true,
        sourceRightsChecked: true,
        previewVerified: true,
        namedIpRiskCleared: true,
        independentAdaptationConfirmed: true,
        sourceWordingNotCopied: true
      }
    },
    editorial: {
      title: editorial.title.trim(),
      titleRu: editorial.titleRu?.trim() || '',
      category: editorial.category.trim(),
      subcategory: editorial.subcategory.trim(),
      collections: unique(editorial.collections || analysis.research?.collections || []),
      tags: unique(editorial.tags || []),
      whyItWorks: editorial.whyItWorks.trim(),
      porterAdaptation: editorial.porterAdaptation.trim(),
      notes: editorial.notes?.trim() || ''
    },
    verifiedPattern: analysis.pattern,
    adaptationBrief: analysis.adaptationBrief,
    implementationNote: 'This is an editorially gated implementation draft, not an automatic write to Industry Digest. Convert it into the repository curated-case format in a reviewed code change.'
  };
}

export function validateEditorialGate(analysis, editorial = {}) {
  const blockers = [];
  if (!analysis?.readiness?.eligibleForEditorialReview) blockers.push('Curation readiness has hard blockers.');
  if (Number(analysis?.readiness?.score || 0) < 70) blockers.push('Curation readiness score must be at least 70.');
  for (const key of ['attributionVerified','sourceRightsChecked','previewVerified','namedIpRiskCleared','independentAdaptationConfirmed','sourceWordingNotCopied']) {
    if (editorial[key] !== true) blockers.push(`${key} must be confirmed.`);
  }
  if (String(editorial.title || '').trim().length < 4) blockers.push('Final title is required.');
  if (String(editorial.category || '').trim().length < 3) blockers.push('Category is required.');
  if (String(editorial.subcategory || '').trim().length < 3) blockers.push('Subcategory is required.');
  if (String(editorial.whyItWorks || '').trim().length < 80) blockers.push('Observed-evidence Why it works must be at least 80 characters.');
  if (String(editorial.porterAdaptation || '').trim().length < 120) blockers.push('Independent Porter Adaptation must be at least 120 characters.');
  if (!Array.isArray(editorial.collections) || editorial.collections.length < 1) blockers.push('At least one Collection is required.');
  return { ok: blockers.length === 0, blockers: unique(blockers) };
}

function validObservedShot(shot) {
  return Boolean(
    shot
    && Number.isInteger(shot.n)
    && shot.n >= 1
    && String(shot.observedFraming || '').trim()
    && String(shot.observedCamera || '').trim()
    && String(shot.observedAction || '').trim()
    && ['strong','partial','weak','invented'].includes(shot.promptMatch)
    && String(shot.attentionMechanic || '').trim()
  );
}

function summarizePromptMatch(shots) {
  const summary = { strong: 0, partial: 0, weak: 0, invented: 0 };
  for (const shot of shots || []) {
    if (shot?.promptMatch in summary) summary[shot.promptMatch] += 1;
  }
  return summary;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}
