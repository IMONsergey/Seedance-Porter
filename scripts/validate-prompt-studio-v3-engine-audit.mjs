#!/usr/bin/env node
import { forkPromptStudioSource, applyPromptStudioPatch, createPromptStudioProject } from '../studio/prompt-studio-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const legacy=forkPromptStudioSource({kind:'curated',source:{id:'legacy-audit',title:'Legacy audit',porterPrompt:'Core subject: exact device from [Image 1]. Camera: one slow push-in. Continuous action: preserve [Image 1] geometry while one highlight settles. Constraints: no duplicates.'}});
const compiled=legacy.compiledPrompt||'';
assert(compiled.includes('@ref01'),'Legacy curated fork must compile Studio reference token.');
assert(!compiled.includes('[Image 1]'),'Legacy curated fork must remove bracket legacy token from compiled prompt, including reference notes.');
assert(!legacy.references.some(ref=>Object.prototype.hasOwnProperty.call(ref,'legacyNumber')),'Transient legacyNumber metadata must not persist into canonical project references.');

const base=createPromptStudioProject({id:'patch-audit',sections:[{id:'objective',content:'Create a controlled product motion proof with a stable endpoint.'},{id:'camera',content:'one slow lateral track'},{id:'action',content:'The product remains fixed while one highlight moves and settles.'}]});
const patched=applyPromptStudioPatch(base,{summary:'Camera update',changes:[{sectionId:'camera',content:'one locked low-angle push-in',reason:'single dominant move'}],warnings:[]},{now:'2026-08-08T00:00:00.000Z',source:'test-backend'});
const audit=patched.lastPatch?.changes?.[0];
assert(audit?.before==='one slow lateral track','Patch audit must preserve before-text.');
assert(audit?.after==='one locked low-angle push-in','Patch audit must preserve after-text.');
assert(audit?.content==='one locked low-angle push-in','Patch audit must retain canonical content field for compatibility.');
assert(patched.lastPatch?.backend==='test-backend','Patch audit backend must accept existing source option used by Studio UI.');

if(failures.length){console.error('Prompt Studio v3 engine audit regression failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,legacyReferenceNotesSafe:true,patchBeforeAfterAudit:true,backendCompatibility:true},null,2));
