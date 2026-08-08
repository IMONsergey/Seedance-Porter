#!/usr/bin/env node
import {
  MODELARK_TASKS_ENDPOINT,
  buildGenerationResult,
  cancelQueuedSeedanceGeneration,
  downloadSeedanceGenerationOutput,
  retrieveSeedanceGeneration,
  submitSeedanceGeneration,
  validateGenerationJob,
  validateSeedanceRunnerExport,
  waitForSeedanceGeneration
} from './seedance-modelark-runner-engine.mjs';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
const API_KEY='runner-secret-key-DO-NOT-PERSIST';

const exportBundle=makeExport();
assert(validateSeedanceRunnerExport(exportBundle).ok,'Ready provider export must pass runner preflight.');
let networkCalls=0;
try{await submitSeedanceGeneration({...exportBundle,ready:false,payload:null},{apiKey:API_KEY,requester:async()=>{networkCalls++;}});}catch(error){assert(error.code==='invalid-export','Blocked export must fail before execution.');}
assert(networkCalls===0,'Blocked export must execute zero network calls.');

const exportWithKey=makeExport();exportWithKey.payload.content[0].text=`Never persist ${API_KEY}`;
try{await submitSeedanceGeneration(exportWithKey,{apiKey:API_KEY,requester:async()=>{networkCalls++;}});}catch(error){assert(error.code==='secret-value-persisted','Export containing ARK_API_KEY value must be rejected before request.');}
assert(networkCalls===0,'Secret-bearing export must execute zero network calls.');

const submitCalls=[];
const submitted=await submitSeedanceGeneration(exportBundle,{apiKey:API_KEY,now:Date.parse('2026-08-08T10:00:00Z'),requester:async(url,options)=>{submitCalls.push({url,options});return jsonResponse({id:'cgt-test-001',model:'dreamina-seedance-2-0-260128',created_at:1786183200});}});
assert(submitCalls.length===1&&submitCalls[0].url===MODELARK_TASKS_ENDPOINT&&submitCalls[0].options.method==='POST','Submit must POST exactly once to official ModelArk task endpoint.');
assert(submitCalls[0].options.headers.Authorization===`Bearer ${API_KEY}`,'Submit must use ARK_API_KEY only as the outbound Authorization header.');
assert(JSON.parse(submitCalls[0].options.body).model==='dreamina-seedance-2-0-260128','Submit body must be the verified ready provider payload.');
assert(submitted.taskId==='cgt-test-001'&&submitted.status==='submitted','Submit must create resumable submitted job manifest.');
assert(validateGenerationJob(submitted).ok,'Submitted job must satisfy runner protocol validation.');
assert(!JSON.stringify(submitted).includes(API_KEY)&&!JSON.stringify(submitted).includes('Authorization'),'Job manifest must never persist API key or Authorization header.');
assert(submitted.exportHash.length===64&&submitted.exportSummary.images===1&&submitted.exportSummary.audios===0,'Job must persist only hash + non-sensitive export summary.');

const createWithUnexpectedTerminal=await submitSeedanceGeneration(exportBundle,{apiKey:API_KEY,requester:async()=>jsonResponse({id:'cgt-test-terminal',status:'succeeded',content:{video_url:'https://cdn.example.com/create.mp4'}})});
assert(createWithUnexpectedTerminal.status==='submitted'&&createWithUnexpectedTerminal.terminal===false&&createWithUnexpectedTerminal.completedAt===null,'Create response must remain non-terminal until authoritative task retrieval, even if upstream unexpectedly includes terminal status.');

const queuedCalls=[];
const queued=await retrieveSeedanceGeneration(submitted,{apiKey:API_KEY,now:Date.parse('2026-08-08T10:00:05Z'),requester:async(url,options)=>{queuedCalls.push({url,options});return jsonResponse({id:'cgt-test-001',status:'queued',model:'dreamina-seedance-2-0-260128',created_at:1786183200,updated_at:1786183205});}});
assert(queued.status==='queued'&&!queued.terminal,'Retrieve must normalize queued provider status.');
assert(queuedCalls[0].options.method==='GET'&&queuedCalls[0].options.headers.Authorization===`Bearer ${API_KEY}`,'Status must authenticate GET against task URL.');
assert(!JSON.stringify(queued).includes(API_KEY),'Retrieved job must remain secret-free.');
const tampered={...queued,terminal:true};const tamperedValidation=validateGenerationJob(tampered);assert(!tamperedValidation.ok&&tamperedValidation.errors.includes('terminal-status-mismatch'),'Engine validation must reject status/terminal lifecycle tampering.');

