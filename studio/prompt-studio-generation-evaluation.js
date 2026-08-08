import { normalizePromptStudioVariantSet } from './prompt-studio-variants.js';
import { attachPromptStudioGenerationOutput, listPromptStudioGenerationRecords } from './prompt-studio-generation-results.js';
import { promptStudioBatchLinkForTask } from './prompt-studio-generation-batch.js';

export const PROMPT_STUDIO_EVALUATIONS_KEY='generationEvaluations';
export const PROMPT_STUDIO_COMPARISONS_KEY='generationComparisons';
export const PROMPT_STUDIO_WINNERS_KEY='generationWinners';
export const PROMPT_STUDIO_RETAKES_KEY='generationRetakes';
export const MAX_GENERATION_EVALUATIONS=200;
export const MAX_GENERATION_COMPARISONS=100;
export const MAX_GENERATION_RETAKES=100;

export const GENERATION_EVALUATION_DIMENSIONS=Object.freeze([
  {id:'task-adherence',label:'Task adherence',labelRu:'Соответствие задаче'},
  {id:'identity-consistency',label:'Identity consistency',labelRu:'Консистентность объекта / героя'},
  {id:'composition',label:'Composition / framing',labelRu:'Композиция / кадр'},
  {id:'camera',label:'Camera behavior',labelRu:'Работа камеры'},
  {id:'motion-action',label:'Motion / action quality',labelRu:'Движение / действие'},
  {id:'timing-readability',label:'Timing / shot readability',labelRu:'Тайминг / читаемость шотов'},
  {id:'continuity',label:'Continuity',labelRu:'Континуитет'},
  {id:'material-physics',label:'Material / physics',labelRu:'Материалы / физика'},
  {id:'lighting-color',label:'Lighting / color',labelRu:'Свет / цвет'},
  {id:'graphics-text-logo',label:'Graphics / text / logo',labelRu:'Графика / текст / логотип'},
  {id:'audio-fit',label:'Audio fit',labelRu:'Аудио / диалог / музыка'},
  {id:'artifact-severity',label:'Artifact control',labelRu:'Контроль артефактов'},
  {id:'production-readiness',label:'Production readiness',labelRu:'Готовность к продакшену'}
]);
const DIMENSION_IDS=new Set(GENERATION_EVALUATION_DIMENSIONS.map(item=>item.id));
const VERDICTS=new Set(['candidate','winner','retake','reject']);
const RETAKE_LEVERS=new Set(['objective','subject','environment','composition','camera','action','timing','lighting','materials','style','continuity','constraints','avoid','references','provider-settings','other']);

export function savePromptStudioGenerationEvaluation(project,input,options={}){
  const record=requireGenerationRecord(project,input?.taskId),exportHash=String(input?.exportHash||record.exportHash||'').toLowerCase();
  if(exportHash!==String(record.exportHash||'').toLowerCase())throw new Error(`Evaluation export hash does not match generation task ${record.taskId}.`);
  const now=new Date(options.now||Date.now()).toISOString(),evaluations=normalizeEvaluations(project?.[PROMPT_STUDIO_EVALUATIONS_KEY]);
  const previous=evaluations.find(item=>item.taskId===record.taskId)||null;
  const evaluation={id:previous?.id||`eval-${safeId(record.taskId)}`,taskId:record.taskId,exportHash,scores:normalizeScores(input?.scores),overallScore:scoreAverage(normalizeScores(input?.scores)),verdict:VERDICTS.has(String(input?.verdict||''))?String(input.verdict):previous?.verdict||'candidate',strengths:uniqueStrings(input?.strengths),weaknesses:uniqueStrings(input?.weaknesses),artifactFlags:uniqueStrings(input?.artifactFlags),notes:String(input?.notes||'').slice(0,6000),createdAt:previous?.createdAt||now,updatedAt:now};
  const next=clone(project);next[PROMPT_STUDIO_EVALUATIONS_KEY]=[evaluation,...evaluations.filter(item=>item.taskId!==record.taskId)].slice(0,MAX_GENERATION_EVALUATIONS);return next;
}

export function listPromptStudioGenerationEvaluations(project){return normalizeEvaluations(project?.[PROMPT_STUDIO_EVALUATIONS_KEY]);}
export function promptStudioGenerationEvaluationForTask(project,taskId){return listPromptStudioGenerationEvaluations(project).find(item=>item.taskId===String(taskId||''))||null;}

