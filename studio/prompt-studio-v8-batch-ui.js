import { buildPromptStudioVariantBatchPlan, listPromptStudioBatchVariants, savePromptStudioBatchResult, validatePromptStudioBatchResult } from './prompt-studio-generation-batch.js';

const state={selected:new Set(),plan:null,stagedResult:null,stagedBase:null,resolution:'720p',durationAuto:false,generateAudio:true,message:'',kind:'',queued:false};
bind();scheduleMount();

function bind(){
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-v8-action]');if(!button)return;
    try{
      const action=button.dataset.v8Action;
      if(action==='select-all'){for(const item of listPromptStudioBatchVariants(project()))state.selected.add(item.id);render();return;}
      if(action==='clear'){state.selected.clear();state.plan=null;render();return;}
      if(action==='build'){assertForeignStagedClear();await buildPlan();return;}
      if(action==='download'){if(!state.plan)throw new Error('Build a batch plan first.');downloadJson(state.plan,`${safeName(project()?.title||'prompt-studio')}-batch-plan.json`);return;}
      if(action==='import-result'){document.querySelector('#studioV8ResultInput')?.click();return;}
      if(action==='discard-result'){state.stagedResult=null;state.stagedBase=null;setMessage('Staged batch result discarded.','');render();return;}
      if(action==='save-result'){assertForeignStagedClear();assertStageFresh();const current=project();if(String(state.stagedResult?.project?.id||'')&&String(state.stagedResult.project.id)!==String(current.id))throw new Error('Batch result belongs to a different Prompt Studio project.');const next=savePromptStudioBatchResult(current,state.stagedResult);state.stagedResult=null;state.stagedBase=null;replaceProject(next,'save batch generation results');setMessage('Batch results saved into Generation Results history.','ok');return;}
    }catch(error){setMessage(String(error?.message||error),'error');render();}
  });
  document.addEventListener('change',async event=>{
    const variant=event.target.closest('[data-v8-variant]');if(variant){if(variant.checked)state.selected.add(variant.value);else state.selected.delete(variant.value);state.plan=null;render();return;}
    if(event.target.id==='studioV8Resolution'){state.resolution=event.target.value;state.plan=null;return;}
    if(event.target.id==='studioV8DurationAuto'){state.durationAuto=event.target.checked;state.plan=null;return;}
    if(event.target.id==='studioV8GenerateAudio'){state.generateAudio=event.target.checked;state.plan=null;return;}
    if(event.target.id==='studioV8ResultInput')await importResult(event.target);
  });
  window.addEventListener('porter-prompt-studio-project-replaced',handleProjectChange);
  window.addEventListener('porter-prompt-studio-change',()=>{if(!state.stagedResult){state.plan=null;syncSelection();render();}});
  window.addEventListener('porter-workspace-change',event=>{if(event.detail?.viewId==='promptStudioView')scheduleMount();});
  new MutationObserver(scheduleMount).observe(document.body,{childList:true,subtree:true});
}

function scheduleMount(){if(state.queued)return;state.queued=true;queueMicrotask(()=>{state.queued=false;mount();});}
function mount(){const editor=document.querySelector('#promptStudioView .studio-editor');if(!editor)return;let root=document.querySelector('#studioV8BatchDock');if(!root){root=document.createElement('section');root.id='studioV8BatchDock';root.className='studio-v8-batch';const anchor=document.querySelector('#studioV7ResultsDock')||document.querySelector('#studioV5Dock')||editor.querySelector('.studio-project-toolbar');anchor?.insertAdjacentElement('afterend',root);}syncSelection();render();}
function syncSelection(){const ids=new Set(listPromptStudioBatchVariants(project()).map(item=>item.id));for(const id of [...state.selected])if(!ids.has(id))state.selected.delete(id);}

async function buildPlan(){const current=project();if(!current)throw new Error('Prompt Studio project is unavailable.');if(!state.selected.size)throw new Error('Select at least one A/B variant.');setMessage('Building provider exports locally…','');render();state.plan=await buildPromptStudioVariantBatchPlan(current,[...state.selected],{provider:{resolution:state.resolution,durationAuto:state.durationAuto,generateAudio:state.generateAudio}});setMessage(state.plan.ready?'Batch plan ready for external Runner.':`Plan blocked: ${state.plan.errors.join(', ')}`,state.plan.ready?'ok':'error');render();}

async function importResult(input){const file=input.files?.[0];input.value='';if(!file)return;try{if(file.size>5*1024*1024)throw new Error('Batch result is unexpectedly large (>5 MB).');const raw=JSON.parse(await file.text()),validation=validatePromptStudioBatchResult(raw);if(!validation.ok)throw new Error(`Rejected batch result: ${validation.errors.join(', ')}`);const current=project();state.stagedResult=raw;state.stagedBase={id:current.id,updatedAt:current.updatedAt};setMessage(`${file.name} staged locally. Save is explicit.`,'ok');render();}catch(error){state.stagedResult=null;state.stagedBase=null;setMessage(String(error?.message||error),'error');render();}}
function assertStageFresh(){const current=project();if(!current||!state.stagedResult||!state.stagedBase)throw new Error('No batch result is staged.');if(current.id!==state.stagedBase.id||current.updatedAt!==state.stagedBase.updatedAt){state.stagedResult=null;state.stagedBase=null;throw new Error('Project changed after batch result import. Re-import before saving.');}}
function handleProjectChange(){if(state.stagedResult&&state.stagedBase){const current=project();if(!current||current.id!==state.stagedBase.id||current.updatedAt!==state.stagedBase.updatedAt){state.stagedResult=null;state.stagedBase=null;setMessage('Staged batch result was invalidated because the project changed.','warn');}}state.plan=null;syncSelection();render();}
function assertForeignStagedClear(){if(document.querySelector('#studioV4Dock [data-v4-dirty="true"]'))throw new Error('Apply or discard the staged Storyboard before building/saving a batch.');if(document.querySelector('#studioV5Dock[data-repair-staged="true"]'))throw new Error('Apply or discard the staged Repair proposal before building/saving a batch.');}

