#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';
import { workflowPublishesStudioAsset, workflowUsesBulkStudioPublication } from './pages-publish-policy.mjs';

const paths={sidebar:'studio/sidebar.js',bootstrap:'studio/prompt-studio-v9-bootstrap.js',guard:'studio/prompt-studio-v9-workflow-guard.js',ui:'studio/prompt-studio-v9-console-ui.js',engine:'studio/prompt-studio-generation-evaluation.js',schema:'schemas/prompt-studio-generation-evaluation.schema.json',doc:'docs/PROMPT-STUDIO-V9-GENERATION-CONSOLE.md',memory:'docs/PROJECT-MEMORY.md',memoryJson:'docs/PROJECT-MEMORY.json',pages:'.github/workflows/pages.yml'};
const entries=await Promise.all(Object.entries(paths).map(async([key,path])=>[key,await readFile(path,'utf8')]));const text=Object.fromEntries(entries),failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};const schema=JSON.parse(text.schema),memory=JSON.parse(text.memoryJson);

const order=['prompt-studio-v7-bootstrap.js','prompt-studio-v8-bootstrap.js','prompt-studio-v9-bootstrap.js','command-palette-bootstrap.js'].map(name=>text.sidebar.indexOf(name));assert(order.every(index=>index>=0)&&order.every((value,index)=>index===0||value>order[index-1]),'Sidebar must mount v7 → v8 → v9 → Cmd-K in order.');
assert(text.bootstrap.includes("link.href='./prompt-studio-v9.css'")&&text.bootstrap.indexOf("await import('./prompt-studio-v9-workflow-guard.js')")<text.bootstrap.indexOf("await import('./prompt-studio-v9-console-ui.js')"),'V9 bootstrap must load guard before Generation Console UI.');
for(const marker of ['fetch(','XMLHttpRequest','sendBeacon','ARK_API_KEY','Authorization:'])assert(!text.ui.includes(marker),`V9 browser UI must not contain provider execution/credential marker: ${marker}`);
assert(!text.ui.includes('<video')&&!text.ui.includes('<img'),'V9 Console must not auto-embed remote generated media.');
assert(text.ui.includes('target="_blank"')&&text.ui.includes('rel="noopener noreferrer"'),'Generated media URLs must remain explicit safe external links.');
assert(text.ui.includes('window.porterPromptStudio?.replaceProject')&&text.ui.includes('snapshot:true')&&text.ui.includes('preserveIdentity:true'),'V9 decisions must mutate through revisioned public Prompt Studio API only.');
assert(!/\bstate\.project\b/.test(text.ui),'V9 UI must not access Prompt Studio private project state.');
assert(text.guard.includes("#studioV4Dock [data-v4-dirty=\"true\"]")&&text.guard.includes("#studioV5Dock[data-repair-staged=\"true\"]"),'V9 guard must use direct V4/V5 staged state signals.');
assert(text.guard.includes('[data-v7-action="save-stage"]')&&text.guard.includes('[data-v8-action="save-result"]'),'V9 guard must detect staged V7/V8 returned-result layers.');
assert(text.guard.includes("document.addEventListener('click',event=>")&&text.guard.includes('},true);'),'V9 staged-work blocking must operate in capture phase.');
assert(text.guard.includes("#studioV9ConsoleDock[data-v9-dirty=\"true\"]"),'V9 guard must expose an explicit dirty draft state.');

