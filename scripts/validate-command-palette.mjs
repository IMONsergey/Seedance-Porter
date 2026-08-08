#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildCommandIndex, searchCommandIndex, parseCommandQuery } from '../studio/command-palette-engine.js';

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const fixture = buildCommandIndex({
  workspaces:[
    { id:'operations', title:'Operations', subtitle:'What to do next', keywords:['priority','health'], action:{type:'workspace',view:'operations'} },
    { id:'digest', title:'Industry Digest', subtitle:'100 curated', keywords:['cases'], action:{type:'workspace',view:'digest'} }
  ],
  collectionGroups:[
    { id:'commercial', title:'Commercial', items:['Beauty','Packshot'] },
    { id:'motion', title:'Motion language', items:['Camera'] }
  ],
  curatedCases:[
    { id:'case-alpha', title:'Alpha Beauty Film', author:'@alice', sourcePlatform:'x', category:'Beauty', subcategory:'Serum', collections:['Beauty','Macro'], tags:['macro','glass'] },
    { id:'case-beta', title:'Beta Camera Loop', author:'@bob', sourcePlatform:'youtube', category:'Motion', collections:['Camera','Loop'], tags:['tracking'] }
  ],
  originals:[
    { id:'original-foo', title:'Glass Packshot Hero', category:'Product', subcategory:'Packshot', variation:'Luxury', use:'Beauty launch', mode:'image-to-video', aspect:'16:9', tags:['glass','macro'] }
  ],
  sources:[
    { id:'source-one', title:'Official Seedance Guide', type:'official', url:'https://example.com/official' }
  ],
  sourceUniverse:[
    { id:'source-two', title:'Motion Research Lab', kind:'research', url:'https://example.com/research' }
  ],
  researchCandidates:[
    { id:'candidate-safe', title:'Safe Beauty Macro', author:'@carol', sourcePool:'pool-a', sourcePoolLabel:'Pool A', score:90, collections:['beauty','macro'], excerpt:'macro serum product film', riskFlags:[] },
    { id:'candidate-risk', title:'Risky Famous Character', author:'@risk', sourcePool:'pool-b', score:99, collections:['camera'], excerpt:'named character sequence', riskFlags:['named-ip-or-celebrity'] }
  ],
  reviewQueue:[
    { candidateId:'candidate-safe' }
  ]
});

assert(new Set(fixture.map(item => item.key)).size === fixture.length, 'Command index keys must be unique.');
assert(!fixture.some(item => item.id === 'candidate-risk'), 'Risk-flagged research candidates must never enter the command index.');
const safe = fixture.find(item => item.id === 'candidate-safe');
assert(safe?.action?.type === 'review-candidate', 'Queued research candidate must route directly to Deep Review.');
assert(safe?.metadata?.queued === true, 'Queued research candidate metadata must preserve queued=true.');

const exact = searchCommandIndex(fixture, 'Alpha Beauty Film', { limit:10 });
assert(exact[0]?.item?.id === 'case-alpha', `Exact title match must rank first; got ${exact[0]?.item?.id}.`);
assert(exact[0]?.reasons?.includes('exact-title'), 'Exact title ranking reason must be explicit.');

const prefix = searchCommandIndex(fixture, 'Alpha', { limit:10 });
assert(prefix[0]?.item?.id === 'case-alpha', 'Title prefix match must outrank generic token matches.');

const workspaceMode = searchCommandIndex(fixture, '> oper', { limit:10 });
assert(workspaceMode.length > 0 && workspaceMode.every(result => result.item.kind === 'workspace'), '`>` prefix must restrict results to workspaces.');
assert(workspaceMode[0]?.item?.id === 'operations', '`> oper` must resolve Operations first.');

const collectionMode = searchCommandIndex(fixture, '# beauty', { limit:10 });
assert(collectionMode.length > 0 && collectionMode.every(result => result.item.kind === 'collection'), '`#` prefix must restrict results to Collections.');
assert(collectionMode[0]?.item?.title === 'Beauty', '`# beauty` must resolve Beauty Collection first.');

const creatorMode = searchCommandIndex(fixture, '@ alice', { limit:10 });
assert(creatorMode.length > 0 && creatorMode.every(result => result.item.kind === 'creator'), '`@` prefix must restrict results to creators.');
assert(creatorMode[0]?.item?.title === '@alice', '`@ alice` must resolve @alice.');

const parsed = parseCommandQuery('#Beauty');
assert(parsed.kind === 'collection' && parsed.query === 'beauty', 'Prefix parser must normalize Collection queries.');