function render(){const root=document.querySelector('#studioV8BatchDock'),current=project();if(!root||!current)return;const variants=listPromptStudioBatchVariants(current),staged=state.stagedResult;root.innerHTML=`
<header class="v8-head"><div><span>PROMPT STUDIO V8</span><h3>Variant Batch Queue</h3><p>Build integrity-bound provider exports for A/B variants in the browser; execute only with the external Runner.</p></div><b>${state.selected.size}/${variants.length} selected</b></header>
${state.message?`<div class="v8-message is-${esc(state.kind||'info')}">${esc(state.message)}</div>`:''}
<div class="v8-controls"><label>Resolution<select id="studioV8Resolution">${['480p','720p','1080p','4k'].map(value=>`<option ${state.resolution===value?'selected':''}>${value}</option>`).join('')}</select></label><label><input id="studioV8DurationAuto" type="checkbox" ${state.durationAuto?'checked':''}> provider auto duration</label><label><input id="studioV8GenerateAudio" type="checkbox" ${state.generateAudio?'checked':''}> generate audio</label><div><button data-v8-action="select-all">Select all</button><button data-v8-action="clear">Clear</button><button class="primary" data-v8-action="build">Build plan</button>${state.plan?`<button data-v8-action="download">Download plan</button>`:''}</div></div>
<div class="v8-grid"><section><div class="v8-title"><strong>Variants</strong><span>max 20</span></div>${variants.length?variants.map(item=>`<label class="v8-variant"><input type="checkbox" data-v8-variant value="${attr(item.id)}" ${state.selected.has(item.id)?'checked':''}><span><strong>${esc(item.label)}</strong><small>${esc(item.status)}${item.isBase?' · frozen base':''}</small></span></label>`).join(''):`<div class="v8-empty">Initialize A/B Variants in Prompt Studio v4 first.</div>`}</section><section><div class="v8-title"><strong>Batch plan</strong><span>${state.plan?state.plan.ready?'READY':'BLOCKED':'NOT BUILT'}</span></div>${state.plan?renderPlan(state.plan):`<div class="v8-empty">One selected variant = one independently compiled Handoff + Seedance export. No provider request occurs here.</div>`}</section><section><div class="v8-title"><strong>Return results</strong><span>${staged?'STAGED':'EMPTY'}</span></div><button data-v8-action="import-result">Import batch result</button><input id="studioV8ResultInput" type="file" accept="application/json,.json" hidden>${staged?renderResult(staged):`<div class="v8-empty">Import the external <code>*.batch-result.json</code>, validate every item locally, then save successful items into v7 Generation Results.</div>`}</section></div>
<footer class="v8-foot"><span>NO BROWSER SUBMIT</span><span>ENV-ONLY RUNNER KEY</span><span>NO AMBIGUOUS AUTO-RETRY</span><span>EXPLICIT RESULT SAVE</span></footer>`;}
function renderPlan(plan){return`<div class="v8-plan-meta"><span>SHA ${esc(plan.integrity.contentHash.slice(0,14))}…</span><span>${plan.items.length} items</span><span>local concurrency recommendation ${plan.execution.recommendedLocalConcurrency}</span></div><div class="v8-items">${plan.items.map(item=>`<article class="v8-item is-${item.ready?'ready':'blocked'}"><strong>${esc(item.variant.label)}</strong><span>${item.ready?'ready':esc(item.errors.join(', '))}</span><small>${esc(item.exportHash.slice(0,12))}…</small></article>`).join('')}</div>`;}
function renderResult(result){const counts={};for(const item of result.items||[])counts[item.status]=(counts[item.status]||0)+1;return`<div class="v8-result"><p>batch <code>${esc(result.batchId||'')}</code></p><p>${Object.entries(counts).map(([key,value])=>`${esc(key)} ${value}`).join(' · ')}</p><div><button class="primary" data-v8-action="save-result">Save to Generation Results</button><button data-v8-action="discard-result">Discard</button></div></div>`;}
function project(){return window.porterPromptStudio?.getProject?.()||null;}
function replaceProject(next,reason){const saved=window.porterPromptStudio?.replaceProject?.(next,{reason,snapshot:true,preserveIdentity:true});if(!saved)throw new Error('Prompt Studio public mutation API is unavailable.');render();return saved;}
function setMessage(text,kind=''){state.message=String(text||'');state.kind=kind;}
function downloadJson(value,name){const blob=new Blob([`${JSON.stringify(value,null,2)}\n`],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
function safeName(value){return String(value||'batch').toLowerCase().replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,64)||'batch';}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function attr(value){return esc(value);}
