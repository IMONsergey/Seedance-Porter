import { CASE_INTELLIGENCE } from './case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from './multi-source-index.js';
import { getLanguage, collectionLabel } from './i18n.js';
import { buildCuratedRotationPlan } from './rotation-engine.js';

const $=(selector,root=document)=>root.querySelector(selector);
const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const attr=(value='')=>esc(value).replace(/`/g,'&#96;');
const ru=()=>getLanguage()==='ru';
const ui=(en,ruText)=>ru()?ruText:en;

const state={coverage:null,candidates:new Map(),draft:null,plan:null,error:null};

injectPanel();
bindEvents();
loadData();

async function loadData(){
  const [coverage,corpus]=await Promise.allSettled([fetchJson('./coverage-plan.json'),fetchJson('./case-candidates.json')]);
  if(coverage.status==='fulfilled')state.coverage=coverage.value;
  if(corpus.status==='fulfilled')state.candidates=new Map((corpus.value.candidates||[]).map(item=>[item.id,item]));
  if(state.draft)analyzeDraft(state.draft);
  else render();
}
async function fetchJson(url){const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json();}

function injectPanel(){
  const body=$('#promotionBody');
  if(!body){queueMicrotask(injectPanel);return;}
  if($('#rotationPlanner'))return;
  const section=document.createElement('section');
  section.id='rotationPlanner';
  section.className='rotation-planner';
  body.appendChild(section);
  render();
}

function bindEvents(){
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-rotation-action]')?.dataset.rotationAction;
    if(action==='choose-file')$('#rotationFile')?.click();
    if(action==='analyze-paste')parseInput($('#rotationPaste')?.value||'');
    if(action==='copy-report')copyReport();
    if(action==='export-report')exportReport();
    const open=event.target.closest('[data-rotation-open-case]');
    if(open)openCuratedCase(open.dataset.rotationOpenCase);
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='rotationFile')handleFile(event.target.files?.[0]);
  });
  window.addEventListener('porter-language-change',render);
}

async function handleFile(file){if(!file)return;try{parseInput(await file.text());}catch(error){state.error=String(error?.message||error);state.draft=null;state.plan=null;render();}}
function parseInput(text){
  try{const value=JSON.parse(text);state.error=null;state.draft=value;analyzeDraft(value);}
  catch(error){state.error=String(error?.message||error);state.draft=null;state.plan=null;render();}
}

function analyzeDraft(draft){
  const candidateId=String(draft?.candidateId||draft?.case?.id||draft?.curatedCase?.id||'');
  const candidate=state.candidates.get(candidateId)||null;
  state.plan=buildCuratedRotationPlan({incomingDraft:draft,candidate,currentCases:currentCases(),coveragePlan:state.coverage});
  render();
}

function currentCases(){
  const map=new Map();
  for(const item of CASE_INTELLIGENCE){
    map.set(item.id,{...item,collections:item.intelligence?.collections||[],evidenceStatus:item.intelligence?.reviewStatus||'prompt-reviewed',sourcePlatform:item.sourcePlatform||inferPlatform(item.sourceUrl)});
  }
  for(const item of MULTI_SOURCE_CASES){
    map.set(item.id,{...item,collections:item.collections||[],evidenceStatus:item.reviewStatus||item.evidenceStatus||'unknown',sourcePlatform:item.sourcePlatform||inferPlatform(item.sourceUrl)});
  }
  return [...map.values()];
}

function render(){
  const root=$('#rotationPlanner');if(!root)return;
  root.innerHTML=`
    <div class="rotation-head"><div><span>${ui('Top-100 editorial control','Редакторский контроль top‑100')}</span><h3>${ui('Curated Rotation Planner','Curated Rotation Planner')}</h3><p>${ui('Analyze whether an incoming Curation Draft strengthens the fixed 100-case curated library and which existing case would be the least damaging strategic replacement. No automatic swap exists.','Проверь, усиливает ли новый Curation Draft фиксированный top‑100 и какой существующий кейс стратегически наименее болезненно заменить. Автоматического swap здесь нет.')}</p></div><strong>100</strong></div>
    <div class="rotation-input-grid"><div><input id="rotationFile" type="file" accept="application/json,.json" hidden><textarea id="rotationPaste" rows="4" placeholder="${attr(ui('Paste exported Curation Draft JSON…','Вставь экспортированный Curation Draft JSON…'))}"></textarea><div class="rotation-actions"><button class="button small" type="button" data-rotation-action="choose-file">${ui('Choose draft','Выбрать draft')}</button><button class="button primary small" type="button" data-rotation-action="analyze-paste">${ui('Analyze rotation','Посчитать rotation')}</button></div></div><div class="rotation-invariant"><span>${ui('Invariant','Инвариант')}</span><strong>100 → 100</strong><p>${ui('Planner recommends only. Human editor approves both the incoming case and any removal.','Planner только рекомендует. Редактор вручную утверждает и новый кейс, и удаление.')}</p></div></div>
    ${state.error?`<div class="rotation-error">${esc(state.error)}</div>`:''}
    ${state.plan?planHtml(state.plan):`<div class="rotation-empty">${ui('Import a Promotion Curation Draft to calculate strategic gain and replacement cost.','Импортируй Curation Draft из Promotion, чтобы посчитать strategic gain и стоимость замены.')}</div>`}`;
}

function planHtml(plan){
  const incoming=plan.incoming;
  const best=plan.recommendedReplacement;
  return `<div class="rotation-analysis" data-decision="${attr(plan.decision.status)}">
    <div class="rotation-summary-grid">
      <article><span>${ui('Decision','Решение')}</span><strong>${esc(decisionLabel(plan.decision.status))}</strong><small>${esc(reasonLabel(plan.decision.reason))}</small></article>
      <article><span>${ui('Confidence','Уверенность')}</span><strong>${esc(plan.confidence)}</strong><small>${plan.valid?ui('input structurally usable','input структурно пригоден'):ui('blocked by validation','заблокировано валидацией')}</small></article>
      <article><span>${ui('Incoming strategic gain','Strategic gain нового кейса')}</span><strong>${Number(plan.incomingStrategicGain.score||0)}</strong><small>${esc(plan.incomingStrategicGain.reasons.slice(0,4).join(' · '))}</small></article>
      <article><span>${ui('Incoming evidence','Evidence нового кейса')}</span><strong>${incoming.deepReviewed?ui('deep-reviewed','deep-reviewed'):ui('not deep-reviewed','не deep-reviewed')}</strong><small>${incoming.editorialComplete?ui('editorial gate complete','editorial gate complete'):ui('editorial gate incomplete/unknown','editorial gate incomplete/unknown')}</small></article>
    </div>
    ${plan.errors.length?`<div class="rotation-errors">${plan.errors.map(item=>`<p>• ${esc(item)}</p>`).join('')}</div>`:''}
    ${plan.warnings.length?`<div class="rotation-warnings">${plan.warnings.map(item=>`<p>• ${esc(item)}</p>`).join('')}</div>`:''}
    <div class="rotation-incoming"><div><span>${ui('Incoming candidate','Новый кандидат')}</span><strong>${esc(incoming.title||incoming.candidateId)}</strong><small>${esc([incoming.author,incoming.sourcePlatform].filter(Boolean).join(' · '))}</small></div><div class="rotation-pills">${incoming.collections.map(name=>`<span>${esc(collectionLabel(name))}</span>`).join('')}</div></div>
    ${best?`<div class="rotation-best"><div class="rotation-panel-head"><div><span>${ui('Best replacement candidate','Лучший кандидат на замену')}</span><strong>${esc(best.removeTitle)}</strong></div><div class="rotation-net"><span>net</span><strong>${best.netStrategicValue}</strong></div></div>${replacementHtml(best,true)}</div>`:''}
    ${plan.alternatives.length?`<div class="rotation-alternatives"><div class="rotation-panel-head"><div><span>${ui('Alternatives','Альтернативы')}</span><strong>${ui('Other top-100 cases to inspect','Другие top‑100 кейсы для проверки')}</strong></div></div>${plan.alternatives.map(item=>replacementHtml(item,false)).join('')}</div>`:''}
    <div class="rotation-actions"><button class="button small" type="button" data-rotation-action="copy-report">${ui('Copy rotation report','Копировать report')}</button><button class="button small" type="button" data-rotation-action="export-report">${ui('Export report','Экспорт report')}</button></div>
    <div class="rotation-boundary"><strong>${ui('Editorial boundary.','Редакторская граница.')}</strong> ${ui('No button in this planner can remove, add or reorder curated cases. Exact-100 implementation remains a separate human-approved change.','Ни одна кнопка здесь не удаляет, не добавляет и не переставляет curated-кейсы. Реализация exact‑100 остаётся отдельным human-approved изменением.')}</div>
  </div>`;
}

function replacementHtml(item,best){
  return `<article class="rotation-replacement${best?' is-best':''}"><div class="rotation-replacement-main"><div><strong>${esc(item.removeTitle)}</strong><span>${esc([item.removeAuthor,item.removeSourcePlatform].filter(Boolean).join(' · '))}</span></div><button class="button small" type="button" data-rotation-open-case="${attr(item.removeCaseId)}">${ui('Inspect case','Открыть кейс')}</button></div><div class="rotation-metrics"><span><b>${item.netStrategicValue}</b> net</span><span><b>${item.removalPenalty.score}</b> ${ui('removal cost','стоимость удаления')}</span><span><b>${item.redundancyBonus.score}</b> ${ui('redundancy','избыточность')}</span><span><b>${item.removeDesignScore||0}</b> design</span></div><div class="rotation-deltas">${item.projectedCollections.slice(0,8).map(delta=>`<span data-delta="${delta.delta}">${esc(collectionLabel(delta.title))} ${delta.before}→${delta.after}</span>`).join('')}</div>${item.warnings.length?`<div class="rotation-row-warnings">${item.warnings.map(w=>`<span>${esc(w)}</span>`).join('')}</div>`:''}</article>`;
}

async function copyReport(){if(state.plan)await navigator.clipboard.writeText(JSON.stringify(state.plan,null,2));}
function exportReport(){if(!state.plan)return;const blob=new Blob([`${JSON.stringify(state.plan,null,2)}\n`],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${safeName(state.plan.incoming.candidateId||'candidate')}.rotation-plan.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}

function openCuratedCase(id){
  document.querySelector('[data-view="digest"]')?.click();
  requestAnimationFrame(()=>{document.querySelector('#resetDigest')?.click();document.querySelector('#caseCollections [data-collection="all"]')?.click();requestAnimationFrame(()=>{const card=document.querySelector(`#digestGrid [data-digest-id="${CSS.escape(id)}"]`);card?.scrollIntoView({behavior:'smooth',block:'center'});card?.click();});});
}

function decisionLabel(status){return {blocked:ui('Blocked','Заблокировано'),'consider-swap':ui('Consider swap','Рассмотреть swap'),'editorial-review':ui('Editorial review','Редакторская проверка'),hold:ui('Hold','Не менять')}[status]||status;}
function reasonLabel(reason){const map={'invalid-input':ui('invalid input','невалидный input'),'insufficient-comparison-data':ui('not enough comparison data','недостаточно данных'),'positive-strategic-upgrade':ui('positive strategic upgrade','положительное стратегическое усиление'),'marginal-strategic-upgrade':ui('marginal upgrade','пограничное усиление'),'incoming-strategic-gain-too-low':ui('incoming gain too low','слишком малая польза нового кейса'),'replacement-cost-exceeds-gain':ui('replacement cost exceeds gain','стоимость замены выше пользы')};return map[reason]||reason;}
function inferPlatform(url){try{const host=new URL(url).hostname.toLowerCase();if(host.includes('x.com')||host.includes('twitter.com'))return'x';if(host.includes('youtube'))return'youtube';if(host.includes('vimeo'))return'vimeo';if(host.includes('github'))return'github';return host.replace(/^www\./,'');}catch{return'';}}
function safeName(value){return String(value||'rotation').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'');}
