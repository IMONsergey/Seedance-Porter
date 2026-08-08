bindGuard();
function bindGuard(){
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-studio-v4-action]');const action=target?.dataset.studioV4Action||'';
    if(!storyboardDirty()||!isUnsafeWhileStoryboardDirty(action,target))return;
    event.preventDefault();event.stopImmediatePropagation();showBoundary();
  },true);
  new MutationObserver(syncDisabled).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-v4-dirty']});
  syncDisabled();
}
function isUnsafeWhileStoryboardDirty(action,target=null){if(['variants-init','variant-capture','variant-delete','variant-promote','variant-winner','handoff-build','handoff-copy-json','handoff-copy-brief','handoff-download'].includes(action))return true;return action==='tab'&&target?.dataset.studioV4Tab==='handoff';}
function storyboardDirty(){return document.querySelector('#studioV4Dock [data-v4-dirty="true"]')!==null;}
function syncDisabled(){const dirty=storyboardDirty();for(const button of document.querySelectorAll('#studioV4Dock [data-studio-v4-action]')){if(!isUnsafeWhileStoryboardDirty(button.dataset.studioV4Action||'',button))continue;button.disabled=dirty;if(dirty)button.title='Apply or discard the staged Storyboard before changing Variants or opening/building Handoff.';else button.removeAttribute('title');}}
function showBoundary(){const footer=document.querySelector('#studioV4Dock .studio-v4-footer span');if(!footer)return;footer.textContent='Apply or discard the staged Storyboard before changing Variants or opening/building Handoff.';footer.classList.add('is-error');}
