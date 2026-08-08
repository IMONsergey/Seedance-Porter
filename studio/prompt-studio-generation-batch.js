import { normalizePromptStudioVariantSet, materializePromptStudioVariant } from './prompt-studio-variants.js';
import { buildPromptStudioGenerationHandoff } from './prompt-studio-generation-handoff.js';
import { buildSeedance2ModelArkExport } from './prompt-studio-seedance-adapter.js';
import { containsCredentialLikeField, savePromptStudioGenerationArtifact, validatePromptStudioGenerationArtifact } from './prompt-studio-generation-results.js';

export const PROMPT_STUDIO_BATCH_PLAN_KIND='seedance-porter-generation-batch-plan';
export const PROMPT_STUDIO_BATCH_RESULT_KIND='seedance-porter-generation-batch-result';
export const PROMPT_STUDIO_BATCH_LINKS_KEY='generationBatchLinks';
export const MAX_PROMPT_STUDIO_BATCH_ITEMS=20;
const TERMINAL_ITEM_STATUSES=new Set(['succeeded','failed','cancelled','expired']);
const REVIEW_STOP_STATUSES=new Set(['submission-uncertain','blocked']);

export function listPromptStudioBatchVariants(project){
  const set=normalizePromptStudioVariantSet(project?.variants,project);
  return(set.items||[]).map(item=>({id:String(item.id||''),label:String(item.label||item.id||'Variant'),status:String(item.status||'draft'),isBase:item.status==='base',notes:String(item.notes||''),delta:clone(item.delta||{})}));
}

export async function buildPromptStudioVariantBatchPlan(project,variantIds,options={}){
  if(!project||typeof project!=='object')throw new Error('Prompt Studio project is required.');
  const set=normalizePromptStudioVariantSet(project.variants,project),available=new Map((set.items||[]).map(item=>[item.id,item]));
  const ids=[...new Set((variantIds||[]).map(String).filter(Boolean))];
  if(!ids.length)throw new Error('Select at least one variant for the batch plan.');
  if(ids.length>MAX_PROMPT_STUDIO_BATCH_ITEMS)throw new Error(`Batch plan is limited to ${MAX_PROMPT_STUDIO_BATCH_ITEMS} items.`);
  const unknown=ids.filter(id=>!available.has(id));if(unknown.length)throw new Error(`Unknown variants: ${unknown.join(', ')}`);
  const createdAt=new Date(options.now||Date.now()).toISOString(),items=[];
  for(let index=0;index<ids.length;index++){
    const id=ids[index],variant=available.get(id);let materialized;
    try{materialized=materializePromptStudioVariant(project,set,id,{now:options.now||Date.now()});}
    catch(error){items.push(failedPlanItem(index,variant,`materialize:${String(error?.message||error)}`));continue;}
    materialized.id=project.id;materialized.createdAt=project.createdAt;materialized.updatedAt=project.updatedAt;
    try{
      const handoff=await buildPromptStudioGenerationHandoff(materialized,{now:createdAt,target:'byteplus-modelark'});
      const providerExport=await buildSeedance2ModelArkExport(handoff,options.provider||{});
      const variantHash=await sha256Hex(stable({id:variant.id,label:variant.label,status:variant.status,delta:variant.delta||{}}));
      const exportHash=await sha256Hex(stable(providerExport));
      items.push({itemId:itemId(index,variant.id),variant:{id:variant.id,label:String(variant.label||variant.id),status:String(variant.status||'draft'),isBase:variant.status==='base',variantHash},ready:Boolean(providerExport.ready),errors:[...(providerExport.errors||[])],warnings:[...(providerExport.warnings||[])],exportHash,providerExport});
    }catch(error){items.push(failedPlanItem(index,variant,`export:${String(error?.message||error)}`));}
  }
  const errors=items.flatMap(item=>item.ready?[]:item.errors.map(error=>`${item.itemId}:${error}`)),warnings=items.flatMap(item=>item.warnings.map(warning=>`${item.itemId}:${warning}`));
  const core={kind:PROMPT_STUDIO_BATCH_PLAN_KIND,schemaVersion:1,createdAt,project:{id:String(project.id||''),updatedAt:String(project.updatedAt||''),title:String(project.title||'')},ready:items.length===ids.length&&items.every(item=>item.ready),errors:[...new Set(errors)],warnings:[...new Set(warnings)],items,execution:{provider:'byteplus-modelark',adapter:'seedance-2.0',recommendedLocalConcurrency:2,maxLocalConcurrency:8},policy:{autoSubmit:false,browserNetwork:false,clientSecrets:false,requiresExternalExecution:true,automaticRetry:false,ambiguousSubmissionRetry:false}};
  return{...core,integrity:{algorithm:'sha-256',canonicalization:'stable-json-v1',contentHash:await sha256Hex(stable(core))}};
}

