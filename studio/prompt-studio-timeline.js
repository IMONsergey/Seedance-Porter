export const PROMPT_STUDIO_SHOT_TYPES = Object.freeze([
  'establishing','wide','medium','close-up','macro','overhead','pov','tracking','packshot','interface','transition','custom'
]);

const CAMERA_MOVE_PATTERNS=Object.freeze([
  ['orbit',/\borbit(?:ing)?\b/],
  ['pan',/\bpan(?:ning)?\b/],
  ['tilt',/\btilt(?:ing)?\b/],
  ['dolly',/\bdolly(?:ing)?\b/],
  ['truck',/\btruck(?:ing)?\b/],
  ['tracking',/\btrack(?:ing)?\b/],
  ['push-in',/\bpush\s+in\b/],
  ['pull-back',/\bpull\s+back\b/],
  ['zoom',/\bzoom(?:ing)?\b/],
  ['crane',/\bcrane\b/],
  ['handheld',/\bhandheld\b/],
  ['roll',/\broll(?:ing)?\b/],
  ['arc',/\barc(?:ing)?\b/]
]);
const REF_TOKEN=/@ref\d{2,}/gi;

export function normalizePromptStudioTimeline(projectOrTimeline) {
  const projectLike=projectOrTimeline&&Array.isArray(projectOrTimeline.sections);
  const timeline=projectLike?projectOrTimeline.timeline:projectOrTimeline;
  const duration=projectLike?Number(projectOrTimeline.duration||0):0;
  const beats=(timeline?.beats||[]).map((beat,index)=>normalizeBeat(beat,index));
  return {
    schemaVersion:1,
    beats,
    updatedAt:String(timeline?.updatedAt||''),
    lastSyncedAt:String(timeline?.lastSyncedAt||''),
    lastSyncedHash:String(timeline?.lastSyncedHash||''),
    projectDuration:duration
  };
}

export function addTimelineBeat(project,input={}) {
  const next=clone(project);
  const timeline=normalizePromptStudioTimeline(next);
  const defaultDuration=Math.max(0.5,Number(input.duration||suggestBeatDuration(next.duration,timeline.beats.length+1)));
  timeline.beats.push(normalizeBeat({
    id:input.id||`beat-${randomId()}`,
    label:input.label||`Beat ${timeline.beats.length+1}`,
    shotType:input.shotType||'medium',
    duration:defaultDuration,
    purpose:input.purpose||'',
    camera:input.camera||'',
    action:input.action||'',
    referenceTokens:input.referenceTokens||[],
    notes:input.notes||'',
    enabled:input.enabled!==false
  },timeline.beats.length));
  next.timeline=touchTimeline(timeline);
  return next;
}

export function updateTimelineBeat(project,id,patch={}) {
  const next=clone(project);
  const timeline=normalizePromptStudioTimeline(next);
  const beat=timeline.beats.find(item=>item.id===id);
  if(!beat)throw new Error(`Unknown timeline beat: ${id}`);
  if('label'in patch)beat.label=String(patch.label||'');
  if('shotType'in patch)beat.shotType=PROMPT_STUDIO_SHOT_TYPES.includes(String(patch.shotType))?String(patch.shotType):beat.shotType;
  if('duration'in patch)beat.duration=clamp(Number(patch.duration||0),0.1,30);
  if('purpose'in patch)beat.purpose=String(patch.purpose||'');
  if('camera'in patch)beat.camera=String(patch.camera||'');
  if('action'in patch)beat.action=String(patch.action||'');
  if('referenceTokens'in patch)beat.referenceTokens=normalizeReferenceTokens(patch.referenceTokens||[]);
  if('notes'in patch)beat.notes=String(patch.notes||'');
  if('enabled'in patch)beat.enabled=Boolean(patch.enabled);
  next.timeline=touchTimeline(timeline);
  return next;
}

export function deleteTimelineBeat(project,id) {
  const next=clone(project);
  const timeline=normalizePromptStudioTimeline(next);
  timeline.beats=timeline.beats.filter(item=>item.id!==id);
  next.timeline=touchTimeline(timeline);
  return next;
}

