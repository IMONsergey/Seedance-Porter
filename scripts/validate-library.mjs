import { INDUSTRY_DIGEST, DIGEST_META } from '../studio/digest-data.js';
import { PROMPTS, SOURCES, LIBRARY_STATS } from '../studio/library-data.js';
import { CASE_INTELLIGENCE, COLLECTION_GROUPS } from '../studio/case-intelligence-runtime.js';

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
  if (!/(Shot\s+1:|Clip\s+[A-Z0-9]+:|Camera:|Core motion:|Continuous action:)/i.test(item.porterPrompt)) fail(`${item.id} adaptation lacks an explicit shot/clip/camera/motion production instruction`);
  if (!item.variables || !Object.keys(item.variables).length) fail(`${item.id} has no remix variables`);
  if (item.designScore < 1 || item.designScore > 5) fail(`${item.id} designScore must be 1-5`);
}

if (CASE_INTELLIGENCE.length !== INDUSTRY_DIGEST.length) fail('every digest entry must have Case Intelligence');
const validCollections = new Set(COLLECTION_GROUPS.flatMap(group => group.items));
for (const item of CASE_INTELLIGENCE) {
  const intel = item.intelligence;
  if (!intel) { fail(`${item.id} missing intelligence object`); continue; }
  if (!intel.collections?.length) fail(`${item.id} has no collections`);
  for (const collection of intel.collections || []) if (!validCollections.has(collection)) fail(`${item.id} uses unknown collection ${collection}`);
  if (!['A','B','C'].includes(intel.evidenceLevel)) fail(`${item.id} has invalid evidenceLevel`);
  if (!intel.signatureMove || words(intel.signatureMove) < 4) fail(`${item.id} signatureMove is too weak`);
  if (!intel.transferablePattern || words(intel.transferablePattern) < 10) fail(`${item.id} transferablePattern is too weak`);
  if (!intel.promptMechanics?.length) fail(`${item.id} has no prompt mechanics`);
  if (!intel.referenceStrategy?.length) fail(`${item.id} has no reference strategy`);
  if (!intel.cameraLanguage?.length) fail(`${item.id} has no camera analysis`);
  if (!intel.failureRisks?.length) fail(`${item.id} has no failure risks`);
  if (!intel.bosNotes?.length) fail(`${item.id} has no BOS notes`);
  if (!intel.postProductionExpectation) fail(`${item.id} has no post-production expectation`);
  if (!intel.shotBreakdown?.length) fail(`${item.id} has no shot breakdown`);
  if (/Shot\s+2:|Clip\s+B:/i.test(item.porterPrompt) && intel.shotBreakdown.length < 2) fail(`${item.id} is multi-shot but intelligence has fewer than two beats`);
  for (const shot of intel.shotBreakdown || []) {
    for (const field of ['camera','action','visualPurpose','continuity','whyThisShotExists']) if (!shot[field]) fail(`${item.id} shot ${shot.index} missing ${field}`);
  }
}

if (!isUrl(DIGEST_META.corpusUrl) || !DIGEST_META.corpusLicense) fail('digest corpus attribution metadata is incomplete');
if (PROMPTS.length !== 192) fail(`expected 192 Porter Originals, got ${PROMPTS.length}`);
if (LIBRARY_STATS.promptCount !== PROMPTS.length) fail('LIBRARY_STATS.promptCount is inconsistent');
if (SOURCES.length < 20) fail('source audit unexpectedly small');

if (!process.exitCode) {
  console.log(JSON.stringify({
    ok: true,
    digestEntries: INDUSTRY_DIGEST.length,
    caseIntelligenceEntries: CASE_INTELLIGENCE.length,
    digestCreators: new Set(INDUSTRY_DIGEST.map(item => item.author)).size,
    digestCategories: new Set(INDUSTRY_DIGEST.map(item => item.category)).size,
    collections: validCollections.size,
    porterOriginals: PROMPTS.length,
    auditedSources: SOURCES.length,
    maxSourceExcerptWords: Math.max(...INDUSTRY_DIGEST.map(item => words(item.originalExcerpt)))
  }, null, 2));
}
