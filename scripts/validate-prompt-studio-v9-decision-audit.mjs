#!/usr/bin/env node
import { createPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { savePromptStudioGenerationArtifact } from '../studio/prompt-studio-generation-results.js';
import { savePromptStudioGenerationEvaluation, createPromptStudioGenerationComparison, setPromptStudioGenerationWinner, createPromptStudioGenerationRetake } from '../studio/prompt-studio-generation-evaluation.js';
import { auditPromptStudioGenerationDecisions } from '../studio/prompt-studio-generation-evaluation-audit.js';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
let project=createPromptStudioProject({id:'v9-audit',title:'V9 Audit',mode:'text-to-video',duration:6,sections:[{id:'objective',content:'Audit production decision lineage.'},{id:'action',content:'One controlled motion.'}]});
project=savePromptStudioGenerationArtifact(project,result('task-a','a'.repeat(64)),{now:Date.parse('2026-08-08T21:00:00Z')});
project=savePromptStudioGenerationArtifact(project,result('task-b','b'.repeat(64)),{now:Date.parse('2026-08-08T21:00:01Z')});
project.generationBatchLinks={'task-a':{batchId:'batch-audit',planHash:'c'.repeat(64),itemId:'a',variantId:'variant-a',variantLabel:'A',variantHash:'d'.repeat(64),exportHash:'a'.repeat(64),savedAt:'2026-08-08T21:00:02.000Z'}};
project=savePromptStudioGenerationEvaluation(project,{taskId:'task-a',exportHash:'a'.repeat(64),scores:{camera:{score:5}},notes:'Good camera.'},{now:Date.parse('2026-08-08T21:01:00Z')});
const comparison=createPromptStudioGenerationComparison(project,['task-a','task-b'],{id:'cmp-audit',label:'Audit comparison',now:'2026-08-08T21:02:00.000Z'});project=comparison.project;
project=setPromptStudioGenerationWinner(project,'cmp-audit','task-a',{reason:'A has the cleaner movement.',now:'2026-08-08T21:03:00.000Z'});
project=createPromptStudioGenerationRetake(project,{sourceTaskId:'task-b',lever:'camera',changeInstruction:'Reduce camera speed only.',expectedImprovement:'Improve readability.',retainedLocks:['subject identity']},{id:'retake-audit',now:'2026-08-08T21:04:00.000Z'}).project;
let audit=auditPromptStudioGenerationDecisions(project);assert(audit.ok&&audit.errors===0,'Consistent V9 decisions must pass lineage audit.');assert(audit.counts.generationRecords===2&&audit.counts.evaluations===1&&audit.counts.comparisons===1&&audit.counts.retakes===1&&audit.counts.winners===1,'Audit must expose deterministic production-decision counts.');

let drift=structuredClone(project);drift.generationEvaluations[0].exportHash='f'.repeat(64);audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='evaluation-export-drift'),'Audit must detect Evaluation ↔ Generation Result export-hash drift.');

drift=structuredClone(project);drift.generationWinners['cmp-audit'].taskId='task-outside';audit=auditPromptStudioGenerationDecisions(drift);assert(audit.issues.some(item=>item.id==='winner-outside-comparison')&&audit.issues.some(item=>item.id==='winner-task-missing'),'Audit must detect winner outside comparison and missing winner task.');

drift=structuredClone(project);drift.generationWinners['cmp-audit'].reason='';audit=auditPromptStudioGenerationDecisions(drift);assert(audit.ok&&audit.warnings===1&&audit.issues[0].id==='winner-rationale-empty','Empty winner rationale must be an explicit warning, not silent state.');

drift=structuredClone(project);drift.generationRetakes[0].retainedLocks=[];audit=auditPromptStudioGenerationDecisions(drift);assert(audit.ok&&audit.issues.some(item=>item.id==='retake-locks-empty'),'Retake without retained locks must produce a learning-quality warning.');

drift=structuredClone(project);drift.generationBatchLinks['task-a'].exportHash='e'.repeat(64);audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='batch-result-export-drift'),'Audit must detect V8 batch lineage ↔ V7 history export drift.');

drift=structuredClone(project);drift.generationResults=drift.generationResults.filter(item=>item.taskId!=='task-b');audit=auditPromptStudioGenerationDecisions(drift);assert(!audit.ok&&audit.issues.some(item=>item.id==='comparison-task-missing')&&audit.issues.some(item=>item.id==='retake-source-missing'),'Audit must detect decisions orphaned by missing generation history.');

if(failures.length){console.error('Prompt Studio v9 Decision Audit contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,cleanState:true,evaluationDrift:true,winnerOrphan:true,winnerRationaleWarning:true,retakeLocksWarning:true,batchLineageDrift:true,orphanDecisionDetection:true},null,2));

function result(taskId,exportHash){return{kind:'seedance-porter-generation-result',schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',taskId,status:'succeeded',succeeded:true,terminal:true,exportHash,studioLink:null,output:{videoUrl:`https://cdn.example.com/${taskId}.mp4`,lastFrameUrl:`https://cdn.example.com/${taskId}.png`},usage:null,error:null,providerMeta:null,createdAt:'2026-08-08T21:00:00.000Z',completedAt:'2026-08-08T21:00:10.000Z',recordedAt:'2026-08-08T21:00:11.000Z',policy:{secretPersisted:false,externalExecution:true}};}
