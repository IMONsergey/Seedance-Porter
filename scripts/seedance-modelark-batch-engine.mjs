import { randomUUID } from 'node:crypto';
import { validatePromptStudioBatchPlan, PROMPT_STUDIO_BATCH_RESULT_KIND } from '../studio/prompt-studio-generation-batch.js';
import { buildGenerationResult, cancelQueuedSeedanceGeneration, retrieveSeedanceGeneration, submitSeedanceGeneration, waitForSeedanceGeneration } from './seedance-modelark-runner-engine.mjs';
import { applyExportStudioLinkToJob, applyJobStudioLinkToResult } from './seedance-modelark-runner-lineage.mjs';

export const SEEDANCE_BATCH_JOB_KIND='seedance-porter-generation-batch-job';
export const MAX_BATCH_CONCURRENCY=8;
const PROVIDER_TERMINAL=new Set(['succeeded','failed','cancelled','expired']);
const REVIEW_STOP=new Set(['submission-uncertain','blocked']);
const ITEM_STATUSES=new Set(['pending','submitting','submitted','queued','running','unknown','interrupted','submission-uncertain','blocked','succeeded','failed','cancelled','expired']);
const BATCH_STATUSES=new Set(['pending','running','needs-resume','needs-review','succeeded','completed-with-errors']);
const BATCH_TERMINAL=new Set(['succeeded','completed-with-errors']);

export class SeedanceBatchError extends Error{constructor(code,message,details={}){super(message);this.name='SeedanceBatchError';this.code=code;this.details=details;}}

export async function createSeedanceBatchJob(plan,{concurrency=2,now=Date.now()}={}){
  const planValidation=await validatePromptStudioBatchPlan(plan);if(!planValidation.ok)throw new SeedanceBatchError('invalid-batch-plan',`Batch plan is not executable: ${planValidation.errors.join(', ')}`,{errors:planValidation.errors});
  const localConcurrency=normalizeConcurrency(concurrency),createdAt=iso(now);
  return sanitizeBatchJob({kind:SEEDANCE_BATCH_JOB_KIND,schemaVersion:1,batchId:`batch-${String(plan.integrity.contentHash).slice(0,12)}-${randomUUID().slice(0,8)}`,planHash:String(plan.integrity.contentHash),project:clone(plan.project),status:'pending',localConcurrency,createdAt,updatedAt:createdAt,completedAt:null,items:plan.items.map(item=>({itemId:item.itemId,variant:clone(item.variant),exportHash:item.exportHash,status:'pending',job:null,result:null,error:null,startedAt:null,updatedAt:createdAt,completedAt:null})),policy:{secretPersisted:false,apiKeySource:'environment',externalExecution:true,automaticRetry:false,ambiguousSubmissionRetry:false}});
}

