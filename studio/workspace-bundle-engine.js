export const WORKSPACE_BUNDLE_KIND = 'seedance-porter-workspace-bundle';
export const WORKSPACE_BUNDLE_ARCHIVE_KIND = 'seedance-porter-workspace-bundle-archive';
export const WORKSPACE_BUNDLE_VERSION = 1;
export const WORKSPACE_BUNDLE_COMPONENTS = Object.freeze(['deepReviewDraft','mediaEvidence','promotionDraft']);

const MAX_COMPONENT_BYTES = 1_000_000;
const MAX_BUNDLE_BYTES = 2_500_000;
const MAX_ARCHIVE_BUNDLES = 250;

export function buildWorkspaceBundle(input) {
  const candidateId = cleanId(input?.candidateId);
  if (!candidateId) throw new Error('candidateId is required');

  const components = {};
  for (const key of WORKSPACE_BUNDLE_COMPONENTS) {
    const value = input?.components?.[key];
    if (value == null) continue;
    components[key] = cloneJson(value);
  }

  const bundle = {
    schemaVersion: WORKSPACE_BUNDLE_VERSION,
    kind: WORKSPACE_BUNDLE_KIND,
    candidateId,
    exportedAt: new Date(input?.exportedAt || Date.now()).toISOString(),
    source: {
      app: 'Seedance Porter',
      transport: 'browser-local-workspace-bundle',
      autoApproval: false,
      autoGitHubWrite: false
    },
    candidate: sanitizeCandidateSummary(input?.candidate || {}, candidateId),
    components,
    componentManifest: manifest(components),
    evidenceBoundary: 'This bundle transports unfinished browser-local work only. Importing it never attests complete-video review, never creates deep-reviewed evidence, and never promotes or publishes a curated case.'
  };

  const validation = validateWorkspaceBundle(bundle);
  if (!validation.ok) throw new Error(validation.errors.join('; '));
  return bundle;
}

export function validateWorkspaceBundle(value) {
  const errors = [];
  const warnings = [];
  const bundle = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  if (!bundle) return result(false, ['Bundle must be a JSON object.'], warnings, []);

  if (bundle.kind !== WORKSPACE_BUNDLE_KIND) errors.push(`kind must equal ${WORKSPACE_BUNDLE_KIND}`);
  if (Number(bundle.schemaVersion) !== WORKSPACE_BUNDLE_VERSION) errors.push(`schemaVersion must equal ${WORKSPACE_BUNDLE_VERSION}`);
  const candidateId = cleanId(bundle.candidateId);
  if (!candidateId) errors.push('candidateId is required.');
  if (!isIsoDate(bundle.exportedAt)) errors.push('exportedAt must be a valid timestamp.');

  const components = bundle.components && typeof bundle.components === 'object' && !Array.isArray(bundle.components) ? bundle.components : {};
  const unknown = Object.keys(components).filter(key => !WORKSPACE_BUNDLE_COMPONENTS.includes(key));
  if (unknown.length) errors.push(`Unknown component(s): ${unknown.join(', ')}`);
  const present = WORKSPACE_BUNDLE_COMPONENTS.filter(key => components[key] != null);
  if (!present.length) warnings.push('Bundle contains no workspace components.');

  for (const key of present) {
    const component = components[key];
    if (!component || typeof component !== 'object' || Array.isArray(component)) {
      errors.push(`${key} must be a JSON object.`);
      continue;
    }
    if (jsonBytes(component) > MAX_COMPONENT_BYTES) errors.push(`${key} exceeds ${MAX_COMPONENT_BYTES} byte limit.`);
    validateCandidateBinding(component, candidateId, key, errors);
  }

  if (components.deepReviewDraft) validateDeepReviewDraft(components.deepReviewDraft, errors, warnings);
  if (components.mediaEvidence) validateMediaEvidence(components.mediaEvidence, candidateId, errors, warnings);
  if (components.promotionDraft) validatePromotionDraft(components.promotionDraft, errors, warnings);

  if (bundle.candidate?.id && bundle.candidate.id !== candidateId) errors.push('candidate.id must match bundle candidateId.');
  if (jsonBytes(bundle) > MAX_BUNDLE_BYTES) errors.push(`Bundle exceeds ${MAX_BUNDLE_BYTES} byte limit.`);
  if (!String(bundle.evidenceBoundary || '').toLowerCase().includes('never')) warnings.push('Evidence boundary statement is missing or unusually weak.');

  return result(errors.length === 0, errors, warnings, present);
}

