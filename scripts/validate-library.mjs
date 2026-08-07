import { INDUSTRY_DIGEST, DIGEST_META } from '../studio/digest-data.js';
import { PROMPTS, SOURCES, LIBRARY_STATS } from '../studio/library-data.js';
import { COLLECTIONS, COLLECTION_GROUPS, CASE_INTELLIGENCE, CASE_SOURCE_POOLS } from '../studio/case-intelligence-data.js';

const fail = (message) => {
  console.error(`library validation failed: ${message}`);
  process.exitCode = 1;
};

const words = (value) => String(value).trim().split(/\s+/).filter(Boolean).length;
const isUrl = (value) => /^https:\/\//.test(String(value));

if (!INDUSTRY_DIGEST.length) fail('digest is empty');
if (new Set(INDUSTRY_DIGEST.map(item => item.id)).size !== INDUSTRY_DIGEST.length) fail('digest IDs must be unique');

for (const item of INDUSTRY_DIGEST) {
  for (const field of ['id','title','category','author','sourceUrl','archiveUrl','previewUrl','originalExcerpt','porterPrompt','why']) {
    if (!item[field]) fail(`${item.id || 'unknown'} missing ${field}`);
  }
  for (const field of ['sourceUrl','archiveUrl','previewUrl','authorUrl']) {
    if (!isUrl(item[field])) fail(`${item.id} has invalid ${field}`);
  }
  const excerptWords = words(item.originalExcerpt);
  if (excerptWords > 25) fail(`${item.id} source excerpt is ${excerptWords} words; keep digest excerpts <=25 words and link the full original`);
  if (excerptWords < 6) fail(`${item.id} source excerpt is too small to be useful`);
  if (words(item.porterPrompt) < 55) fail(`${item.id} Porter Adaptation is too thin to be production-useful`);
  if (!/(Shot\s+1:|Clip\s+[A-Z0-9]+:|Camera:|Core motion:)/i.test(item.porterPrompt)) fail(`${item.id} adaptation lacks an explicit shot/clip/camera/motion production instruction`);
  if (!item.variables || !Object.keys(item.variables).length) fail(`${item.id} has no remix variables`);
  if (item.designScore < 1 || item.designScore > 5) fail(`${item.id} designScore must be 1-5`);

  const intel = CASE_INTELLIGENCE[item.id];
  if (!intel) fail(`${item.id} missing Case Intelligence analysis`);
  else {
    if (!['prompt-reviewed','deep-reviewed'].includes(intel.reviewStatus)) fail(`${item.id} invalid reviewStatus`);
    if (!intel.thesis || !intel.signatureMove || !intel.transferablePattern) fail(`${item.id} analysis missing thesis/signature/transferable pattern`);
    if (!Array.isArray(intel.shotBreakdown) || intel.shotBreakdown.length < 1) fail(`${item.id} has no shot breakdown`);
    for (const shot of intel.shotBreakdown || []) {
      for (const field of ['n','role','framing','camera','action','why']) if (shot[field] === undefined || shot[field] === '') fail(`${item.id} shot missing ${field}`);
    }
    if (!Array.isArray(intel.causalMechanics) || intel.causalMechanics.length < 2) fail(`${item.id} needs at least two causal mechanics`);
    if (!Array.isArray(intel.collections) || !intel.collections.length) fail(`${item.id} has no collection mapping`);
    if (!Array.isArray(intel.failureRisks) || intel.failureRisks.length < 2) fail(`${item.id} needs explicit failure risks`);
  }
}

const collectionIds = COLLECTIONS.map(item => item.id);
if (COLLECTIONS.length !== 30) fail(`expected 30 requested collections, got ${COLLECTIONS.length}`);
if (new Set(collectionIds).size !== collectionIds.length) fail('collection IDs must be unique');
if (COLLECTION_GROUPS.length !== 3) fail('expected Digital / Commercial / Motion collection groups');
for (const [caseId, intel] of Object.entries(CASE_INTELLIGENCE)) {
  for (const id of intel.collections || []) if (!collectionIds.includes(id)) fail(`${caseId} references unknown collection ${id}`);
}
for (const source of CASE_SOURCE_POOLS) {
  if (!source.id || !source.title || !isUrl(source.url) || !source.strategy) fail(`case source pool ${source.id || 'unknown'} incomplete`);
}

if (!isUrl(DIGEST_META.corpusUrl) || !DIGEST_META.corpusLicense) fail('digest corpus attribution metadata is incomplete');
if (PROMPTS.length !== 192) fail(`expected 192 Porter Originals, got ${PROMPTS.length}`);
if (LIBRARY_STATS.promptCount !== PROMPTS.length) fail('LIBRARY_STATS.promptCount is inconsistent');
if (SOURCES.length < 20) fail('source audit unexpectedly small');

if (!process.exitCode) {
  console.log(JSON.stringify({
    ok: true,
    digestEntries: INDUSTRY_DIGEST.length,
    caseIntelligenceEntries: Object.keys(CASE_INTELLIGENCE).length,
    deepReviewedCases: Object.values(CASE_INTELLIGENCE).filter(item => item.reviewStatus === 'deep-reviewed').length,
    collections: COLLECTIONS.length,
    caseSourcePools: CASE_SOURCE_POOLS.length,
    digestCreators: new Set(INDUSTRY_DIGEST.map(item => item.author)).size,
    digestCategories: new Set(INDUSTRY_DIGEST.map(item => item.category)).size,
    porterOriginals: PROMPTS.length,
    auditedSources: SOURCES.length,
    maxSourceExcerptWords: Math.max(...INDUSTRY_DIGEST.map(item => words(item.originalExcerpt)))
  }, null, 2));
}