export function moveTimelineBeat(project,id,direction) {
  const next=clone(project);
  const timeline=normalizePromptStudioTimeline(next);
  const index=timeline.beats.findIndex(item=>item.id===id);
  if(index<0)return next;
  const target=String(direction)==='up'?index-1:String(direction)==='down'?index+1:Number(direction);
  if(!Number.isInteger(target)||target<0||target>=timeline.beats.length)return next;
  const [beat]=timeline.beats.splice(index,1);
  timeline.beats.splice(target,0,beat);
  timeline.beats=timeline.beats.map((item,i)=>({...item,index:i}));
  next.timeline=touchTimeline(timeline);
  return next;
}

export function fitTimelineToProjectDuration(project,options={}) {
  const next=clone(project);
  const timeline=normalizePromptStudioTimeline(next);
  const enabled=timeline.beats.filter(item=>item.enabled!==false);
  const target=clamp(Number(options.duration||next.duration||0),0.5,30);
  if(!enabled.length)return next;
  const current=enabled.reduce((sum,item)=>sum+item.duration,0);
  if(current<=0){
    const each=target/enabled.length;
    enabled.forEach(item=>item.duration=roundDuration(each));
  }else{
    const scale=target/current;
    enabled.forEach(item=>item.duration=roundDuration(Math.max(0.1,item.duration*scale)));
    const adjusted=enabled.reduce((sum,item)=>sum+item.duration,0);
    const delta=roundDuration(target-adjusted);
    enabled[enabled.length-1].duration=roundDuration(Math.max(0.1,enabled[enabled.length-1].duration+delta));
  }
  next.timeline=touchTimeline(timeline);
  return next;
}

export function timelineWithTimeRanges(project) {
  const timeline=normalizePromptStudioTimeline(project);
  let cursor=0;
  return timeline.beats.map((beat,index)=>{
    const start=roundDuration(cursor);
    const end=roundDuration(cursor+(beat.enabled===false?0:beat.duration));
    if(beat.enabled!==false)cursor=end;
    return {...beat,index,start,end,timecode:`${formatTime(start)}–${formatTime(end)}`};
  });
}

export function compileTimelineToTiming(project,options={}) {
  const beats=timelineWithTimeRanges(project).filter(item=>item.enabled!==false);
  if(!beats.length)return'';
  return beats.map((beat,index)=>{
    const pieces=[
      `Beat ${index+1} — ${beat.timecode}`,
      beat.shotType&&beat.shotType!=='custom'?`Shot: ${beat.shotType}`:'',
      beat.purpose?`Purpose: ${beat.purpose}`:'',
      beat.camera?`Camera: ${beat.camera}`:'',
      beat.action?`Action: ${beat.action}`:'',
      beat.referenceTokens.length?`Refs: ${beat.referenceTokens.join(', ')}`:'',
      options.includeNotes!==false&&beat.notes?`Note: ${beat.notes}`:''
    ].filter(Boolean);
    return pieces.join(' | ');
  }).join('\n');
}

export function syncTimelineToTimingSection(project,options={}) {
  const next=clone(project);
  const timing=compileTimelineToTiming(next,options);
  const section=(next.sections||[]).find(item=>item.id==='timing');
  if(!section)throw new Error('Prompt Studio Timing section is missing.');
  if(!timing.trim())throw new Error('Timeline has no enabled beats to sync.');
  section.content=timing;
  const timeline=normalizePromptStudioTimeline(next);
  timeline.lastSyncedAt=new Date().toISOString();
  timeline.lastSyncedHash=hashTimelineText(timing);
  timeline.updatedAt=timeline.updatedAt||timeline.lastSyncedAt;
  next.timeline=timeline;
  return next;
}

