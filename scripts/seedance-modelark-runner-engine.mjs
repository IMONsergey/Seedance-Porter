import { createHash } from 'node:crypto';

export const MODELARK_TASKS_ENDPOINT='https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks';
export const GENERATION_JOB_KIND='seedance-porter-generation-job';
export const GENERATION_RESULT_KIND='seedance-porter-generation-result';
export const TERMINAL_TASK_STATUSES=Object.freeze(['succeeded','failed','cancelled','expired']);
const KNOWN_TASK_STATUSES=new Set(['queued','running',...TERMINAL_TASK_STATUSES]);

export class SeedanceRunnerError extends Error{
  constructor(code,message,details={}){super(message);this.name='SeedanceRunnerError';this.code=code;this.details=details;}
}

export function validateSeedanceRunnerExport(bundle){
  const errors=[];
  if(!bundle||typeof bundle!=='object')errors.push('export-missing');
  if(bundle?.kind!=='seedance-porter-provider-export')errors.push('invalid-export-kind');
  if(bundle?.schemaVersion!==1)errors.push('invalid-export-schema-version');
  if(bundle?.provider!=='byteplus-modelark')errors.push('invalid-provider');
  if(bundle?.adapter!=='seedance-2.0')errors.push('invalid-adapter');
  if(bundle?.ready!==true)errors.push('export-not-ready');
  if(!bundle?.payload||typeof bundle.payload!=='object')errors.push('ready-export-payload-missing');
  if(String(bundle?.endpoint||'')!==MODELARK_TASKS_ENDPOINT)errors.push('unexpected-create-endpoint');
  const policy=bundle?.policy||{};
  if(policy.autoSubmit!==false||policy.apiKeyEmbedded!==false||policy.networkRequest!==false||policy.requiresExternalExecution!==true)errors.push('unsafe-export-policy');
  return{ok:errors.length===0,errors};
}

export function validateGenerationJob(job){
  const errors=[];
  if(!job||typeof job!=='object')errors.push('job-missing');
  if(job?.kind!==GENERATION_JOB_KIND)errors.push('invalid-job-kind');
  if(job?.schemaVersion!==1)errors.push('invalid-job-schema-version');
  if(job?.provider!=='byteplus-modelark'||job?.adapter!=='seedance-2.0')errors.push('invalid-job-provider');
  if(!String(job?.taskId||'').trim())errors.push('task-id-missing');
  if(String(job?.endpoint||'')!==MODELARK_TASKS_ENDPOINT)errors.push('unexpected-job-endpoint');
  const expectedRetrieve=job?.taskId?taskUrl(job.taskId):'';
  if(String(job?.retrieveUrl||'')!==expectedRetrieve)errors.push('unexpected-retrieve-url');
  const policy=job?.policy||{};
  if(policy.secretPersisted!==false||policy.apiKeySource!=='environment'||policy.externalExecution!==true)errors.push('unsafe-job-policy');
  if(containsPersistedCredential(job))errors.push('credential-like-field-persisted');
  return{ok:errors.length===0,errors};
}

