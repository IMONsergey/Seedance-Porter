#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildCuratedSwapBaseline, verifyCuratedSwapImplementation } from '../studio/curated-swap-guard-engine.js';
import { indexCuratedCaseLocations } from '../studio/curation-staging-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const runtime=await import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href);
const multi=await import(pathToFileURL(resolve('studio/multi-source-index.js')).href);
const before=[
  ...runtime.CASE_INTELLIGENCE.map(item=>({...item,collections:item.intelligence?.collections||[]})),
  ...multi.MULTI_SOURCE_CASES.map(item=>({...item,collections:item.collections||[]}))
];
assert(before.length===100&&new Set(before.map(item=>item.id)).size===100,'Guard baseline requires live exact-100 unique runtime.');

const specs=[
  ['studio/digest-data.js','industry-digest'],
  ['studio/multi-source-cases.js','multi-source'],
  ['studio/multi-source-cases-batch2.js','multi-source'],
  ['studio/multi-source-cases-batch3.js','multi-source'],
  ['studio/multi-source-cases-batch4.js','multi-source'],
  ['studio/multi-source-cases-batch5.js','multi-source']
];
const sourceFiles=[];
for(const [file,dataFamily] of specs){try{sourceFiles.push({file,dataFamily,content:await readFile(file,'utf8')});}catch{}}
const beforeLocations=indexCuratedCaseLocations(sourceFiles);
const remove=before.find(item=>beforeLocations.has(item.id));
assert(Boolean(remove),'Need one live removable case with repository location.');
const incomingId='candidate-swap-guard-new';
const incomingCollections=['Beauty','Packshot'];
const staging={
  schemaVersion:1,kind:'seedance-porter-curation-staging-pack',generatedAt:'2026-08-07T18:00:00.000Z',valid:true,implementationReady:true,approvalRequired:true,autoApply:false,autoPublish:false,
  incoming:{candidateId:incomingId,title:'Incoming Guard Case',collections:incomingCollections},
  proposedRemoval:{id:remove.id,title:remove.title,collections:remove.collections||remove.intelligence?.collections||[],repositoryLocation:beforeLocations.get(remove.id)},
  implementationManifest:{remove:{caseId:remove.id,file:beforeLocations.get(remove.id).file},add:{candidateId:incomingId,suggestedFile:'studio/multi-source-cases-next.js'}}
};

const baseline=await buildCuratedSwapBaseline({stagingPack:staging,beforeCases:before,now:'2026-08-07T18:01:00.000Z'});
assert(baseline.valid,`Valid exact-100 staging must produce a baseline: ${baseline.errors.join('; ')}`);
assert(/^[a-f0-9]{64}$/.test(baseline.baselineHash),'Baseline must have SHA-256 integrity hash.');
assert(baseline.expectedAfter.caseIds.length===100&&baseline.expectedAfter.protectedCaseIds.length===99,'Baseline must protect exactly 99 unchanged incumbents.');
assert(!baseline.expectedAfter.caseIds.includes(remove.id)&&baseline.expectedAfter.caseIds.includes(incomingId),'Baseline expected set must remove one and add one.');

const after=before.filter(item=>item.id!==remove.id).concat({id:incomingId,title:'Incoming Guard Case',collections:incomingCollections});
const afterLocations=new Map(beforeLocations);afterLocations.delete(remove.id);afterLocations.set(incomingId,{file:'studio/multi-source-cases-next.js',dataFamily:'multi-source',indexHint:0});
const verified=await verifyCuratedSwapImplementation({baseline,afterCases:after,afterLocations,now:'2026-08-07T18:02:00.000Z'});
assert(verified.valid,`Exact staged one-out/one-in fixture must verify: ${verified.errors.join('; ')}`);
assert(verified.after.curatedCases===100&&verified.after.uniqueCases===100,'Verified after runtime must remain exact-100 unique.');
assert(verified.collectionMismatches.length===0,'Expected staging Collection deltas must match after runtime.');
assert(verified.autoApprove===false&&verified.autoPublish===false,'Verification must never approve/publish the case.');
assert(/^[a-f0-9]{64}$/.test(verified.verificationHash),'Verification must have SHA-256 integrity hash.');