const dimensionIds=[...text.engine.matchAll(/\{id:'([^']+)',label:/g)].map(match=>match[1]);assert(dimensionIds.length===13&&new Set(dimensionIds).size===13,'V9 engine must define exactly 13 unique production evaluation dimensions.');
assert(text.engine.includes('MAX_GENERATION_EVALUATIONS=200')&&text.engine.includes('MAX_GENERATION_COMPARISONS=100')&&text.engine.includes('MAX_GENERATION_RETAKES=100'),'V9 extension collections must remain bounded.');
assert(text.engine.includes("ids.length<2")&&text.engine.includes("ids.length>8"),'Saved comparison must require 2–8 generation tasks.');
assert(text.engine.includes('if(!comparison.taskIds.includes')&&text.engine.includes('setPromptStudioGenerationWinner'),'Winner must belong to a saved comparison and remain an explicit action.');
assert(text.engine.includes('scoreAverage')&&text.engine.includes('Math.round'),'Overall evaluation score must be a transparent derived average, not opaque model confidence.');
assert(text.ui.includes("['candidate','retake','reject']")&&!text.ui.includes("['candidate','winner','retake','reject']"),'Evaluation form must not auto/easily conflate numeric review with winner selection.');
assert(text.engine.includes('createPromptStudioGenerationRetake')&&text.engine.includes("status:'draft'")&&!text.engine.includes('setSectionContent'),'Retake Draft must record intent without rewriting prompt sections.');
assert(text.engine.includes('attachGenerationWinnerOutput')&&text.engine.includes('attachPromptStudioGenerationOutput'),'Winner continuation must reuse canonical V7 explicit output-reference path.');
assert(text.engine.includes('promptStudioBatchLinkForTask')&&text.engine.includes('normalizePromptStudioVariantSet'),'Comparison view must recover V8 batch and V4 variant lineage dynamically.');

assert(schema.additionalProperties===false,'V9 evaluation extension schema must be closed at top level.');assert(schema.properties?.evaluations?.maxItems===200&&schema.properties?.comparisons?.maxItems===100&&schema.properties?.retakes?.maxItems===100,'V9 schema must enforce bounded extension collections.');assert(schema.$defs?.comparison?.properties?.taskIds?.minItems===2&&schema.$defs?.comparison?.properties?.taskIds?.maxItems===8,'V9 schema must enforce 2–8 comparison tasks.');assert(schema.$defs?.retake?.properties?.status?.const==='draft','Retake schema must remain draft-only.');assert(schema.$defs?.scores?.additionalProperties===false&&Object.keys(schema.$defs.scores.properties||{}).length===13,'Evaluation score schema must contain exactly the 13 named dimensions.');

assert(workflowUsesBulkStudioPublication(text.pages),'Pages must continue bulk publishing top-level Studio JS/CSS assets.');for(const asset of ['prompt-studio-v9-bootstrap.js','prompt-studio-v9-workflow-guard.js','prompt-studio-v9-console-ui.js','prompt-studio-generation-evaluation.js','prompt-studio-v9.css'])assert(workflowPublishesStudioAsset(text.pages,asset),`Pages publication policy must include V9 browser asset ${asset}.`);
assert(text.memory.includes('NOW: Prompt Studio v9 — Generation Console + Evaluation Loop')||text.memory.includes('NOW — v9 Generation Console + Evaluation Loop'),'Canonical project memory must identify V9 as current work.');assert(memory.active?.phase==='prompt-studio-v9-generation-console-evaluation-loop','Machine-readable project memory must identify V9 as active phase.');assert(text.doc.includes('No automatic winner selection exists')&&text.doc.includes('One-lever Retake'),'V9 feature doc must preserve human-winner and one-lever-retake decisions.');

const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`V9 must preserve exactly 100 unique curated cases; got ${curated.length}.`);assert(PROMPTS.length===192,`V9 must preserve exactly 192 Porter Originals; got ${PROMPTS.length}.`);

if(failures.length){console.error('Prompt Studio v9 production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,mountOrder:['v7','v8','v9','cmd-k'],dimensions:13,humanWinnerOnly:true,oneLeverRetake:true,browserProviderExecution:false,autoMediaEmbed:false,comparisonBounds:[2,8],evaluationMax:200,comparisonMax:100,retakeMax:100,projectMemoryCurrent:true,curatedCases:curated.length,porterOriginals:PROMPTS.length},null,2));