export function importTimelineFromTiming(project) {
  const next=clone(project);
  const timing=String((next.sections||[]).find(item=>item.id==='timing')?.content||'').trim();
  if(!timing)return next;
  const lines=timing.split(/\n+/).map(line=>line.trim()).filter(Boolean);
  const parsed=[];
  for(const line of lines){
    const match=line.match(/^Beat\s*(\d+)\s*[—-]\s*([^|]+)(?:\|\s*)?(.*)$/i);
    if(!match)continue;
    const range=parseTimeRange(match[2]);
    const rest=match[3]||'';
    const fields=parsePipeFields(rest);
    parsed.push(normalizeBeat({
      id:`beat-${randomId()}`,
      label:`Beat ${parsed.length+1}`,
      shotType:normalizeShotType(fields.Shot||'custom'),
      duration:range?Math.max(0.1,range.end-range.start):suggestBeatDuration(next.duration,lines.length),
      purpose:fields.Purpose||'',
      camera:fields.Camera||'',
      action:fields.Action||'',
      referenceTokens:normalizeReferenceTokens((fields.Refs||'').split(',')),
      notes:fields.Note||'',
      enabled:true
    },parsed.length));
  }
  if(!parsed.length){
    const pieces=lines.slice(0,12);
    next.timeline={schemaVersion:1,beats:pieces.map((line,index)=>normalizeBeat({id:`beat-${randomId()}`,label:`Beat ${index+1}`,shotType:'custom',duration:suggestBeatDuration(next.duration,pieces.length),purpose:'',camera:'',action:line,referenceTokens:normalizeReferenceTokens(line.match(REF_TOKEN)||[]),notes:'Imported from free-form Timing section',enabled:true},index)),updatedAt:new Date().toISOString(),lastSyncedAt:'',lastSyncedHash:''};
    return next;
  }
  next.timeline={schemaVersion:1,beats:parsed,updatedAt:new Date().toISOString(),lastSyncedAt:'',lastSyncedHash:''};
  return next;
}

export function detectPromptStudioTimelineCameraMoves(value){
  const text=normalizeText(value);
  return CAMERA_MOVE_PATTERNS.filter(([,pattern])=>pattern.test(text)).map(([label])=>label);
}

export function lintPromptStudioTimeline(project) {
  const timeline=normalizePromptStudioTimeline(project);
  const ranges=timelineWithTimeRanges(project).filter(item=>item.enabled!==false);
  const issues=[];
  const push=(severity,id,message,beatId=null)=>issues.push({severity,id,message,beatId});
  const projectDuration=Number(project.duration||0);
  const total=roundDuration(ranges.reduce((sum,item)=>sum+item.duration,0));
  if(!ranges.length)push('info','timeline-empty','Timeline has no enabled beats.');
  if(ranges.length&&Math.abs(total-projectDuration)>0.15)push('warning','timeline-duration-mismatch',`Timeline totals ${total}s but project duration is ${projectDuration}s.`);
  if(ranges.length>Math.max(4,Math.ceil(projectDuration/1.2)))push('warning','timeline-density',`${ranges.length} beats are dense for a ${projectDuration}s clip.`);
  const activeRefs=new Set((project.references||[]).filter(ref=>ref.enabled!==false).map(ref=>String(ref.token||'').toLowerCase()));
  for(const beat of ranges){
    if(beat.duration<0.45)push('warning','beat-too-short',`${beat.label} is only ${beat.duration}s.`,beat.id);
    if(!beat.purpose.trim())push('info','beat-purpose-missing',`${beat.label} has no explicit purpose.`,beat.id);
    if(!beat.action.trim())push('warning','beat-action-missing',`${beat.label} has no visible action/state change.`,beat.id);
    const moves=detectPromptStudioTimelineCameraMoves(beat.camera);
    if(moves.length>1)push('warning','beat-camera-overload',`${beat.label} contains competing camera moves: ${moves.join(', ')}.`,beat.id);
    for(const token of beat.referenceTokens){if(!activeRefs.has(token.toLowerCase()))push('error','beat-reference-unresolved',`${beat.label} uses ${token}, but no enabled project reference matches it.`,beat.id);}
  }
  const score=Math.max(0,100-issues.reduce((sum,item)=>sum+({error:18,warning:8,info:2}[item.severity]||0),0));
  return {schemaVersion:1,kind:'seedance-porter-prompt-studio-timeline-lint',projectId:project.id,score,grade:score>=90?'A':score>=78?'B':score>=64?'C':score>=48?'D':'F',totalDuration:total,projectDuration,beats:ranges.length,issues};
}