export function createPromptStudioGenerationComparison(project,taskIds,options={}){
  const ids=[...new Set((taskIds||[]).map(String).filter(Boolean))];if(ids.length<2)throw new Error('A comparison requires at least two generation tasks.');if(ids.length>8)throw new Error('A comparison is limited to 8 generation tasks.');
  const records=ids.map(id=>requireGenerationRecord(project,id));const now=new Date(options.now||Date.now()).toISOString(),comparisons=normalizeComparisons(project?.[PROMPT_STUDIO_COMPARISONS_KEY]);
  const comparison={id:String(options.id||`cmp-${randomId()}`),label:String(options.label||`Comparison ${comparisons.length+1}`).slice(0,180),taskIds:records.map(item=>item.taskId),createdAt:now,updatedAt:now};
  const next=clone(project);next[PROMPT_STUDIO_COMPARISONS_KEY]=[comparison,...comparisons.filter(item=>item.id!==comparison.id)].slice(0,MAX_GENERATION_COMPARISONS);return{project:next,comparison};
}

export function listPromptStudioGenerationComparisons(project){return normalizeComparisons(project?.[PROMPT_STUDIO_COMPARISONS_KEY]);}

export function buildPromptStudioGenerationComparisonView(project,comparisonOrId){
  const comparison=typeof comparisonOrId==='string'?listPromptStudioGenerationComparisons(project).find(item=>item.id===comparisonOrId):normalizeComparison(comparisonOrId);if(!comparison)throw new Error('Generation comparison not found.');
  const variants=normalizePromptStudioVariantSet(project?.variants,project),byVariant=new Map((variants.items||[]).map(item=>[String(item.id),item]));
  const rows=comparison.taskIds.map(taskId=>{const record=requireGenerationRecord(project,taskId),batch=promptStudioBatchLinkForTask(project,taskId),variant=batch?.variantId?byVariant.get(String(batch.variantId)):null,evaluation=promptStudioGenerationEvaluationForTask(project,taskId);return{taskId,record:clone(record),batch:batch?clone(batch):null,variant:variant?{id:String(variant.id),label:String(variant.label||variant.id),status:String(variant.status||''),delta:clone(variant.delta||{}),changedControls:Object.keys(variant.delta||{})}:null,evaluation:evaluation?clone(evaluation):null,overallScore:evaluation?.overallScore??null};});
  const winner=promptStudioGenerationWinner(project,comparison.id);return{comparison:clone(comparison),rows,winner:winner?clone(winner):null};
}

export function setPromptStudioGenerationWinner(project,comparisonId,taskId,options={}){
  const comparison=listPromptStudioGenerationComparisons(project).find(item=>item.id===String(comparisonId||''));if(!comparison)throw new Error(`Comparison not found: ${comparisonId}`);if(!comparison.taskIds.includes(String(taskId||'')))throw new Error(`Task ${taskId} is not part of comparison ${comparison.id}.`);const record=requireGenerationRecord(project,taskId),now=new Date(options.now||Date.now()).toISOString(),winners=normalizeWinners(project?.[PROMPT_STUDIO_WINNERS_KEY]);
  const winner={comparisonId:comparison.id,taskId:record.taskId,exportHash:record.exportHash,reason:String(options.reason||'').slice(0,3000),selectedAt:now};const next=clone(project);next[PROMPT_STUDIO_WINNERS_KEY]={...winners,[comparison.id]:winner};return next;
}
export function promptStudioGenerationWinner(project,comparisonId){return normalizeWinners(project?.[PROMPT_STUDIO_WINNERS_KEY])[String(comparisonId||'')]||null;}

export function createPromptStudioGenerationRetake(project,input,options={}){
  const record=requireGenerationRecord(project,input?.sourceTaskId),lever=String(input?.lever||'other');if(!RETAKE_LEVERS.has(lever))throw new Error(`Unsupported retake lever: ${lever}`);const instruction=String(input?.changeInstruction||'').trim();if(!instruction)throw new Error('Retake change instruction is required.');
  const now=new Date(options.now||Date.now()).toISOString(),retakes=normalizeRetakes(project?.[PROMPT_STUDIO_RETAKES_KEY]);const retake={id:String(options.id||`retake-${randomId()}`),sourceTaskId:record.taskId,sourceExportHash:record.exportHash,lever,changeInstruction:instruction.slice(0,5000),expectedImprovement:String(input?.expectedImprovement||'').slice(0,3000),retainedLocks:uniqueStrings(input?.retainedLocks).slice(0,40),status:'draft',createdAt:now,updatedAt:now};const next=clone(project);next[PROMPT_STUDIO_RETAKES_KEY]=[retake,...retakes.filter(item=>item.id!==retake.id)].slice(0,MAX_GENERATION_RETAKES);return{project:next,retake};
}
export function listPromptStudioGenerationRetakes(project){return normalizeRetakes(project?.[PROMPT_STUDIO_RETAKES_KEY]);}

export function attachGenerationWinnerOutput(project,comparisonId,outputKind='video',options={}){
  const winner=promptStudioGenerationWinner(project,comparisonId);if(!winner)throw new Error(`Comparison ${comparisonId} has no selected winner.`);const record=requireGenerationRecord(project,winner.taskId);return attachPromptStudioGenerationOutput(project,record,outputKind,options);
}

