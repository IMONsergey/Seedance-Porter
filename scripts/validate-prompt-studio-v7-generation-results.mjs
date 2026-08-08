#!/usr/bin/env node
import { createPromptStudioProject, refreshPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { buildPromptStudioGenerationHandoff } from '../studio/prompt-studio-generation-handoff.js';
import { buildSeedance2ModelArkExport } from '../studio/prompt-studio-seedance-adapter.js';
import {
  attachPromptStudioGenerationOutput,
  containsCredentialLikeField,
  generationArtifactProjectLinkState,
  generationOutputReferenceProvenance,
  listPromptStudioGenerationRecords,
  savePromptStudioGenerationArtifact,
  validatePromptStudioGenerationArtifact
} from '../studio/prompt-studio-generation-results.js';
import { buildGenerationResult, retrieveSeedanceGeneration, submitSeedanceGeneration } from './seedance-modelark-runner-engine.mjs';
import { applyExportStudioLinkToJob, applyJobStudioLinkToResult } from './seedance-modelark-runner-lineage.mjs';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
const API_KEY='v7-test-key-never-persist';
const project=createPromptStudioProject({id:'v7-project',title:'Generation continuation',mode:'text-to-video',aspect:'16:9',duration:6,sections:[{id:'objective',content:'Create one controlled six-second product beauty shot.'},{id:'subject',content:'A single matte sculptural product centered in frame.'},{id:'camera',content:'Slow precise push-in, no handheld motion.'},{id:'action',content:'One soft highlight moves across the surface, then settles.'},{id:'continuity',content:'Keep shape, material, lighting direction and scale unchanged.'},{id:'constraints',content:'One product only. No text, logos or topology drift.'}]});
const handoff=await buildPromptStudioGenerationHandoff(project,{now:'2026-08-08T12:00:00.000Z'});
assert(handoff.project.id===project.id&&handoff.project.updatedAt===project.updatedAt,'Handoff must carry exact project ID + updatedAt lineage.');
const exportBundle=await buildSeedance2ModelArkExport(handoff,{resolution:'1080p',returnLastFrame:true});
assert(exportBundle.ready,'Baseline v7 Seedance export must be ready.');
assert(exportBundle.studioLink?.projectId===project.id&&exportBundle.studioLink?.projectUpdatedAt===project.updatedAt,'Provider export must carry exact Studio project state.');
assert(exportBundle.studioLink?.handoffHash===handoff.integrity.contentHash,'Provider export Studio link must carry verified Handoff hash.');

const submitted=await submitSeedanceGeneration(exportBundle,{apiKey:API_KEY,now:Date.parse('2026-08-08T12:00:01Z'),requester:async()=>jsonResponse({id:'cgt-v7-001'})});
const job=applyExportStudioLinkToJob(submitted,exportBundle);
assert(job.studioLink?.projectId===project.id&&job.studioLink?.handoffHash===handoff.integrity.contentHash,'External Runner manifest boundary must preserve safe Studio lineage.');
assert(!JSON.stringify(job).includes(API_KEY),'Runner job with Studio lineage must remain credential-free.');
const succeeded=await retrieveSeedanceGeneration(job,{apiKey:API_KEY,now:Date.parse('2026-08-08T12:00:30Z'),requester:async()=>jsonResponse({id:'cgt-v7-001',status:'succeeded',content:{video_url:'https://cdn.example.com/v7.mp4',last_frame_url:'https://cdn.example.com/v7-last.png'},model:'dreamina-seedance-2-0-260128',resolution:'1080p',ratio:'16:9',duration:6,generate_audio:true})});
const result=applyJobStudioLinkToResult(buildGenerationResult(succeeded,Date.parse('2026-08-08T12:00:31Z')),succeeded);
assert(result.studioLink?.projectUpdatedAt===project.updatedAt,'Terminal external Runner result must preserve original Studio project version.');

const validation=validatePromptStudioGenerationArtifact(result);
assert(validation.ok&&validation.kind==='result','V7 importer must accept a valid terminal Runner result.');
assert(generationArtifactProjectLinkState(project,validation.artifact).state==='exact-project','Fresh result must match exact originating project state.');
const drifted=refreshPromptStudioProject(project,'2026-08-08T12:05:00.000Z');
assert(generationArtifactProjectLinkState(drifted,validation.artifact).state==='same-project-drift','Same project with newer updatedAt must be reported as drifted, not exact.');
const other={...project,id:'other-project'};
assert(generationArtifactProjectLinkState(other,validation.artifact).state==='different-project','Different project ID must be reported explicitly.');
const legacy={...result};delete legacy.studioLink;
assert(validatePromptStudioGenerationArtifact(legacy).ok&&generationArtifactProjectLinkState(project,legacy).state==='unlinked','Historical result without Studio lineage must remain importable as unlinked.');

let saved=savePromptStudioGenerationArtifact(project,result,{now:Date.parse('2026-08-08T12:01:00Z')});
assert(listPromptStudioGenerationRecords(saved).length===1&&listPromptStudioGenerationRecords(saved)[0].status==='succeeded','Explicit save must persist one normalized generation record.');
const staleQueued={...job,status:'queued',providerStatus:'queued',terminal:false,completedAt:null,updatedAt:'2026-08-08T12:00:10.000Z'};
saved=savePromptStudioGenerationArtifact(saved,staleQueued,{now:Date.parse('2026-08-08T12:02:00Z')});
assert(listPromptStudioGenerationRecords(saved)[0].sourceArtifactKind==='result'&&listPromptStudioGenerationRecords(saved)[0].status==='succeeded','Older queued job must not downgrade saved terminal result for same task/export.');
let conflict=false;try{savePromptStudioGenerationArtifact(saved,{...result,exportHash:'a'.repeat(64)});}catch{conflict=true;}
assert(conflict,'Same task ID with different export hash must be rejected as lineage conflict.');

const videoAttach=attachPromptStudioGenerationOutput(saved,result,'video',{now:Date.parse('2026-08-08T12:03:00Z')});
assert(videoAttach.reference.mediaType==='video'&&videoAttach.reference.role==='motion'&&videoAttach.reference.uri==='https://cdn.example.com/v7.mp4','Explicit video attach must create a video/motion reference from generated output.');
assert(/^@ref\d{2,}$/.test(videoAttach.reference.token),'Generated video must receive stable Prompt Studio @refNN token.');
const videoProvenance=generationOutputReferenceProvenance(videoAttach.project,videoAttach.reference.id);
assert(videoProvenance?.taskId==='cgt-v7-001'&&videoProvenance?.exportHash===result.exportHash&&videoProvenance?.outputKind==='video','Generated video reference must retain task/export provenance outside core reference schema.');

const lastAttach=attachPromptStudioGenerationOutput(videoAttach.project,result,'last-frame',{now:Date.parse('2026-08-08T12:04:00Z')});
assert(lastAttach.reference.mediaType==='image'&&lastAttach.reference.role==='first-frame'&&lastAttach.reference.locked===true,'Explicit last-frame attach must become a locked first-frame image for continuation.');
assert(lastAttach.reference.uri==='https://cdn.example.com/v7-last.png','Last-frame continuation reference must preserve generated HTTPS URL.');
assert(lastAttach.reference.token!==videoAttach.reference.token,'Each attached generated output must get a unique reference token.');
const refreshed=refreshPromptStudioProject(lastAttach.project,'2026-08-08T12:06:00Z');
assert(listPromptStudioGenerationRecords(refreshed)[0].taskId==='cgt-v7-001','Core project refresh must preserve extension-safe generation history.');
assert(generationOutputReferenceProvenance(refreshed,lastAttach.reference.id)?.outputKind==='last-frame','Core project refresh must preserve generated-reference provenance extension.');

const credentialArtifact={...result,debug:{Authorization:'Bearer bad'}};
assert(containsCredentialLikeField(credentialArtifact),'Credential detector must find nested Authorization-like fields.');
const credentialValidation=validatePromptStudioGenerationArtifact(credentialArtifact);
assert(!credentialValidation.ok&&credentialValidation.errors.includes('credential-like-field-present'),'Browser importer must reject credential-bearing manifests before staging.');
const unsafePolicy={...result,policy:{secretPersisted:true,externalExecution:true}};
assert(!validatePromptStudioGenerationArtifact(unsafePolicy).ok,'Browser importer must reject unsafe result policy.');
const badOutput={...result,output:{videoUrl:'http://insecure.example/video.mp4',lastFrameUrl:''}};
assert(!validatePromptStudioGenerationArtifact(badOutput).ok,'Browser importer must require HTTPS succeeded output.');

if(failures.length){console.error('Prompt Studio v7 Generation Results contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,lineage:['exact-project','same-project-drift','different-project','unlinked'],runnerManifestBoundary:true,credentialImportBlocked:true,historyMonotonic:true,hashConflictBlocked:true,videoContinuation:true,lastFrameContinuation:true,extensionPersistence:true,networkDuringImport:false},null,2));

function jsonResponse(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});}
