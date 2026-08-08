const MUTATING_ACTIONS=new Set(['save-stage','attach-stage-video','attach-stage-last','attach-record-video','attach-record-last','delete-record']);

export function promptStudioV7ForeignStagedState(){
  const storyboardDirty=document.querySelector('#studioV4Dock [data-v4-dirty="true"]')!==null;
  const repairStaged=document.querySelector('#studioV5Dock[data-repair-staged="true"]')!==null;
  return{storyboardDirty,repairStaged,blocked:storyboardDirty||repairStaged};
}

export function assertPromptStudioV7MutationAllowed(){
  const state=promptStudioV7ForeignStagedState();
  if(!state.blocked)return state;
  if(state.repairStaged)throw new Error('Apply or discard the staged Repair proposal before changing Generation Results.');
  throw new Error('Apply or discard the staged Storyboard before changing Generation Results.');
}

function handleCapture(event){
  const button=event.target?.closest?.('[data-v7-action]');if(!button||!MUTATING_ACTIONS.has(button.dataset.v7Action))return;
  const state=promptStudioV7ForeignStagedState();if(!state.blocked)return;
  event.preventDefault();event.stopImmediatePropagation();
  const message=state.repairStaged?'Apply or discard the staged Repair proposal before changing Generation Results.':'Apply or discard the staged Storyboard before changing Generation Results.';
  showBoundary(message);
  window.dispatchEvent(new CustomEvent('porter-prompt-studio-v7-blocked',{detail:{source:'prompt-studio-v7',action:button.dataset.v7Action,state,message}}));
}

function showBoundary(message){const dock=document.querySelector('#studioV7ResultsDock');if(!dock)return;let node=dock.querySelector('.v7-message');if(!node){node=document.createElement('div');node.className='v7-message is-error';dock.prepend(node);}else node.className='v7-message is-error';node.textContent=message;}

document.addEventListener('click',handleCapture,true);