export function validateSeedanceBatchJob(job,plan=null){
  const errors=[];
  if(!job||job.kind!==SEEDANCE_BATCH_JOB_KIND)errors.push('invalid-kind');if(job?.schemaVersion!==1)errors.push('invalid-schema-version');
  if(!String(job?.batchId||''))errors.push('batch-id-missing');if(!/^[a-f0-9]{64}$/i.test(String(job?.planHash||'')))errors.push('plan-hash-invalid');
  if(!Array.isArray(job?.items)||job.items.length<1||job.items.length>20)errors.push('invalid-item-count');
  if(!Number.isInteger(Number(job?.localConcurrency))||Number(job.localConcurrency)<1||Number(job.localConcurrency)>MAX_BATCH_CONCURRENCY)errors.push('invalid-concurrency');
  const policy=job?.policy||{};if(policy.secretPersisted!==false||policy.apiKeySource!=='environment'||policy.externalExecution!==true||policy.automaticRetry!==false||policy.ambiguousSubmissionRetry!==false)errors.push('unsafe-policy');
  if(containsCredentialLikeField(job))errors.push('credential-like-field-persisted');
  const seen=new Set();
  for(const item of job?.items||[]){
    const status=String(item?.status||'');if(!item?.itemId||seen.has(item.itemId))errors.push('duplicate-or-missing-item-id');seen.add(item?.itemId);
    if(!ITEM_STATUSES.has(status))errors.push(`invalid-item-status:${item?.itemId||'unknown'}`);if(!/^[a-f0-9]{64}$/i.test(String(item?.exportHash||'')))errors.push(`export-hash-invalid:${item?.itemId||'unknown'}`);
    if(item?.job&&String(item.job.exportHash||'')!==String(item.exportHash||''))errors.push(`job-export-hash-mismatch:${item.itemId}`);
    if(item?.job&&item?.result&&String(item.result.taskId||'')!==String(item.job.taskId||''))errors.push(`job-result-task-mismatch:${item.itemId}`);
    if(status==='submission-uncertain'&&item?.job?.taskId)errors.push(`submission-uncertain-has-task-id:${item.itemId}`);
    if(REVIEW_STOP.has(status)&&item?.result)errors.push(`review-stop-result-present:${item.itemId}`);
    if(REVIEW_STOP.has(status)&&!item?.completedAt)errors.push(`review-stop-completed-at-missing:${item.itemId}`);
    if(PROVIDER_TERMINAL.has(status)&&(!item?.job||!item?.result||String(item.result.status||'')!==status))errors.push(`terminal-result-invalid:${item.itemId}`);
    if(PROVIDER_TERMINAL.has(status)&&!item?.completedAt)errors.push(`terminal-completed-at-missing:${item.itemId}`);
  }
  const batchStatus=String(job?.status||''),complete=isBatchComplete(job?.items||[]);if(!BATCH_STATUSES.has(batchStatus))errors.push('invalid-batch-status');if(complete){if(!BATCH_TERMINAL.has(batchStatus))errors.push('complete-batch-status-mismatch');if(!job?.completedAt)errors.push('complete-batch-completed-at-missing');}else{if(BATCH_TERMINAL.has(batchStatus))errors.push('incomplete-batch-terminal-status');if(job?.completedAt!=null)errors.push('incomplete-batch-completed-at-present');}
  if(plan){
    if(String(plan?.integrity?.contentHash||'')!==String(job?.planHash||''))errors.push('plan-job-hash-mismatch');
    const byId=new Map((plan.items||[]).map(item=>[item.itemId,item]));for(const item of job?.items||[]){const planned=byId.get(item.itemId);if(!planned)errors.push(`job-item-not-in-plan:${item.itemId}`);else if(String(planned.exportHash)!==String(item.exportHash))errors.push(`job-item-export-hash-mismatch:${item.itemId}`);}
  }
  return{ok:errors.length===0,errors:[...new Set(errors)]};
}

export async function runSeedanceBatch(plan,job,options={}){
  const apiKey=requireApiKey(options.apiKey??process.env.ARK_API_KEY),requester=options.requester??globalThis.fetch,pollMs=options.pollMs??10000,timeoutMs=options.timeoutMs??60*60*1000,sleep=options.sleep,now=options.now??(()=>Date.now()),onState=options.onState??null;
  const planValidation=await validatePromptStudioBatchPlan(plan);if(!planValidation.ok)throw new SeedanceBatchError('invalid-batch-plan',`Batch plan is not executable: ${planValidation.errors.join(', ')}`);
  const jobValidation=validateSeedanceBatchJob(job,plan);if(!jobValidation.ok)throw new SeedanceBatchError('invalid-batch-job',`Batch job is invalid: ${jobValidation.errors.join(', ')}`);
  const base=clone(job),localConcurrency=normalizeConcurrency(options.concurrency??job.localConcurrency),actionable=base.items.filter(item=>!PROVIDER_TERMINAL.has(item.status)&&!REVIEW_STOP.has(item.status)).map(item=>item.itemId);
  if(!actionable.length){const settled=sanitizeBatchJob({...base,localConcurrency,status:aggregateBatchStatus(base.items),updatedAt:iso(now()),completedAt:isBatchComplete(base.items)?(base.completedAt||iso(now())):null});await emit(onState,settled);return settled;}
  let state=sanitizeBatchJob({...base,localConcurrency,status:'running',updatedAt:iso(now()),completedAt:null});await emit(onState,state);
  const planMap=new Map(plan.items.map(item=>[item.itemId,item]));let cursor=0;
  const worker=async()=>{while(true){const index=cursor++;if(index>=actionable.length)return;await processItem(actionable[index]);}};
  const persist=async()=>{state=sanitizeBatchJob({...state,status:aggregateBatchStatus(state.items),updatedAt:iso(now()),completedAt:isBatchComplete(state.items)?iso(now()):null});await emit(onState,state);};
  const update=(itemId,patch)=>{state={...state,items:state.items.map(item=>item.itemId===itemId?{...item,...clone(patch)}:item)};};
  const get=itemId=>state.items.find(item=>item.itemId===itemId);

  async function processItem(itemId){
    const planned=planMap.get(itemId);if(!planned){update(itemId,{status:'blocked',error:{code:'missing-plan-item',message:'Batch job item is missing from plan.'},completedAt:iso(now())});await persist();return;}
    let item=get(itemId);
    if(!item.job){
      update(itemId,{status:'submitting',startedAt:item.startedAt||iso(now()),updatedAt:iso(now()),error:null});await persist();
      try{
        const submitted=await submitSeedanceGeneration(planned.providerExport,{requester,apiKey,now:now()});const providerJob=applyExportStudioLinkToJob(submitted,planned.providerExport);
        if(String(providerJob.exportHash)!==String(item.exportHash))throw new SeedanceBatchError('export-hash-drift',`Runner export hash changed for ${itemId}.`);
        update(itemId,{status:providerJob.status,job:providerJob,updatedAt:iso(now())});await persist();
      }catch(error){
        const ambiguous=error?.code==='network-error';update(itemId,{status:ambiguous?'submission-uncertain':'blocked',job:null,result:null,error:safeError(error),updatedAt:iso(now()),completedAt:iso(now())});await persist();return;
      }
    }
    item=get(itemId);
    if(PROVIDER_TERMINAL.has(item.job?.status||item.status)){const result=applyJobStudioLinkToResult(buildGenerationResult(item.job,now()),item.job);update(itemId,{status:item.job.status,result,error:item.job.error||null,updatedAt:iso(now()),completedAt:item.job.completedAt||iso(now())});await persist();return;}
    try{
      const completed=await waitForSeedanceGeneration(item.job,{requester,apiKey,pollMs,timeoutMs,...(sleep?{sleep}:{}),now,onPoll:async current=>{const terminal=PROVIDER_TERMINAL.has(current.status),result=terminal?applyJobStudioLinkToResult(buildGenerationResult(current,now()),current):null;update(itemId,{status:current.status,job:current,result,error:current.error||null,updatedAt:iso(now()),completedAt:terminal?current.completedAt||iso(now()):null});await persist();}});
      const result=applyJobStudioLinkToResult(completed.result,completed.job);update(itemId,{status:completed.job.status,job:completed.job,result,error:completed.job.error||null,updatedAt:iso(now()),completedAt:completed.job.completedAt||iso(now())});await persist();
    }catch(error){update(itemId,{status:'interrupted',error:safeError(error),updatedAt:iso(now()),completedAt:null});await persist();}
  }

  await Promise.all(Array.from({length:Math.min(state.localConcurrency,Math.max(1,actionable.length))},worker));await persist();return state;
}

