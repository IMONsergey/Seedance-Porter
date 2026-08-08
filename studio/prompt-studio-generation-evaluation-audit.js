import {
  listPromptStudioGenerationComparisons,
  listPromptStudioGenerationEvaluations,
  listPromptStudioGenerationRetakes,
  promptStudioGenerationWinner
} from './prompt-studio-generation-evaluation.js';
import { listPromptStudioGenerationRecords } from './prompt-studio-generation-results.js';
import { promptStudioBatchLinkForTask } from './prompt-studio-generation-batch.js';

export function auditPromptStudioGenerationDecisions(project){
  const issues=[];
  const records=listPromptStudioGenerationRecords(project),byTask=new Map(records.map(item=>[item.taskId,item]));
  const evaluations=listPromptStudioGenerationEvaluations(project),comparisons=listPromptStudioGenerationComparisons(project),retakes=listPromptStudioGenerationRetakes(project);

  for(const evaluation of evaluations){
    const record=byTask.get(evaluation.taskId);
    if(!record){issues.push(issue('error','evaluation-task-missing',evaluation.taskId,'Evaluation references a generation task that no longer exists.'));continue;}
    if(normalizeHash(record.exportHash)!==normalizeHash(evaluation.exportHash))issues.push(issue('error','evaluation-export-drift',evaluation.taskId,'Evaluation export hash no longer matches the generation record.'));
  }

  const comparisonIds=new Set();
  for(const comparison of comparisons){
    if(comparisonIds.has(comparison.id))issues.push(issue('error','comparison-id-duplicate',comparison.id,'Comparison ID is duplicated.'));comparisonIds.add(comparison.id);
    for(const taskId of comparison.taskIds)if(!byTask.has(taskId))issues.push(issue('error','comparison-task-missing',taskId,`Comparison ${comparison.id} references a missing generation task.`));
    const winner=promptStudioGenerationWinner(project,comparison.id);
    if(winner){
      if(!comparison.taskIds.includes(winner.taskId))issues.push(issue('error','winner-outside-comparison',winner.taskId,`Winner is not part of comparison ${comparison.id}.`));
      const record=byTask.get(winner.taskId);
      if(!record)issues.push(issue('error','winner-task-missing',winner.taskId,'Winner references a generation task that no longer exists.'));
      else if(normalizeHash(record.exportHash)!==normalizeHash(winner.exportHash))issues.push(issue('error','winner-export-drift',winner.taskId,'Winner export hash no longer matches the generation record.'));
      if(!String(winner.reason||'').trim())issues.push(issue('warning','winner-rationale-empty',winner.taskId,'Winner has no written rationale.'));
    }
  }

  const winnerMap=project?.generationWinners&&typeof project.generationWinners==='object'&&!Array.isArray(project.generationWinners)?project.generationWinners:{};
  for(const comparisonId of Object.keys(winnerMap))if(!comparisonIds.has(comparisonId))issues.push(issue('warning','winner-comparison-missing',comparisonId,'Winner record references a comparison that no longer exists.'));

  for(const retake of retakes){
    const record=byTask.get(retake.sourceTaskId);
    if(!record){issues.push(issue('error','retake-source-missing',retake.sourceTaskId,'Retake Draft references a generation task that no longer exists.'));continue;}
    if(normalizeHash(record.exportHash)!==normalizeHash(retake.sourceExportHash))issues.push(issue('error','retake-export-drift',retake.sourceTaskId,'Retake source export hash no longer matches the generation record.'));
    if(!String(retake.changeInstruction||'').trim())issues.push(issue('error','retake-instruction-empty',retake.id,'Retake Draft has no explicit change instruction.'));
    if(!Array.isArray(retake.retainedLocks)||!retake.retainedLocks.length)issues.push(issue('warning','retake-locks-empty',retake.id,'Retake Draft does not explicitly preserve any successful locks.'));
  }

  for(const record of records){
    const batch=promptStudioBatchLinkForTask(project,record.taskId);
    if(batch&&normalizeHash(batch.exportHash)!==normalizeHash(record.exportHash))issues.push(issue('error','batch-result-export-drift',record.taskId,'V8 batch lineage export hash no longer matches generation history.'));
  }

  const errors=issues.filter(item=>item.severity==='error').length,warnings=issues.filter(item=>item.severity==='warning').length;
  return{ok:errors===0,errors,warnings,issues,counts:{generationRecords:records.length,evaluations:evaluations.length,comparisons:comparisons.length,retakes:retakes.length,winners:Object.keys(winnerMap).length}};
}

export function generationDecisionAuditSummary(project){const audit=auditPromptStudioGenerationDecisions(project);return{ok:audit.ok,errors:audit.errors,warnings:audit.warnings,records:audit.counts.generationRecords,evaluations:audit.counts.evaluations,comparisons:audit.counts.comparisons,winners:audit.counts.winners,retakes:audit.counts.retakes};}

function issue(severity,id,subject,message){return{severity,id,subject:String(subject||''),message};}
function normalizeHash(value){return String(value||'').toLowerCase();}
