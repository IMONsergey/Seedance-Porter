#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { SOURCE_ADAPTERS, enabledSourceAdapters } from './source-adapter-registry.mjs';
import { detectResearchRisk } from './research-risk-policy.mjs';
import { buildSourceHealth } from './source-health-engine.mjs';

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const ids = SOURCE_ADAPTERS.map(item => item.id);
assert(SOURCE_ADAPTERS.length === 9, `Expected exactly 9 registered source pools in this release, got ${SOURCE_ADAPTERS.length}.`);
assert(enabledSourceAdapters().length === 9, 'All nine release source adapters must be enabled.');
assert(new Set(ids).size === ids.length, 'Source adapter IDs must be unique.');
for (const id of ['youmind','cyberbara','seedance2prompt','lanshu','zerolu-awesome-seedance','awesome-ai-video-ads','marsoyang-seedance-prompts','huyle-awesome-seedance','astorie-seedance-source']) {
  assert(ids.includes(id), `Missing expected source adapter: ${id}`);
}
assert(!ids.some(id => /seedance25api/i.test(id)), 'Unverified promotional Seedance 2.5/API corpus must not enter the canonical adapter registry.');

const huyLe = SOURCE_ADAPTERS.find(item => item.id === 'huyle-awesome-seedance');
const astorie = SOURCE_ADAPTERS.find(item => item.id === 'astorie-seedance-source');
assert(huyLe?.rights.includes('MIT'), 'HuyLe adapter must preserve the verified repository license note.');
assert(/third-party source attribution/i.test(huyLe?.rights || ''), 'HuyLe adapter must not treat repository license as replacing creator attribution.');
assert(/no standalone LICENSE/i.test(astorie?.rights || ''), 'Astorie adapter must record that no standalone LICENSE file was verified.');
assert(/short excerpt/i.test(astorie?.rights || ''), 'Astorie adapter must remain metadata/excerpt-only.');

const riskyIp = detectResearchRisk('Sun Wukong fights Homelander above Gotham while Pikachu watches.');
assert(riskyIp.flags.includes('named-ip-or-celebrity'), 'Named franchise/character input must trigger named-IP risk.');
assert(riskyIp.flags.includes('branded-character-dependent'), 'Branded-character input must trigger branded-character risk.');
const riskyPerson = detectResearchRisk('Cinematography in the style of Denis Villeneuve with Hans Zimmer sound design.');
assert(riskyPerson.flags.includes('public-figure-dependent'), 'Named public-figure dependency must be risk-flagged for automatic research promotion.');
const clean = detectResearchRisk('Macro product film with a slow orbit, condensation and a clean unbranded packshot.');
assert(clean.flags.length === 0, 'Generic production-language candidate must not be risk-flagged.');

const syntheticAdapters = [
  { id:'high', label:'High Source', stage:'test', kind:'test', priority:5, enabled:true, upstream:'https://example.com/high', provenance:'direct', rights:'test', expectedEvidence:[] },
  { id:'zero', label:'Zero Source', stage:'test', kind:'test', priority:3, enabled:true, upstream:'https://example.com/zero', provenance:'direct', rights:'test', expectedEvidence:[] },
  { id:'failed', label:'Failed Source', stage:'test', kind:'test', priority:3, enabled:true, upstream:'https://example.com/failed', provenance:'direct', rights:'test', expectedEvidence:[] }
];
const syntheticCandidates = Array.from({ length: 12 }, (_, index) => ({
  id:`high-${index}`,
  sourcePool:'high',
  score:82 + (index % 8),
  sourceUrl:`https://x.com/source/status/${1000 + index}`,
  previewUrl:`https://example.com/${index}.jpg`,
  sourceVideoUrl:index < 5 ? `https://video.example.com/${index}.mp4` : '',
  collections:index % 3 === 0 ? ['alpha','beta','gamma'] : index % 2 === 0 ? ['alpha','beta'] : ['alpha'],
  metrics:{ sourceTraceability:5 }
}));
const syntheticCorpus = {
  sourceStats:[
    { source:'high', discovered:14, ok:true },
    { source:'zero', discovered:20, ok:true },
    { source:'failed', discovered:0, ok:false, error:'upstream unavailable' }
  ],
  candidates:syntheticCandidates
};
const syntheticPlan = { collections:[
  { id:'alpha', priority:80 }, { id:'beta', priority:70 }, { id:'gamma', priority:60 }
] };
const health = buildSourceHealth({ corpus:syntheticCorpus, plan:syntheticPlan, adapters:syntheticAdapters, highQualityThreshold:70 });
const high = health.adapters.find(item => item.id === 'high');
const zero = health.adapters.find(item => item.id === 'zero');
const failed = health.adapters.find(item => item.id === 'failed');
assert(high?.health.status === 'high-value', `Strong synthetic source should be high-value, got ${high?.health.status}.`);
assert(high?.health.recommendation === 'expand-this-source', `Strong source serving weak Collections should recommend expansion, got ${high?.health.recommendation}.`);
assert(high?.yield.weakCollectionsServed === 3, 'Health engine must count weak-Collection contribution.');
assert(high?.yield.directCreatorSourcePercent === 100, 'Direct X source coverage should be measured.');
assert(zero?.health.status === 'zero-yield', `Responding source with discoveries but no selected candidates should be zero-yield, got ${zero?.health.status}.`);
assert(zero?.health.recommendation === 'inspect-duplicates-risk-and-parser-quality', 'Zero-yield source must recommend yield inspection rather than blind scaling.');
assert(failed?.health.status === 'failed', 'Failed runtime source must remain failed regardless of registry metadata.');
assert(failed?.health.recommendation === 'repair-adapter', 'Failed source must recommend adapter repair.');

