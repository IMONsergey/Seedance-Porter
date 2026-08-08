#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';

const [pages,sidebar,router,bootstrap,ui,bridge,ai]=await Promise.all([
  readFile('.github/workflows/pages.yml','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('studio/workspace-router.js','utf8'),
  readFile('studio/prompt-studio-bootstrap.js','utf8'),
  readFile('studio/prompt-studio-ui.js','utf8'),
  readFile('studio/prompt-studio-source-bridge.js','utf8'),
  readFile('studio/prompt-studio-ai.js','utf8')
]);
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const assets=[
  'prompt-studio.css','prompt-studio-bridge.css','prompt-studio-bootstrap.js','prompt-studio-engine.js','prompt-studio-store.js','prompt-studio-assets.js','prompt-studio-ai.js','prompt-studio-source-catalog.js','prompt-studio-source-bridge.js','prompt-studio-ui.js'
];
for(const asset of assets)assert(pages.includes(`cp studio/${asset} _site/${asset}`),`Pages must publish ${asset}.`);
assert(pages.includes('node scripts/validate-prompt-studio.mjs'),'Pages must run Prompt Studio engine/safety contract.');
assert(pages.includes('node scripts/validate-prompt-studio-production.mjs'),'Pages must run Prompt Studio production contract.');
assert(sidebar.includes("import './prompt-studio-bootstrap.js';"),'Application shell must mount Prompt Studio.');
assert(sidebar.indexOf("import './operations-bootstrap.js';")<sidebar.indexOf("import './prompt-studio-bootstrap.js';"),'Prompt Studio should mount after Operations.');
assert(sidebar.indexOf("import './prompt-studio-bootstrap.js';")<sidebar.indexOf("import './command-palette-bootstrap.js';"),'Prompt Studio must mount before global navigation helpers.');
assert(router.includes("'prompt-studio': 'promptStudioView'"),'Central workspace router must register Prompt Studio.');
assert(bootstrap.includes("await import('./prompt-studio-ui.js')")&&bootstrap.includes("await import('./prompt-studio-source-bridge.js')"),'Prompt Studio bootstrap must mount editor and source bridge.');
assert(bootstrap.includes('./prompt-studio.css')&&bootstrap.includes('./prompt-studio-bridge.css'),'Prompt Studio bootstrap must load editor and bridge styles.');
assert(ui.includes('window.porterPromptStudio'),'Prompt Studio must expose safe open/openSource/compile/lint API for existing surfaces.');
assert(ui.includes('data-studio-action="apply-patch"'),'AI patch apply must be an explicit user action.');
assert(ui.includes('createPromptStudioRevision'),'AI apply path must snapshot current project before applying staged patch.');
assert(bridge.includes('#digestGrid [data-digest-id]'),'Source bridge must decorate curated cards by stable ID.');
assert(bridge.includes('#promptGrid [data-id]'),'Source bridge must decorate Porter Original cards by stable ID.');
assert(bridge.includes('#corpusBody .corpus-card'),'Source bridge must support Research Corpus cards.');
assert(bridge.includes('ambiguous:true'),'Research title bridge must refuse ambiguous title mapping instead of guessing candidate identity.');
assert(!bridge.includes('CASE_INTELLIGENCE.push')&&!bridge.includes('MULTI_SOURCE_CASES.push'),'Source bridge must never mutate curated arrays.');
assert(!ui.includes('CASE_INTELLIGENCE.push')&&!ui.includes('MULTI_SOURCE_CASES.push'),'Prompt Studio UI must never mutate curated arrays.');
assert(!ai.includes('applyPromptStudioPatch'),'AI controller must not own an apply path.');

const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];
assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`Prompt Studio production baseline must remain exactly 100 curated cases; got ${curated.length}.`);
assert(PROMPTS.length===192,`Prompt Studio production baseline must retain 192 Porter Originals; got ${PROMPTS.length}.`);

if(failures.length){console.error('Prompt Studio production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,curatedCases:curated.length,porterOriginals:PROMPTS.length,productionAssets:assets.length,workspaceRoute:true,sourceBridge:true,aiAutoApply:false,curatedMutation:false},null,2));
