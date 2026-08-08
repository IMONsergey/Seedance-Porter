#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createPromptStudioProject } from '../studio/prompt-studio-engine.js';
import {
  normalizeVariableKey,
  setProjectVariable,
  resolvePromptStudioTemplate,
  addProjectIngredient,
  insertIngredientIntoSection,
  resolveVariablesInSection,
  buildPromptStudioVariableReport,
  PROMPT_STUDIO_STARTER_INGREDIENTS
} from '../studio/prompt-studio-ingredients.js';
import {
  addTimelineBeat,
  updateTimelineBeat,
  fitTimelineToProjectDuration,
  timelineWithTimeRanges,
  compileTimelineToTiming,
  syncTimelineToTimingSection,
  importTimelineFromTiming,
  lintPromptStudioTimeline,
  timelineSyncState
} from '../studio/prompt-studio-timeline.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

assert(normalizeVariableKey('Product Name')==='product_name','Variable key normalization must produce stable snake-like keys.');
assert(normalizeVariableKey('9invalid')==='','Variable keys may not start with a digit.');
let project=createPromptStudioProject({
  id:'tools-contract',title:'Product tools contract',duration:6,
  sections:[
    {id:'objective',content:'Create a precise six-second product hero with a stable endpoint.'},
    {id:'action',content:'{{product}} remains rigid while one controlled highlight travels across the surface.'},
    {id:'timing',content:''},
    {id:'continuity',content:''},
    {id:'constraints',content:''}
  ],
  references:[{id:'r1',token:'@ref01',name:'Product',mediaType:'image',role:'geometry',locked:true,uri:'https://example.com/product.png'}]
});
project=setProjectVariable(project,'product','Aster device','Primary product name');
project=setProjectVariable(project,'endpoint_hold','1.2','Final hold seconds');
const resolved=resolvePromptStudioTemplate('{{product}} holds for {{endpoint_hold}}s.',project.variables);
assert(resolved.text==='Aster device holds for 1.2s.','Template resolver must substitute project variables deterministically.');
assert(resolved.unresolved.length===0,'Resolved template must report no unresolved variables.');
const unresolved=resolvePromptStudioTemplate('{{material}} on {{product}}',project.variables);
assert(unresolved.unresolved.includes('material'),'Missing project variables must remain explicit.');

project=addProjectIngredient(project,{id:'endpoint',label:'Stable endpoint',type:'action',defaultSection:'timing',template:'Let {{product}} settle and hold for {{endpoint_hold}} seconds.',tags:['endpoint']});
const beforeSections=Object.fromEntries(project.sections.map(section=>[section.id,section.content]));
const inserted=insertIngredientIntoSection(project,'endpoint','timing');
project=inserted.project;
assert(project.sections.find(section=>section.id==='timing')?.content.includes('Aster device'),'Ingredient insertion must resolve variables into target section.');
for(const section of project.sections.filter(section=>section.id!=='timing'))assert(section.content===beforeSections[section.id],`Ingredient insertion must not modify non-target section ${section.id}.`);

let blocked=false;
const missingIngredient=addProjectIngredient(project,{id:'missing',label:'Missing material',type:'material',defaultSection:'materials',template:'Use {{material}} with stable reflections.'});
try{insertIngredientIntoSection(missingIngredient,'missing','materials');}catch(error){blocked=/unresolved variables/i.test(String(error?.message||error));}
assert(blocked,'Ingredient insertion must block unresolved variables by default.');
const resolvedAction=resolveVariablesInSection(project,'action');
assert(resolvedAction.project.sections.find(section=>section.id==='action')?.content.includes('Aster device'),'Explicit Resolve must update only requested section.');
const variableReport=buildPromptStudioVariableReport(missingIngredient);
assert(variableReport.unresolved.some(item=>item.key==='material'),'Variable report must expose unresolved tokens and scopes.');
assert(PROMPT_STUDIO_STARTER_INGREDIENTS.length>=6,'Production Tools must ship with substantive starter ingredients.');

