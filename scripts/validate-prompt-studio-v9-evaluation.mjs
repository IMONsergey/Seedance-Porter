#!/usr/bin/env node
import { createPromptStudioProject, refreshPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { createPromptStudioVariantSet, capturePromptStudioVariant } from '../studio/prompt-studio-variants.js';
import { savePromptStudioGenerationArtifact, listPromptStudioGenerationRecords } from '../studio/prompt-studio-generation-results.js';
import {
  GENERATION_EVALUATION_DIMENSIONS,
  attachGenerationWinnerOutput,
  buildPromptStudioGenerationComparisonView,
  createPromptStudioGenerationComparison,
  createPromptStudioGenerationRetake,
  listPromptStudioGenerationEvaluations,
  listPromptStudioGenerationRetakes,
  promptStudioGenerationEvaluationForTask,
  promptStudioGenerationEvaluationReadiness,
  promptStudioGenerationWinner,
  savePromptStudioGenerationEvaluation,
  setPromptStudioGenerationWinner
} from '../studio/prompt-studio-generation-evaluation.js';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
let project=createPromptStudioProject({id:'v9-project',title:'V9 Evaluation',mode:'text-to-video',aspect:'16:9',duration:6,now:'2026-08-08T19:00:00.000Z',sections:[{id:'objective',content:'Create one controlled product beauty shot.'},{id:'subject',content:'One matte object.'},{id:'camera',content:'Static medium shot.'},{id:'action',content:'One highlight moves across the surface.'},{id:'continuity',content:'Keep geometry stable.'},{id:'constraints',content:'No text, logo or duplicate object.'}]});
let set=createPromptStudioVariantSet(project,{id:'base',label:'Frozen Base',now:'2026-08-08T19:00:01.000Z'});
const push=refreshPromptStudioProject({...structuredClone(project),sections:project.sections.map(section=>section.id==='camera'?{...section,content:'Slow precise push-in.'}:section)},'2026-08-08T19:00:02.000Z');set=capturePromptStudioVariant(push,set,'Push In',{id:'variant-push',now:'2026-08-08T19:00:03.000Z'});
const locked=refreshPromptStudioProject({...structuredClone(project),sections:project.sections.map(section=>section.id==='lighting'?{...section,content:'Brighter edge light from camera-right.'}:section)},'2026-08-08T19:00:04.000Z');set=capturePromptStudioVariant(locked,set,'Edge Light',{id:'variant-light',now:'2026-08-08T19:00:05.000Z'});project.variants=set;

project=savePromptStudioGenerationArtifact(project,result('task-push','a'.repeat(64),'https://cdn.example.com/push.mp4','https://cdn.example.com/push-last.png'),{now:Date.parse('2026-08-08T19:01:00Z')});
project=savePromptStudioGenerationArtifact(project,result('task-light','b'.repeat(64),'https://cdn.example.com/light.mp4','https://cdn.example.com/light-last.png'),{now:Date.parse('2026-08-08T19:01:01Z')});
project.generationBatchLinks={
  'task-push':{batchId:'batch-v9',planHash:'c'.repeat(64),itemId:'item-push',variantId:'variant-push',variantLabel:'Push In',variantHash:'d'.repeat(64),exportHash:'a'.repeat(64),savedAt:'2026-08-08T19:01:02.000Z'},
  'task-light':{batchId:'batch-v9',planHash:'c'.repeat(64),itemId:'item-light',variantId:'variant-light',variantLabel:'Edge Light',variantHash:'e'.repeat(64),exportHash:'b'.repeat(64),savedAt:'2026-08-08T19:01:02.000Z'}
};
assert(listPromptStudioGenerationRecords(project).length===2,'V9 fixture must contain two canonical generation records.');
assert(GENERATION_EVALUATION_DIMENSIONS.length===13,'V9 production rubric must contain exactly 13 named dimensions.');

project=savePromptStudioGenerationEvaluation(project,{taskId:'task-push',exportHash:'a'.repeat(64),scores:scores({'task-adherence':5,camera:5,'motion-action':5,'production-readiness':5,continuity:4}),verdict:'candidate',strengths:['clean camera','stable geometry'],weaknesses:['slight lighting softness'],artifactFlags:[],notes:'Best motion read.'},{now:Date.parse('2026-08-08T19:02:00Z')});
project=savePromptStudioGenerationEvaluation(project,{taskId:'task-light',exportHash:'b'.repeat(64),scores:scores({camera:3,'lighting-color':5,'production-readiness':4,continuity:4}),verdict:'candidate',strengths:['strong edge light'],weaknesses:['less dynamic'],artifactFlags:['minor shimmer'],notes:'Good lighting, weaker motion.'},{now:Date.parse('2026-08-08T19:02:01Z')});
const pushEval=promptStudioGenerationEvaluationForTask(project,'task-push'),lightEval=promptStudioGenerationEvaluationForTask(project,'task-light');
assert(pushEval?.overallScore===4.8,'Evaluation overall score must be transparent average of rated dimensions only.');
assert(pushEval?.ratedDimensions===5&&pushEval?.evidenceDimensions===5&&pushEval?.decisionReady===true,'Five rated/evidenced dimensions including production-readiness must become decision-ready.');
assert(lightEval?.decisionReady===false&&promptStudioGenerationEvaluationReadiness(project,'task-light').missing.some(item=>item.startsWith('rated-dimensions:')),'Incomplete Evaluation must remain saved but not decision-ready.');
assert(listPromptStudioGenerationEvaluations(project).length===2,'Both task evaluations must persist.');
let badHash=false;try{savePromptStudioGenerationEvaluation(project,{taskId:'task-push',exportHash:'f'.repeat(64),scores:{}});}catch{badHash=true;}assert(badHash,'Evaluation must reject task/export lineage mismatch.');

const duplicateState=structuredClone(project);duplicateState.generationEvaluations.push({...duplicateState.generationEvaluations.find(item=>item.taskId==='task-push'),id:'eval-duplicate',notes:'newer canonical copy',updatedAt:'2026-08-08T19:02:30.000Z'});const normalizedPush=listPromptStudioGenerationEvaluations(duplicateState).filter(item=>item.taskId==='task-push');assert(normalizedPush.length===1&&normalizedPush[0].notes==='newer canonical copy','Raw duplicate Evaluations must normalize to one latest canonical record per task.');

const created=createPromptStudioGenerationComparison(project,['task-push','task-light'],{id:'cmp-v9',label:'Push vs Edge Light',now:'2026-08-08T19:03:00.000Z'});project=created.project;
let view=buildPromptStudioGenerationComparisonView(project,'cmp-v9');assert(view.rows.length===2,'Saved comparison must derive two result rows.');
const pushRow=view.rows.find(row=>row.taskId==='task-push'),lightRow=view.rows.find(row=>row.taskId==='task-light');assert(pushRow?.variant?.id==='variant-push','Comparison must recover V8 batch → V4 variant lineage.');
assert(pushRow?.variant?.changedControls?.length>0,'Comparison must expose changed controls from the variant delta.');
assert(pushRow?.overallScore===4.8&&pushRow?.decisionReady===true,'Comparison must surface saved Evaluation score/readiness without copying Evaluation into comparison record.');
assert(lightRow?.decisionReady===false,'Comparison row must expose incomplete review as not decision-ready.');

let outsider=false;try{setPromptStudioGenerationWinner(project,'cmp-v9','task-outsider',{reason:'Invalid outsider.'});}catch{outsider=true;}assert(outsider,'Winner selection must reject a task outside the comparison.');
let incompleteWinner=false;try{setPromptStudioGenerationWinner(project,'cmp-v9','task-light',{reason:'Lighting is stronger.'});}catch(error){incompleteWinner=String(error.message).includes('not decision-ready');}assert(incompleteWinner,'Winner selection must reject a comparison candidate without decision-ready Evaluation.');
let emptyReason=false;try{setPromptStudioGenerationWinner(project,'cmp-v9','task-push',{reason:'   '});}catch(error){emptyReason=String(error.message).includes('rationale');}assert(emptyReason,'Winner selection must require an explicit human rationale.');
project=setPromptStudioGenerationWinner(project,'cmp-v9','task-push',{reason:'Best camera/motion balance with sufficient review evidence.',now:'2026-08-08T19:04:00.000Z'});
const winner=promptStudioGenerationWinner(project,'cmp-v9');assert(winner?.taskId==='task-push'&&winner?.exportHash==='a'.repeat(64),'Winner must retain task + export lineage.');
view=buildPromptStudioGenerationComparisonView(project,'cmp-v9');assert(view.winner?.reason.includes('sufficient review evidence'),'Comparison view must surface explicit human winner rationale.');

const continuation=attachGenerationWinnerOutput(project,'cmp-v9','video',{now:Date.parse('2026-08-08T19:05:00Z')});project=continuation.project;assert(continuation.reference.mediaType==='video'&&continuation.reference.role==='motion','Winner video continuation must reuse canonical V7 generated-output reference semantics.');assert(/^@ref\d{2,}$/.test(continuation.reference.token),'Winner continuation must allocate a stable Prompt Studio reference token.');

const retake=createPromptStudioGenerationRetake(project,{sourceTaskId:'task-light',lever:'camera',changeInstruction:'Change only the camera: use the precise push-in from the winning take while keeping lighting and subject locks unchanged.',expectedImprovement:'Increase motion readability without losing the stronger edge light.',retainedLocks:['subject geometry','edge-light direction','material response']},{id:'retake-v9',now:'2026-08-08T19:06:00.000Z'});project=retake.project;assert(retake.retake.lever==='camera'&&retake.retake.status==='draft','Retake must record one named production lever as a draft only.');assert(listPromptStudioGenerationRetakes(project).length===1,'Retake Draft must persist extension-safely.');
let emptyRetake=false;try{createPromptStudioGenerationRetake(project,{sourceTaskId:'task-light',lever:'camera',changeInstruction:'Change camera only.',expectedImprovement:'',retainedLocks:[]});}catch{emptyRetake=true;}assert(emptyRetake,'Retake must require explicit instruction, expected improvement and retained locks.');

const refreshed=refreshPromptStudioProject(project,'2026-08-08T19:07:00.000Z');assert(promptStudioGenerationEvaluationForTask(refreshed,'task-push')?.overallScore===4.8,'Core project refresh must preserve V9 evaluations.');assert(promptStudioGenerationWinner(refreshed,'cmp-v9')?.taskId==='task-push','Core project refresh must preserve V9 winner selection.');assert(listPromptStudioGenerationRetakes(refreshed)[0]?.id==='retake-v9','Core project refresh must preserve V9 retake drafts.');

if(failures.length){console.error('Prompt Studio v9 Evaluation contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,dimensions:GENERATION_EVALUATION_DIMENSIONS.length,evaluations:2,decisionReady:true,incompleteWinnerBlocked:true,humanRationaleRequired:true,comparisonRows:2,variantDeltaVisible:true,humanWinner:true,winnerContinuation:true,oneLeverRetake:true,duplicateEvaluationNormalized:true,extensionPersistence:true},null,2));

function scores(overrides={}){return Object.fromEntries(GENERATION_EVALUATION_DIMENSIONS.map(def=>[def.id,{score:overrides[def.id]??null,note:overrides[def.id]?`Observed ${def.id}`:'',evidence:overrides[def.id]?`review:${def.id}`:''}]));}
function result(taskId,exportHash,videoUrl,lastFrameUrl){return{kind:'seedance-porter-generation-result',schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',taskId,status:'succeeded',succeeded:true,terminal:true,exportHash,studioLink:{projectId:'v9-project',projectUpdatedAt:'2026-08-08T19:00:00.000Z',handoffHash:'9'.repeat(64)},output:{videoUrl,lastFrameUrl},usage:null,error:null,providerMeta:{model:'dreamina-seedance-2-0-260128',resolution:'1080p',ratio:'16:9',duration:6},createdAt:'2026-08-08T19:00:10.000Z',completedAt:'2026-08-08T19:00:30.000Z',recordedAt:'2026-08-08T19:00:31.000Z',policy:{secretPersisted:false,externalExecution:true}};}