export async function submitSeedanceGeneration(exportBundle,{requester=globalThis.fetch,apiKey=process.env.ARK_API_KEY,now=Date.now()}={}){
  const validation=validateSeedanceRunnerExport(exportBundle);if(!validation.ok)throw new SeedanceRunnerError('invalid-export',`Seedance export is not executable: ${validation.errors.join(', ')}`,{errors:validation.errors});
  const key=requireApiKey(apiKey);const request=resolveRequester(requester);const submittedAt=iso(now);
  const response=await request(MODELARK_TASKS_ENDPOINT,{method:'POST',headers:authHeaders(key),body:JSON.stringify(exportBundle.payload)});
  const payload=await readJsonResponse(response,'submit');const taskId=String(payload?.id||'').trim();if(!taskId)throw new SeedanceRunnerError('task-id-missing','ModelArk create response did not contain a task ID.');
  const providerStatus=String(payload?.status||'').toLowerCase();const status=KNOWN_TASK_STATUSES.has(providerStatus)?providerStatus:'submitted';
  return sanitizeJob({kind:GENERATION_JOB_KIND,schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',taskId,status,providerStatus:providerStatus||null,terminal:TERMINAL_TASK_STATUSES.includes(status),endpoint:MODELARK_TASKS_ENDPOINT,retrieveUrl:taskUrl(taskId),exportHash:hashStableJson(exportBundle),exportSummary:summarizeExport(exportBundle),createdAt:submittedAt,updatedAt:submittedAt,submittedAt,lastCheckedAt:null,completedAt:TERMINAL_TASK_STATUSES.includes(status)?submittedAt:null,output:null,usage:null,error:null,providerMeta:{model:String(payload?.model||exportBundle.payload.model||''),createdAt:normalizeEpoch(payload?.created_at),updatedAt:normalizeEpoch(payload?.updated_at)},policy:{secretPersisted:false,apiKeySource:'environment',externalExecution:true}});
}

export async function retrieveSeedanceGeneration(job,{requester=globalThis.fetch,apiKey=process.env.ARK_API_KEY,now=Date.now()}={}){
  assertJob(job);const key=requireApiKey(apiKey);const request=resolveRequester(requester);
  const response=await request(job.retrieveUrl,{method:'GET',headers:authHeaders(key)});const payload=await readJsonResponse(response,'retrieve');
  return mergeProviderTask(job,payload,now);
}

export async function waitForSeedanceGeneration(job,{requester=globalThis.fetch,apiKey=process.env.ARK_API_KEY,pollMs=10000,timeoutMs=60*60*1000,sleep=defaultSleep,now=()=>Date.now(),onPoll=null}={}){
  assertJob(job);const poll=Math.max(1000,Number(pollMs)||10000),timeout=Math.max(poll,Number(timeoutMs)||60*60*1000);const started=Number(now());let current=sanitizeJob(job);
  while(true){
    if(TERMINAL_TASK_STATUSES.includes(current.status))return{job:current,result:buildGenerationResult(current,now())};
    current=await retrieveSeedanceGeneration(current,{requester,apiKey,now:now()});
    if(typeof onPoll==='function')await onPoll(sanitizeJob(current));
    if(TERMINAL_TASK_STATUSES.includes(current.status))return{job:current,result:buildGenerationResult(current,now())};
    if(Number(now())-started>=timeout)throw new SeedanceRunnerError('wait-timeout',`Timed out waiting for task ${current.taskId}.`,{taskId:current.taskId,status:current.status,timeoutMs:timeout});
    await sleep(poll);
  }
}

export async function cancelQueuedSeedanceGeneration(job,{requester=globalThis.fetch,apiKey=process.env.ARK_API_KEY,now=Date.now()}={}){
  assertJob(job);const key=requireApiKey(apiKey);const request=resolveRequester(requester);
  const current=await retrieveSeedanceGeneration(job,{requester:request,apiKey:key,now});
  if(current.status==='running')throw new SeedanceRunnerError('task-running-not-cancellable',`Task ${current.taskId} is running and ModelArk does not allow cancellation at this stage.`,{taskId:current.taskId,status:current.status});
  if(TERMINAL_TASK_STATUSES.includes(current.status))throw new SeedanceRunnerError('terminal-record-delete-refused',`Task ${current.taskId} is already ${current.status}. Runner refuses to delete terminal provider records.`,{taskId:current.taskId,status:current.status});
  if(current.status!=='queued')throw new SeedanceRunnerError('task-not-queued',`Task ${current.taskId} is ${current.status}; cancellation is allowed only while queued.`,{taskId:current.taskId,status:current.status});
  const response=await request(current.retrieveUrl,{method:'DELETE',headers:authHeaders(key)});await readJsonResponse(response,'cancel',{emptyObjectAllowed:true});const updated=iso(now);
  return sanitizeJob({...current,status:'cancelled',providerStatus:'cancelled',terminal:true,updatedAt:updated,lastCheckedAt:updated,completedAt:updated,error:null});
}

export async function downloadSeedanceGenerationOutput(job,{requester=globalThis.fetch}={}){
  assertJob(job);if(job.status!=='succeeded')throw new SeedanceRunnerError('output-not-ready',`Task ${job.taskId} is ${job.status}; video download requires succeeded status.`);
  const url=String(job?.output?.videoUrl||'');if(!isHttpsUrl(url))throw new SeedanceRunnerError('video-url-missing','Succeeded job does not contain a valid HTTPS video URL.');
  const response=await resolveRequester(requester)(url,{method:'GET'});if(!response?.ok)throw new SeedanceRunnerError('download-http-error',`Video download failed with HTTP ${response?.status??'unknown'}.`,{status:response?.status??null});
  const bytes=new Uint8Array(await response.arrayBuffer());return{bytes,contentType:String(response.headers?.get?.('content-type')||'video/mp4'),contentLength:bytes.byteLength,url};
}

export function buildGenerationResult(job,now=Date.now()){
  assertJob(job);if(!TERMINAL_TASK_STATUSES.includes(job.status))throw new SeedanceRunnerError('job-not-terminal',`Task ${job.taskId} is not terminal.`);
  const result={kind:GENERATION_RESULT_KIND,schemaVersion:1,provider:job.provider,adapter:job.adapter,taskId:job.taskId,status:job.status,succeeded:job.status==='succeeded',terminal:true,exportHash:job.exportHash,output:job.output?clone(job.output):null,usage:job.usage?clone(job.usage):null,error:job.error?clone(job.error):null,providerMeta:job.providerMeta?clone(job.providerMeta):null,createdAt:job.createdAt,completedAt:job.completedAt||job.updatedAt,recordedAt:iso(now),policy:{secretPersisted:false,externalExecution:true}};
  if(containsPersistedCredential(result))throw new SeedanceRunnerError('credential-persistence-detected','Result manifest contains a credential-like field.');return result;
}

export function hashStableJson(value){return createHash('sha256').update(stable(value)).digest('hex');}
export function isTerminalSeedanceStatus(status){return TERMINAL_TASK_STATUSES.includes(String(status||'').toLowerCase());}

function mergeProviderTask(job,payload,now){
  const providerStatus=String(payload?.status||'').toLowerCase();const status=KNOWN_TASK_STATUSES.has(providerStatus)?providerStatus:'unknown';const checked=iso(now);const terminal=TERMINAL_TASK_STATUSES.includes(status);const content=payload?.content&&typeof payload.content==='object'?payload.content:{};const usage=payload?.usage&&typeof payload.usage==='object'?payload.usage:{};const providerError=payload?.error&&typeof payload.error==='object'?payload.error:null;
  const output=status==='succeeded'?{videoUrl:isHttpsUrl(content.video_url)?String(content.video_url):'',lastFrameUrl:isHttpsUrl(content.last_frame_url)?String(content.last_frame_url):''}:null;
  const error=providerError?{code:String(providerError.code||''),message:String(providerError.message||providerError.msg||'').slice(0,1000)}:status==='failed'?{code:'provider-failed',message:'ModelArk reported failed without a structured error payload.'}:null;
  return sanitizeJob({...clone(job),status,providerStatus:providerStatus||null,terminal,updatedAt:checked,lastCheckedAt:checked,completedAt:terminal?checked:null,output,usage:Object.keys(usage).length?{completionTokens:numberOrNull(usage.completion_tokens),totalTokens:numberOrNull(usage.total_tokens)}:null,error,providerMeta:{model:String(payload?.model||job.providerMeta?.model||''),createdAt:normalizeEpoch(payload?.created_at)||job.providerMeta?.createdAt||null,updatedAt:normalizeEpoch(payload?.updated_at)||null,resolution:String(payload?.resolution||''),ratio:String(payload?.ratio||''),duration:numberOrNull(payload?.duration),framesPerSecond:numberOrNull(payload?.framespersecond),generateAudio:typeof payload?.generate_audio==='boolean'?payload.generate_audio:null,priority:numberOrNull(payload?.priority),executionExpiresAfter:numberOrNull(payload?.execution_expires_after)}});
}

function summarizeExport(bundle){const payload=bundle?.payload||{};const content=Array.isArray(payload.content)?payload.content:[];return{model:String(payload.model||''),resolution:String(payload.resolution||''),ratio:String(payload.ratio||''),duration:numberOrNull(payload.duration),generateAudio:Boolean(payload.generate_audio),images:content.filter(item=>item?.type==='image_url').length,videos:content.filter(item=>item?.type==='video_url').length,audios:content.filter(item=>item?.type==='audio_url').length};}
function sanitizeJob(job){const next=clone(job);if(containsPersistedCredential(next))throw new SeedanceRunnerError('credential-persistence-detected','Job manifest contains a credential-like field.');return next;}
function assertJob(job){const validation=validateGenerationJob(job);if(!validation.ok)throw new SeedanceRunnerError('invalid-job',`Invalid generation job: ${validation.errors.join(', ')}`,{errors:validation.errors});}
function requireApiKey(value){const key=String(value||'').trim();if(!key)throw new SeedanceRunnerError('api-key-missing','ARK_API_KEY is required in the external runner environment.');return key;}
function resolveRequester(requester){if(typeof requester!=='function')throw new SeedanceRunnerError('requester-missing','A fetch-compatible requester is required.');return requester;}
function authHeaders(apiKey){return{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`};}
function taskUrl(taskId){return`${MODELARK_TASKS_ENDPOINT}/${encodeURIComponent(String(taskId))}`;}
async function readJsonResponse(response,operation,{emptyObjectAllowed=false}={}){if(!response||typeof response.ok!=='boolean')throw new SeedanceRunnerError('invalid-http-response',`Invalid HTTP response during ${operation}.`);let text='';try{text=await response.text();}catch{}let payload={};if(text.trim()){try{payload=JSON.parse(text);}catch{if(response.ok)throw new SeedanceRunnerError('invalid-json-response',`ModelArk ${operation} response was not JSON.`);}}if(!response.ok){const provider=payload?.error||payload;const message=String(provider?.message||provider?.msg||text||`HTTP ${response.status}`).slice(0,1000);throw new SeedanceRunnerError('provider-http-error',`ModelArk ${operation} failed with HTTP ${response.status}: ${message}`,{status:response.status,providerCode:String(provider?.code||'')});}if(!text.trim()&&emptyObjectAllowed)return{};return payload;}
function containsPersistedCredential(value){if(!value||typeof value!=='object')return false;const stack=[value];while(stack.length){const current=stack.pop();if(Array.isArray(current)){for(const item of current)if(item&&typeof item==='object')stack.push(item);continue;}for(const[key,item]of Object.entries(current)){const normalized=key.toLowerCase().replace(/[^a-z]/g,'');if(['authorization','apikey','arkapikey','secret','credential','credentials'].includes(normalized))return true;if(item&&typeof item==='object')stack.push(item);}}return false;}
function stable(value){if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;if(value&&typeof value==='object')return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;return JSON.stringify(value);}
function isHttpsUrl(value){try{return new URL(String(value||'')).protocol==='https:';}catch{return false;}}
function normalizeEpoch(value){const numeric=Number(value);return Number.isFinite(numeric)&&numeric>0?new Date(numeric*1000).toISOString():null;}
function numberOrNull(value){const number=Number(value);return Number.isFinite(number)?number:null;}
function iso(value){const raw=typeof value==='function'?value():value;return new Date(Number.isFinite(Number(raw))?Number(raw):raw).toISOString();}
function clone(value){return JSON.parse(JSON.stringify(value??null));}
function defaultSleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
