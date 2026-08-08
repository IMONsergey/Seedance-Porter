#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { SOURCE_PLATFORMS, SOURCE_UNIVERSE } from '../studio/source-universe.js';
import { workflowPublishesStudioAsset, workflowRunsValidator } from './pages-publish-policy.mjs';

const [pages, sidebar, bootstrap, ui] = await Promise.all([
  readFile('.github/workflows/pages.yml','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('studio/command-palette-bootstrap.js','utf8'),
  readFile('studio/command-palette-ui.js','utf8')
]);
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

for(const asset of ['command-palette.css','command-palette-bootstrap.js','command-palette-engine.js','command-palette-ui.js','source-universe.js']){
  assert(workflowPublishesStudioAsset(pages,asset),`Pages must publish ${asset}.`);
}
assert(workflowRunsValidator(pages,'validate-command-palette.mjs'),'Pages must run Command Palette ranking contract.');
assert(workflowRunsValidator(pages,'validate-command-palette-production.mjs'),'Pages must run Command Palette production contract.');
assert(sidebar.includes("import './command-palette-bootstrap.js';"),'Application shell must mount Command Palette.');
assert(sidebar.indexOf("import './operations-bootstrap.js';") < sidebar.indexOf("import './command-palette-bootstrap.js';"),'Palette must mount after Operations so workspace navigation is indexed.');
assert(bootstrap.includes("link.href = './command-palette.css'"),'Palette bootstrap must load CSS.');
assert(bootstrap.includes("typeof Element.prototype.scrollIntoView !== 'function'")&&bootstrap.includes("value() {}"),'Palette bootstrap must degrade safely when scrollIntoView is unavailable in embedded/limited DOM environments.');
assert(ui.includes('case-candidates.json')&&ui.includes('case-review-queue.json'),'Palette must gracefully enrich index from research snapshots.');
assert(ui.includes('metaKey')&&ui.includes('ctrlKey'),'Palette must support Cmd/Ctrl+K.');
assert(ui.includes("import { SOURCE_UNIVERSE } from './source-universe.js';"),'Palette must consume the canonical derived Source Universe export.');
assert(SOURCE_UNIVERSE.length===SOURCE_PLATFORMS.length,`Source Universe must remain a one-to-one projection of source platforms; got ${SOURCE_UNIVERSE.length}/${SOURCE_PLATFORMS.length}.`);
assert(SOURCE_UNIVERSE.length===31,`Current Source Universe contract expects 31 platform/source families; got ${SOURCE_UNIVERSE.length}.`);
assert(SOURCE_UNIVERSE.every(item=>item.id&&item.title&&item.platform&&item.description),'Every Source Universe record must expose searchable id/title/platform/description fields.');
assert(!/digestGrid\.innerHTML\s*=/.test(ui)&&!ui.includes('INDUSTRY_DIGEST.push')&&!ui.includes('MULTI_SOURCE_CASES.push'),'Palette must not mutate curated runtime/grid.');
const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];
assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`Palette production baseline must be exact 100 curated cases; got ${curated.length}.`);

if(failures.length){console.error('Command Palette production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,curatedCases:curated.length,sourceUniverse:SOURCE_UNIVERSE.length,assets:['command-palette.css','command-palette-bootstrap.js','command-palette-engine.js','command-palette-ui.js','source-universe.js'],publicationPolicy:'shared',shortcut:'Cmd/Ctrl+K',scrollCapabilityFallback:true,curatedMutation:false},null,2));