export function timelineSyncState(project) {
  const timeline=normalizePromptStudioTimeline(project);
  const text=compileTimelineToTiming(project);
  const currentTiming=String((project.sections||[]).find(item=>item.id==='timing')?.content||'').trim();
  return {
    timelineHash:hashTimelineText(text),
    timingHash:hashTimelineText(currentTiming),
    lastSyncedHash:timeline.lastSyncedHash,
    inSync:Boolean(text&&currentTiming&&hashTimelineText(text)===hashTimelineText(currentTiming)),
    changedSinceLastSync:Boolean(timeline.lastSyncedHash&&timeline.lastSyncedHash!==hashTimelineText(text))
  };
}

function normalizeBeat(beat,index){
  return {
    id:String(beat?.id||`beat-${randomId()}`),
    index:Number.isInteger(beat?.index)?beat.index:index,
    label:String(beat?.label||`Beat ${index+1}`),
    shotType:normalizeShotType(beat?.shotType),
    duration:clamp(Number(beat?.duration||1),0.1,30),
    purpose:String(beat?.purpose||''),
    camera:String(beat?.camera||''),
    action:String(beat?.action||''),
    referenceTokens:normalizeReferenceTokens(beat?.referenceTokens||[]),
    notes:String(beat?.notes||''),
    enabled:beat?.enabled!==false
  };
}
function touchTimeline(timeline){return{...timeline,schemaVersion:1,beats:timeline.beats.map((item,index)=>({...item,index})),updatedAt:new Date().toISOString()};}
function normalizeShotType(value){const raw=String(value||'custom').toLowerCase();return PROMPT_STUDIO_SHOT_TYPES.includes(raw)?raw:'custom';}
function normalizeReferenceTokens(values){return uniqueStrings((Array.isArray(values)?values:[values]).flatMap(value=>String(value||'').match(REF_TOKEN)||[]).map(value=>value.toLowerCase()));}
function suggestBeatDuration(duration,count){return roundDuration(Math.max(0.5,Number(duration||6)/Math.max(1,count)));}
function roundDuration(value){return Math.round(Number(value||0)*10)/10;}
function formatTime(value){const n=Math.max(0,Number(value||0));const minutes=Math.floor(n/60);const seconds=(n-minutes*60).toFixed(1).padStart(4,'0');return`${String(minutes).padStart(2,'0')}:${seconds}`;}
function parseTimeRange(value){const values=String(value||'').match(/(\d{1,2}:\d{1,2}(?:\.\d+)?)\s*[–—-]\s*(\d{1,2}:\d{1,2}(?:\.\d+)?)/);if(!values)return null;return{start:parseTime(values[1]),end:parseTime(values[2])};}
function parseTime(value){const[minutes,seconds]=String(value||'').split(':').map(Number);return Number(minutes||0)*60+Number(seconds||0);}
function parsePipeFields(value){const result={};for(const chunk of String(value||'').split('|')){const match=chunk.trim().match(/^([^:]+):\s*(.*)$/);if(match)result[match[1].trim()]=match[2].trim();}return result;}
function hashTimelineText(value){let hash=2166136261;for(const char of String(value||'')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return(hash>>>0).toString(16).padStart(8,'0');}
function normalizeText(value){return String(value||'').toLowerCase().replace(/[^a-z0-9@]+/g,' ').replace(/\s+/g,' ').trim();}
function uniqueStrings(values){return[...new Set((Array.isArray(values)?values:[values]).flat(Infinity).map(value=>String(value??'').trim()).filter(Boolean))];}
function clamp(value,min,max){return Math.max(min,Math.min(max,Number.isFinite(value)?value:min));}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,12)||Math.random().toString(36).slice(2,14);}catch{return Math.random().toString(36).slice(2,14);}}