const recentKey = fixture.find(item => item.id === 'case-beta')?.key;
const emptyWithRecent = searchCommandIndex(fixture, '', { limit:20, recent:[recentKey] });
const betaRank = emptyWithRecent.findIndex(result => result.item.id === 'case-beta');
const alphaRank = emptyWithRecent.findIndex(result => result.item.id === 'case-alpha');
assert(betaRank >= 0 && alphaRank >= 0 && betaRank < alphaRank, 'Recent curated selection must receive a meaningful ranking boost on empty query.');

const researchSearch = searchCommandIndex(fixture, 'Safe Beauty Macro', { limit:10 });
assert(researchSearch[0]?.item?.id === 'candidate-safe', 'Safe research candidate must be searchable.');
assert(researchSearch[0]?.score > 0, 'Research result must receive a positive score.');

const sourceSearch = searchCommandIndex(fixture, 'Motion Research Lab', { limit:10 });
assert(sourceSearch[0]?.item?.kind === 'source', 'Source Universe entries must enter the global search index.');

const empty = searchCommandIndex(fixture, '', { limit:10 });
assert(empty[0]?.item?.kind === 'workspace', 'Empty palette should default to navigation/workspace utility before content noise.');

const [runtime, multiSource, ui, bootstrap, sidebar] = await Promise.all([
  import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href),
  import(pathToFileURL(resolve('studio/multi-source-index.js')).href),
  readFile('studio/command-palette-ui.js','utf8'),
  readFile('studio/command-palette-bootstrap.js','utf8'),
  readFile('studio/sidebar.js','utf8')
]);
const unifiedCurated = new Set([...runtime.CASE_INTELLIGENCE.map(item=>item.id), ...multiSource.MULTI_SOURCE_CASES.map(item=>item.id)]);
assert(unifiedCurated.size === 100, `Command Palette must share current exact-100 curated baseline; got ${unifiedCurated.size}.`);

for (const snapshot of ['case-candidates.json','case-review-queue.json']) {
  assert(ui.includes(`./${snapshot}`), `Command Palette must load ${snapshot} when available.`);
}
assert(ui.includes('metaKey') && ui.includes('ctrlKey') && ui.includes("key.toLowerCase() === 'k'"), 'Global Cmd/Ctrl+K shortcut is required.');
assert(ui.includes("event.key === 'ArrowDown'") && ui.includes("event.key === 'ArrowUp'") && ui.includes("event.key === 'Enter'"), 'Keyboard navigation must support arrows and Enter.');
assert(ui.includes('data-command-key'), 'Palette must render stable keyed result rows.');
assert(ui.includes('openDeepReview'), 'Queued research results must support direct Deep Review routing.');
assert(ui.includes('openCurated') && ui.includes('openOriginal') && ui.includes('openResearch') && ui.includes('openSource'), 'Palette must route across curated, originals, research and sources.');
assert(ui.includes('porterCommandRecent'), 'Palette must persist a small local recent-selection list.');
assert(!ui.includes('INDUSTRY_DIGEST.push') && !ui.includes('MULTI_SOURCE_CASES.push'), 'Command Palette must never mutate curated datasets.');
assert(!/digestGrid\.innerHTML\s*=/.test(ui), 'Command Palette may locate curated cards but must never rewrite the curated grid.');
assert(!/digestGrid\.append/.test(ui), 'Command Palette must never append curated cards.');

assert(bootstrap.includes("link.href = './command-palette.css'"), 'Command Palette bootstrap must load CSS.');
assert(bootstrap.includes("await import('./command-palette-ui.js')"), 'Command Palette bootstrap must mount UI.');
for (const prefix of ['>','#','@']) assert(bootstrap.includes(prefix), `Command Palette bootstrap must support clickable ${prefix} prefix.`);
const routerIndex = sidebar.indexOf("import './workspace-router.js';");
const opsIndex = sidebar.indexOf("import './operations-bootstrap.js';");
const paletteIndex = sidebar.indexOf("import './command-palette-bootstrap.js';");
assert(routerIndex >= 0 && paletteIndex > routerIndex, 'Command Palette must mount after central workspace router.');
assert(opsIndex >= 0 && paletteIndex > opsIndex, 'Operations navigation should exist before Command Palette builds its workspace index.');

if (failures.length) {
  console.error('Command Palette contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok:true,
  syntheticIndex:fixture.length,
  unifiedCuratedCases:unifiedCurated.size,
  prefixes:['>','#','@'],
  riskyResearchExcluded:true,
  queuedResearchDirectReview:true,
  keyboard:['Cmd/Ctrl+K','ArrowUp','ArrowDown','Enter','Escape'],
  curatedMutation:false
},null,2));
