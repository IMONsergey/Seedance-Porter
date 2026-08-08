export const PROMPT_STUDIO_GENERATION_RECORDS_KEY='generationResults';
export const PROMPT_STUDIO_GENERATION_PROVENANCE_KEY='generationOutputProvenance';
export const MAX_PROMPT_STUDIO_GENERATION_RECORDS=50;
const JOB_KIND='seedance-porter-generation-job';
const RESULT_KIND='seedance-porter-generation-result';
const TERMINAL=new Set(['succeeded','failed','cancelled','expired']);
const JOB_STATUSES=new Set(['submitted','queued','running','succeeded','failed','cancelled','expired','unknown']);
const SAFE_PROVIDER_META_KEYS=new Set(['model','createdAt','updatedAt','resolution','ratio','duration','framesPerSecond','generateAudio','priority','executionExpiresAfter']);

export function validatePromptStudioGenerationArtifact(value){
  const errors=[];
  if(!value||typeof value!=='object'||Array.isArray(value))return{ok:false,errors:['artifact-missing'],kind:'unknown',artifact:null};
  if(containsCredentialLikeField(value))errors.push('credential-like-field-present');
  const kind=String(value.kind||'');
  if(![JOB_KIND,RESULT_KIND].includes(kind))errors.push('unsupported-artifact-kind');
  if(Number(value.schemaVersion)!==1)errors.push('unsupported-schema-version');
  if(String(value.provider||'')!=='byteplus-modelark')errors.push('unsupported-provider');
  if(String(value.adapter||'')!=='seedance-2.0')errors.push('unsupported-adapter');
  if(!String(value.taskId||'').trim())errors.push('task-id-missing');
  if(!/^[a-f0-9]{64}$/i.test(String(value.exportHash||'')))errors.push('export-hash-invalid');
  const status=String(value.status||'').toLowerCase();
  if(kind===JOB_KIND&&!JOB_STATUSES.has(status))errors.push('job-status-invalid');
  if(kind===RESULT_KIND&&!TERMINAL.has(status))errors.push('result-status-not-terminal');
  if(kind===RESULT_KIND&&value.terminal!==true)errors.push('result-terminal-invalid');
  if(kind===RESULT_KIND&&Boolean(value.succeeded)!==(status==='succeeded'))errors.push('result-success-flag-mismatch');
  if(kind===JOB_KIND&&Boolean(value.terminal)!==TERMINAL.has(status))errors.push('job-terminal-status-mismatch');
  if(kind===JOB_KIND&&TERMINAL.has(status)&&!String(value.completedAt||'').trim())errors.push('job-completed-at-missing');
  if(kind===JOB_KIND&&!TERMINAL.has(status)&&value.completedAt!=null)errors.push('job-nonterminal-completed-at-present');
  if(status==='succeeded'){
    if(!isHttpsUrl(value?.output?.videoUrl))errors.push('succeeded-video-url-missing');
    if(value?.output?.lastFrameUrl&&!isHttpsUrl(value.output.lastFrameUrl))errors.push('last-frame-url-invalid');
  }
  const studioLink=normalizeStudioLink(value.studioLink);
  if(value.studioLink!=null&&!studioLink)errors.push('studio-link-invalid');
  const policy=value.policy||{};
  if(policy.secretPersisted!==false||policy.externalExecution!==true)errors.push('unsafe-artifact-policy');
  if(kind===JOB_KIND&&policy.apiKeySource!=='environment')errors.push('unsafe-job-key-source');
  return{ok:errors.length===0,errors:[...new Set(errors)],kind:kind===JOB_KIND?'job':kind===RESULT_KIND?'result':'unknown',artifact:errors.length?null:sanitizeGenerationArtifact(value)};
}

