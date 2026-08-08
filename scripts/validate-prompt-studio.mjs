#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';
import {
  PROMPT_SECTION_DEFINITIONS,
  createPromptStudioProject,
  forkPromptStudioSource,
  compilePromptProject,
  lintPromptProject,
  validatePromptStudioPatch,
  applyPromptStudioPatch,
  buildDeterministicStudioPatch
} from '../studio/prompt-studio-engine.js';
import { promptStudioSourceCatalog } from '../studio/prompt-studio-source-catalog.js';
import { buildAIRequest, classifyPresetFromInstruction } from '../studio/prompt-studio-ai.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];
assert(curated.length===100,`Prompt Studio must see exact 100 curated cases; got ${curated.length}.`);
assert(new Set(curated.map(item=>item.id)).size===100,'Prompt Studio curated source inventory must contain 100 unique IDs.');
assert(PROMPTS.length===192,`Prompt Studio must see all 192 Porter Originals; got ${PROMPTS.length}.`);
const catalog=promptStudioSourceCatalog();
assert(catalog.curated.length===100,'Unified Studio catalog must expose 100 curated cases.');
assert(catalog.originals.length===192,'Unified Studio catalog must expose 192 Porter Originals.');

const blank=createPromptStudioProject({id:'studio-test',title:'Test project',now:'2026-08-08T00:00:00.000Z'});
assert(blank.kind==='seedance-porter-prompt-studio-project','Studio project kind must be stable.');
assert(blank.sections.length===PROMPT_SECTION_DEFINITIONS.length,'Studio project must contain all canonical sections.');
assert(blank.sections.map(item=>item.id).join('|')===PROMPT_SECTION_DEFINITIONS.map(item=>item.id).join('|'),'Studio sections must preserve canonical compile order.');

const controlled=createPromptStudioProject({
  id:'studio-controlled',mode:'image-to-video',duration:6,
  sections:[
    {id:'objective',content:'Create a premium product hero that proves exact industrial geometry.'},
    {id:'subject',content:'@ref01 is the exact hero device and controls geometry only.'},
    {id:'camera',content:'one slow lateral tracking move'},
    {id:'action',content:'The device remains rigid while one narrow highlight travels across the front surface and settles.'},
    {id:'continuity',content:'Keep device silhouette, proportions, seams and material response identical across the clip.'},
    {id:'constraints',content:'One device only. No topology drift, duplicated parts or invented label text.'}
  ],
  references:[{id:'r1',token:'@ref01',name:'Hero device',mediaType:'image',role:'geometry',locked:true,uri:'https://example.com/device.png'}],
  customRules:['Never combine multiple camera moves.']
});
const compiled=compilePromptProject(controlled);
assert(compiled.includes('REFERENCE JOBS')&&compiled.includes('@ref01'),'Compiler must emit explicit reference jobs.');
assert(compiled.includes('LOCK this property across the clip'),'Locked references must compile as explicit locks.');
assert(!compiled.includes('EDITOR RULES'),'Custom editor rules must stay out of generation prompt by default.');
const controlledLint=lintPromptProject(controlled);
assert(!controlledLint.issues.some(item=>item.id==='image-reference-required'),'Valid i2v project with image reference must pass reference requirement.');

const missingImage=createPromptStudioProject({mode:'image-to-video',sections:[{id:'objective',content:'Create a clear product motion proof for a campaign hero.'},{id:'action',content:'One object rotates slowly and settles into the approved endpoint.'}]});
assert(lintPromptProject(missingImage).issues.some(item=>item.id==='image-reference-required'),'Image-to-video without image reference must error.');

const firstLast=createPromptStudioProject({mode:'first-last-frame',sections:[{id:'objective',content:'Transition between two approved endpoint compositions without identity drift.'},{id:'action',content:'Move from the first approved state into the final approved state with one coherent physical transition.'}],references:[{token:'@ref01',mediaType:'image',role:'first-frame',locked:true}]});
assert(lintPromptProject(firstLast).issues.some(item=>item.id==='last-frame-required'),'First/last mode without last-frame reference must error.');