export async function refreshSeedanceBatchJob(plan,job,options={}){
  const apiKey=requireApiKey(options.apiKey??process.env.ARK_API_KEY),requester=options.requester??globalThis.fetch,now=options.now??Date.now();const validation=validateSeedanceBatchJob(job,plan);if(!validation.ok)throw new SeedanceBatchError('invalid-batch-job',`Batch job is invalid: ${validation.errors.join(', ')}`);
  let state=clone(job);const active=state.items.filter(item=>item.job&&!PROVIDER_TERMINAL.has(item.status)&&!REVIEW_STOP.has(item.status));
  for(const item of active){
    try{const current=await retrieveSeedanceGeneration(item.job,{requester,apiKey,now});const terminal=PROVIDER_TERMINAL.has(current.status),result=terminal?applyJobStudioLinkToResult(buildGenerationResult(current,now),current):null;state.items=state.items.map(entry=>entry.itemId===item.itemId?{...entry,status:current.status,job:current,result,error:current.error||null,updatedAt:iso(now),completedAt:terminal?current.completedAt||iso(now):null}:entry);}
    catch(error){state.items=state.items.map(entry=>entry.itemId===item.itemId?{...entry,status:'interrupted',error:safeError(error),updatedAt:iso(now),completedAt:null}:entry);}
  }
  state={...state,status:aggregateBatchStatus(state.items),updatedAt:iso(now),completedAt:isBatchComplete(state.items)?iso(now):null};return sanitizeBatchJob(state);
}

export async function cancelQueuedSeedanceBatch(plan,job,options={}){
  const apiKey=requireApiKey(options.apiKey??process.env.ARK_API_KEY),requester=options.requester??globalThis.fetch,now=options.now??Date.now();const validation=validateSeedanceBatchJob(job,plan);if(!validation.ok)throw new SeedanceBatchError('invalid-batch-job',`Batch job is invalid: ${validation.errors.join(', ')}`);
  let state=clone(job);for(const item of state.items.filter(item=>item.job&&!PROVIDER_TERMINAL.has(item.status)&&!REVIEW_STOP.has(item.status))){
    try{const cancelled=await cancelQueuedSeedanceGeneration(item.job,{requester,apiKey,now});const result=applyJobStudioLinkToResult(buildGenerationResult(cancelled,now),cancelled);state.items=state.items.map(entry=>entry.itemId===item.itemId?{...entry,status:'cancelled',job:cancelled,result,error:null,updatedAt:iso(now),completedAt:cancelled.completedAt||iso(now)}:entry);}
    catch(error){state.items=state.items.map(entry=>entry.itemId===item.itemId?{...entry,error:safeError(error),updatedAt:iso(now)}:entry);}
  }
  state={...state,status:aggregateBatchStatus(state.items),updatedAt:iso(now),completedAt:isBatchComplete(state.items)?iso(now):null};return sanitizeBatchJob(state);
}