export function buildWorkspaceBundleArchive(bundles, options = {}) {
  const input = Array.isArray(bundles) ? bundles : [];
  if (!input.length) throw new Error('At least one bundle is required.');
  if (input.length > MAX_ARCHIVE_BUNDLES) throw new Error(`Archive supports at most ${MAX_ARCHIVE_BUNDLES} bundles.`);
  const accepted = [];
  for (const bundle of input) {
    const validation = validateWorkspaceBundle(bundle);
    if (!validation.ok) throw new Error(`Invalid bundle ${bundle?.candidateId || 'unknown'}: ${validation.errors.join('; ')}`);
    accepted.push(cloneJson(bundle));
  }
  return {
    schemaVersion: 1,
    kind: WORKSPACE_BUNDLE_ARCHIVE_KIND,
    exportedAt: new Date(options.exportedAt || Date.now()).toISOString(),
    bundles: accepted,
    summary: {
      candidates: accepted.length,
      deepReviewDrafts: accepted.filter(bundle => bundle.components?.deepReviewDraft).length,
      mediaEvidence: accepted.filter(bundle => bundle.components?.mediaEvidence).length,
      promotionDrafts: accepted.filter(bundle => bundle.components?.promotionDraft).length
    },
    evidenceBoundary: 'Archive import restores unfinished local work only. It never grants review, curation, rights, publication, or approval status.'
  };
}

export function parseWorkspaceBundlePayload(value) {
  const payload = typeof value === 'string' ? JSON.parse(value) : cloneJson(value);
  if (payload?.kind === WORKSPACE_BUNDLE_KIND) {
    const validation = validateWorkspaceBundle(payload);
    return { kind:'bundle', bundles:[payload], validation, archiveWarnings:[] };
  }
  if (payload?.kind === WORKSPACE_BUNDLE_ARCHIVE_KIND) {
    const errors = [];
    const warnings = [];
    const bundles = Array.isArray(payload.bundles) ? payload.bundles : [];
    if (!bundles.length) errors.push('Archive contains no bundles.');
    if (bundles.length > MAX_ARCHIVE_BUNDLES) errors.push(`Archive exceeds ${MAX_ARCHIVE_BUNDLES} bundle limit.`);
    for (const bundle of bundles) {
      const validation = validateWorkspaceBundle(bundle);
      if (!validation.ok) errors.push(`${bundle?.candidateId || 'unknown'}: ${validation.errors.join('; ')}`);
      warnings.push(...validation.warnings.map(message => `${bundle?.candidateId || 'unknown'}: ${message}`));
    }
    const duplicateIds = duplicates(bundles.map(bundle => cleanId(bundle?.candidateId)).filter(Boolean));
    if (duplicateIds.length) errors.push(`Archive contains duplicate candidate IDs: ${duplicateIds.join(', ')}`);
    return { kind:'archive', bundles, validation:result(errors.length===0,errors,warnings,[]), archiveWarnings:warnings };
  }
  return { kind:'unknown', bundles:[], validation:result(false,[`Unsupported bundle kind: ${payload?.kind || 'missing'}`],[],[]), archiveWarnings:[] };
}

export function planWorkspaceBundleImport(bundle, existing = {}, mode = 'fill-missing') {
  const validation = validateWorkspaceBundle(bundle);
  if (!validation.ok) return { ok:false, errors:validation.errors, warnings:validation.warnings, writes:[], skips:[] };
  if (!['fill-missing','replace'].includes(mode)) return { ok:false, errors:[`Unsupported import mode: ${mode}`], warnings:[], writes:[], skips:[] };

  const writes = [];
  const skips = [];
  for (const key of validation.components) {
    const incoming = cloneJson(bundle.components[key]);
    const current = existing[key] ?? null;
    if (mode === 'fill-missing' && current != null) {
      skips.push({ component:key, reason:'existing-local-component' });
      continue;
    }
    writes.push({ component:key, value:incoming, replace:current != null });
  }
  return { ok:true, errors:[], warnings:validation.warnings, writes, skips };
}

