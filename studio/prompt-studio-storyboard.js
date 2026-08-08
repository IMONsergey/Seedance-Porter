import { timelineWithTimeRanges } from './prompt-studio-timeline.js';

export const PROMPT_STUDIO_STORYBOARD_ROLES=Object.freeze(['keyframe','start','middle','end','transition']);

export function normalizePromptStudioStoryboard(value){
  const input=value&&typeof value==='object'?value:{};
  const ids=new Set();
  const cards=(Array.isArray(input.cards)?input.cards:[]).map((card,index)=>{
    let id=String(card?.id||`story-${index+1}`);
    if(ids.has(id))id=`${id}-${index+1}`;
    ids.add(id);
    return{
      id,
      beatId:String(card?.beatId||''),
      enabled:card?.enabled!==false,
      label:String(card?.label||`Shot ${index+1}`),
      frameRole:PROMPT_STUDIO_STORYBOARD_ROLES.includes(String(card?.frameRole))?String(card.frameRole):'keyframe',
      frameIntent:String(card?.frameIntent||''),
      composition:String(card?.composition||''),
      actionState:String(card?.actionState||''),
      continuity:String(card?.continuity||''),
      referenceTokens:normalizeReferenceTokens(card?.referenceTokens||[]),
      notes:String(card?.notes||''),
      createdAt:String(card?.createdAt||''),
      updatedAt:String(card?.updatedAt||'')
    };
  });
  return{schemaVersion:1,cards,updatedAt:String(input.updatedAt||''),timelineFingerprint:String(input.timelineFingerprint||'')};
}

export function buildStoryboardFromTimeline(project,options={}){
  const next=clone(project);
  const existing=normalizePromptStudioStoryboard(next.storyboard||{});
  const byBeat=new Map(existing.cards.filter(card=>card.beatId).map(card=>[card.beatId,card]));
  const ranges=timelineWithTimeRanges(next).filter(beat=>beat.enabled!==false);
  const now=new Date(options.now||Date.now()).toISOString();
  const generated=ranges.map((beat,index)=>{
    const current=byBeat.get(beat.id);
    if(current){
      return{...current,label:current.label||beat.label||`Shot ${index+1}`,referenceTokens:current.referenceTokens.length?current.referenceTokens:normalizeReferenceTokens(beat.referenceTokens||[]),updatedAt:now};
    }
    return{
      id:`story-${beat.id||randomId()}`,
      beatId:beat.id,
      enabled:true,
      label:beat.label||`Shot ${index+1}`,
      frameRole:index===0?'start':index===ranges.length-1?'end':'keyframe',
      frameIntent:beat.purpose||'',
      composition:shotTypeToComposition(beat.shotType),
      actionState:beat.action||'',
      continuity:'',
      referenceTokens:normalizeReferenceTokens(beat.referenceTokens||[]),
      notes:beat.notes||'',
      createdAt:now,
      updatedAt:now
    };
  });
  const used=new Set(generated.map(card=>card.beatId));
  const orphans=options.keepOrphans===false?[]:existing.cards.filter(card=>card.beatId&&!used.has(card.beatId)).map(card=>({...card,enabled:false,updatedAt:now}));
  next.storyboard={schemaVersion:1,cards:[...generated,...orphans],updatedAt:now,timelineFingerprint:timelineFingerprint(next)};
  return next;
}

export function addStoryboardCard(project,input={}){
  const next=clone(project);
  const board=normalizePromptStudioStoryboard(next.storyboard||{});
  const now=new Date(input.now||Date.now()).toISOString();
  board.cards.push({
    id:String(input.id||`story-${randomId()}`),beatId:String(input.beatId||''),enabled:input.enabled!==false,label:String(input.label||`Shot ${board.cards.length+1}`),
    frameRole:PROMPT_STUDIO_STORYBOARD_ROLES.includes(String(input.frameRole))?String(input.frameRole):'keyframe',frameIntent:String(input.frameIntent||''),composition:String(input.composition||''),
    actionState:String(input.actionState||''),continuity:String(input.continuity||''),referenceTokens:normalizeReferenceTokens(input.referenceTokens||[]),notes:String(input.notes||''),createdAt:now,updatedAt:now
  });
  next.storyboard={...board,updatedAt:now};
  return next;
}

export function updateStoryboardCard(project,id,patch={}){
  const next=clone(project);
  const board=normalizePromptStudioStoryboard(next.storyboard||{});
  const card=board.cards.find(item=>item.id===id);
  if(!card)throw new Error(`Unknown storyboard card: ${id}`);
  for(const field of ['beatId','label','frameIntent','composition','actionState','continuity','notes'])if(field in patch)card[field]=String(patch[field]??'');
  if('enabled'in patch)card.enabled=Boolean(patch.enabled);
  if('frameRole'in patch&&PROMPT_STUDIO_STORYBOARD_ROLES.includes(String(patch.frameRole)))card.frameRole=String(patch.frameRole);
  if('referenceTokens'in patch)card.referenceTokens=normalizeReferenceTokens(patch.referenceTokens||[]);
  card.updatedAt=new Date(patch.now||Date.now()).toISOString();
  next.storyboard={...board,updatedAt:card.updatedAt};
  return next;
}