export function buildSeedanceBatchResult(job,now=Date.now()){
  const validation=validateSeedanceBatchJob(job);if(!validation.ok)throw new SeedanceBatchError('invalid-batch-job',`Batch job is invalid: ${validation.errors.join(', ')}`);if(!isBatchComplete(job.items))throw new SeedanceBatchError('batch-not-complete','Batch still has resumable items.');
  return{kind:PROMPT_STUDIO_BATCH_RESULT_KIND,schemaVersion:1,batchId:job.batchId,planHash:job.planHash,project:clone(job.project),status:aggregateBatchStatus(job.items),createdAt:job.createdAt,completedAt:job.completedAt||iso(now),recordedAt:iso(now),items:job.items.map(item=>({itemId:item.itemId,variant:clone(item.variant),exportHash:item.exportHash,taskId:String(item.job?.taskId||''),status:item.status,result:item.result?clone(item.result):null,error:item.error?clone(item.error):null})),policy:{secretPersisted:false,externalExecution:true,automaticRetry:false}};
}

export function batchExecutionSummary(job){const counts={};for(const item of job?.items||[])counts[item.status]=(counts[item.status]||0)+1;return{batchId:String(job?.batchId||''),status:String(job?.status||'invalid'),total:job?.items?.length||0,counts,concurrency:job?.localConcurrency||null,complete:isBatchComplete(job?.items||[])};}

function aggregateBatchStatus(items){if(items.some(item=>item.status==='submission-uncertain'||item.status==='blocked'))return isBatchComplete(items)?'completed-with-errors':'needs-review';if(items.some(item=>item.status==='interrupted'))return'needs-resume';if(items.some(item=>['submitting','submitted','queued','running','unknown'].includes(item.status)))return'running';if(items.every(item=>item.status==='pending'))return'pending';if(items.length&&items.every(item=>item.status==='succeeded'))return'succeeded';if(isBatchComplete(items))return'completed-with-errors';return'needs-review';}
function isBatchComplete(items){return Boolean(items?.length)&&items.every(item=>PROVIDER_TERMINAL.has(item.status)||REVIEW_STOP.has(item.status));}
function normalizeConcurrency(value){const number=Number(value);if(!Number.isInteger(number)||number<1||number>MAX_BATCH_CONCURRENCY)throw new SeedanceBatchError('invalid-concurrency',`Local concurrency must be an integer from 1 to ${MAX_BATCH_CONCURRENCY}.`);return number;}
function requireApiKey(value){const key=String(value||'').trim();if(!key)throw new SeedanceBatchError('api-key-missing','ARK_API_KEY is required in the external batch runner environment.');return key;}
function safeError(error){return{code:String(error?.code||'runner-error').slice(0,120),message:String(error?.message||error||'Unknown error').replace(/Bearer\s+[^\s]+/gi,'Bearer [REDACTED]').slice(0,1000)};}
function containsCredentialLikeField(value){if(!value||typeof value!=='object')return false;const stack=[value];while(stack.length){const current=stack.pop();if(Array.isArray(current)){for(const item of current)if(item&&typeof item==='object')stack.push(item);continue;}for(const[key,item]of Object.entries(current)){const normalized=String(key).toLowerCase().replace(/[^a-z]/g,'');if(['authorization','apikey','arkapikey','secret','credential','credentials','accesstoken','refreshtoken','bearertoken'].includes(normalized))return true;if(item&&typeof item==='object')stack.push(item);}}return false;}
function sanitizeBatchJob(value){const next=clone(value);if(containsCredentialLikeField(next))throw new SeedanceBatchError('credential-persistence-detected','Batch job contains a credential-like field.');return next;}
async function emit(callback,state){if(typeof callback==='function')await callback(clone(state));}
function iso(value){const raw=typeof value==='function'?value():value;return new Date(Number.isFinite(Number(raw))?Number(raw):raw).toISOString();}
function clone(value){return JSON.parse(JSON.stringify(value??null));}
