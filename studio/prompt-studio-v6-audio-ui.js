import { putPromptStudioAsset, deletePromptStudioAsset } from './prompt-studio-assets.js';
import { effectiveReferenceMediaType, inferPromptStudioMediaTypeFromBlob, promptStudioReferenceMediaCounts, setPromptStudioReferenceMediaType } from './prompt-studio-reference-media.js';

let queued=false;
bind();scheduleDecorate();

function bind(){
  document.addEventListener('change',event=>{
    const mediaSelect=event.target.closest('select[data-ref-field="mediaType"]');
    if(mediaSelect){handleMediaTypeChange(event,mediaSelect);return;}
    const fileInput=event.target.closest('input[data-ref-file]');
    if(fileInput&&inferPromptStudioMediaTypeFromBlob(fileInput.files?.[0])==='audio')handleAudioFile(event,fileInput);
  },true);
  window.addEventListener('porter-prompt-studio-change',scheduleDecorate);
  window.addEventListener('porter-prompt-studio-project-replaced',scheduleDecorate);
  window.addEventListener('porter-workspace-change',event=>{if(event.detail?.viewId==='promptStudioView')scheduleDecorate();});
  new MutationObserver(scheduleDecorate).observe(document.body,{childList:true,subtree:true});
}

function handleMediaTypeChange(event,select){
  const card=select.closest('[data-ref-id]');const refId=card?.dataset.refId;if(!refId)return;
  const project=currentProject();const ref=(project?.references||[]).find(item=>item.id===refId);if(!ref)return;
  const effective=effectiveReferenceMediaType(project,ref);const nextType=String(select.value||'unknown');
  if(nextType!=='audio'&&effective!=='audio')return;
  event.preventDefault();event.stopImmediatePropagation();
  try{replaceProject(setPromptStudioReferenceMediaType(project,refId,nextType),`reference media type ${nextType}`);}catch(error){showError(error);}
}

async function handleAudioFile(event,input){
  const file=input.files?.[0];const refId=input.closest('[data-ref-id]')?.dataset.refId;if(!file||!refId)return;
  event.preventDefault();event.stopImmediatePropagation();input.value='';
  try{
    const project=currentProject();const ref=(project?.references||[]).find(item=>item.id===refId);if(!ref)return;
    if(ref.localAssetKey)await deletePromptStudioAsset(ref.localAssetKey).catch(()=>{});
    const meta=await putPromptStudioAsset(file,{projectId:project.id,referenceId:ref.id,name:file.name,type:file.type});
    let next=JSON.parse(JSON.stringify(project));const target=next.references.find(item=>item.id===refId);target.localAssetKey=meta.key;if(!target.name||target.name===target.token)target.name=file.name;target.notes=target.notes||'Reference audio: describe the exact dialogue, rhythm, music or sound-design job this source controls.';
    next=setPromptStudioReferenceMediaType(next,refId,'audio');replaceProject(next,'attach local audio reference');
  }catch(error){showError(error);}
}

function scheduleDecorate(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate();});}
function decorate(){
  const project=currentProject();if(!project)return;
  for(const card of document.querySelectorAll('#promptStudioView .studio-reference-card[data-ref-id]')){
    const ref=(project.references||[]).find(item=>item.id===card.dataset.refId);if(!ref)continue;const effective=effectiveReferenceMediaType(project,ref);
    const select=card.querySelector('select[data-ref-field="mediaType"]');if(select){if(!select.querySelector('option[value="audio"]'))select.insertAdjacentHTML('beforeend','<option value="audio">audio</option>');if(effective==='audio')select.value='audio';}
    const file=card.querySelector('input[data-ref-file]');if(file)file.accept='image/*,video/*,audio/*,.wav,.mp3';
    card.dataset.effectiveMediaType=effective;
    const asset=card.querySelector('.studio-ref-asset');if(asset&&effective==='audio'&&!asset.querySelector('[data-v6-audio-chip]'))asset.insertAdjacentHTML('afterbegin','<strong data-v6-audio-chip>AUDIO · </strong>');
  }
  const counts=promptStudioReferenceMediaCounts(project);const caps=document.querySelector('#studioV5Dock .v5-capabilities');if(caps&&!caps.querySelector('[data-v6-audio-capability]'))caps.insertAdjacentHTML('afterbegin','<span data-v6-audio-capability>≤3 audio</span>');
  const provider=document.querySelector('#studioV5Dock .v5-provider-head');let badge=provider?.querySelector('[data-v6-audio-count]');if(provider&&counts.audio){if(!badge){badge=document.createElement('span');badge.dataset.v6AudioCount='true';badge.className='v6-audio-count';provider.appendChild(badge);}badge.textContent=`${counts.audio} audio ref${counts.audio===1?'':'s'}`;}else badge?.remove();
}

function currentProject(){return window.porterPromptStudio?.getProject?.()||null;}
function replaceProject(project,reason){const saved=window.porterPromptStudio?.replaceProject?.(project,{reason,snapshot:false,preserveIdentity:true});if(!saved)throw new Error('Prompt Studio public mutation API is unavailable.');scheduleDecorate();return saved;}
function showError(error){const footer=document.querySelector('#studioV5Dock .studio-v5-footer span')||document.querySelector('.studio-global-error span');if(footer){footer.textContent=String(error?.message||error);footer.classList.add('is-error');}else console.error(error);}
