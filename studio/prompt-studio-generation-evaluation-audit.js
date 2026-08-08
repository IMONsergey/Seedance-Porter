import {
  listPromptStudioGenerationComparisons,
  listPromptStudioGenerationEvaluations,
  listPromptStudioGenerationRetakes,
  promptStudioGenerationEvaluationReadiness
} from './prompt-studio-generation-evaluation.js';
import { listPromptStudioGenerationRecords } from './prompt-studio-generation-results.js';
import { promptStudioBatchLinkForTask } from './prompt-studio-generation-batch.js';

export function auditPromptStudioGenerationDecisions(project){
  const issues=[];
  const records=listPromptStudioGenerationRecords(project),byTask=new Map(records.map(item=>[item.taskId,item]));
  const evaluations=listPromptStudioGenerationEvaluations(project),comparisons=listPromptStudioGenerationComparisons(project),retakes=listPromptStudioGenerationRetakes(project);
  const rawEvaluations=Array.isArray(project?.generationEvaluations)?project.generationEvaluations:[],rawComparisons=Array.isArray(project?.generationComparisons)?project.generationComparisons:[],rawRetakes=Array.isArray(project?.generationRetakes)?project.generationRetakes:[];
  const winnerMap=project?.generationWinners&&typeof project.generationWinners==='object'&&!Array.isArray(project.generationWinners)?project.generationWinners:{};

  if(rawEvaluations.length>200)issues.push(issue('error','evaluation-limit-exceeded','generationEvaluations',`Evaluation extension exceeds 200 records (${rawEvaluations.length}).`));
  const rawEvaluationTasks=new Set();for(const raw of rawEvaluations){const taskId=String(raw?.taskId||'');if(taskId&&rawEvaluationTasks.has(taskId))issues.push(issue('error','evaluation-task-duplicate',taskId,'More than one raw Evaluation exists for the same generation task.'));if(taskId)rawEvaluationTasks.add(taskId);}
  for(const evaluation of evaluations){
    const record=byTask.get(evaluation.taskId);
    if(!record){issues.push(issue('error','evaluation-task-missing',evaluation.taskId,'Evaluation references a generation task that no longer exists.'));continue;}
    if(record.status!=='succeeded'||!record.output?.videoUrl)issues.push(issue('error','evaluation-source-not-succeeded',evaluation.taskId,'Visual Evaluation must reference a succeeded generation with video output.'));
    if(normalizeHash(record.exportHash)!==normalizeHash(evaluation.exportHash))issues.push(issue('error','evaluation-export-drift',evaluation.taskId,'Evaluation export hash no longer matches the generation record.'));
    if(!evaluation.decisionReady){const readiness=promptStudioGenerationEvaluationReadiness(project,evaluation.taskId);issues.push(issue('warning','evaluation-not-decision-ready',evaluation.taskId,`Evaluation is saved but not decision-ready: ${readiness.missing.join(', ')||'incomplete review'}.`));}
  }

  if(rawComparisons.length>100)issues.push(issue('error','comparison-limit-exceeded','generationComparisons',`Comparison extension exceeds 100 records (${rawComparisons.length}).`));
  const rawComparisonIds=new Set();for(const raw of rawComparisons){const id=String(raw?.id||'');if(id&&rawComparisonIds.has(id))issues.push(issue('error','comparison-id-duplicate',id,'Comparison ID is duplicated in raw extension state.'));if(id)rawComparisonIds.add(id);}
  const comparisonIds=new Set(),comparisonById=new Map();
  for(const comparison of comparisons){
    comparisonIds.add(comparison.id);comparisonById.set(comparison.id,comparison);
    for(const taskId of comparison.taskIds){const record=byTask.get(taskId);if(!record)issues.push(issue('error','comparison-task-missing',taskId,`Comparison ${comparison.id} references a missing generation task.`));else if(record.status!=='succeeded'||!record.output?.videoUrl)issues.push(issue('error','comparison-task-not-succeeded',taskId,`Comparison ${comparison.id} contains a non-succeeded visual generation.`));}
  }

  if(Object.keys(winnerMap).length>100)issues.push(issue('error','winner-limit-exceeded','generationWinners',`Winner map exceeds 100 entries (${Object.keys(winnerMap).length}).`));
  for(const[comparisonId,rawWinner]of Object.entries(winnerMap)){
    const comparison=comparisonById.get(comparisonId);if(!comparison){issues.push(issue('error','winner-comparison-missing',comparisonId,'Winner record references a comparison that no longer exists.'));continue;}
    const taskId=String(rawWinner?.taskId||'');if(!taskId){issues.push(issue('error','winner-task-empty',comparisonId,'Winner record has no task ID.'));continue;}
    if(!comparison.taskIds.includes(taskId))issues.push(issue('error','winner-outside-comparison',taskId,`Winner is not part of comparison ${comparisonId}.`));
    const record=byTask.get(taskId);if(!record)issues.push(issue('error','winner-task-missing',taskId,'Winner references a generation task that no longer exists.'));else{if(record.status!=='succeeded'||!record.output?.videoUrl)issues.push(issue('error','winner-source-not-succeeded',taskId,'Winner must reference a succeeded visual generation.'));if(normalizeHash(record.exportHash)!==normalizeHash(rawWinner?.exportHash))issues.push(issue('error','winner-export-drift',taskId,'Winner export hash no longer matches the generation record.'));}
    if(!String(rawWinner?.reason||'').trim())issues.push(issue('error','winner-rationale-empty',taskId,'Winner rationale is required.'));
    const readiness=promptStudioGenerationEvaluationReadiness(project,taskId);if(!readiness.ready)issues.push(issue('error','winner-not-decision-ready',taskId,`Winner does not have a decision-ready Evaluation: ${readiness.missing.join(', ')}.`));
  }

  if(rawRetakes.length>100)issues.push(issue('error','retake-limit-exceeded','generationRetakes',`Retake extension exceeds 100 records (${rawRetakes.length}).`));
  const rawRetakeIds=new Set();for(const raw of rawRetakes){const id=String(raw?.id||'');if(id&&rawRetakeIds.has(id))issues.push(issue('error','retake-id-duplicate',id,'Retake Draft ID is duplicated.'));if(id)rawRetakeIds.add(id);const taskId=String(raw?.sourceTaskId||''),record=byTask.get(taskId);if(!record){issues.push(issue('error','retake-source-missing',taskId||id,'Retake Draft references a generation task that no longer exists.'));continue;}if(record.status!=='succeeded'||!record.output?.videoUrl)issues.push(issue('error','retake-source-not-succeeded',taskId,'Retake Draft must start from a succeeded visual generation.'));if(normalizeHash(record.exportHash)!==normalizeHash(raw?.sourceExportHash))issues.push(issue('error','retake-export-drift',taskId,'Retake source export hash no longer matches the generation record.'));if(!String(raw?.changeInstruction||'').trim())issues.push(issue('error','retake-instruction-empty',id,'Retake Draft has no explicit change instruction.'));if(!String(raw?.expectedImprovement||'').trim())issues.push(issue('error','retake-expected-improvement-empty',id,'Retake Draft must define expected improvement.'));if(!Array.isArray(raw?.retainedLocks)||!raw.retainedLocks.map(String).some(value=>value.trim()))issues.push(issue('error','retake-locks-empty',id,'Retake Draft must explicitly preserve at least one successful lock.'));if(!listPromptStudioGenerationEvaluations(project).some(item=>item.taskId===taskId))issues.push(issue('error','retake-evaluation-missing',taskId,'Retake Draft source has no saved Evaluation.'));}

  for(const record of records){const batch=promptStudioBatchLinkForTask(project,record.taskId);if(batch&&normalizeHash(batch.exportHash)!==normalizeHash(record.exportHash))issues.push(issue('error','batch-result-export-drift',record.taskId,'V8 batch lineage export hash no longer matches generation history.'));}

  const errors=issues.filter(item=>item.severity==='error').length,warnings=issues.filter(item=>item.severity==='warning').length;
  return{ok:errors===0,errors,warnings,issues,counts:{generationRecords:records.length,evaluations:evaluations.length,comparisons:comparisons.length,retakes:retakes.length,winners:Object.keys(winnerMap).length}};
}

export function generationDecisionAuditSummary(project){const audit=auditPromptStudioGenerationDecisions(project);return{ok:audit.ok,errors:audit.errors,warnings:audit.warnings,records:audit.counts.generationRecords,evaluations:audit.counts.evaluations,comparisons:audit.counts.comparisons,winners:audit.counts.winners,retakes:audit.counts.retakes};}

function issue(severity,id,subject,message){return{severity,id,subject:String(subject||''),message};}
function normalizeHash(value){return String(value||'').toLowerCase();}