const cameraConflict=createPromptStudioProject({sections:[{id:'objective',content:'Create a controlled camera demonstration with visible motion hierarchy.'},{id:'camera',content:'locked static camera with an orbit and zoom around the subject'},{id:'action',content:'The subject performs one small motion and returns to a stable endpoint.'}]});
assert(lintPromptProject(cameraConflict).issues.some(item=>item.id==='camera-conflict'),'Locked camera plus orbit/zoom must trigger camera-conflict.');

const curatedFixture={
  id:'case-fixture',title:'Curated fixture',author:'Tester',aspect:'16:9',sourceUrl:'https://example.com/source',tags:['product'],
  porterPrompt:'Core subject: exact device from [Image 1]. Camera: one slow push-in. Continuous action: one highlight moves across the device and settles. Visual style: restrained industrial product film. Constraints: preserve exact geometry; no duplicate device.',
  intelligence:{collections:['Packshot'],whyItWorks:'The prompt separates exact geometry from one visible motion event.',shotBreakdown:[]}
};
const curatedFork=forkPromptStudioSource({kind:'curated',source:curatedFixture});
assert(curatedFork.source.kind==='curated'&&curatedFork.source.id==='case-fixture','Curated source fork must preserve provenance.');
assert(curatedFork.references.length===1&&curatedFork.references[0].token==='@ref01','Curated fork must convert legacy reference token into Studio reference.');
assert(!compilePromptProject(curatedFork).includes('[Image 1]'),'Compiled Studio fork must not retain converted legacy [Image 1] token.');

const originalFixture={id:'original-fixture',title:'Original fixture',use:'Product hero',mode:'reference-to-video',aspect:'16:9',duration:8,refs:['environment','motion'],tags:['hero'],sourceIds:['a'],prompt:'Core subject: a portal based on [Image 1]. Camera/action reference: use only motion rhythm of [Video 1]. Shot 1: one lateral reveal. Visual style: controlled digital hero. Constraints: no invented text.'};
const originalFork=forkPromptStudioSource({kind:'original',source:originalFixture});
assert(originalFork.source.kind==='original','Original fork must preserve original provenance.');
assert(originalFork.mode==='multi-reference','reference-to-video Original must normalize to multi-reference Studio mode.');
assert(originalFork.references.length===2,'Original fork must infer both image/video references.');

const researchFixture={id:'candidate-fixture',title:'Research Candidate',author:'@researcher',sourceUrl:'https://example.com/research',excerpt:'SECRET_EXCERPT_MUST_NOT_BECOME_GENERATION_PROMPT',collections:['Camera','Packshot'],riskFlags:['named-ip-or-celebrity'],score:91};
const researchFork=forkPromptStudioSource({kind:'research',source:researchFixture});
assert(researchFork.source.kind==='research'&&researchFork.source.riskFlags.includes('named-ip-or-celebrity'),'Research fork must preserve risk flags.');
assert(researchFork.notes.includes('SECRET_EXCERPT_MUST_NOT_BECOME_GENERATION_PROMPT'),'Research excerpt should remain visible as provenance note.');
assert(!compilePromptProject(researchFork).includes('SECRET_EXCERPT_MUST_NOT_BECOME_GENERATION_PROMPT'),'Research excerpt must never be silently promoted into generation prompt.');

const invalidPatch=validatePromptStudioPatch(controlled,{summary:'Bad patch',changes:[{sectionId:'unknown-section',content:'x',reason:'bad'}],warnings:[]});
assert(!invalidPatch.ok,'AI/manual patch with unknown section must be rejected.');
const patch={summary:'Change camera only',changes:[{sectionId:'camera',content:'one locked low-angle push-in',reason:'single dominant camera rule'}],warnings:[]};
const beforeAction=controlled.sections.find(item=>item.id==='action').content;
const patched=applyPromptStudioPatch(controlled,patch,{now:'2026-08-08T00:01:00.000Z',source:'test'});
assert(patched.sections.find(item=>item.id==='camera').content==='one locked low-angle push-in','Valid patch must update requested section.');
assert(patched.sections.find(item=>item.id==='action').content===beforeAction,'Patch must not mutate sections not explicitly changed.');
assert(patched.lastPatch?.changes?.[0]?.before,'Applied patch must retain before-text for audit/diff.');

