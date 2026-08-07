import { INDUSTRY_DIGEST } from './digest-data.js';
import { getCaseIntelligence, COLLECTION_GROUPS } from './case-intelligence.js';
import { CURATED_CASE_ANALYSIS } from './case-analysis-curated.js';

function continuousBeat(item) {
  const prompt = String(item.porterPrompt || '');
  const camera = prompt.match(/Camera:\s*([^\.]+\.?)/i)?.[1]?.trim()
    || prompt.match(/Core motion:\s*([^\.]+\.?)/i)?.[1]?.trim()
    || 'fixed or single controlled camera rule';
  const action = prompt.match(/Continuous action:\s*([\s\S]*?)(?=\s+Rule:|\s+Final state:|\s+Visual style:|\s+Image quality:|\s+Constraints:|$)/i)?.[1]?.trim()
    || prompt.match(/Core motion:\s*([\s\S]*?)(?=\s+Add only|\s+Preserve|\s+Lighting|\s+End state:|\s+Image quality:|\s+Constraints:|$)/i)?.[1]?.trim()
    || item.originalExcerpt;
  return [{
    index: 1,
    label: 'Continuous take / single visual rule',
    camera,
    action,
    visualPurpose: 'Keep one visual rule legible for the entire clip instead of manufacturing unnecessary cuts.',
    promptCause: action,
    continuity: 'The same subject, material, lighting direction and camera rule persist continuously from first frame to endpoint.',
    whyThisShotExists: 'Continuity is the effect; splitting it into artificial shots would weaken the transferable pattern.'
  }];
}

function overlayShots(overlay, fallback) {
  if (!overlay?.shotFunctions?.length) return fallback;
  return overlay.shotFunctions.map((shot, index) => {
    const [role, framing, camera, action, why] = shot;
    return {
      index: index + 1,
      label: role,
      camera: `${framing} · ${camera}`,
      action,
      visualPurpose: role,
      promptCause: action,
      continuity: 'Carry forward the approved identity, geometry, material, spatial relationship and lighting direction unless this beat explicitly changes one of them.',
      whyThisShotExists: why
    };
  });
}

function normalize(item) {
  const base = getCaseIntelligence(item);
  const overlay = CURATED_CASE_ANALYSIS[item.id];
  const fallbackShots = base.shotBreakdown?.length ? base.shotBreakdown : continuousBeat(item);
  const shotBreakdown = overlayShots(overlay, fallbackShots);

  const intelligence = overlay ? {
    ...base,
    reviewStatus: overlay.reviewStatus,
    evidence: overlay.evidence,
    whyItWorks: overlay.thesis,
    signatureMove: overlay.signatureMove,
    rhythm: overlay.rhythm,
    causalMechanics: overlay.causalMechanics,
    promptMechanics: overlay.causalMechanics,
    referenceStrategy: [overlay.referenceStrategy],
    cameraLanguage: overlay.motionLanguage,
    motionLanguage: overlay.motionLanguage,
    shotBreakdown,
    hook: shotBreakdown[0]?.action || base.hook,
    failureRisks: base.failureRisks,
    transferablePattern: base.transferablePattern,
  } : {
    ...base,
    reviewStatus: 'prompt-reviewed',
    evidence: {
      prompt: 'reviewed',
      preview: item.previewUrl ? 'reviewed' : 'missing',
      fullVideo: 'pending-visual-review',
      note: 'Prompt-derived analysis only until the complete source video is visually reviewed.'
    },
    shotBreakdown,
    hook: base.hook || shotBreakdown[0]?.action,
    causalMechanics: base.promptMechanics,
    motionLanguage: base.cameraLanguage,
  };

  intelligence.productionScore = Math.max(1, Math.min(5, Math.round((item.designScore + (shotBreakdown.length >= 3 ? 5 : 4)) / 2)));
  return { ...item, intelligence };
}

export { COLLECTION_GROUPS };
export const CASE_INTELLIGENCE = INDUSTRY_DIGEST.map(normalize);
export const COLLECTION_COUNTS = Object.fromEntries(
  COLLECTION_GROUPS.flatMap(group => group.items).map(name => [name, CASE_INTELLIGENCE.filter(item => item.intelligence.collections.includes(name)).length])
);
