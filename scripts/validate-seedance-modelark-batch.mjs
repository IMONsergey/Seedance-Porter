#!/usr/bin/env node
import { createPromptStudioProject, refreshPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { capturePromptStudioVariant, createPromptStudioVariantSet } from '../studio/prompt-studio-variants.js';
import { buildPromptStudioVariantBatchPlan, validatePromptStudioBatchResult } from '../studio/prompt-studio-generation-batch.js';
import { buildSeedanceBatchResult, createSeedanceBatchJob, runSeedanceBatch, validateSeedanceBatchJob } from './seedance-modelark-batch-engine.mjs';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};const KEY='batch-key-never-persist';
const plan=await makePlan();

let active=0,maxActive=0,postCount=0,getCount=0,taskCounter=0;
const taskMap=new Map();
const requester=async(url,options={})=>{
  active++;maxActive=Math.max(maxActive,active);await delay(5);
  try{
    if(options.method==='POST'){
      postCount++;const id=`cgt-batch-${++taskCounter}`;taskMap.set(id,{status:'succeeded',video:`https://cdn.example.com/${id}.mp4`});return json({id});
    }
    if(options.method==='GET'){
      getCount++;const id=decodeURIComponent(String(url).split('/').pop()),task=taskMap.get(id);return json({id,status:task?.status||'succeeded',content:{video_url:task?.video||`https://cdn.example.com/${id}.mp4`,last_frame_url:`https://cdn.example.com/${id}-last.png`},model:'dreamina-seedance-2-0-260128',resolution:'1080p',ratio:'16:9',duration:6,generate_audio:true});
    }
    return json({});
  }finally{active--;}
};

let job=await createSeedanceBatchJob(plan,{concurrency:2,now:Date.parse('2026-08-08T15:00:00Z')});
assert(validateSeedanceBatchJob(job,plan).ok,'Fresh batch job must validate against its exact plan.');
const snapshots=[];job=await runSeedanceBatch(plan,job,{apiKey:KEY,requester,concurrency:2,pollMs:1000,timeoutMs:10000,sleep:async()=>{},now:clock('2026-08-08T15:00:01Z'),onState:state=>snapshots.push(structuredClone(state))});
assert(job.status==='succeeded'&&job.items.every(item=>item.status==='succeeded'),'Two-item batch must reach succeeded when every provider task succeeds.');
assert(postCount===2,'Two batch items must create exactly two paid POST submissions.');
assert(getCount>=2,'Each submitted task must be retrieved/polled to terminal state.');
assert(maxActive<=2&&maxActive>=2,'Observed requester concurrency must respect configured local concurrency=2.');
assert(snapshots.length>=4,'Batch execution must expose/persist multiple intermediate state snapshots.');
assert(snapshots.every(snapshot=>validateSeedanceBatchJob(snapshot,plan).ok),'Every emitted batch snapshot must remain protocol-valid and resumable after a process crash.');
assert(job.items.every(item=>item.job?.studioLink?.projectId===plan.project.id),'Per-item Runner jobs must retain Studio lineage.');
assert(job.items.every(item=>item.result?.studioLink?.handoffHash),'Per-item terminal results must retain Handoff lineage.');
assert(!JSON.stringify(job).includes(KEY)&&!JSON.stringify(job).includes('Authorization'),'Batch job manifest must never persist ARK_API_KEY or Authorization.');
const result=buildSeedanceBatchResult(job,Date.parse('2026-08-08T15:10:00Z'));
assert(result.status==='succeeded'&&validatePromptStudioBatchResult(result).ok,'Terminal successful batch job must produce browser-importable batch result.');
assert(!JSON.stringify(result).includes(KEY),'Batch result must remain credential-free.');

const onePlan={...structuredClone(plan),items:[structuredClone(plan.items[0])]};onePlan.ready=true;onePlan.errors=[];onePlan.warnings=[];onePlan.integrity=await rehashPlan(onePlan);
let uncertainJob=await createSeedanceBatchJob(onePlan,{concurrency:1,now:Date.parse('2026-08-08T16:00:00Z')});let uncertainPosts=0;
const uncertainRequester=async(url,options={})=>{if(options.method==='POST'){uncertainPosts++;throw new Error('socket closed after request write');}throw new Error('GET must not run without task ID');};
uncertainJob=await runSeedanceBatch(onePlan,uncertainJob,{apiKey:KEY,requester:uncertainRequester,concurrency:1,pollMs:1000,timeoutMs:2000,sleep:async()=>{},now:clock('2026-08-08T16:00:01Z')});
assert(uncertainJob.items[0].status==='submission-uncertain'&&uncertainJob.items[0].job===null,'Ambiguous paid POST must stop as submission-uncertain with no invented task ID.');
assert(validateSeedanceBatchJob(uncertainJob,onePlan).ok,'submission-uncertain batch job must remain a valid persisted manual-reconciliation state.');
assert(uncertainPosts===1,'Ambiguous submission must perform exactly one POST attempt.');
uncertainJob=await runSeedanceBatch(onePlan,uncertainJob,{apiKey:KEY,requester:uncertainRequester,concurrency:1,now:clock('2026-08-08T16:01:00Z')});
assert(uncertainPosts===1,'Re-running a submission-uncertain batch must not automatically repeat the paid POST.');
assert(uncertainJob.status==='completed-with-errors','A submission-uncertain-only batch must finish in manual-review/error state, not succeeded.');