export function generationArtifactProjectLinkState(project,artifactInput){
  const artifact=artifactInput?.sourceArtifactKind?artifactInput:sanitizeGenerationArtifact(artifactInput);const link=artifact?.studioLink;
  if(!link)return{state:'unlinked',exact:false,sameProject:false,label:'No Studio lineage in this historical artifact.'};
  const sameProject=String(link.projectId||'')===String(project?.id||'');
  if(!sameProject)return{state:'different-project',exact:false,sameProject:false,label:`Generated from a different Prompt Studio project (${link.projectId}).`};
  const exact=Boolean(link.projectUpdatedAt)&&String(link.projectUpdatedAt)===String(project?.updatedAt||'');
  if(exact)return{state:'exact-project',exact:true,sameProject:true,label:'Generated from this exact saved project state.'};
  return{state:'same-project-drift',exact:false,sameProject:true,label:'Generated from this project, but the project has changed since export.'};
}

export function listPromptStudioGenerationRecords(project){return normalizeRecords(project?.[PROMPT_STUDIO_GENERATION_RECORDS_KEY]||[]);}

export function savePromptStudioGenerationArtifact(project,artifactInput,options={}){
  const validation=artifactInput?.sourceArtifactKind?{ok:true,artifact:sanitizeStoredRecord(artifactInput)}:validatePromptStudioGenerationArtifact(artifactInput);
  if(!validation.ok)throw new Error(`Generation artifact is not safe to save: ${validation.errors.join(', ')}`);
  const record=artifactInput?.sourceArtifactKind?sanitizeStoredRecord(artifactInput):artifactToRecord(validation.artifact,options.now||Date.now());
  const existing=normalizeRecords(project?.[PROMPT_STUDIO_GENERATION_RECORDS_KEY]||[]).filter(item=>item.taskId!==record.taskId);
  const next=clone(project);next[PROMPT_STUDIO_GENERATION_RECORDS_KEY]=[record,...existing].slice(0,MAX_PROMPT_STUDIO_GENERATION_RECORDS);return next;
}

export function deletePromptStudioGenerationRecord(project,taskId){const next=clone(project);next[PROMPT_STUDIO_GENERATION_RECORDS_KEY]=normalizeRecords(next[PROMPT_STUDIO_GENERATION_RECORDS_KEY]||[]).filter(item=>item.taskId!==String(taskId||''));return next;}

export function attachPromptStudioGenerationOutput(project,artifactOrRecord,outputKind='video',options={}){
  const source=artifactOrRecord?.sourceArtifactKind?sanitizeStoredRecord(artifactOrRecord):artifactToRecord(requireValidArtifact(artifactOrRecord),options.now||Date.now());
  if(source.status!=='succeeded')throw new Error(`Generation task ${source.taskId} is ${source.status}; only succeeded output can become a reference.`);
  const kind=String(outputKind||'video');if(!['video','last-frame'].includes(kind))throw new Error(`Unsupported generation output kind: ${kind}`);
  const uri=kind==='video'?source.output?.videoUrl:source.output?.lastFrameUrl;if(!isHttpsUrl(uri))throw new Error(`Generation ${kind} output is unavailable or not HTTPS.`);
  const next=savePromptStudioGenerationArtifact(project,source,{now:options.now||Date.now()});
  const used=new Set((next.references||[]).map(ref=>String(ref.token||'').toLowerCase()));const token=nextReferenceToken(used);const refId=`gen-${safeId(source.taskId)}-${kind==='video'?'video':'last'}-${randomId()}`;
  const reference={id:refId,token,name:kind==='video'?`Generated video · ${shortTask(source.taskId)}`:`Generated last frame · ${shortTask(source.taskId)}`,mediaType:kind==='video'?'video':'image',role:kind==='video'?'motion':'first-frame',locked:kind==='last-frame',uri:String(uri),localAssetKey:'',notes:`Generated by Seedance 2.0 task ${source.taskId}. Export ${source.exportHash.slice(0,12)}. Explicitly attached from Generation Results.`,enabled:true};
  next.references=[...(next.references||[]),reference];
  const provenance=normalizeProvenance(next[PROMPT_STUDIO_GENERATION_PROVENANCE_KEY]);provenance[refId]={taskId:source.taskId,provider:source.provider,adapter:source.adapter,exportHash:source.exportHash,outputKind:kind,sourceArtifactKind:source.sourceArtifactKind,studioLink:source.studioLink?clone(source.studioLink):null,attachedAt:new Date(options.now||Date.now()).toISOString()};next[PROMPT_STUDIO_GENERATION_PROVENANCE_KEY]=provenance;
  return{project:next,reference,record:source};
}

