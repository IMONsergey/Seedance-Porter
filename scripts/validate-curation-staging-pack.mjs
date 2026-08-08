#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildCurationStagingPack, renderCurationStagingHtml, indexCuratedCaseLocations } from '../studio/curation-staging-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const runtime=await import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href);
const multi=await import(pathToFileURL(resolve('studio/multi-source-index.js')).href);
const current=[
  ...runtime.CASE_INTELLIGENCE.map(item=>({...item,collections:item.intelligence?.collections||[],evidenceStatus:item.intelligence?.reviewStatus||'prompt-reviewed'})),
  ...multi.MULTI_SOURCE_CASES.map(item=>({...item,collections:item.collections||[],evidenceStatus:item.reviewStatus||item.evidenceStatus||'unknown'}))
];
const ids=new Set(current.map(item=>item.id));
assert(current.length===100&&ids.size===100,`Live staging baseline must be exact-100 unique; got ${current.length}/${ids.size}.`);

const specs=[
  ['studio/digest-data.js','industry-digest'],
  ['studio/multi-source-cases.js','multi-source'],
  ['studio/multi-source-cases-batch2.js','multi-source'],
  ['studio/multi-source-cases-batch3.js','multi-source'],
  ['studio/multi-source-cases-batch4.js','multi-source'],
  ['studio/multi-source-cases-batch5.js','multi-source']
];
const sources=[];
for(const [file,dataFamily] of specs){try{sources.push({file,dataFamily,content:await readFile(file,'utf8')});}catch{}}
const locations=indexCuratedCaseLocations(sources);
const missing=[...ids].filter(id=>!locations.has(id));
assert(missing.length===0,`Every live curated ID must resolve to a data-file location; missing: ${missing.slice(0,12).join(', ')}`);
const duplicate=[...ids].filter(id=>(locations.get(id)?.duplicateLocations||[]).length);
assert(duplicate.length===0,`Curated IDs must not be duplicated across data files; duplicates: ${duplicate.slice(0,12).join(', ')}`);

const removable=current.find(item=>item.id&&locations.has(item.id));
assert(Boolean(removable),'Need one live removable fixture case.');
const incomingId='candidate-staging-new';
const draft={
  schemaVersion:1,kind:'seedance-porter-curation-draft',candidateId:incomingId,reviewStatus:'deep-reviewed',
  case:{id:incomingId,title:'Staged Incoming Case',author:'@new',sourcePlatform:'vimeo',collections:['Beauty','Packshot'],designScore:5,porterAdaptation:'Independent Porter adaptation '.repeat(15)},
  source:{sourceUrl:'https://vimeo.com/123456'},readiness:{score:90}
};
const rotation={
  schemaVersion:1,kind:'seedance-porter-curated-rotation-plan',valid:true,confidence:'high',doNotAutoReplace:true,
  invariant:{curatedSize:100,autoSwap:false,autoPublish:false},
  incoming:{candidateId:incomingId},
  incomingStrategicGain:{score:60},
  decision:{status:'consider-swap',reason:'positive-strategic-upgrade',recommendedSwap:true,removeCaseId:removable.id},
  recommendedReplacement:{removeCaseId:removable.id,netStrategicValue:30,removalPenalty:{score:20},redundancyBonus:{score:8},projectedCollections:[]}
};
const pack=buildCurationStagingPack({curationDraft:draft,rotationPlan:rotation,currentCases:current,caseLocations:locations,now:'2026-08-07T18:00:00.000Z'});
assert(pack.valid,`Valid live staging fixture must pass: ${pack.errors.join('; ')}`);
assert(pack.implementationReady===true,'High-confidence consider-swap fixture should be marked ready for human implementation.');
assert(pack.approvalRequired===true&&pack.autoApply===false&&pack.autoPublish===false,'Staging pack must require human approval and prohibit auto apply/publish.');
assert(pack.invariant.before===100&&pack.invariant.after===100&&pack.invariant.uniqueAfter===100,'Projected staging invariant must remain exact-100 unique.');
assert(pack.proposedRemoval.id===removable.id,'Staging must bind the proposed removal exactly.');
assert(pack.proposedRemoval.repositoryLocation.file===locations.get(removable.id).file,'Staging must preserve exact repository data-file location.');
assert(pack.implementationManifest.remove.file===locations.get(removable.id).file,'Implementation manifest must name exact removal file.');
assert(pack.implementationManifest.preconditions.some(item=>/100 unique/.test(item)),'Implementation preconditions must include exact-100 invariant.');
assert(pack.implementationManifest.postconditions.some(item=>/present exactly once/.test(item)),'Implementation postconditions must require incoming case exactly once.');
assert(pack.humanApproval.approved===false,'Generated staging pack must never self-approve.');