const [baseImporter, augment, expansion, refresh, healthUi, healthBootstrap, sidebar] = await Promise.all([
  readFile('scripts/import-case-candidates.mjs','utf8'),
  readFile('scripts/augment-case-candidates.mjs','utf8'),
  readFile('scripts/expand-case-candidates.mjs','utf8'),
  readFile('scripts/refresh-case-corpus.mjs','utf8'),
  readFile('studio/source-health-ui.js','utf8'),
  readFile('studio/source-health-bootstrap.js','utf8'),
  readFile('studio/sidebar.js','utf8')
]);

for (const id of enabledSourceAdapters('base').map(item => item.id)) assert(baseImporter.includes(`'${id}'`), `Base importer is missing registered base adapter ${id}.`);
for (const id of enabledSourceAdapters('augment').map(item => item.id)) assert(augment.includes(`id: '${id}'`) || augment.includes(`['${id}'`) || augment.includes(`'${id}'`), `Augmentation stage is missing registered adapter ${id}.`);
for (const id of enabledSourceAdapters('expand').map(item => item.id)) assert(expansion.includes(`'${id}'`), `Expansion stage is missing registered adapter ${id}.`);
assert(expansion.includes('mergeResearchRisk'), 'Expansion stage must use the shared Research Risk Policy.');
assert(expansion.includes('slice(0, maxWords)'), 'Expansion snapshot excerpt must remain word-limited.');
assert(expansion.includes('sourceVideoUrl'), 'Expansion must preserve direct source-video evidence when available.');
assert(refresh.includes("'scripts/expand-case-candidates.mjs'"), 'Unified refresh must execute the expansion stage before queue planning.');
assert(refresh.includes("'scripts/build-source-health.mjs'"), 'Unified refresh must generate source health after coverage planning.');
assert(healthUi.includes("fetch('./source-health.json'"), 'Source Health UI must consume the generated health snapshot.');
assert(healthUi.includes('Selection yield') && healthUi.includes('duplicate rate'), 'UI must disclose why selection yield is not a duplicate rate.');
assert(healthBootstrap.includes("link.href = './source-health.css'"), 'Source Health bootstrap must load its CSS.');
assert(sidebar.includes("import './source-health-bootstrap.js';"), 'Sidebar must mount Source Adapter Health.');

if (failures.length) {
  console.error('Source adapter contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok:true,
  registeredAdapters:SOURCE_ADAPTERS.length,
  stages:Object.fromEntries(['base','augment','expand'].map(stage => [stage, enabledSourceAdapters(stage).length])),
  riskPolicy:{ namedIp:true, publicFigure:true, cleanGenericPass:true },
  syntheticHealth:{ high:high.health, zero:zero.health, failed:failed.health }
},null,2));