const deterministic=buildDeterministicStudioPatch(controlled,'continuity');
assert(deterministic.changes.some(item=>item.sectionId==='continuity'),'Deterministic rules engine must produce section-level staged changes.');
assert(classifyPresetFromInstruction('сделай камеру проще и убери конфликт')==='camera-cleanup','Russian common instruction should map to deterministic camera preset.');
const aiRequest=buildAIRequest(controlled,'Make motion more physical.');
assert(Array.isArray(aiRequest.project.sections)&&aiRequest.project.sections.length===PROMPT_SECTION_DEFINITIONS.length,'AI request must receive structured sections, not an opaque prompt only.');
assert(aiRequest.project.customRules.includes('Never combine multiple camera moves.'),'AI request must include user custom rules.');

const [engine,ai,ui,store,assets,sourceCatalog,bootstrap]=await Promise.all([
  readFile('studio/prompt-studio-engine.js','utf8'),
  readFile('studio/prompt-studio-ai.js','utf8'),
  readFile('studio/prompt-studio-ui.js','utf8'),
  readFile('studio/prompt-studio-store.js','utf8'),
  readFile('studio/prompt-studio-assets.js','utf8'),
  readFile('studio/prompt-studio-source-catalog.js','utf8'),
  readFile('studio/prompt-studio-bootstrap.js','utf8')
]);
assert(ai.includes('responseConstraint:buildPromptStudioPatchSchema()'),'Built-in AI must request schema-constrained structured patches.');
assert(!ai.includes('applyPromptStudioPatch'),'AI controller must not be able to apply its own patch.');
assert(ui.includes("data-studio-action=\"apply-patch\"")||ui.includes('data-studio-action="apply-patch"'),'Apply must exist only as an explicit UI action.');
assert(ui.includes('createPromptStudioRevision'),'UI must snapshot before applying staged AI changes.');
assert(assets.includes('indexedDB.open')&&!assets.includes('fetch('),'Local reference asset store must use IndexedDB and not upload files.');
assert(store.includes('MAX_REVISIONS = 25'),'Project store must cap local revision history.');
assert(sourceCatalog.includes('CASE_INTELLIGENCE')&&sourceCatalog.includes('MULTI_SOURCE_CASES')&&sourceCatalog.includes('PROMPTS'),'Source catalog must unify curated + multi-source + Originals.');
assert(bootstrap.includes("await import('./prompt-studio-ui.js')"),'Prompt Studio bootstrap must mount editor UI.');
for(const forbidden of ['api.openai.com','generativelanguage.googleapis.com','x-api-key','OPENAI_API_KEY','GEMINI_API_KEY'])assert(!ai.includes(forbidden),`Prompt Studio AI must not ship client-side cloud secret/API integration: ${forbidden}.`);
assert(!ui.includes('CASE_INTELLIGENCE.push')&&!ui.includes('MULTI_SOURCE_CASES.push'),'Prompt Studio UI must never mutate curated datasets.');
assert(!engine.includes('CASE_INTELLIGENCE.push')&&!engine.includes('MULTI_SOURCE_CASES.push'),'Prompt Studio engine must never mutate curated datasets.');

if(failures.length){console.error('Prompt Studio contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,curatedSources:catalog.curated.length,originalSources:catalog.originals.length,sections:PROMPT_SECTION_DEFINITIONS.length,structuredPatch:true,aiAutoApply:false,localAssets:'IndexedDB',cloudApiSecrets:false,exactCurated:curated.length},null,2));