const html=renderCurationStagingHtml(pack);
assert(html.includes('HUMAN APPROVAL REQUIRED'),'HTML preview must visibly require human approval.');
assert(html.includes('INCOMING')&&html.includes('PROPOSED REMOVAL'),'HTML must render side-by-side comparison roles.');
assert(html.includes(removable.id)&&html.includes(incomingId),'HTML must bind both incoming and removal IDs.');
assert(html.includes(locations.get(removable.id).file),'HTML must expose the real removal source file.');
assert(!html.includes('<script'),'Staging HTML should be inert/static, with no executable script.');

const holdPack=buildCurationStagingPack({curationDraft:draft,rotationPlan:{...rotation,decision:{status:'hold',reason:'replacement-cost-exceeds-gain',recommendedSwap:false},recommendedReplacement:null},currentCases:current,caseLocations:locations,now:'2026-08-07T18:00:00.000Z'});
assert(holdPack.valid,'Hold staging preview may remain structurally valid.');
assert(holdPack.implementationReady===false,'Hold decision must never become implementation-ready.');
assert(holdPack.warnings.some(item=>/hold/i.test(item)),'Hold staging must carry explicit warning.');

const wrongSize=buildCurationStagingPack({curationDraft:draft,rotationPlan:rotation,currentCases:current.slice(0,99),caseLocations:locations,now:'2026-08-07T18:00:00.000Z'});
assert(!wrongSize.valid,'99-case current runtime must block staging implementation.');

const duplicateIncoming=buildCurationStagingPack({curationDraft:{...draft,candidateId:removable.id,case:{...draft.case,id:removable.id}},rotationPlan:{...rotation,incoming:{candidateId:removable.id}},currentCases:current,caseLocations:locations,now:'2026-08-07T18:00:00.000Z'});
assert(!duplicateIncoming.valid,'Incoming candidate already curated must block staging.');

const missingLocation=new Map(locations);missingLocation.delete(removable.id);
const noLocation=buildCurationStagingPack({curationDraft:draft,rotationPlan:rotation,currentCases:current,caseLocations:missingLocation,now:'2026-08-07T18:00:00.000Z'});
assert(!noLocation.valid,'Unknown repository removal location must block staging.');

const [engine,cli,workflow]=await Promise.all([
  readFile('studio/curation-staging-engine.js','utf8'),
  readFile('scripts/build-curation-staging-pack.mjs','utf8'),
  readFile('.github/workflows/curation-staging-ci.yml','utf8').catch(()=>''),
]);
assert(engine.includes('autoApply:false')&&engine.includes('autoPublish:false'),'Engine must explicitly prohibit auto apply/publish.');
assert(engine.includes('humanApproval:{required:true,approved:false'),'Generated pack must start unapproved.');
assert(!engine.includes('INDUSTRY_DIGEST.push')&&!engine.includes('MULTI_SOURCE_CASES.push'),'Engine must never mutate curated arrays.');
assert(cli.includes('buildCurationStagingPack')&&cli.includes('renderCurationStagingHtml'),'CLI must use shared JSON + HTML staging engine.');

if(failures.length){console.error('Curation Staging Pack contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,liveCuratedCases:current.length,locatedCuratedCases:[...ids].filter(id=>locations.has(id)).length,removalFixture:removable?.id,stagingReady:pack.implementationReady,htmlStatic:true,autoApply:false,autoPublish:false},null,2));
