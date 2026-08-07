import { SOURCE_PLATFORMS } from '../studio/source-universe.js';
import { MULTI_SOURCE_CASES, MULTI_SOURCE_BATCH_STATS } from '../studio/multi-source-index.js';

const fail = message => { console.error(`source universe validation failed: ${message}`); process.exitCode = 1; };
const words = value => String(value || '').trim().split(/\s+/).filter(Boolean).length;
const platforms = new Map(SOURCE_PLATFORMS.map(item => [item.id,item]));
const allowedKinds = new Set(['prompt-case','workflow-case','award-case','motion-reference','official-case','official-example']);
const allowedPlayers = new Set(['vimeo','behance','youtube','iframe']);

if (SOURCE_PLATFORMS.length < 25) fail(`expected broad platform registry, got ${SOURCE_PLATFORMS.length}`);
if (new Set(SOURCE_PLATFORMS.map(item => item.id)).size !== SOURCE_PLATFORMS.length) fail('source platform IDs must be unique');
if (MULTI_SOURCE_CASES.length < 62) fail(`expected at least 62 non-X curated cases, got ${MULTI_SOURCE_CASES.length}`);
if (MULTI_SOURCE_BATCH_STATS.batch2 < 10) fail(`source expansion batch 2 unexpectedly small: ${MULTI_SOURCE_BATCH_STATS.batch2}`);
if (MULTI_SOURCE_BATCH_STATS.batch3 < 15) fail(`digital source expansion batch 3 unexpectedly small: ${MULTI_SOURCE_BATCH_STATS.batch3}`);
if (MULTI_SOURCE_BATCH_STATS.batch4 < 15) fail(`motion-craft source expansion batch 4 unexpectedly small: ${MULTI_SOURCE_BATCH_STATS.batch4}`);
if (new Set(MULTI_SOURCE_CASES.map(item => item.id)).size !== MULTI_SOURCE_CASES.length) fail('multi-source case IDs must be unique');

for (const item of MULTI_SOURCE_CASES) {
  if (!platforms.has(item.sourcePlatform)) fail(`${item.id} references unknown platform ${item.sourcePlatform}`);
  if (!allowedKinds.has(item.sourceKind)) fail(`${item.id} has invalid sourceKind ${item.sourceKind}`);
  if (!/^https:\/\//.test(item.sourceUrl || '')) fail(`${item.id} missing valid sourceUrl`);
  if (!item.player || !allowedPlayers.has(item.player.kind)) fail(`${item.id} has unsupported player strategy`);
  if (item.player.kind === 'vimeo' && !/^\d+$/.test(String(item.player.id || ''))) fail(`${item.id} missing Vimeo ID`);
  if (item.player.kind === 'behance' && !/^\d+$/.test(String(item.player.projectId || ''))) fail(`${item.id} missing Behance project ID`);
  if (item.player.kind === 'youtube' && !item.player.id) fail(`${item.id} missing YouTube ID`);
  if (item.player.kind === 'iframe' && !/^https:\/\//.test(item.player.url || '')) fail(`${item.id} missing iframe URL`);
  if (item.promptPublished !== false) fail(`${item.id} must explicitly mark unpublished source prompt; do not invent original prompts`);
  if (!item.sourceExcerpt || words(item.sourceExcerpt) > 25) fail(`${item.id} source excerpt must be present and <=25 words, got ${words(item.sourceExcerpt)}`);
  for (const field of ['title','titleRu','author','why','whyRu','signature','signatureRu','transferable','transferableRu','porterPrompt']) if (!item[field]) fail(`${item.id} missing ${field}`);
  if (words(item.porterPrompt) < 55) fail(`${item.id} Porter Adaptation is too thin (${words(item.porterPrompt)} words)`);
  if (!Array.isArray(item.shots) || item.shots.length < 3) fail(`${item.id} needs at least three analyzed production beats`);
  for (const [index,shot] of (item.shots || []).entries()) if (!Array.isArray(shot) || shot.length < 3 || shot.some(value => !String(value || '').trim())) fail(`${item.id} shot ${index+1} is incomplete`);
  if (!item.collections?.length) fail(`${item.id} missing Collections`);
  if (!item.variables || !Object.keys(item.variables).length) fail(`${item.id} missing remix variables`);
}

const nonXPlatforms = new Set(MULTI_SOURCE_CASES.map(item => item.sourcePlatform));
if (nonXPlatforms.size < 10) fail(`expected cases from >=10 platforms, got ${nonXPlatforms.size}`);

if (!process.exitCode) console.log(JSON.stringify({
  ok:true,
  sourcePlatforms:SOURCE_PLATFORMS.length,
  curatedNonXCases:MULTI_SOURCE_CASES.length,
  batches:MULTI_SOURCE_BATCH_STATS,
  totalCuratedWithPromptDigest:MULTI_SOURCE_CASES.length + 24,
  representedPlatforms:[...nonXPlatforms].sort(),
  sourceKinds:[...new Set(MULTI_SOURCE_CASES.map(item=>item.sourceKind))].sort()
},null,2));