export function generationOutputReferenceProvenance(project,referenceId){const value=normalizeProvenance(project?.[PROMPT_STUDIO_GENERATION_PROVENANCE_KEY]);return value[String(referenceId||'')]||null;}

export function sanitizeGenerationArtifact(value){
  const kind=String(value.kind||'');const sourceArtifactKind=kind===JOB_KIND?'job':'result';
  return{sourceArtifactKind,kind,schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',taskId:String(value.taskId||''),status:String(value.status||'').toLowerCase(),terminal:sourceArtifactKind==='result'?true:Boolean(value.terminal),succeeded:sourceArtifactKind==='result'?Boolean(value.succeeded):String(value.status||'').toLowerCase()==='succeeded',exportHash:String(value.exportHash||'').toLowerCase(),studioLink:normalizeStudioLink(value.studioLink),output:normalizeOutput(value.output),usage:normalizeUsage(value.usage),error:normalizeError(value.error),providerMeta:normalizeProviderMeta(value.providerMeta),createdAt:safeDate(value.createdAt),updatedAt:safeDate(value.updatedAt),completedAt:safeDate(value.completedAt),recordedAt:safeDate(value.recordedAt),policy:{secretPersisted:false,externalExecution:true}};
}

export function normalizePromptStudioGenerationExtensions(project){const next=clone(project);next[PROMPT_STUDIO_GENERATION_RECORDS_KEY]=normalizeRecords(next[PROMPT_STUDIO_GENERATION_RECORDS_KEY]||[]);next[PROMPT_STUDIO_GENERATION_PROVENANCE_KEY]=normalizeProvenance(next[PROMPT_STUDIO_GENERATION_PROVENANCE_KEY]);return next;}

export function containsCredentialLikeField(value){
  if(!value||typeof value!=='object')return false;const stack=[value];
  while(stack.length){const current=stack.pop();if(Array.isArray(current)){for(const item of current)if(item&&typeof item==='object')stack.push(item);continue;}for(const[key,item]of Object.entries(current)){const normalized=String(key).toLowerCase().replace(/[^a-z]/g,'');if(['authorization','apikey','arkapikey','secret','credential','credentials','accesstoken','refreshtoken','bearertoken'].includes(normalized))return true;if(item&&typeof item==='object')stack.push(item);}}
  return false;
}

function requireValidArtifact(value){const validation=validatePromptStudioGenerationArtifact(value);if(!validation.ok)throw new Error(`Generation artifact is not safe: ${validation.errors.join(', ')}`);return validation.artifact;}
function artifactToRecord(artifact,now){return sanitizeStoredRecord({...artifact,importedAt:new Date(now||Date.now()).toISOString()});}
function sanitizeStoredRecord(value){return{sourceArtifactKind:value.sourceArtifactKind==='job'?'job':'result',provider:'byteplus-modelark',adapter:'seedance-2.0',taskId:String(value.taskId||''),status:String(value.status||'unknown').toLowerCase(),terminal:Boolean(value.terminal),succeeded:Boolean(value.succeeded),exportHash:/^[a-f0-9]{64}$/i.test(String(value.exportHash||''))?String(value.exportHash).toLowerCase():'',studioLink:normalizeStudioLink(value.studioLink),output:normalizeOutput(value.output),usage:normalizeUsage(value.usage),error:normalizeError(value.error),providerMeta:normalizeProviderMeta(value.providerMeta),createdAt:safeDate(value.createdAt),completedAt:safeDate(value.completedAt),recordedAt:safeDate(value.recordedAt),importedAt:safeDate(value.importedAt)||new Date().toISOString()};}
function normalizeRecords(items){const byTask=new Map();for(const raw of Array.isArray(items)?items:[]){const item=sanitizeStoredRecord(raw);if(!item.taskId||!item.exportHash)continue;const previous=byTask.get(item.taskId);if(!previous||recordRank(item)>recordRank(previous))byTask.set(item.taskId,item);}return[...byTask.values()].sort((a,b)=>String(b.importedAt||b.completedAt||'').localeCompare(String(a.importedAt||a.completedAt||''))).slice(0,MAX_PROMPT_STUDIO_GENERATION_RECORDS);}
function recordRank(item){return(item.sourceArtifactKind==='result'?100:0)+(item.terminal?50:0)+(item.status==='succeeded'?20:0);}
function normalizeOutput(value){if(!value||typeof value!=='object')return null;const videoUrl=isHttpsUrl(value.videoUrl)?String(value.videoUrl):'';const lastFrameUrl=isHttpsUrl(value.lastFrameUrl)?String(value.lastFrameUrl):'';return videoUrl||lastFrameUrl?{videoUrl,lastFrameUrl}:null;}
function normalizeUsage(value){if(!value||typeof value!=='object')return null;const completionTokens=numberOrNull(value.completionTokens),totalTokens=numberOrNull(value.totalTokens);return completionTokens!=null||totalTokens!=null?{completionTokens,totalTokens}:null;}
function normalizeError(value){if(!value||typeof value!=='object')return null;return{code:String(value.code||'').slice(0,120),message:String(value.message||'').slice(0,1000)};}
function normalizeProviderMeta(value){if(!value||typeof value!=='object')return null;const out={};for(const key of SAFE_PROVIDER_META_KEYS)if(value[key]!=null)out[key]=typeof value[key]==='string'?String(value[key]).slice(0,240):value[key];return Object.keys(out).length?out:null;}
function normalizeStudioLink(value){if(value==null)return null;if(!value||typeof value!=='object'||Array.isArray(value))return null;const projectId=String(value.projectId||'').trim(),projectUpdatedAt=safeDate(value.projectUpdatedAt),handoffHash=String(value.handoffHash||'').toLowerCase();if(!projectId||!projectUpdatedAt||!/^[a-f0-9]{64}$/.test(handoffHash))return null;return{projectId,projectUpdatedAt,handoffHash};}
function normalizeProvenance(value){const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;for(const[id,raw]of Object.entries(value)){if(!raw||typeof raw!=='object'||containsCredentialLikeField(raw))continue;const exportHash=String(raw.exportHash||'').toLowerCase();if(!/^[a-f0-9]{64}$/.test(exportHash))continue;out[id]={taskId:String(raw.taskId||''),provider:'byteplus-modelark',adapter:'seedance-2.0',exportHash,outputKind:raw.outputKind==='last-frame'?'last-frame':'video',sourceArtifactKind:raw.sourceArtifactKind==='job'?'job':'result',studioLink:normalizeStudioLink(raw.studioLink),attachedAt:safeDate(raw.attachedAt)};}return out;}
function nextReferenceToken(used){for(let index=1;index<10000;index++){const token=`@ref${String(index).padStart(2,'0')}`;if(!used.has(token))return token;}throw new Error('Prompt Studio reference token space exhausted.');}
function isHttpsUrl(value){try{return new URL(String(value||'')).protocol==='https:';}catch{return false;}}
function safeDate(value){if(!value)return null;const date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString();}
function numberOrNull(value){const number=Number(value);return Number.isFinite(number)?number:null;}
function shortTask(value){const text=String(value||'');return text.length<=18?text:`${text.slice(0,9)}…${text.slice(-6)}`;}
function safeId(value){return String(value||'task').replace(/[^a-z0-9_-]+/gi,'-').slice(0,48)||'task';}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,10)||Math.random().toString(36).slice(2,12);}catch{return Math.random().toString(36).slice(2,12);}}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