export async function validatePromptStudioBatchPlan(plan){
  const errors=[];
  if(!plan||plan.kind!==PROMPT_STUDIO_BATCH_PLAN_KIND)errors.push('invalid-kind');
  if(plan?.schemaVersion!==1)errors.push('invalid-schema-version');
  if(containsCredentialLikeField(plan))errors.push('credential-like-field-present');
  if(!String(plan?.project?.id||'').trim())errors.push('project-id-missing');
  if(!String(plan?.project?.updatedAt||'').trim())errors.push('project-version-missing');
  if(!Array.isArray(plan?.items)||plan.items.length<1||plan.items.length>MAX_PROMPT_STUDIO_BATCH_ITEMS)errors.push('invalid-item-count');
  const policy=plan?.policy||{};if(policy.autoSubmit!==false||policy.browserNetwork!==false||policy.clientSecrets!==false||policy.requiresExternalExecution!==true||policy.automaticRetry!==false||policy.ambiguousSubmissionRetry!==false)errors.push('unsafe-policy');
  const seen=new Set();
  for(const item of plan?.items||[]){
    if(!item?.itemId||seen.has(item.itemId))errors.push('duplicate-or-missing-item-id');seen.add(item?.itemId);
    if(!item?.variant?.id)errors.push(`variant-id-missing:${item?.itemId||'unknown'}`);
    if(!/^[a-f0-9]{64}$/i.test(String(item?.variant?.variantHash||'')))errors.push(`variant-hash-invalid:${item?.itemId||'unknown'}`);
    if(!/^[a-f0-9]{64}$/i.test(String(item?.exportHash||'')))errors.push(`export-hash-invalid:${item?.itemId||'unknown'}`);
    if(item?.ready!==true)errors.push(`item-not-ready:${item?.itemId||'unknown'}`);
    if(!providerExportLooksExecutable(item?.providerExport))errors.push(`provider-export-unsafe:${item?.itemId||'unknown'}`);
    if(item?.providerExport){
      const actual=await sha256Hex(stable(item.providerExport));if(actual!==String(item.exportHash||''))errors.push(`provider-export-hash-mismatch:${item.itemId}`);
      const link=item.providerExport.studioLink;if(!link)errors.push(`provider-studio-link-missing:${item.itemId}`);else{if(String(link.projectId)!==String(plan?.project?.id||''))errors.push(`provider-project-mismatch:${item.itemId}`);if(String(link.projectUpdatedAt)!==String(plan?.project?.updatedAt||''))errors.push(`provider-project-version-mismatch:${item.itemId}`);if(!/^[a-f0-9]{64}$/i.test(String(link.handoffHash||'')))errors.push(`provider-handoff-hash-invalid:${item.itemId}`);}
    }
  }
  if(plan?.ready!==true)errors.push('plan-not-ready');
  const core=clone(plan);delete core.integrity;const expected=await sha256Hex(stable(core));
  if(plan?.integrity?.algorithm!=='sha-256'||plan?.integrity?.canonicalization!=='stable-json-v1'||plan?.integrity?.contentHash!==expected)errors.push('integrity-mismatch');
  return{ok:errors.length===0,errors:[...new Set(errors)],expectedHash:expected};
}

export function validatePromptStudioBatchResult(value){
  const errors=[];
  if(!value||value.kind!==PROMPT_STUDIO_BATCH_RESULT_KIND)errors.push('invalid-kind');
  if(value?.schemaVersion!==1)errors.push('invalid-schema-version');
  if(containsCredentialLikeField(value))errors.push('credential-like-field-present');
  if(!/^[a-f0-9]{64}$/i.test(String(value?.planHash||'')))errors.push('plan-hash-invalid');
  if(!String(value?.project?.id||'').trim())errors.push('project-id-missing');
  if(!String(value?.project?.updatedAt||'').trim())errors.push('project-version-missing');
  if(!Array.isArray(value?.items)||value.items.length<1||value.items.length>MAX_PROMPT_STUDIO_BATCH_ITEMS)errors.push('invalid-item-count');
  if(value?.policy?.secretPersisted!==false||value?.policy?.externalExecution!==true||value?.policy?.automaticRetry!==false)errors.push('unsafe-policy');
  const seen=new Set();
  for(const item of value?.items||[]){
    const status=String(item?.status||'');if(!item?.itemId||seen.has(item.itemId))errors.push('duplicate-or-missing-item-id');seen.add(item?.itemId);
    if(!item?.variant?.id)errors.push(`variant-id-missing:${item?.itemId||'unknown'}`);
    if(!/^[a-f0-9]{64}$/i.test(String(item?.variant?.variantHash||'')))errors.push(`variant-hash-invalid:${item?.itemId||'unknown'}`);
    if(!/^[a-f0-9]{64}$/i.test(String(item?.exportHash||'')))errors.push(`export-hash-invalid:${item?.itemId||'unknown'}`);
    if(!TERMINAL_ITEM_STATUSES.has(status)&&!REVIEW_STOP_STATUSES.has(status))errors.push(`invalid-result-status:${item?.itemId||'unknown'}`);
    if(TERMINAL_ITEM_STATUSES.has(status)){
      if(!item?.result)errors.push(`terminal-result-missing:${item.itemId}`);
      else{
        const validation=validatePromptStudioGenerationArtifact(item.result);if(!validation.ok)errors.push(`invalid-generation-result:${item.itemId}:${validation.errors.join('|')}`);
        if(String(item.result?.taskId||'')!==String(item.taskId||''))errors.push(`task-result-mismatch:${item.itemId}`);
        if(String(item.result?.status||'')!==status)errors.push(`status-result-mismatch:${item.itemId}`);
        if(String(item.result?.exportHash||'').toLowerCase()!==String(item.exportHash||'').toLowerCase())errors.push(`export-result-mismatch:${item.itemId}`);
        const link=item.result?.studioLink;if(!link)errors.push(`result-studio-link-missing:${item.itemId}`);else{if(String(link.projectId)!==String(value?.project?.id||''))errors.push(`result-project-mismatch:${item.itemId}`);if(String(link.projectUpdatedAt)!==String(value?.project?.updatedAt||''))errors.push(`result-project-version-mismatch:${item.itemId}`);}
      }
    }else if(item?.result)errors.push(`review-stop-must-not-have-result:${item.itemId}`);
  }
  const items=Array.isArray(value?.items)?value.items:[],expectedStatus=items.length&&items.every(item=>item.status==='succeeded')?'succeeded':'completed-with-errors';if(String(value?.status||'')!==expectedStatus)errors.push('batch-status-item-mismatch');
  return{ok:errors.length===0,errors:[...new Set(errors)]};
}

