const MUTATING_ACTIONS=new Set(['save-stage','attach-stage-video','attach-stage-last','attach-record-video','attach-record-last','delete-record']);

export function promptStudioV7ForeignStagedState(){
  const storyboardFields=[...document.querySelectorAll('[data-story-field]')];
  const repairStaged=storyboardFields.some(control=>control.disabled===true);
  const repairStage=document.querySelector('[data-v5-action="repair-stage"],[data-v5-action="stage-repair"],[data-repair-action="stage"]');
  const blueprintTab=document.querySelector('[data-v5-tab="blueprints"],[data-v5-view="blueprints"]');
  const seedanceTab=document.querySelector('[data-v5-tab="seedance"],[data-v5-view="seedance"]');
  const storyboardDirty=Boolean((repairStage&&repairStage.disabled)||(blueprintTab&&blueprintTab.disabled)||(seedanceTab&&seedanceTab.disabled));
  return{storyboardDirty,repairStaged,blocked:storyboardDirty||repairStaged};
}

export function assertPromptStudioV7MutationAllowed(){
  const state=promptStudioV7ForeignStagedState();
  if(!state.blocked)return state;
  if(state.repairStaged)throw new Error('Finish or discard the staged Repair proposal before changing Generation Results.');
  throw new Error('Apply or discard the staged Storyboard draft before changing Generation Results.');
}

function handleCapture(event){
  const button=event.target?.closest?.('[data-v7-action]');if(!button||!MUTATING_ACTIONS.has(button.dataset.v7Action))return;
  const state=promptStudioV7ForeignStagedState();if(!state.blocked)return;
  event.preventDefault();event.stopImmediatePropagation();
  const detail={source:'prompt-studio-v7',action:button.dataset.v7Action,state};
  window.dispatchEvent(new CustomEvent('porter-prompt-studio-v7-blocked',{detail}));
}

document.addEventListener('click',handleCapture,true);
