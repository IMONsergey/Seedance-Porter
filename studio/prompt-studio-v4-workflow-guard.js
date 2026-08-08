let guardedOpenSource=null;
bindGuard();ensureApiGuard();

function bindGuard(){
  document.addEventListener('click',event=>{
    if(!storyboardDirty())return;
    const v4=event.target.closest('[data-studio-v4-action]');
    const coreAction=event.target.closest('[data-studio-action]')?.dataset.studioAction||'';
    const sourceFork=event.target.closest('[data-studio-source-id]');
    const restore=event.target.closest('[data-restore-revision]');
    if(isUnsafeV4(v4?.dataset.studioV4Action||'',v4)||['new','duplicate','snapshot','export','import-project','delete-project'].includes(coreAction)||sourceFork||restore){
      event.preventDefault();event.stopImmediatePropagation();showBoundary();
    }
  },true);
  document.addEventListener('change',event=>{
    if(!storyboardDirty())return;
    if(event.target.id==='studioProjectSelect'){
      event.preventDefault();event.stopImmediatePropagation();
      const id=window.porterPromptStudio?.getProject?.()?.id||'';if(id)event.target.value=id;
      showBoundary();return;
    }
    if(event.target.id==='studioProjectImportFile'){
      event.preventDefault();event.stopImmediatePropagation();event.target.value='';showBoundary();
    }
  },true);
  window.addEventListener('porter-open-prompt-studio',event=>{if(!storyboardDirty())return;event.preventDefault?.();event.stopImmediatePropagation();showBoundary();},true);
  new MutationObserver(()=>{syncDisabled();ensureApiGuard();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-v4-dirty']});
  syncDisabled();
}

function isUnsafeV4(action,target=null){if(['variants-init','variant-capture','variant-delete','variant-promote','variant-winner','handoff-build','handoff-copy-json','handoff-copy-brief','handoff-download'].includes(action))return true;return action==='tab'&&['variants','handoff'].includes(target?.dataset.studioV4Tab||'');}
function storyboardDirty(){return document.querySelector('#studioV4Dock [data-v4-dirty="true"]')!==null;}
function syncDisabled(){const dirty=storyboardDirty();for(const button of document.querySelectorAll('#studioV4Dock [data-studio-v4-action]')){if(!isUnsafeV4(button.dataset.studioV4Action||'',button))continue;button.disabled=dirty;if(dirty)button.title=boundaryText();else button.removeAttribute('title');}for(const button of document.querySelectorAll('#promptStudioView [data-studio-action]')){const action=button.dataset.studioAction||'';if(!['new','duplicate','snapshot','export','import-project','delete-project'].includes(action))continue;button.disabled=dirty;if(dirty)button.title=boundaryText();else button.removeAttribute('title');}}
function ensureApiGuard(){const api=window.porterPromptStudio;if(!api?.openSource||api.openSource===guardedOpenSource)return;const original=api.openSource.bind(api);guardedOpenSource=(detail)=>{if(storyboardDirty()){showBoundary();return null;}return original(detail);};api.openSource=guardedOpenSource;}
function boundaryText(){return'Apply or discard the staged Storyboard before switching/forking/restoring/exporting a project or opening Variants/Handoff.';}
function showBoundary(){const footer=document.querySelector('#studioV4Dock .studio-v4-footer span');if(!footer)return;footer.textContent=boundaryText();footer.classList.add('is-error');}