let keyBearingJobCalls=0,keyBearingJobError=null;const keyBearingJob=JSON.parse(JSON.stringify(queued));keyBearingJob.providerMeta.model=`model-${API_KEY}`;try{await retrieveSeedanceGeneration(keyBearingJob,{apiKey:API_KEY,requester:async()=>{keyBearingJobCalls++;}});}catch(error){keyBearingJobError=error;}
assert(keyBearingJobError?.code==='secret-value-persisted'&&keyBearingJobCalls===0,'Runner must refuse a persisted job containing current API key value before network execution.');

let clock=Date.parse('2026-08-08T10:00:10Z');const polled=[];const waitResponses=[{id:'cgt-test-001',status:'running',updated_at:1786183210},{id:'cgt-test-001',status:'succeeded',content:{video_url:'https://cdn.example.com/final.mp4',last_frame_url:'https://cdn.example.com/last.png'},usage:{completion_tokens:246840,total_tokens:246840},model:'dreamina-seedance-2-0-260128',resolution:'1080p',ratio:'16:9',duration:6,framespersecond:24,generate_audio:true,priority:0,created_at:1786183200,updated_at:1786183230}];
const waited=await waitForSeedanceGeneration(queued,{apiKey:API_KEY,pollMs:1000,timeoutMs:10000,sleep:async()=>{},now:()=>{clock+=1000;return clock;},onPoll:current=>polled.push(current.status),requester:async()=>jsonResponse(waitResponses.shift())});
assert(polled.join(',')==='running,succeeded','Wait must poll through running to succeeded.');
assert(waited.job.status==='succeeded'&&waited.job.terminal&&waited.job.output.videoUrl.endsWith('/final.mp4'),'Succeeded provider task must persist output URLs in job.');
assert(waited.job.usage.totalTokens===246840&&waited.job.providerMeta.framesPerSecond===24,'Succeeded job must normalize provider usage/metadata.');
assert(waited.result.kind==='seedance-porter-generation-result'&&waited.result.succeeded===true,'Wait must produce terminal result manifest.');
assert(!JSON.stringify(waited.job).includes(API_KEY)&&!JSON.stringify(waited.result).includes(API_KEY),'Wait job/result manifests must remain secret-free.');
assert(buildGenerationResult(waited.job).taskId===waited.job.taskId,'Terminal result must be reproducible from persisted job.');
assert(validateGenerationJob(waited.job).ok,'Succeeded job must satisfy semantic lifecycle validation.');

const downloadCalls=[];const downloaded=await downloadSeedanceGenerationOutput(waited.job,{requester:async(url,options)=>{downloadCalls.push({url,options});return new Response(new Uint8Array([1,2,3,4]),{status:200,headers:{'content-type':'video/mp4'}});}});
assert(downloaded.contentLength===4&&downloaded.contentType==='video/mp4','Download must return generated video bytes and content type.');
assert(downloadCalls[0].url==='https://cdn.example.com/final.mp4'&&downloadCalls[0].options.method==='GET','Download must use generated HTTPS video URL.');
assert(!downloadCalls[0].options.headers,'Generated output download must not forward ModelArk Authorization header to signed CDN URL.');

const redacted=await retrieveSeedanceGeneration(queued,{apiKey:API_KEY,requester:async()=>jsonResponse({id:'cgt-test-001',status:'failed',error:{code:'BadRequest',message:`Provider echoed ${API_KEY} in an error`}})});
assert(redacted.status==='failed'&&redacted.error.message.includes('[REDACTED]')&&!redacted.error.message.includes(API_KEY),'Provider error payload must redact API key before persistence.');
assert(!JSON.stringify(redacted).includes(API_KEY),'Redacted failed job must not persist API key.');
let httpError=null;try{await retrieveSeedanceGeneration(queued,{apiKey:API_KEY,requester:async()=>jsonResponse({error:{code:'Unauthorized',message:`Bad credential ${API_KEY}`}},401)});}catch(error){httpError=error;}
assert(httpError?.code==='provider-http-error'&&!httpError.message.includes(API_KEY)&&httpError.message.includes('[REDACTED]'),'Thrown provider HTTP errors must redact echoed API key before CLI logging.');
let transportError=null;try{await retrieveSeedanceGeneration(queued,{apiKey:API_KEY,requester:async()=>{throw new Error(`Socket failed near ${API_KEY}`);}});}catch(error){transportError=error;}
assert(transportError?.code==='network-error'&&!transportError.message.includes(API_KEY)&&transportError.message.includes('[REDACTED]'),'Thrown transport errors must redact API key before CLI logging.');
let outputMissingError=null;try{await retrieveSeedanceGeneration(queued,{apiKey:API_KEY,requester:async()=>jsonResponse({id:'cgt-test-001',status:'succeeded',content:{}})});}catch(error){outputMissingError=error;}
assert(outputMissingError?.code==='provider-output-missing','Succeeded provider state without HTTPS content.video_url must fail closed rather than create false success result.');

