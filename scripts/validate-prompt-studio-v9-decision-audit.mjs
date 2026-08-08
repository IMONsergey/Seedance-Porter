#!/usr/bin/env node
import { createPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { savePromptStudioGenerationArtifact } from '../studio/prompt-studio-generation-results.js';
import { GENERATION_EVALUATION_DIMENSIONS, savePromptStudioGenerationEvaluation, createPromptStudioGenerationComparison, setPromptStudioGenerationWinner, createPromptStudioGenerationRetake } from '../studio/prompt-studio-generation-evaluation.js';
import { auditPromptStudioGenerationDecisions } from '../studio/prompt-studio-generation-evaluation-audit.js';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
let project=createPromptStudioProject({id:'v9-audit',title:'V9 Audit',mode:'text-to-video',duration:6,sections:[{id:'objective',content:'Audit production decision lineage.'},{id:'action',content:'One controlled motion.'}]});
project=savePromptStudioGenerationArtifact(project,result('task-a','a'.repeat(64)),{now:Date.parse('2026-08-08T21:00:00Z')});
project=savePromptStudioGenerationArtifact(project,result('task-b','b'.repeat(64)),{now:Date.parse('2026-08-08T21:00:01Z')});
project.generationBatchLinks={'task-a':{batchId:'batch-audit',planHash:'c'.repeat(64),itemId:'a',variantId:'variant-a',variantLabel:'A',variantHash:'d'.repeat(64),exportHash:'a'.repeat(64),savedAt:'2026-08-08T21:00:02.000Z'}};
project=savePromptStudioGenerationEvaluation(project,{taskId:'task-a',exportHash:'a'.repeat(64),scores:readyScores(5),notes:'Strong controlled take.'},{now:Date.parse('2026-08-08T21:01:00Z')});
project=savePromptStudioGenerationEvaluation(project,{taskId:'task-b',exportHash:'b'.repeat(64),scores:readyScores(4),notes:'Usable source for a retake.'},{now:Date.parse('2026-08-08T21:01:01Z')});
const comparison=createPromptStudioGenerationComparison(project,['task-a','task-b'],{id:'cmp-audit',label:'Audit comparison',now:'2026-08-08T21:02:00.000Z'});project=comparison.project;
project=setPromptStudioGenerationWinner(project,'cmp-audit','task-a',{reason:'A has the cleaner movement with sufficient evidence coverage.',now:'2026-08-08T21:03:00.000Z'});
project=createPromptStudioGenerationRetake(project,{sourceTaskId:'task-b',lever:'camera',changeInstruction:'Reduce camera speed only.',expectedImprovement:'Improve shot readability while preserving the usable subject/light state.',retainedLocks:['subject identity','lighting direction']},{id:'retake-audit',now:'2026-08-08T21:04:00.000Z'}).project;
let audit=auditPromptStudioGenerationDecisions(project);assert(audit.ok&&audit.errors===0&&audit.warnings===0,'Consistent V9 decisions must pass lineage/readiness audit cleanly.');assert(audit.counts.generationRecords===2&&audit.counts.evaluations===2&&audit.counts.comparisons===1&&audit.counts.retakes===1&&audit.counts.winners===1,'Audit must expose deterministic production-decision counts.');

let drift=structuredClone(project);drift.generationEvaluations[0].exportHash='f'.repeat(64);audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='evaluation-export-drift'),'Audit must detect Evaluation ↔ Generation Result export-hash drift.');

drift=structuredClone(project);drift.generationEvaluations.push({...drift.generationEvaluations[0],id:'eval-duplicate',updatedAt:'2026-08-08T21:10:00.000Z'});audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='evaluation-task-duplicate'),'Audit must detect duplicate raw Evaluation state even though normalization can recover one canonical record.');

drift=structuredClone(project);drift.generationWinners['cmp-audit'].taskId='task-outside';audit=auditPromptStudioGenerationDecisions(drift);assert(audit.issues.some(item=>item.id==='winner-outside-comparison')&&audit.issues.some(item=>item.id==='winner-task-missing'),'Audit must detect winner outside comparison and missing winner task.');

drift=structuredClone(project);drift.generationWinners['cmp-audit'].reason='';audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='winner-rationale-empty'),'Empty winner rationale must be a hard decision-integrity error.');

drift=structuredClone(project);drift.generationEvaluations=drift.generationEvaluations.filter(item=>item.taskId!=='task-a');audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='winner-not-decision-ready'),'Winner without a decision-ready Evaluation must fail audit.');

drift=structuredClone(project);drift.generationRetakes[0].retainedLocks=[];audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='retake-locks-empty'),'Retake without retained locks must be a hard one-lever-retake integrity error.');

drift=structuredClone(project);drift.generationRetakes[0].expectedImprovement='';audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='retake-expected-improvement-empty'),'Retake without expected improvement must fail audit.');

drift=structuredClone(project);drift.generationBatchLinks['task-a'].exportHash='e'.repeat(64);audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='batch-result-export-drift'),'Audit must detect V8 batch lineage ↔ V7 history export drift.');

drift=structuredClone(project);drift.generationResults=drift.generationResults.filter(item=>item.taskId!=='task-b');audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='comparison-task-missing')&&audit.issues.some(item=>item.id==='retake-source-missing'),'Audit must detect decisions orphaned by missing generation history.');

if(failures.length){console.error('Prompt Studio v9 Decision Audit contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,cleanState:true,evaluationDrift:true,duplicateEvaluation:true,winnerOrphan:true,winnerRationaleHardGate:true,winnerReadinessGate:true,retakeLocksHardGate:true,retakeExpectedImprovementHardGate:true,batchLineageDrift:true,orphanDecisionDetection:true},null,2));

function readyScores(score){return Object.fromEntries(GENERATION_EVALUATION_DIMENSIONS.map((def,index)=>[def.id,{score:index<5||def.id==='production-readiness'?score:null,note:index<5||def.id==='production-readiness'?`Observed ${def.id}`:'',evidence:index<5||def.id==='production-readiness'?`frame:${def.id}`:''}]));}
function result(taskId,exportHash){return{kind:'seedance-porter-generation-result',schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',taskId,status:'succeeded',succeeded:true,terminal:true,exportHash,studioLink:null,output:{videoUrl:`https://cdn.example.com/${taskId}.mp4`,lastFrameUrl:`https://cdn.example.com/${taskId}.png`},usage:null,error:null,providerMeta:null,createdAt:'2026-08-08T21:00:00.000Z',completedAt:'2026-08-08T21:00:10.000Z',recordedAt:'2026-08-08T21:00:11.000Z',policy:{secretPersisted:false,externalExecution:true}};}
