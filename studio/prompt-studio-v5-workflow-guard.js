let guardedOpenSource=null;
bindGuard();ensureApiGuard();

function bindGuard(){
  document.addEventListener('click',event=>{
    const v4Dirty=storyboardDirty(),repair=repairStaged();
    const v5=event.target.closest('[data-studio-v5-action]');const v5Action=v5?.dataset.studioV5Action||'';const coreAction=event.target.closest('[data-studio-action]')?.dataset.studioAction||'';const sourceFork=event.target.closest('[data-studio-source-id]');const restore=event.target.closest('[data-restore-revision]');const v4=event.target.closest('[data-studio-v4-action]');
    if(v4Dirty&&isUnsafeWhenStoryboardDirty(v5Action,v5)){event.preventDefault();event.stopImmediatePropagation();showBoundary('Storyboard');return;}
    if(repair&&(isUnsafeWhenRepairStaged(v5Action,v5)||['new','duplicate','snapshot','export','import-project','delete-project'].includes(coreAction)||sourceFork||restore||isV4StoryboardStart(v4))){event.preventDefault();event.stopImmediatePropagation();showBoundary('Repair');}
  },true);
  document.addEventListener('change',event=>{
    if(!repairStaged())return;
    if(event.target.id==='studioProjectSelect'){event.preventDefault();event.stopImmediatePropagation();const id=window.porterPromptStudio?.getProject?.()?.id||'';if(id)event.target.value=id;showBoundary('Repair');return;}
    if(event.target.id==='studioProjectImportFile'){event.preventDefault();event.stopImmediatePropagation();event.target.value='';showBoundary('Repair');}
  },true);
  window.addEventListener('porter-open-prompt-studio',event=>{if(!repairStaged())return;event.preventDefault?.();event.stopImmediatePropagation();showBoundary('Repair');},true);
  new MutationObserver(()=>{syncDisabled();ensureApiGuard();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-repair-staged','data-v4-dirty']});syncDisabled();
}

function isUnsafeWhenStoryboardDirty(action,target=null){if(['repair-stage','repair-ai','repair-apply','blueprint-new','blueprint-fill','blueprint-full','seedance-build','seedance-copy-json','seedance-copy-curl','seedance-copy-node','seedance-download'].includes(action))return true;return action==='tab'&&['blueprints','seedance'].includes(target?.dataset.studioV5Tab||'');}
function isUnsafeWhenRepairStaged(action,target=null){if(['repair-stage','repair-ai','blueprint-new','blueprint-fill','blueprint-full','seedance-build','seedance-copy-json','seedance-copy-curl','seedance-copy-node','seedance-download'].includes(action))return true;return action==='tab'&&['blueprints','seedance'].includes(target?.dataset.studioV5Tab||'');}
function isV4StoryboardStart(target){if(!target)return false;const action=target.dataset.studioV4Action||'';return action==='story-build'||(action==='tab'&&target.dataset.studioV4Tab==='storyboard');}
function storyboardDirty(){return document.querySelector('#studioV4Dock [data-v4-dirty="true"]')!==null;}
function repairStaged(){return document.querySelector('#studioV5Dock[data-repair-staged="true"]')!==null;}

function syncDisabled(){const v4Dirty=storyboardDirty(),repair=repairStaged();for(const button of document.querySelectorAll('#studioV5Dock [data-studio-v5-action]')){const action=button.dataset.studioV5Action||'';const blocked=(v4Dirty&&isUnsafeWhenStoryboardDirty(action,button))||(repair&&isUnsafeWhenRepairStaged(action,button));button.disabled=blocked;if(blocked)button.title=boundaryText(v4Dirty?'Storyboard':'Repair');else button.removeAttribute('title');}for(const button of document.querySelectorAll('#promptStudioView [data-studio-action]')){const action=button.dataset.studioAction||'';if(!['new','duplicate','snapshot','export','import-project','delete-project'].includes(action))continue;button.disabled=repair;if(repair)button.title=boundaryText('Repair');else button.removeAttribute('title');}for(const node of document.querySelectorAll('#studioV4Dock [data-story-field]')){if(repair){if(!node.disabled){node.disabled=true;node.dataset.v5Disabled='true';}}else if(node.dataset.v5Disabled==='true'){node.disabled=false;delete node.dataset.v5Disabled;}}for(const button of document.querySelectorAll('#studioV4Dock [data-studio-v4-action]')){if(!isV4StoryboardStart(button))continue;if(repair){button.disabled=true;button.dataset.v5Disabled='true';button.title=boundaryText('Repair');}else if(button.dataset.v5Disabled==='true'){button.disabled=false;delete button.dataset.v5Disabled;button.removeAttribute('title');}}}
function ensureApiGuard(){const api=window.porterPromptStudio;if(!api?.openSource||api.openSource===guardedOpenSource)return;const original=api.openSource.bind(api);guardedOpenSource=(detail)=>{if(repairStaged()){showBoundary('Repair');return null;}return original(detail);};api.openSource=guardedOpenSource;}
function boundaryText(layer){return layer==='Storyboard'?'Apply or discard the staged Storyboard before staging Repair, applying Blueprints or building Seedance export.':'Apply or discard the staged Repair proposal before switching/forking/exporting the project, opening Blueprints/Seedance or editing Storyboard.';}
function showBoundary(layer){const footer=document.querySelector('#studioV5Dock .studio-v5-footer span');if(!footer)return;footer.textContent=boundaryText(layer);footer.classList.add('is-error');}