let resumeJob=await createSeedanceBatchJob(onePlan,{concurrency:1,now:Date.parse('2026-08-08T17:00:00Z')});let resumePosts=0,resumeGets=0;
const interruptRequester=async(url,options={})=>{if(options.method==='POST'){resumePosts++;return json({id:'cgt-resume-001'});}if(options.method==='GET'){resumeGets++;throw new Error('temporary poll network loss');}return json({});};
resumeJob=await runSeedanceBatch(onePlan,resumeJob,{apiKey:KEY,requester:interruptRequester,concurrency:1,pollMs:1000,timeoutMs:2000,sleep:async()=>{},now:clock('2026-08-08T17:00:01Z')});
assert(resumeJob.items[0].status==='interrupted'&&resumeJob.items[0].job?.taskId==='cgt-resume-001','Known task ID must be retained when polling is interrupted.');
assert(validateSeedanceBatchJob(resumeJob,onePlan).ok,'Interrupted known-task job must remain protocol-valid for resume.');
assert(resumePosts===1&&resumeGets>=1,'Interrupted known task must have exactly one original POST.');
const resumeRequester=async(url,options={})=>{if(options.method==='POST'){resumePosts++;throw new Error('resume must not POST again');}if(options.method==='GET'){resumeGets++;return json({id:'cgt-resume-001',status:'succeeded',content:{video_url:'https://cdn.example.com/resume.mp4',last_frame_url:'https://cdn.example.com/resume-last.png'},model:'dreamina-seedance-2-0-260128',resolution:'1080p',ratio:'16:9',duration:6});}return json({});};
resumeJob=await runSeedanceBatch(onePlan,resumeJob,{apiKey:KEY,requester:resumeRequester,concurrency:1,pollMs:1000,timeoutMs:2000,sleep:async()=>{},now:clock('2026-08-08T17:01:00Z')});
assert(resumeJob.items[0].status==='succeeded'&&resumePosts===1,'Resuming an interrupted known task must succeed without a second POST.');

let invalidConcurrencyCalls=0;try{await runSeedanceBatch(onePlan,await createSeedanceBatchJob(onePlan,{concurrency:1}),{apiKey:KEY,requester:async()=>{invalidConcurrencyCalls++;},concurrency:9});}catch(error){assert(error.code==='invalid-concurrency','Out-of-range local concurrency must be rejected.');}
assert(invalidConcurrencyCalls===0,'Invalid local concurrency must fail before any network call.');
const mismatched=structuredClone(job);mismatched.planHash='a'.repeat(64);let mismatchCalls=0;try{await runSeedanceBatch(plan,mismatched,{apiKey:KEY,requester:async()=>{mismatchCalls++;}});}catch(error){assert(error.code==='invalid-batch-job','Plan/job hash mismatch must block execution.');}
assert(mismatchCalls===0,'Plan/job mismatch must fail before network execution.');

if(failures.length){console.error('Seedance ModelArk Batch Runner contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,items:2,configuredConcurrency:2,observedMaxConcurrency:maxActive,paidPosts:postCount,allSnapshotsResumable:true,submissionUncertainNoRetry:true,knownTaskResumeWithoutPost:true,credentialPersistence:false,batchResultValid:true},null,2));

async function makePlan(){
  const project=createPromptStudioProject({id:'batch-project',title:'Batch runner validation',mode:'text-to-video',aspect:'16:9',duration:6,now:'2026-08-08T14:30:00.000Z',sections:[{id:'objective',content:'Create one controlled product motion study.'},{id:'subject',content:'One matte geometric object.'},{id:'camera',content:'Static medium shot.'},{id:'action',content:'A single highlight travels across the surface.'},{id:'continuity',content:'Keep geometry and material stable.'},{id:'constraints',content:'No text, logo or duplicate object.'}]});let set=createPromptStudioVariantSet(project,{id:'base',label:'Base',now:'2026-08-08T14:30:01.000Z'});const a=refreshPromptStudioProject({...structuredClone(project),sections:project.sections.map(s=>s.id==='camera'?{...s,content:'Slow push-in.'}:s)},'2026-08-08T14:30:02.000Z');set=capturePromptStudioVariant(a,set,'Push',{id:'push',now:'2026-08-08T14:30:03.000Z'});const b=refreshPromptStudioProject({...structuredClone(project),sections:project.sections.map(s=>s.id==='camera'?{...s,content:'Locked-off camera.'}:s)},'2026-08-08T14:30:04.000Z');set=capturePromptStudioVariant(b,set,'Locked',{id:'locked',now:'2026-08-08T14:30:05.000Z'});project.variants=set;return buildPromptStudioVariantBatchPlan(project,['push','locked'],{now:'2026-08-08T14:31:00.000Z',provider:{resolution:'1080p'}});}
async function rehashPlan(plan){const core=structuredClone(plan);delete core.integrity;return{algorithm:'sha-256',canonicalization:'stable-json-v1',contentHash:await sha(stable(core))};}
async function sha(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function stable(value){if(Array.isArray(value))return`[${value.map(stable).join(',')}]`;if(value&&typeof value==='object')return`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;return JSON.stringify(value);}
function clock(start){let value=Date.parse(start);return()=>{value+=1000;return value;};}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});}
