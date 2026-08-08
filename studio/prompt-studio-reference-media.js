const OVERRIDES_KEY='referenceMediaOverrides';
const CORE_MEDIA_TYPES=new Set(['image','video','unknown']);
const EXTENDED_MEDIA_TYPES=new Set(['image','video','audio','unknown']);

export function effectiveReferenceMediaType(project,referenceOrId){
  const ref=typeof referenceOrId==='string'?(project?.references||[]).find(item=>item.id===referenceOrId):referenceOrId;
  if(!ref)return'unknown';
  const override=normalizedOverrides(project)[String(ref.id||'')];
  if(override==='audio')return'audio';
  return CORE_MEDIA_TYPES.has(String(ref.mediaType||''))?String(ref.mediaType):'unknown';
}

export function setPromptStudioReferenceMediaType(project,referenceId,mediaType){
  const next=clone(project);const ref=(next.references||[]).find(item=>item.id===referenceId);if(!ref)throw new Error(`Unknown Prompt Studio reference: ${referenceId}`);
  const type=normalizeExtendedMediaType(mediaType);const overrides=normalizedOverrides(next);
  if(type==='audio'){
    ref.mediaType='unknown';
    overrides[referenceId]='audio';
  }else{
    ref.mediaType=type;
    delete overrides[referenceId];
  }
  next[OVERRIDES_KEY]=overrides;
  return next;
}

export function normalizePromptStudioReferenceMedia(project){
  const next=clone(project);next[OVERRIDES_KEY]=normalizedOverrides(next);return next;
}

export function listPromptStudioAudioReferences(project){
  return(project?.references||[]).filter(ref=>effectiveReferenceMediaType(project,ref)==='audio');
}

export function promptStudioReferenceMediaCounts(project){
  const counts={image:0,video:0,audio:0,unknown:0};
  for(const ref of project?.references||[]){if(ref.enabled===false)continue;counts[effectiveReferenceMediaType(project,ref)]++;}
  return counts;
}

export function inferPromptStudioMediaTypeFromBlob(file){
  const type=String(file?.type||'').toLowerCase();const name=String(file?.name||'').toLowerCase();
  if(type.startsWith('audio/')||/\.(wav|mp3)$/.test(name))return'audio';
  if(type.startsWith('video/')||/\.(mp4|mov|m4v|webm)$/.test(name))return'video';
  if(type.startsWith('image/')||/\.(png|jpe?g|webp|bmp|tiff?|gif|heic|heif)$/.test(name))return'image';
  return'unknown';
}

export function isPromptStudioAudioReference(project,referenceOrId){return effectiveReferenceMediaType(project,referenceOrId)==='audio';}

function normalizedOverrides(project){
  const ids=new Set((project?.references||[]).map(ref=>String(ref.id||'')));const raw=project?.[OVERRIDES_KEY];const next={};
  if(raw&&typeof raw==='object'&&!Array.isArray(raw))for(const[id,type]of Object.entries(raw)){if(ids.has(id)&&type==='audio')next[id]='audio';}
  return next;
}
function normalizeExtendedMediaType(value){const raw=String(value||'unknown').toLowerCase();return EXTENDED_MEDIA_TYPES.has(raw)?raw:'unknown';}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
