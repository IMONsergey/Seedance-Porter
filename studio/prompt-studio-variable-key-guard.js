let queued=false;

bindVariableKeyGuard();
scheduleGuard();

function bindVariableKeyGuard(){
  for(const type of ['beforeinput','input','change']){
    document.addEventListener(type,event=>{
      const field=event.target?.closest?.('#studioProductionTools [data-variable-field="key"]');
      if(!field)return;
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      const canonical=field.dataset.variableKey||'';
      if(field.value!==canonical)field.value=canonical;
    },true);
  }

  window.addEventListener('porter-prompt-studio-change',scheduleGuard);
  window.addEventListener('porter-prompt-studio-project-replaced',scheduleGuard);
  window.addEventListener('porter-workspace-change',event=>{
    if(event.detail?.viewId==='promptStudioView')scheduleGuard();
  });
  new MutationObserver(scheduleGuard).observe(document.body,{childList:true,subtree:true});
}

function scheduleGuard(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{
    queued=false;
    document.querySelectorAll('#studioProductionTools [data-variable-field="key"]').forEach(field=>{
      field.readOnly=true;
      field.setAttribute('readonly','');
      field.setAttribute('aria-readonly','true');
      field.title='Variable keys are immutable after creation. Delete and recreate the variable to use another key.';
      const canonical=field.dataset.variableKey||'';
      if(field.value!==canonical)field.value=canonical;
    });
  });
}
