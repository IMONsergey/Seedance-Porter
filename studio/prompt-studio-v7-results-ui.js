import {
  attachPromptStudioGenerationOutput,
  deletePromptStudioGenerationRecord,
  generationArtifactProjectLinkState,
  listPromptStudioGenerationRecords,
  savePromptStudioGenerationArtifact,
  validatePromptStudioGenerationArtifact
} from './prompt-studio-generation-results.js';

let dock=null;
let staged=null;
let stagedBase=null;
let message='';
let messageKind='';

mount();
bindGlobal();

function mount(){
  const root=document.querySelector('#promptStudioView');if(!root)return;
  dock=document.querySelector('#studioV7ResultsDock');
  if(!dock){dock=document.createElement('section');dock.id='studioV7ResultsDock';dock.className='studio-v7-results';const anchor=document.querySelector('#studioV5Dock');anchor?.insertAdjacentElement('afterend',dock)||root.appendChild(dock);}
  render();
}

function bindGlobal(){
  document.addEventListener('click',handleClick);
  document.addEventListener('change',handleChange);
  window.addEventListener('porter-prompt-studio-project-replaced',handleProjectChange);
  window.addEventListener('porter-prompt-studio-change',()=>{if(!staged)render();});
  window.addEventListener('porter-workspace-change',event=>{if(event.detail?.viewId==='promptStudioView')render();});
}

async function handleChange(event){
  const input=event.target.closest('#studioV7ImportInput');if(!input)return;
  const file=input.files?.[0];input.value='';if(!file)return;
  try{
    if(file.size>2*1024*1024)throw new Error('Generation manifest is unexpectedly large (>2 MB).');
    const raw=JSON.parse(await file.text());const validation=validatePromptStudioGenerationArtifact(raw);
    if(!validation.ok)throw new Error(`Rejected generation artifact: ${validation.errors.join(', ')}`);
    const project=currentProject();if(!project)throw new Error('Prompt Studio project is unavailable.');
    staged=validation.artifact;stagedBase={projectId:project.id,updatedAt:project.updatedAt};setMessage(`${file.name} staged locally. Nothing has been saved or attached yet.`,'ok');render();
  }catch(error){staged=null;stagedBase=null;setMessage(String(error?.message||error),'error');render();}
}

function handleClick(event){
  const button=event.target.closest('[data-v7-action]');if(!button)return;const action=button.dataset.v7Action;
  try{
    if(action==='import'){document.querySelector('#studioV7ImportInput')?.click();return;}
    if(action==='discard'){staged=null;stagedBase=null;setMessage('Staged manifest discarded.','');render();return;}
    if(action==='save-stage'){assertStageFresh();const next=savePromptStudioGenerationArtifact(currentProject(),staged);staged=null;stagedBase=null;replaceProject(next,'save generation result record');setMessage('Generation record saved to this project.','ok');return;}
    if(action==='attach-stage-video'){attachFromStage('video');return;}
    if(action==='attach-stage-last'){attachFromStage('last-frame');return;}
    if(action==='attach-record-video'){attachFromRecord(button.dataset.taskId,'video');return;}
    if(action==='attach-record-last'){attachFromRecord(button.dataset.taskId,'last-frame');return;}
    if(action==='delete-record'){const project=currentProject();const taskId=button.dataset.taskId;if(!project||!taskId)return;replaceProject(deletePromptStudioGenerationRecord(project,taskId),'delete generation result record');setMessage(`Generation record ${shortTask(taskId)} removed from this project.`,'ok');return;}
    if(action==='copy-task'){navigator.clipboard?.writeText(button.dataset.taskId||'');setMessage('Task ID copied.','ok');render();return;}
  }catch(error){setMessage(String(error?.message||error),'error');render();}
}

function attachFromStage(kind){assertStageFresh();const project=currentProject();const attached=attachPromptStudioGenerationOutput(project,staged,kind);staged=null;stagedBase=null;replaceProject(attached.project,`attach generated ${kind} reference`);setMessage(`${attached.reference.token} attached from generated ${kind}.`,'ok');}
function attachFromRecord(taskId,kind){const project=currentProject();const record=listPromptStudioGenerationRecords(project).find(item=>item.taskId===taskId);if(!record)throw new Error('Saved generation record is no longer available.');const attached=attachPromptStudioGenerationOutput(project,record,kind);replaceProject(attached.project,`attach saved generated ${kind} reference`);setMessage(`${attached.reference.token} attached from task ${shortTask(taskId)}.`,'ok');}

function assertStageFresh(){const project=currentProject();if(!project||!staged||!stagedBase)throw new Error('No generation artifact is staged.');if(project.id!==stagedBase.projectId||project.updatedAt!==stagedBase.updatedAt){staged=null;stagedBase=null;throw new Error('Project changed after import. Re-import the manifest before applying it.');}}
function handleProjectChange(){if(staged&&stagedBase){const project=currentProject();if(!project||project.id!==stagedBase.projectId||project.updatedAt!==stagedBase.updatedAt){staged=null;stagedBase=null;setMessage('Staged generation manifest was invalidated because the project changed.','warn');}}render();}

