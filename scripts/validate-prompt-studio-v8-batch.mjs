#!/usr/bin/env node
import { createPromptStudioProject, refreshPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { createPromptStudioVariantSet, capturePromptStudioVariant } from '../studio/prompt-studio-variants.js';
import { buildPromptStudioVariantBatchPlan, promptStudioBatchLinkForTask, savePromptStudioBatchResult, validatePromptStudioBatchPlan, validatePromptStudioBatchResult } from '../studio/prompt-studio-generation-batch.js';
import { listPromptStudioGenerationRecords } from '../studio/prompt-studio-generation-results.js';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
let networkCalls=0;const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{networkCalls++;throw new Error('Browser batch plan must not use fetch.');};

try{
  const project=createPromptStudioProject({id:'v8-project',title:'Variant batch project',mode:'text-to-video',aspect:'16:9',duration:6,now:'2026-08-08T14:00:00.000Z',sections:[
    {id:'objective',content:'Create one controlled six-second product study.'},
    {id:'subject',content:'A single matte sculptural object centered in frame.'},
    {id:'camera',content:'Static eye-level medium shot.'},
    {id:'action',content:'A highlight moves once across the surface while the object remains stable.'},
    {id:'lighting',content:'Large soft source from camera-left with controlled falloff.'},
    {id:'continuity',content:'Keep geometry, material and scale stable for the full clip.'},
    {id:'constraints',content:'One object only. No text, logo, duplicate geometry or topology drift.'}
  ]});
  let set=createPromptStudioVariantSet(project,{id:'base',label:'Frozen Base',now:'2026-08-08T14:00:01.000Z'});
  const a=refreshPromptStudioProject({...structuredClone(project),sections:project.sections.map(section=>section.id==='camera'?{...section,content:'Slow precise push-in, no pan or orbit.'}:section)},'2026-08-08T14:00:02.000Z');
  set=capturePromptStudioVariant(a,set,'Push In',{id:'variant-push',now:'2026-08-08T14:00:03.000Z'});
  const b=refreshPromptStudioProject({...structuredClone(project),sections:project.sections.map(section=>section.id==='camera'?{...section,content:'Locked-off symmetrical camera; only lighting changes.'}:section)},'2026-08-08T14:00:04.000Z');
  set=capturePromptStudioVariant(b,set,'Locked',{id:'variant-locked',now:'2026-08-08T14:00:05.000Z'});
  project.variants=set;

  const plan=await buildPromptStudioVariantBatchPlan(project,['variant-push','variant-locked'],{now:'2026-08-08T14:00:10.000Z',provider:{resolution:'1080p',generateAudio:true}});
  assert(networkCalls===0,'Building a batch plan must execute zero provider network calls.');
  assert(plan.ready===true&&plan.items.length===2,'Two selected variants must create two ready batch items.');
  assert(plan.items.every(item=>item.providerExport?.ready===true),'Every batch item must contain its own ready provider export.');
  assert(plan.items[0].exportHash!==plan.items[1].exportHash,'Different variant prompt projections must produce distinct provider export hashes.');
  assert(plan.items.every(item=>item.providerExport.studioLink?.projectId===project.id),'Every provider export must preserve canonical Studio project ID lineage.');
  assert(plan.items.every(item=>item.providerExport.studioLink?.projectUpdatedAt===project.updatedAt),'Every provider export must preserve canonical project version rather than derived materialization timestamp.');
  assert(plan.policy.autoSubmit===false&&plan.policy.browserNetwork===false&&plan.policy.clientSecrets===false&&plan.policy.ambiguousSubmissionRetry===false,'Batch plan policy must forbid browser execution, client secrets and ambiguous auto-retry.');
  assert(plan.execution.maxLocalConcurrency===8&&plan.execution.recommendedLocalConcurrency===2,'Plan must expose bounded local concurrency without claiming provider quota.');
  const valid=await validatePromptStudioBatchPlan(plan);assert(valid.ok,'Fresh batch plan must pass integrity/preflight validation.');

  const tampered=structuredClone(plan);tampered.items[0].providerExport.previewPayload.duration=15;
  assert(!(await validatePromptStudioBatchPlan(tampered)).ok,'Tampered provider export must fail item hash/full plan integrity validation.');
  const credential=structuredClone(plan);credential.debug={Authorization:'Bearer secret'};
  const credentialValidation=await validatePromptStudioBatchPlan(credential);assert(!credentialValidation.ok&&credentialValidation.errors.includes('credential-like-field-present'),'Batch plan must reject nested credential-like fields.');

  const result={kind:'seedance-porter-generation-batch-result',schemaVersion:1,batchId:'batch-v8-test',planHash:plan.integrity.contentHash,project:structuredClone(plan.project),status:'succeeded',createdAt:'2026-08-08T14:01:00.000Z',completedAt:'2026-08-08T14:02:00.000Z',recordedAt:'2026-08-08T14:02:01.000Z',items:plan.items.map((item,index)=>({itemId:item.itemId,variant:structuredClone(item.variant),exportHash:item.exportHash,taskId:`cgt-v8-${index+1}`,status:'succeeded',result:{kind:'seedance-porter-generation-result',schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',taskId:`cgt-v8-${index+1}`,status:'succeeded',succeeded:true,terminal:true,exportHash:item.exportHash,studioLink:structuredClone(item.providerExport.studioLink),output:{videoUrl:`https://cdn.example.com/v8-${index+1}.mp4`,lastFrameUrl:`https://cdn.example.com/v8-${index+1}-last.png`},usage:null,error:null,providerMeta:{model:'dreamina-seedance-2-0-260128',resolution:'1080p',ratio:'16:9',duration:6},createdAt:'2026-08-08T14:01:00.000Z',completedAt:'2026-08-08T14:02:00.000Z',recordedAt:'2026-08-08T14:02:01.000Z',policy:{secretPersisted:false,externalExecution:true}},error:null})),policy:{secretPersisted:false,externalExecution:true,automaticRetry:false}};
  const resultValidation=validatePromptStudioBatchResult(result);assert(resultValidation.ok,'Terminal per-item batch result must validate before project mutation.');
  let saved=savePromptStudioBatchResult(project,result,{now:Date.parse('2026-08-08T14:03:00Z')});
  const records=listPromptStudioGenerationRecords(saved);assert(records.length===2&&records.every(record=>record.status==='succeeded'),'Saving a successful batch must add both terminal items to v7 generation history.');
  assert(promptStudioBatchLinkForTask(saved,'cgt-v8-1')?.variantId==='variant-push','Batch history must retain variant lineage for each generated task.');
  assert(promptStudioBatchLinkForTask(saved,'cgt-v8-2')?.planHash===plan.integrity.contentHash,'Batch task lineage must retain the source batch plan hash.');
  saved=refreshPromptStudioProject(saved,'2026-08-08T14:04:00.000Z');
  assert(listPromptStudioGenerationRecords(saved).length===2,'Core project refresh must preserve batch-imported generation history extensions.');
  assert(promptStudioBatchLinkForTask(saved,'cgt-v8-1')?.variantHash===plan.items[0].variant.variantHash,'Core project refresh must preserve generationBatchLinks extension.');

  const badResult=structuredClone(result);badResult.items[0].result.exportHash='a'.repeat(64);
  assert(!validatePromptStudioBatchResult(badResult).ok,'Batch result must reject per-item result/export lineage mismatch.');
  const uncertain=structuredClone(result);uncertain.status='completed-with-errors';uncertain.items[0]={...uncertain.items[0],taskId:'',status:'submission-uncertain',result:null,error:{code:'network-error',message:'Unknown POST outcome'}};
  assert(validatePromptStudioBatchResult(uncertain).ok,'submission-uncertain item without task/result must remain representable for manual reconciliation.');

  if(failures.length){console.error('Prompt Studio v8 Batch Plan contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,variants:2,planIntegrity:true,providerExports:2,browserNetworkCalls:networkCalls,tamperBlocked:true,credentialsBlocked:true,batchResultImport:true,batchLinks:true,maxItems:20,maxLocalConcurrency:8},null,2));
}finally{globalThis.fetch=originalFetch;}
