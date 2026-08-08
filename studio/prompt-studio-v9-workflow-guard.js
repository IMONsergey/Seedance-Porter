const CORE_MUTATIONS=new Set(['new','duplicate','snapshot','export','import-project','delete-project']);
const V9_MUTATIONS=new Set(['save-evaluation','create-comparison','mark-winner','attach-winner-video','attach-winner-last','save-retake']);
const OPEN_SOURCE_GUARD='__porterV9OpenSourceGuarded';

export function promptStudioV9ForeignStagedState(){
  const storyboardDirty=document.querySelector('#studioV4Dock [data-v4-dirty="true"]')!==null;
  const repairStaged=document.querySelector('#studioV5Dock[data-repair-staged="true"]')!==null;
  const v7ResultStaged=document.querySelector('#studioV7ResultsDock [data-v7-action="save-stage"]')!==null;
  const v8ResultStaged=document.querySelector('#studioV8BatchDock [data-v8-action="save-result"]')!==null;
  return{storyboardDirty,repairStaged,v7ResultStaged,v8ResultStaged,blocked:storyboardDirty||repairStaged||v7ResultStaged||v8ResultStaged};
}

export function promptStudioV9DraftDirty(){return document.querySelector('#studioV9ConsoleDock[data-v9-dirty="true"]')!==null;}

export function assertPromptStudioV9MutationAllowed(){
  const state=promptStudioV9ForeignStagedState();if(!state.blocked)return state;
  if(state.storyboardDirty)throw new Error('Apply or discard the staged Storyboard before changing Generation Console decisions.');
  if(state.repairStaged)throw new Error('Apply or discard the staged Repair proposal before changing Generation Console decisions.');
  if(state.v7ResultStaged)throw new Error('Save or discard the staged Generation Result before changing Generation Console decisions.');
  throw new Error('Save or discard the staged Batch Result before changing Generation Console decisions.');
}

function bind(){
  document.addEventListener('click',event=>{
    const v9=event.target.closest('[data-v9-action]');if(v9&&V9_MUTATIONS.has(v9.dataset.v9Action)){const foreign=promptStudioV9ForeignStagedState();if(foreign.blocked){event.preventDefault();event.stopImmediatePropagation();showBoundary(foreign);return;}}
    if(!promptStudioV9DraftDirty())return;
    const core=event.target.closest('[data-studio-action]')?.dataset.studioAction||'',sourceFork=event.target.closest('[data-studio-source-id]'),restore=event.target.closest('[data-restore-revision]');
    const foreignAction=event.target.closest('[data-studio-v4-action],[data-studio-v5-action],[data-v7-action],[data-v8-action]');
    if(CORE_MUTATIONS.has(core)||sourceFork||restore||foreignAction){event.preventDefault();event.stopImmediatePropagation();showDraftBoundary();}
  },true);
  document.addEventListener('change',event=>{
    if(!promptStudioV9DraftDirty())return;
    if(event.target.id==='studioProjectSelect'){event.preventDefault();event.stopImmediatePropagation();const id=window.porterPromptStudio?.getProject?.()?.id||'';if(id)event.target.value=id;showDraftBoundary();return;}
    if(event.target.id==='studioProjectImportFile'){event.preventDefault();event.stopImmediatePropagation();event.target.value='';showDraftBoundary();}
  },true);
  window.addEventListener('porter-open-prompt-studio',event=>{if(!promptStudioV9DraftDirty())return;event.preventDefault?.();event.stopImmediatePropagation();showDraftBoundary();},true);
  for(const eventName of ['porter-prompt-studio-change','porter-prompt-studio-project-replaced','porter-workspace-change'])window.addEventListener(eventName,installOpenSourceGuard);
  queueMicrotask(installOpenSourceGuard);
}

function installOpenSourceGuard(){
  const api=window.porterPromptStudio,openSource=api?.openSource;if(typeof openSource!=='function'||openSource[OPEN_SOURCE_GUARD])return;
  const original=openSource.bind(api);const guarded=function(...args){if(promptStudioV9DraftDirty()){showDraftBoundary();return null;}return original(...args);};guarded[OPEN_SOURCE_GUARD]=true;api.openSource=guarded;
}

function showBoundary(state){let text='Finish other staged work before changing Generation Console decisions.';if(state.storyboardDirty)text='Apply or discard the staged Storyboard first.';else if(state.repairStaged)text='Apply or discard the staged Repair proposal first.';else if(state.v7ResultStaged)text='Save or discard the staged Generation Result first.';else if(state.v8ResultStaged)text='Save or discard the staged Batch Result first.';show(text);}
function showDraftBoundary(){show('Save or discard the current V9 Evaluation/Retake draft before switching, restoring, forking or changing another staged production layer.');}
function show(text){const dock=document.querySelector('#studioV9ConsoleDock');if(!dock)return;let node=dock.querySelector('.v9-message');if(!node){node=document.createElement('div');node.className='v9-message is-error';dock.prepend(node);}else node.className='v9-message is-error';node.textContent=text;}

bind();
