bindGuard();
function bindGuard(){
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-studio-v4-action]')?.dataset.studioV4Action||'';
    if(!isVariantMutation(action)||!storyboardDirty())return;
    event.preventDefault();event.stopImmediatePropagation();showBoundary();
  },true);
  new MutationObserver(syncDisabled).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-v4-dirty']});
  syncDisabled();
}
function isVariantMutation(action){return action==='variants-init'||action==='variant-capture'||action==='variant-delete'||action==='variant-promote'||action==='variant-winner';}
function storyboardDirty(){return document.querySelector('#studioV4Dock [data-v4-dirty="true"]')!==null;}
function syncDisabled(){const dirty=storyboardDirty();for(const button of document.querySelectorAll('#studioV4Dock [data-studio-v4-action]')){if(!isVariantMutation(button.dataset.studioV4Action||''))continue;button.disabled=dirty;if(dirty)button.title='Apply or discard the staged Storyboard before changing Variants.';else button.removeAttribute('title');}}
function showBoundary(){const footer=document.querySelector('#studioV4Dock .studio-v4-footer span');if(!footer)return;footer.textContent='Apply or discard the staged Storyboard before changing Variants.';footer.classList.add('is-error');}