function validateCandidateBinding(component, candidateId, key, errors) {
  const ids = [component.candidateId, component.sourceCaseId, component.review?.candidateId, component.candidate?.id].filter(Boolean).map(cleanId);
  const mismatched = ids.filter(id => id && id !== candidateId);
  if (mismatched.length) errors.push(`${key} contains candidate binding that does not match ${candidateId}.`);
}

function validateDeepReviewDraft(value, errors, warnings) {
  const status = String(value.reviewStatus || value.status || 'draft').toLowerCase();
  if (status === 'deep-reviewed' || status === 'curated' || value.evidenceAttestation?.completeVideoWatched === true) {
    errors.push('deepReviewDraft may contain unfinished draft state only; finalized evidence/attestation cannot be imported through a workspace bundle.');
  }
  if (value.completeVideoWatched === true) errors.push('deepReviewDraft cannot import completeVideoWatched=true.');
  if (!value.reviewStatus && !value.status) warnings.push('Deep Review component has no explicit draft status; it will remain browser-local working data.');
}

function validateMediaEvidence(value, candidateId, errors, warnings) {
  if (value.kind && value.kind !== 'seedance-porter-review-media-evidence') errors.push('mediaEvidence kind is invalid.');
  if (value.candidateId && cleanId(value.candidateId) !== candidateId) errors.push('mediaEvidence candidateId mismatch.');
  const coverage = Number(value.playback?.coveragePercent || 0);
  if (coverage < 0 || coverage > 100) errors.push('mediaEvidence playback coverage must be 0–100.');
  if (value.evidenceAttestation?.completeVideoWatched === true || value.completeVideoWatched === true) errors.push('mediaEvidence cannot import complete-video attestation.');
  if (!Array.isArray(value.markers)) warnings.push('Media evidence has no marker array.');
}

function validatePromotionDraft(value, errors) {
  const status = String(value.reviewStatus || value.status || value.curationStatus || '').toLowerCase();
  if (['curated','published','approved'].includes(status) || value.curated === true || value.published === true || value.approved === true) {
    errors.push('promotionDraft may contain unfinished editorial work only; approved/curated/published state cannot be imported through a workspace bundle.');
  }
}

function sanitizeCandidateSummary(value, candidateId) {
  return {
    id:candidateId,
    title:String(value.title || ''),
    author:String(value.author || ''),
    sourcePool:String(value.sourcePool || ''),
    sourcePoolLabel:String(value.sourcePoolLabel || ''),
    sourceUrl:String(value.sourceUrl || ''),
    archiveUrl:String(value.archiveUrl || ''),
    previewUrl:String(value.previewUrl || ''),
    sourceVideoUrl:String(value.sourceVideoUrl || ''),
    collections:Array.isArray(value.collections) ? value.collections.map(String).slice(0,12) : []
  };
}

function manifest(components) {
  return WORKSPACE_BUNDLE_COMPONENTS.filter(key => components[key] != null).map(key => ({ key, bytes:jsonBytes(components[key]) }));
}
function result(ok, errors, warnings, components) { return { ok, errors, warnings, components }; }
function cloneJson(value) { return JSON.parse(JSON.stringify(value)); }
function cleanId(value) { return String(value || '').trim().replace(/[^a-zA-Z0-9._:-]+/g,'-').replace(/^-+|-+$/g,''); }
function isIsoDate(value) { const date=new Date(value); return Boolean(value) && !Number.isNaN(date.getTime()); }
function jsonBytes(value) { return new TextEncoder().encode(JSON.stringify(value)).length; }
function duplicates(values) { const seen=new Set(); const dup=new Set(); for(const value of values){ if(seen.has(value)) dup.add(value); seen.add(value); } return [...dup]; }