export function savePromptStudioBatchResult(project,batchResult,options={}){
  const validation=validatePromptStudioBatchResult(batchResult);if(!validation.ok)throw new Error(`Batch result is not safe to save: ${validation.errors.join(', ')}`);
  if(String(batchResult?.project?.id||'')!==String(project?.id||''))throw new Error(`Batch result belongs to a different Prompt Studio project (${batchResult?.project?.id||'unknown'}).`);
  let next=clone(project);const links=normalizeBatchLinks(next[PROMPT_STUDIO_BATCH_LINKS_KEY]);
  for(const item of batchResult.items){
    if(!item.result)continue;
    next=savePromptStudioGenerationArtifact(next,item.result,{now:options.now||Date.now()});
    links[String(item.result.taskId)]={batchId:String(batchResult.batchId||''),planHash:String(batchResult.planHash||''),itemId:String(item.itemId||''),variantId:String(item.variant?.id||''),variantLabel:String(item.variant?.label||''),variantHash:String(item.variant?.variantHash||''),exportHash:String(item.exportHash||''),savedAt:new Date(options.now||Date.now()).toISOString()};
  }
  next[PROMPT_STUDIO_BATCH_LINKS_KEY]=links;return next;
}

export function promptStudioBatchLinkForTask(project,taskId){return normalizeBatchLinks(project?.[PROMPT_STUDIO_BATCH_LINKS_KEY])[String(taskId||'')]||null;}

function providerExportLooksExecutable(value){const policy=value?.policy||{};return Boolean(value&&value.kind==='seedance-porter-provider-export'&&value.schemaVersion===1&&value.provider==='byteplus-modelark'&&value.adapter==='seedance-2.0'&&value.ready===true&&value.payload&&policy.autoSubmit===false&&policy.apiKeyEmbedded===false&&policy.networkRequest===false&&policy.requiresExternalExecution===true&&!containsCredentialLikeField(value));}
function failedPlanItem(index,variant,error){return{itemId:itemId(index,variant?.id||'unknown'),variant:{id:String(variant?.id||''),label:String(variant?.label||variant?.id||'Unknown'),status:String(variant?.status||''),isBase:variant?.status==='base',variantHash:'0'.repeat(64)},ready:false,errors:[String(error||'batch-item-failed')],warnings:[],exportHash:'0'.repeat(64),providerExport:null};}
function itemId(index,variantId){return`item-${String(index+1).padStart(2,'0')}-${safeId(variantId)}`;}
function normalizeBatchLinks(value){const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;for(const[taskId,item]of Object.entries(value)){if(!item||typeof item!=='object'||containsCredentialLikeField(item))continue;const planHash=String(item.planHash||'').toLowerCase(),variantHash=String(item.variantHash||'').toLowerCase(),exportHash=String(item.exportHash||'').toLowerCase();if(!/^[a-f0-9]{64}$/.test(planHash)||!/^[a-f0-9]{64}$/.test(variantHash)||!/^[a-f0-9]{64}$/.test(exportHash))continue;out[taskId]={batchId:String(item.batchId||''),planHash,itemId:String(item.itemId||''),variantId:String(item.variantId||''),variantLabel:String(item.variantLabel||''),variantHash,exportHash,savedAt:safeDate(item.savedAt)};}return out;}
function safeDate(value){if(!value)return null;const date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString();}
function safeId(value){return String(value||'variant').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,48)||'variant';}
function stable(value){if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;if(value&&typeof value==='object')return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;return JSON.stringify(value);}
async function sha256Hex(value){const subtle=globalThis.crypto?.subtle;if(!subtle)throw new Error('WebCrypto SHA-256 is unavailable.');const digest=await subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')));return[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
