import { INDUSTRY_DIGEST } from './digest-data.js';
import { getCaseIntelligence, COLLECTION_GROUPS } from './case-intelligence.js';

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
    whyThisShotExists: 'This case is strong precisely because continuity is the effect; splitting it into artificial shots would weaken the pattern.'
  }];
}

function normalize(item) {
  const intelligence = getCaseIntelligence(item);
  const shotBreakdown = intelligence.shotBreakdown?.length ? intelligence.shotBreakdown : continuousBeat(item);
  return {
    ...item,
    intelligence: {
      ...intelligence,
      shotBreakdown,
      hook: intelligence.hook || shotBreakdown[0].action,
      productionScore: Math.max(1, Math.min(5, Math.round((item.designScore + (shotBreakdown.length >= 3 ? 5 : 4)) / 2)))
    }
  };
}

export { COLLECTION_GROUPS };
export const CASE_INTELLIGENCE = INDUSTRY_DIGEST.map(normalize);
export const COLLECTION_COUNTS = Object.fromEntries(
  COLLECTION_GROUPS.flatMap(group => group.items).map(name => [name, CASE_INTELLIGENCE.filter(item => item.intelligence.collections.includes(name)).length])
);