export function deleteStoryboardCard(project,id){
  const next=clone(project);const board=normalizePromptStudioStoryboard(next.storyboard||{});board.cards=board.cards.filter(card=>card.id!==id);board.updatedAt=new Date().toISOString();next.storyboard=board;return next;
}

export function moveStoryboardCard(project,id,direction){
  const next=clone(project);const board=normalizePromptStudioStoryboard(next.storyboard||{});const index=board.cards.findIndex(card=>card.id===id);if(index<0)return next;
  const target=direction==='up'?index-1:direction==='down'?index+1:Number(direction);if(!Number.isInteger(target)||target<0||target>=board.cards.length)return next;
  const [card]=board.cards.splice(index,1);board.cards.splice(target,0,card);board.updatedAt=new Date().toISOString();next.storyboard=board;return next;
}

export function storyboardCoverage(project){
  const board=normalizePromptStudioStoryboard(project.storyboard||{});const beats=timelineWithTimeRanges(project).filter(beat=>beat.enabled!==false);const enabled=board.cards.filter(card=>card.enabled!==false);
  const beatIds=new Set(beats.map(beat=>beat.id));const mapped=new Set(enabled.filter(card=>beatIds.has(card.beatId)).map(card=>card.beatId));
  return{beats:beats.length,cards:enabled.length,mappedBeats:mapped.size,coverage:beats.length?Math.round(mapped.size/beats.length*100):enabled.length?0:100};
}

export function lintPromptStudioStoryboard(project){
  const board=normalizePromptStudioStoryboard(project.storyboard||{});const cards=board.cards.filter(card=>card.enabled!==false);const beats=timelineWithTimeRanges(project).filter(beat=>beat.enabled!==false);const beatIds=new Set(beats.map(beat=>beat.id));
  const activeRefs=new Set((project.references||[]).filter(ref=>ref.enabled!==false).map(ref=>String(ref.token||'').toLowerCase()));const issues=[];const push=(severity,id,message,cardId=null)=>issues.push({severity,id,message,cardId});
  if(!cards.length)push('info','storyboard-empty','Storyboard has no enabled shot cards.');
  const seenBeats=new Set();
  for(const card of cards){
    if(card.beatId&&!beatIds.has(card.beatId))push('warning','storyboard-orphan-beat',`${card.label} points to a missing or disabled timeline beat.`,card.id);
    if(card.beatId&&seenBeats.has(card.beatId))push('warning','storyboard-duplicate-beat',`${card.label} duplicates another storyboard card for the same beat.`,card.id);
    if(card.beatId)seenBeats.add(card.beatId);
    if(!card.frameIntent.trim())push('info','storyboard-frame-intent-missing',`${card.label} has no frame intent.`,card.id);
    if(!card.actionState.trim())push('warning','storyboard-action-state-missing',`${card.label} has no visible action/state description.`,card.id);
    if(!card.referenceTokens.length)push('info','storyboard-reference-missing',`${card.label} has no visual reference assigned.`,card.id);
    for(const token of card.referenceTokens)if(!activeRefs.has(token.toLowerCase()))push('error','storyboard-reference-unresolved',`${card.label} uses ${token}, but no enabled project reference matches it.`,card.id);
  }
  for(const beat of beats)if(!cards.some(card=>card.beatId===beat.id))push('warning','storyboard-beat-unmapped',`${beat.label||beat.id} has no storyboard card.`,null);
  const coverage=storyboardCoverage(project);const score=Math.max(0,100-issues.reduce((sum,item)=>sum+({error:18,warning:8,info:2}[item.severity]||0),0));
  return{kind:'seedance-porter-prompt-studio-storyboard-lint',schemaVersion:1,projectId:project.id,score,grade:score>=90?'A':score>=78?'B':score>=64?'C':score>=48?'D':'F',coverage,issues};
}

export function storyboardTimelineState(project){const board=normalizePromptStudioStoryboard(project.storyboard||{});const current=timelineFingerprint(project);return{storedFingerprint:board.timelineFingerprint,currentFingerprint:current,inSync:Boolean(board.timelineFingerprint&&board.timelineFingerprint===current)};}

function timelineFingerprint(project){return hash(JSON.stringify(timelineWithTimeRanges(project).filter(beat=>beat.enabled!==false).map(beat=>({id:beat.id,duration:beat.duration,shotType:beat.shotType,purpose:beat.purpose,camera:beat.camera,action:beat.action,referenceTokens:beat.referenceTokens}))));}
function normalizeReferenceTokens(values){const out=[];for(const value of (Array.isArray(values)?values:[values]).flat(Infinity)){for(const token of String(value||'').match(/@ref\d{2,}/gi)||[]){const lower=token.toLowerCase();if(!out.includes(lower))out.push(lower);}}return out;}
function shotTypeToComposition(type){return({establishing:'Establishing composition',wide:'Wide composition',medium:'Medium framing','close-up':'Close-up framing',macro:'Macro detail',overhead:'Overhead framing',pov:'POV framing',tracking:'Tracking composition',packshot:'Packshot composition',interface:'Interface-focused composition',transition:'Transition frame'})[String(type||'')]||'';}
function hash(value){let h=2166136261;for(const char of String(value||'')){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(16).padStart(8,'0');}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,12)||Math.random().toString(36).slice(2,14);}catch{return Math.random().toString(36).slice(2,14);}}