export function normalizePromptStudioEvaluationExtensions(project){const next=clone(project);next[PROMPT_STUDIO_EVALUATIONS_KEY]=normalizeEvaluations(next[PROMPT_STUDIO_EVALUATIONS_KEY]);next[PROMPT_STUDIO_COMPARISONS_KEY]=normalizeComparisons(next[PROMPT_STUDIO_COMPARISONS_KEY]);next[PROMPT_STUDIO_WINNERS_KEY]=normalizeWinners(next[PROMPT_STUDIO_WINNERS_KEY]);next[PROMPT_STUDIO_RETAKES_KEY]=normalizeRetakes(next[PROMPT_STUDIO_RETAKES_KEY]);return next;}

function requireGenerationRecord(project,taskId){const id=String(taskId||'');const record=listPromptStudioGenerationRecords(project).find(item=>item.taskId===id);if(!record)throw new Error(`Generation task not found: ${id||'(empty)'}`);return record;}
function normalizeScores(value){const out={};for(const def of GENERATION_EVALUATION_DIMENSIONS){const raw=value?.[def.id],score=raw?.score==null||raw?.score===''?null:Number(raw.score);out[def.id]={score:Number.isInteger(score)&&score>=1&&score<=5?score:null,note:String(raw?.note||'').slice(0,2000),evidence:String(raw?.evidence||'').slice(0,2000)};}return out;}
function scoreAverage(scores){const values=Object.values(scores||{}).map(item=>item.score).filter(value=>Number.isInteger(value));return values.length?Math.round((values.reduce((a,b)=>a+b,0)/values.length)*100)/100:null;}
function normalizeEvaluations(items){return(Array.isArray(items)?items:[]).map(item=>{const scores=normalizeScores(item.scores);return{id:String(item.id||`eval-${safeId(item.taskId)}`),taskId:String(item.taskId||''),exportHash:String(item.exportHash||'').toLowerCase(),scores,overallScore:scoreAverage(scores),verdict:VERDICTS.has(String(item.verdict||''))?String(item.verdict):'candidate',strengths:uniqueStrings(item.strengths),weaknesses:uniqueStrings(item.weaknesses),artifactFlags:uniqueStrings(item.artifactFlags),notes:String(item.notes||'').slice(0,6000),createdAt:safeDate(item.createdAt),updatedAt:safeDate(item.updatedAt)}}).filter(item=>item.taskId&&/^[a-f0-9]{64}$/i.test(item.exportHash)).slice(0,MAX_GENERATION_EVALUATIONS);}
function normalizeComparison(value){if(!value||typeof value!=='object')return null;const ids=[...new Set((value.taskIds||[]).map(String).filter(Boolean))];if(ids.length<2||ids.length>8)return null;return{id:String(value.id||''),label:String(value.label||'Comparison').slice(0,180),taskIds:ids,createdAt:safeDate(value.createdAt),updatedAt:safeDate(value.updatedAt)};}
function normalizeComparisons(items){return(Array.isArray(items)?items:[]).map(normalizeComparison).filter(item=>item?.id).slice(0,MAX_GENERATION_COMPARISONS);}
function normalizeWinners(value){const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;for(const[id,item]of Object.entries(value)){if(!item||typeof item!=='object')continue;const exportHash=String(item.exportHash||'').toLowerCase();if(!item.taskId||!/^[a-f0-9]{64}$/.test(exportHash))continue;out[id]={comparisonId:String(item.comparisonId||id),taskId:String(item.taskId),exportHash,reason:String(item.reason||'').slice(0,3000),selectedAt:safeDate(item.selectedAt)};}return out;}
function normalizeRetakes(items){return(Array.isArray(items)?items:[]).map(item=>({id:String(item.id||''),sourceTaskId:String(item.sourceTaskId||''),sourceExportHash:String(item.sourceExportHash||'').toLowerCase(),lever:RETAKE_LEVERS.has(String(item.lever||''))?String(item.lever):'other',changeInstruction:String(item.changeInstruction||'').slice(0,5000),expectedImprovement:String(item.expectedImprovement||'').slice(0,3000),retainedLocks:uniqueStrings(item.retainedLocks).slice(0,40),status:'draft',createdAt:safeDate(item.createdAt),updatedAt:safeDate(item.updatedAt)})).filter(item=>item.id&&item.sourceTaskId&&/^[a-f0-9]{64}$/.test(item.sourceExportHash)).slice(0,MAX_GENERATION_RETAKES);}
function uniqueStrings(items){return[...new Set((Array.isArray(items)?items:typeof items==='string'?items.split(/\n|,/):[]).map(value=>String(value).trim()).filter(Boolean))];}
function safeDate(value){if(!value)return null;const date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString();}
function safeId(value){return String(value||'item').replace(/[^a-z0-9_-]+/gi,'-').slice(0,64)||'item';}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,12)||Math.random().toString(36).slice(2,14);}catch{return Math.random().toString(36).slice(2,14);}}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
