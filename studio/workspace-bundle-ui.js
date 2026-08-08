import { getLanguage } from './i18n.js';
import { buildWorkspaceBundle, buildWorkspaceBundleArchive, parseWorkspaceBundlePayload, planWorkspaceBundleImport } from './workspace-bundle-engine.js';

const $=(selector,root=document)=>root.querySelector(selector);
const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const attr=(value='')=>esc(value).replace(/`/g,'&#96;');
const ru=()=>getLanguage()==='ru';
const ui=(en,ruText)=>ru()?ruText:en;
const PREFIX={deepReviewDraft:'porterDeepReviewDraft:',mediaEvidence:'porterDeepReviewMediaEvidence:',promotionDraft:'porterPromotionEditorial:'};

const state={corpus:new Map(),selectedId:'',preview:null,importMode:'fill-missing'};

injectPanel();
bindEvents();
loadCorpus();

async function loadCorpus(){
  try{const response=await fetch('./case-candidates.json',{cache:'no-store'});if(response.ok){const data=await response.json();state.corpus=new Map((data.candidates||[]).map(item=>[item.id,item]));}}catch{}
  refresh();
}

function injectPanel(){
  const body=$('#operationsBody');
  if(!body){queueMicrotask(injectPanel);return;}
  if($('#workspaceBundlePanel'))return;
  const section=document.createElement('section');
  section.id='workspaceBundlePanel';
  section.className='workspace-bundle-panel';
  body.appendChild(section);
  refresh();
}

function bindEvents(){
  document.addEventListener('change',event=>{
    if(event.target.id==='workspaceBundleCandidate'){state.selectedId=event.target.value;refresh();}
    if(event.target.id==='workspaceBundleFile') handleFile(event.target.files?.[0]);
    if(event.target.name==='workspaceBundleImportMode'){state.importMode=event.target.value;renderImportPreview();}
  });
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-workspace-bundle-action]')?.dataset.workspaceBundleAction;
    if(!action)return;
    if(action==='copy')copySelected();
    if(action==='export')exportSelected();
    if(action==='export-all')exportAll();
    if(action==='choose-file')$('#workspaceBundleFile')?.click();
    if(action==='analyze-paste')analyzeText($('#workspaceBundlePaste')?.value||'');
    if(action==='import')applyImport();
    if(action==='clear-preview'){state.preview=null;renderImportPreview();}
  });
  window.addEventListener('porter-language-change',refresh);
  window.addEventListener('porter-local-work-change',refresh);
  window.addEventListener('focus',refresh);
}

function refresh(){
  const panel=$('#workspaceBundlePanel');
  if(!panel)return;
  const ids=localCandidateIds();
  if(!state.selectedId||!ids.includes(state.selectedId))state.selectedId=ids[0]||'';
  panel.innerHTML=`
    <div class="workspace-bundle-head"><div><span>${ui('Portable local work','Перенос локальной работы')}</span><h3>${ui('Workspace Evidence Bundles','Workspace Evidence Bundles')}</h3><p>${ui('Move unfinished Deep Review, media timeline and Promotion drafts between browsers or tools without turning transport into approval.','Переноси незавершённые Deep Review, media timeline и Promotion drafts между браузерами/инструментами без превращения transport в approval.')}</p></div><strong>${ids.length}</strong></div>
    <div class="workspace-bundle-grid">
      <div class="workspace-bundle-export">
        <label>${ui('Local candidate','Локальный кандидат')}<select id="workspaceBundleCandidate">${ids.length?ids.map(id=>`<option value="${attr(id)}" ${id===state.selectedId?'selected':''}>${esc(candidateLabel(id))}</option>`).join(''):`<option value="">${ui('No local work','Нет локальной работы')}</option>`}</select></label>
        ${selectedSummary(state.selectedId)}
        <div class="workspace-bundle-actions"><button class="button small" type="button" data-workspace-bundle-action="copy" ${state.selectedId?'':'disabled'}>${ui('Copy bundle JSON','Копировать JSON')}</button><button class="button primary small" type="button" data-workspace-bundle-action="export" ${state.selectedId?'':'disabled'}>${ui('Export bundle','Экспорт bundle')}</button><button class="button small" type="button" data-workspace-bundle-action="export-all" ${ids.length?'':'disabled'}>${ui('Export all','Экспортировать все')}</button></div>
      </div>
      <div class="workspace-bundle-import">
        <div class="workspace-bundle-import-title"><strong>${ui('Import preview','Предпросмотр импорта')}</strong><span>${ui('Nothing is written until Import is clicked.','Ничего не записывается до нажатия Import.')}</span></div>
        <input id="workspaceBundleFile" type="file" accept="application/json,.json" hidden>
        <textarea id="workspaceBundlePaste" rows="4" placeholder="${attr(ui('Paste a bundle/archive JSON or choose a file…','Вставь JSON bundle/archive или выбери файл…'))}"></textarea>
        <div class="workspace-bundle-actions"><button class="button small" type="button" data-workspace-bundle-action="choose-file">${ui('Choose file','Выбрать файл')}</button><button class="button small" type="button" data-workspace-bundle-action="analyze-paste">${ui('Analyze paste','Проверить JSON')}</button></div>
        <div id="workspaceBundleImportPreview"></div>
      </div>
    </div>
    <div class="workspace-bundle-boundary"><strong>${ui('Transport boundary.','Граница transport.')}</strong> ${ui('Bundle import cannot restore complete-video attestation, deep-reviewed state, curated approval or publication state. It only restores unfinished browser-local work.','Bundle import не может восстановить complete-video attestation, deep-reviewed, curated approval или publication. Он переносит только незавершённую browser-local работу.')}</div>`;
  renderImportPreview();
}

function localCandidateIds(){
  const ids=[];
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i)||'';
    for(const prefix of Object.values(PREFIX))if(key.startsWith(prefix))ids.push(key.slice(prefix.length));
  }
  return [...new Set(ids)].filter(Boolean).sort((a,b)=>candidateLabel(a).localeCompare(candidateLabel(b)));
}

function candidateLabel(id){return state.corpus.get(id)?.title||id;}
function readComponent(key,id){try{const raw=localStorage.getItem(`${PREFIX[key]}${id}`);return raw?JSON.parse(raw):null;}catch{return null;}}
function componentsFor(id){return Object.fromEntries(Object.keys(PREFIX).map(key=>[key,readComponent(key,id)]).filter(([,value])=>value!=null));}

function selectedSummary(id){
  if(!id)return `<div class="workspace-bundle-empty">${ui('Create a Deep Review, media timeline or Promotion draft first.','Сначала создай Deep Review, media timeline или Promotion draft.')}</div>`;
  const components=componentsFor(id);
  return `<div class="workspace-bundle-components">${Object.keys(PREFIX).map(key=>`<span data-present="${components[key]!=null?'true':'false'}"><b>${components[key]!=null?'✓':'—'}</b>${esc(componentLabel(key))}</span>`).join('')}</div>`;
}

function componentLabel(key){return {deepReviewDraft:ui('Deep Review draft','Deep Review draft'),mediaEvidence:ui('Media evidence','Media evidence'),promotionDraft:ui('Promotion draft','Promotion draft')}[key]||key;}

function makeBundle(id){
  const candidate=state.corpus.get(id)||{id};
  return buildWorkspaceBundle({candidateId:id,candidate,components:componentsFor(id)});
}

async function copySelected(){if(!state.selectedId)return;await navigator.clipboard.writeText(JSON.stringify(makeBundle(state.selectedId),null,2));}
function exportSelected(){if(!state.selectedId)return;downloadJson(makeBundle(state.selectedId),`${safeName(state.selectedId)}.porter-workspace.json`);}
function exportAll(){
  const bundles=localCandidateIds().map(makeBundle).filter(bundle=>Object.keys(bundle.components||{}).length);
  if(!bundles.length)return;
  downloadJson(buildWorkspaceBundleArchive(bundles),`seedance-porter.workspace-archive.json`);
}

async function handleFile(file){if(!file)return;try{analyzeText(await file.text());}catch(error){state.preview={kind:'error',validation:{ok:false,errors:[String(error?.message||error)],warnings:[]},bundles:[]};renderImportPreview();}}
function analyzeText(text){
  try{state.preview=parseWorkspaceBundlePayload(text);}
  catch(error){state.preview={kind:'error',validation:{ok:false,errors:[String(error?.message||error)],warnings:[]},bundles:[]};}
  renderImportPreview();
}

function renderImportPreview(){
  const root=$('#workspaceBundleImportPreview');if(!root)return;
  if(!state.preview){root.innerHTML='';return;}
  const validation=state.preview.validation||{ok:false,errors:['Unknown validation error'],warnings:[]};
  const bundles=state.preview.bundles||[];
  const plans=bundles.map(bundle=>({bundle,plan:planWorkspaceBundleImport(bundle,componentsFor(bundle.candidateId),state.importMode)}));
  const writeCount=plans.reduce((sum,item)=>sum+item.plan.writes.length,0);
  const skipCount=plans.reduce((sum,item)=>sum+item.plan.skips.length,0);
  root.innerHTML=`<div class="workspace-bundle-preview" data-valid="${validation.ok?'true':'false'}">
    <div class="workspace-bundle-preview-head"><strong>${validation.ok?ui('Valid transport bundle','Валидный transport bundle'):ui('Import blocked','Импорт заблокирован')}</strong><span>${bundles.length} ${ui('candidate(s)','кандидат(ов)')}</span></div>
    ${validation.errors?.length?`<div class="workspace-bundle-errors">${validation.errors.map(item=>`<p>• ${esc(item)}</p>`).join('')}</div>`:''}
    ${validation.warnings?.length?`<div class="workspace-bundle-warnings">${validation.warnings.slice(0,8).map(item=>`<p>• ${esc(item)}</p>`).join('')}</div>`:''}
    ${validation.ok?`<div class="workspace-bundle-mode"><label><input type="radio" name="workspaceBundleImportMode" value="fill-missing" ${state.importMode==='fill-missing'?'checked':''}>${ui('Fill missing only','Только заполнить отсутствующее')}</label><label><input type="radio" name="workspaceBundleImportMode" value="replace" ${state.importMode==='replace'?'checked':''}>${ui('Replace local components','Заменить локальные компоненты')}</label></div>
    <div class="workspace-bundle-plan"><strong>${writeCount}</strong><span>${ui('writes','записей')}</span><strong>${skipCount}</strong><span>${ui('skips','пропусков')}</span></div>
    <div class="workspace-bundle-import-list">${plans.slice(0,20).map(importPlanRow).join('')}</div>
    <div class="workspace-bundle-actions"><button class="button primary small" type="button" data-workspace-bundle-action="import" ${writeCount?'':'disabled'}>${ui('Import local work','Импортировать локальную работу')}</button><button class="button small" type="button" data-workspace-bundle-action="clear-preview">${ui('Clear','Очистить')}</button></div>`:''}
  </div>`;
}

function importPlanRow({bundle,plan}){return `<article><div><strong>${esc(candidateLabel(bundle.candidateId))}</strong><span>${esc(bundle.candidateId)}</span></div><div><strong>${plan.writes.length}</strong><span>${ui('write','write')}</span></div><div><strong>${plan.skips.length}</strong><span>${ui('skip','skip')}</span></div></article>`;}

function applyImport(){
  if(!state.preview?.validation?.ok)return;
  let writes=0;
  for(const bundle of state.preview.bundles||[]){
    const plan=planWorkspaceBundleImport(bundle,componentsFor(bundle.candidateId),state.importMode);
    if(!plan.ok)continue;
    for(const item of plan.writes){
      localStorage.setItem(`${PREFIX[item.component]}${bundle.candidateId}`,JSON.stringify(item.value));
      writes++;
    }
  }
  if(writes){window.dispatchEvent(new CustomEvent('porter-local-work-change',{detail:{source:'workspace-bundle-import',writes}}));}
  state.preview=null;
  refresh();
}

function downloadJson(value,filename){const blob=new Blob([`${JSON.stringify(value,null,2)}\n`],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
function safeName(value){return String(value||'workspace').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'');}
