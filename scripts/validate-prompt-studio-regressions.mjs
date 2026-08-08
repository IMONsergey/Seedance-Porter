#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import {
  forkPromptStudioSource,
  createPromptStudioProject,
  compilePromptProject,
  lintPromptProject,
  inferReferencesFromPrompt
} from '../studio/prompt-studio-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const refs=inferReferencesFromPrompt('Use the exact geometry from [Image 1], then borrow motion rhythm only from [Video 2].');
assert(refs.length===2,'Legacy source should infer two Studio references.');
assert(refs[0].token==='@ref01'&&refs[0].legacyNumber===1,'First legacy image must retain temporary legacyNumber=1 for token rewrite.');
assert(refs[1].token==='@ref02'&&refs[1].legacyNumber===2,'Second legacy video must retain temporary legacyNumber=2 for token rewrite.');

const repeated=inferReferencesFromPrompt('Keep [Image 1] exact. Return to [Image 1] at the endpoint. Use [Video 1] for motion only.');
assert(repeated.length===2,'Repeated Image 1 plus Video 1 must create two references, not three.');
assert(repeated[0].mediaType==='image'&&repeated[0].legacyNumber===1,'Image 1 must retain its import mapping.');
assert(repeated[1].mediaType==='video'&&repeated[1].legacyNumber===1,'Video 1 must remain distinct from Image 1 even with the same legacy number.');

const fork=forkPromptStudioSource({kind:'curated',source:{
  id:'legacy-fixture',title:'Legacy fixture',
  porterPrompt:'Core subject: exact device from [Image 1]. Camera: use one slow push-in. Continuous action: use the motion rhythm of [Video 2] while the device stays rigid. Constraints: preserve exact geometry.',
  refs:['geometry','motion']
}});
const compiled=compilePromptProject(fork);
assert(compiled.includes('@ref01')&&compiled.includes('@ref02'),'Compiled fork must contain Studio reference tokens.');
assert(!compiled.includes('[Image 1]')&&!compiled.includes('[Video 2]'),'Compiled fork must not retain rewritten legacy reference tokens.');
assert(fork.references.every(ref=>!Object.hasOwn(ref,'legacyNumber')),'Temporary legacyNumber metadata must not persist into the normalized Prompt Studio project.');

const repeatedFork=forkPromptStudioSource({kind:'manual',source:{
  title:'Repeated legacy refs',
  prompt:'Subject: exact object from [Image 1]. Action: reveal the same [Image 1] while using motion rhythm from [Video 1]. Constraints: preserve identity.'
}});
const repeatedCompiled=compilePromptProject(repeatedFork);
assert(!/\[(?:Image|Video)\s*1\]/i.test(repeatedCompiled),'All repeated legacy Image/Video tokens must be removed from compiled output.');
assert((repeatedCompiled.match(/@ref01/g)||[]).length>=2,'Repeated Image 1 occurrences must consistently resolve to @ref01.');
assert(repeatedCompiled.includes('@ref02'),'Video 1 must resolve to a separate @ref02 token.');

const twoMoves=createPromptStudioProject({
  sections:[
    {id:'objective',content:'Create a controlled product move with two deliberate camera phases.'},
    {id:'camera',content:'Begin with a lateral tracking move, then finish with one short push-in.'},
    {id:'action',content:'The product remains stable while the camera changes perspective and settles.'}
  ]
});
const twoMoveLint=lintPromptProject(twoMoves);
assert(twoMoveLint.metrics.cameraMoves===2,`tracking + push-in must count as two camera moves, got ${twoMoveLint.metrics.cameraMoves}.`);
assert(!twoMoveLint.issues.some(item=>item.id==='too-many-camera-moves'),'Two intentional camera moves must not trigger the >2 camera warning.');

const risky=forkPromptStudioSource({kind:'research',source:{
  id:'risk-fixture',title:'Risk fixture',sourceUrl:'https://example.com/source',excerpt:'short provenance excerpt',collections:['Camera'],riskFlags:['named-ip-or-celebrity'],score:90
}});
const riskLint=lintPromptProject(risky);
assert(riskLint.issues.some(item=>item.id==='source-risk-preserved'&&item.severity==='warning'),'Research risk flags must remain visible in live Studio lint.');

const schema=JSON.parse(await readFile('schemas/prompt-studio-project.schema.json','utf8'));
assert(schema.properties?.kind?.const==='seedance-porter-prompt-studio-project','Project schema must lock Prompt Studio project kind.');
assert(schema.properties?.sections?.minItems===13&&schema.properties?.sections?.maxItems===13,'Project schema must lock the canonical 13-section shape.');
assert(schema.properties?.references?.items?.properties?.token?.pattern==='^@ref[0-9]{2,}$','Project schema must lock @ref token format.');
assert(schema.properties?.mode?.enum?.includes('first-last-frame'),'Project schema must include first-last-frame mode.');

if(failures.length){console.error('Prompt Studio regression contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,legacyReferenceRewrite:true,repeatedLegacyReferences:true,legacyMetadataTransient:true,cameraMoveCount:twoMoveLint.metrics.cameraMoves,researchRiskLint:true,schemaShape:'13 canonical sections'},null,2));