function render(){
  if(!dock)mount();if(!dock)return;const project=currentProject();if(!project){dock.innerHTML='';return;}
  const records=listPromptStudioGenerationRecords(project);const stageLink=staged?generationArtifactProjectLinkState(project,staged):null;
  dock.innerHTML=`
    <header class="v7-head">
      <div><span class="v7-kicker">PROMPT STUDIO V7</span><h3>Generation Results</h3><p>Import Runner job/result manifests, verify lineage locally, then explicitly attach generated output as a new reference.</p></div>
      <div class="v7-head-actions"><button type="button" data-v7-action="import">Import job / result</button><input id="studioV7ImportInput" type="file" accept="application/json,.json" hidden></div>
    </header>
    ${message?`<div class="v7-message is-${escapeAttr(messageKind||'info')}">${escapeHtml(message)}</div>`:''}
    <div class="v7-grid">
      <section class="v7-panel">
        <div class="v7-panel-title"><strong>Staged import</strong><span>${staged?'LOCAL · NOT APPLIED':'EMPTY'}</span></div>
        ${staged?renderStage(project,staged,stageLink):`<div class="v7-empty">Import a <code>*.job.json</code> or <code>*.result.json</code>. Parsing and validation are local; no provider request is made.</div>`}
      </section>
      <section class="v7-panel">
        <div class="v7-panel-title"><strong>Project history</strong><span>${records.length}/${50}</span></div>
        ${records.length?`<div class="v7-records">${records.slice(0,12).map(record=>renderRecord(project,record)).join('')}</div>`:`<div class="v7-empty">No imported generation records in this project yet.</div>`}
      </section>
    </div>
    <footer class="v7-foot"><span>NO AUTO FETCH</span><span>NO AUTO ATTACH</span><span>NO PROVIDER KEY</span><span>EXPLICIT REVISIONED APPLY</span></footer>`;
}

function renderStage(project,artifact,link){const success=artifact.status==='succeeded';const video=success&&artifact.output?.videoUrl,last=success&&artifact.output?.lastFrameUrl;return`
  <article class="v7-stage">
    ${renderArtifactMeta(artifact,link)}
    <div class="v7-stage-actions">
      <button type="button" data-v7-action="save-stage">Save record</button>
      ${video?`<button type="button" data-v7-action="attach-stage-video">Attach video as reference</button>`:''}
      ${last?`<button type="button" data-v7-action="attach-stage-last">Attach last frame as reference</button>`:''}
      <button type="button" class="is-quiet" data-v7-action="discard">Discard</button>
    </div>
    ${success?`<div class="v7-output-links">${video?externalLink(artifact.output.videoUrl,'Open generated video'):''}${last?externalLink(artifact.output.lastFrameUrl,'Open last frame'):''}</div>`:''}
  </article>`;}

function renderRecord(project,record){const link=generationArtifactProjectLinkState(project,record),success=record.status==='succeeded',video=success&&record.output?.videoUrl,last=success&&record.output?.lastFrameUrl;return`
  <article class="v7-record">
    ${renderArtifactMeta(record,link)}
    <div class="v7-record-actions">
      ${video?`<button type="button" data-v7-action="attach-record-video" data-task-id="${escapeAttr(record.taskId)}">+ video ref</button>`:''}
      ${last?`<button type="button" data-v7-action="attach-record-last" data-task-id="${escapeAttr(record.taskId)}">+ last frame</button>`:''}
      <button type="button" class="is-quiet" data-v7-action="copy-task" data-task-id="${escapeAttr(record.taskId)}">Copy ID</button>
      <button type="button" class="is-danger" data-v7-action="delete-record" data-task-id="${escapeAttr(record.taskId)}">Delete record</button>
    </div>
  </article>`;}

function renderArtifactMeta(artifact,link){return`
  <div class="v7-meta-row"><span class="v7-status is-${escapeAttr(artifact.status)}">${escapeHtml(artifact.status)}</span><span>${escapeHtml(artifact.sourceArtifactKind||'manifest')}</span><span>${escapeHtml(shortTask(artifact.taskId))}</span></div>
  <div class="v7-link is-${escapeAttr(link.state)}"><strong>${escapeHtml(link.state)}</strong><span>${escapeHtml(link.label)}</span></div>
  <dl class="v7-facts"><div><dt>Export</dt><dd>${escapeHtml(String(artifact.exportHash||'').slice(0,16))}…</dd></div>${artifact.providerMeta?.model?`<div><dt>Model</dt><dd>${escapeHtml(artifact.providerMeta.model)}</dd></div>`:''}${artifact.completedAt?`<div><dt>Completed</dt><dd>${escapeHtml(formatDate(artifact.completedAt))}</dd></div>`:''}</dl>`;}

function externalLink(url,label){return`<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)} ↗</a>`;}
function currentProject(){return window.porterPromptStudio?.getProject?.()||null;}
function replaceProject(project,reason){const result=window.porterPromptStudio?.replaceProject?.(project,{reason,snapshot:true,preserveIdentity:true});if(!result)throw new Error('Prompt Studio public mutation API is unavailable.');render();return result;}
function setMessage(text,kind=''){message=String(text||'');messageKind=kind;}
function shortTask(value){const text=String(value||'');return text.length<=24?text:`${text.slice(0,12)}…${text.slice(-8)}`;}
function formatDate(value){try{return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value||'');}}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
function escapeAttr(value){return escapeHtml(value);}
