import { listPromptStudioGenerationRecords, savePromptStudioGenerationArtifact as saveLegacy } from './prompt-studio-generation-results.js';

export function savePromptStudioGenerationArtifact(project,artifactInput,options={}){
  const taskId=String(artifactInput?.taskId||'');if(!taskId)throw new Error('Generation artifact taskId is required.');
  const before=listPromptStudioGenerationRecords(project),previous=before.find(item=>item.taskId===taskId)||null;
  const candidateProject=saveLegacy(project,artifactInput,options),candidate=listPromptStudioGenerationRecords(candidateProject).find(item=>item.taskId===taskId)||null;
  if(!candidate)throw new Error('Generation artifact could not be normalized into project history.');
  if(previous&&String(previous.exportHash)!==String(candidate.exportHash))throw new Error(`Generation task ${taskId} conflicts with an existing export hash.`);
  if(previous&&recordRank(previous)>=recordRank(candidate))return clone(project);
  return candidateProject;
}

export function generationRecordRank(record){return recordRank(record);}
function recordRank(item){return(item?.sourceArtifactKind==='result'?100:0)+(item?.terminal?50:0)+(item?.status==='succeeded'?20:0);}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