let timelineProject=project;
timelineProject=addTimelineBeat(timelineProject,{id:'b1',label:'Establish',shotType:'packshot',duration:2,purpose:'Read product identity',camera:'locked tripod',action:'Hold exact @ref01 geometry.',referenceTokens:['@ref01']});
timelineProject=addTimelineBeat(timelineProject,{id:'b2',label:'Motion',shotType:'close-up',duration:2,purpose:'Reveal material response',camera:'slow push-in',action:'One highlight travels across the surface.',referenceTokens:['@ref01']});
timelineProject=addTimelineBeat(timelineProject,{id:'b3',label:'Endpoint',shotType:'packshot',duration:1,purpose:'Create edit-safe endpoint',camera:'locked',action:'Product settles and holds.',referenceTokens:['@ref01']});
const beforeFit=timelineWithTimeRanges(timelineProject);
assert(Math.abs(beforeFit.filter(item=>item.enabled).reduce((sum,item)=>sum+item.duration,0)-5)<0.01,'Fixture timeline must start at five seconds.');
timelineProject=fitTimelineToProjectDuration(timelineProject);
const ranges=timelineWithTimeRanges(timelineProject).filter(item=>item.enabled);
const total=ranges.reduce((sum,item)=>sum+item.duration,0);
assert(Math.abs(total-6)<=0.11,`Fit-to-duration must scale timeline to project duration; got ${total}s.`);
assert(ranges[0].start===0&&Math.abs(ranges[ranges.length-1].end-6)<=0.11,'Timeline ranges must be contiguous from 0 to project duration.');
const timingText=compileTimelineToTiming(timelineProject);
assert(/Beat 1/.test(timingText)&&/Refs: @ref01/.test(timingText),'Timeline compiler must emit numbered beats and reference jobs.');
const preSyncTiming=timelineProject.sections.find(section=>section.id==='timing')?.content;
const synced=syncTimelineToTimingSection(timelineProject);
assert(synced.sections.find(section=>section.id==='timing')?.content===timingText,'Sync must make Timing equal the compiled structured timeline.');
for(const section of synced.sections.filter(section=>section.id!=='timing'))assert(section.content===timelineProject.sections.find(value=>value.id===section.id)?.content,`Timeline sync must not modify non-Timing section ${section.id}.`);
assert(timelineSyncState(synced).inSync,'Timeline sync state must report inSync after explicit sync.');
const imported=importTimelineFromTiming({...synced,timeline:{schemaVersion:1,beats:[]}});
assert(imported.timeline.beats.length===3,'Structured Timing import must recover three beats.');

let broken=updateTimelineBeat(synced,'b2',{camera:'orbit and zoom while tracking',referenceTokens:['@ref99']});
const brokenLint=lintPromptStudioTimeline(broken);
assert(brokenLint.issues.some(item=>item.id==='beat-camera-overload'),'Timeline lint must catch compound per-beat camera moves.');
assert(brokenLint.issues.some(item=>item.id==='beat-reference-unresolved'&&item.severity==='error'),'Timeline lint must catch unresolved beat references.');

const schema=JSON.parse(await readFile('schemas/prompt-studio-production-tools.schema.json','utf8'));
assert(schema.properties?.variables?.items?.properties?.key?.pattern==='^[a-z][a-z0-9_-]{0,63}$','Production Tools schema must lock variable key format.');
assert(schema.properties?.timeline?.properties?.beats?.maxItems===30,'Production Tools schema must cap timeline beat count.');

if(failures.length){console.error('Prompt Studio Production Tools contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,variables:true,ingredientIsolation:true,unresolvedBlocking:true,starterIngredients:PROMPT_STUDIO_STARTER_INGREDIENTS.length,timelineBeats:ranges.length,timelineDuration:total,timingSync:true,timelineLint:true},null,2));