const cancelMethods=[];const cancelled=await cancelQueuedSeedanceGeneration(queued,{apiKey:API_KEY,requester:async(url,options)=>{cancelMethods.push(options.method);return options.method==='GET'?jsonResponse({id:'cgt-test-001',status:'queued'}):jsonResponse({});}});
assert(cancelMethods.join(',')==='GET,DELETE'&&cancelled.status==='cancelled'&&cancelled.terminal,'Cancel must confirm queued state before DELETE and persist cancelled status.');
assert(validateGenerationJob(cancelled).ok,'Cancelled job must satisfy semantic lifecycle validation.');

const runningMethods=[];let runningError=null;try{await cancelQueuedSeedanceGeneration(queued,{apiKey:API_KEY,requester:async(url,options)=>{runningMethods.push(options.method);return jsonResponse({id:'cgt-test-001',status:'running'});}});}catch(error){runningError=error;}
assert(runningError?.code==='task-running-not-cancellable'&&runningMethods.join(',')==='GET','Runner must refuse DELETE when provider reports running.');

const terminalMethods=[];let terminalDeleteError=null;try{await cancelQueuedSeedanceGeneration(waited.job,{apiKey:API_KEY,requester:async(url,options)=>{terminalMethods.push(options.method);return jsonResponse({id:'cgt-test-001',status:'succeeded',content:{video_url:'https://cdn.example.com/final.mp4'}});}});}catch(error){terminalDeleteError=error;}
assert(terminalDeleteError?.code==='terminal-record-delete-refused'&&terminalMethods.join(',')==='GET','Runner must refuse destructive DELETE of succeeded/failed/expired terminal records.');

let missingKeyCalls=0,missingKeyError=null;try{await retrieveSeedanceGeneration(queued,{apiKey:'',requester:async()=>{missingKeyCalls++;}});}catch(error){missingKeyError=error;}
assert(missingKeyError?.code==='api-key-missing'&&missingKeyCalls===0,'Missing ARK_API_KEY must fail before network execution.');

let downloadBlocked=null;try{await downloadSeedanceGenerationOutput(queued,{requester:async()=>{throw new Error('must not call');}});}catch(error){downloadBlocked=error;}
assert(downloadBlocked?.code==='output-not-ready','Download must refuse non-succeeded jobs before any network request.');

if(failures.length){console.error('Seedance ModelArk runner contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,submit:true,resumableJob:true,createTerminalGuard:true,lifecycleTamperGuard:true,polling:['running','succeeded'],terminalResult:true,providerOutputGuard:true,cancelQueuedOnly:true,terminalDeleteRefused:true,downloadNoAuth:true,secretPersistence:false,upstreamSecretRedaction:true,transportSecretRedaction:true,networkGuard:true},null,2));

function makeExport(){return{kind:'seedance-porter-provider-export',schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',verifiedAgainst:{profile:'byteplus-seedance-2.0'},endpoint:MODELARK_TASKS_ENDPOINT,retrieveEndpoint:`${MODELARK_TASKS_ENDPOINT}/{task_id}`,ready:true,errors:[],warnings:[],payload:{model:'dreamina-seedance-2-0-260128',content:[{type:'text',text:'Create one controlled product shot.'},{type:'image_url',image_url:{url:'https://example.com/product.png'},role:'first_frame'}],resolution:'1080p',ratio:'16:9',duration:6,generate_audio:true,watermark:false,return_last_frame:true},previewPayload:null,referenceTokenMap:{'@ref01':'[Image 1]'},policy:{autoSubmit:false,apiKeyEmbedded:false,networkRequest:false,requiresExternalExecution:true}};}
function jsonResponse(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});}