const extraChange=after.filter(item=>item.id!==before.find(item=>item.id!==remove.id)?.id).concat({id:'unexpected-third-change',collections:['Camera']});
const extraResult=await verifyCuratedSwapImplementation({baseline,afterCases:extraChange,afterLocations:new Map(),now:'2026-08-07T18:02:00.000Z'});
assert(!extraResult.valid,'Changing an additional protected incumbent must fail verification.');
assert(extraResult.errors.some(message=>/Protected incumbent|does not match|Unexpected curated IDs/.test(message)),'Extra curated change must be reported explicitly.');

const duplicateAfter=after.concat({id:incomingId,collections:incomingCollections});
const duplicateResult=await verifyCuratedSwapImplementation({baseline,afterCases:duplicateAfter,afterLocations:new Map(),now:'2026-08-07T18:02:00.000Z'});
assert(!duplicateResult.valid,'101 rows / duplicate incoming must fail exact-100 verification.');

const removedStillPresent=[...before,{id:incomingId,collections:incomingCollections}].slice(0,100);
const removedResult=await verifyCuratedSwapImplementation({baseline,afterCases:removedStillPresent,afterLocations:new Map(),now:'2026-08-07T18:02:00.000Z'});
assert(!removedResult.valid,'Incoming present while removal remains must fail verification.');

const wrongCollections=after.map(item=>item.id===incomingId?{...item,collections:['Camera']}:item);
const collectionResult=await verifyCuratedSwapImplementation({baseline,afterCases:wrongCollections,afterLocations:new Map(),now:'2026-08-07T18:02:00.000Z'});
assert(!collectionResult.valid,'Unexpected Collection membership in incoming case must fail staged Collection verification.');
assert(collectionResult.collectionMismatches.length>0,'Collection mismatch details must be machine-readable.');

const tampered=structuredClone(baseline);tampered.expectedAfter.protectedCaseIds=tampered.expectedAfter.protectedCaseIds.slice(1);
const tamperedResult=await verifyCuratedSwapImplementation({baseline:tampered,afterCases:after,afterLocations:new Map(),now:'2026-08-07T18:02:00.000Z'});
assert(!tamperedResult.valid,'Tampered baseline must fail SHA-256 integrity verification.');
assert(tamperedResult.errors.some(message=>/integrity hash mismatch/.test(message)),'Tampered baseline must report integrity mismatch.');

const invalidStaging=await buildCuratedSwapBaseline({stagingPack:{...staging,implementationReady:false},beforeCases:before,now:'2026-08-07T18:01:00.000Z'});
assert(!invalidStaging.valid,'Baseline cannot be created from non-implementation-ready staging.');

const [engine,builder,verifier]=await Promise.all([
  readFile('studio/curated-swap-guard-engine.js','utf8'),
  readFile('scripts/build-curated-swap-baseline.mjs','utf8'),
  readFile('scripts/verify-curated-swap-implementation.mjs','utf8')
]);
assert(engine.includes('autoApprove:false')&&engine.includes('autoPublish:false'),'Swap verification must explicitly prohibit auto approval/publication.');
assert(engine.includes('protectedCaseIds'),'Baseline must protect the unchanged 99-case set.');
assert(engine.includes("globalThis.crypto.subtle.digest('SHA-256'"),'Guard must hash baseline/set identity with SHA-256.');
assert(!engine.includes('INDUSTRY_DIGEST.push')&&!engine.includes('MULTI_SOURCE_CASES.push'),'Guard engine must never mutate curated datasets.');
assert(builder.includes('buildCuratedSwapBaseline'),'Baseline CLI must use shared guard engine.');
assert(verifier.includes('verifyCuratedSwapImplementation'),'Verification CLI must use shared guard engine.');

if(failures.length){console.error('Curated Swap Guard contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,before:100,protected:99,after:verified.after.curatedCases,uniqueAfter:verified.after.uniqueCases,baselineHash:baseline.baselineHash,verificationHash:verified.verificationHash,autoApprove:false,autoPublish:false},null,2));
