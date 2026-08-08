import {
  PROMPT_SECTION_DEFINITIONS,
  PROMPT_STUDIO_MODES,
  REFERENCE_ROLES,
  createPromptStudioProject,
  forkPromptStudioSource,
  refreshPromptStudioProject,
  lintPromptProject,
  compilePromptProject,
  applyPromptStudioPatch,
  referenceToken
} from './prompt-studio-engine.js';
import {
  listPromptStudioProjects,
  loadPromptStudioProject,
  currentPromptStudioProjectId,
  createAndSavePromptStudioProject,
  savePromptStudioProject,
  duplicatePromptStudioProject,
  deletePromptStudioProject,
  listPromptStudioRevisions,
  createPromptStudioRevision,
  restorePromptStudioRevision,
  exportPromptStudioProject,
  importPromptStudioProject
} from './prompt-studio-store.js';
import {
  putPromptStudioAsset,
  listPromptStudioAssets,
  deletePromptStudioAsset
} from './prompt-studio-assets.js';
import {
  PROMPT_STUDIO_AI_PRESETS,
  createPromptStudioAIController,
  getPromptStudioAICapabilities
} from './prompt-studio-ai.js';
import {
  loadPromptStudioResearchCatalog,
  promptStudioSourceStats,
  searchPromptStudioSources,
  getPromptStudioSource
} from './prompt-studio-source-catalog.js';
import { activateCustomWorkspace } from './workspace-router.js';
import { getLanguage } from './i18n.js';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const attr=(value='')=>esc(value).replace(/`/g,'&#96;');
const ru=()=>getLanguage()==='ru';
const ui=(en,ruText)=>ru()?ruText:en;

const state={
  project:null,
  activeTab:'sections',
  activeSection:'objective',
  sourceKind:'all',
  sourceQuery:'',
  researchLoaded:false,
  researchError:'',
  assets:new Map(),
  lint:null,
  stagedPatch:null,
  aiBusy:false,
  aiInstruction:'',
  aiProgress:null,
  aiCapabilities:null,
  error:'',
  saveTimer:null
};

const ai=createPromptStudioAIController({onProgress:progress=>{state.aiProgress=progress;renderAIStatus();}});

await initializePromptStudio();

async function initializePromptStudio(){
  injectNav();
  injectView();
  bindEvents();
  ensureProject();
  await reloadAssets();
  renderStudio();
  loadPromptStudioResearchCatalog().then(result=>{
    state.researchLoaded=true;
    state.researchError=result.error||'';
    renderSourcePanel();
  });
  getPromptStudioAICapabilities().then(caps=>{state.aiCapabilities=caps;renderRight();});
  exposePublicApi();
}

function injectNav(){
  const nav=$('.sidebar-nav');
  if(!nav||$('[data-case-view="prompt-studio"]',nav))return;
  const button=document.createElement('button');
  button.className='nav-tab';
  button.type='button';
  button.dataset.caseView='prompt-studio';
  button.innerHTML='<span class="nav-icon">✦</span><span data-prompt-studio-nav></span><span class="studio-nav-score" id="studioNavScore">—</span>';
  const operations=$('[data-case-view="operations"]',nav);
  if(operations)operations.insertAdjacentElement('afterend',button);else nav.prepend(button);
  localizeNav();
}

function injectView(){
  const main=$('.page');
  if(!main||$('#promptStudioView'))return;
  const section=document.createElement('section');
  section.id='promptStudioView';
  section.className='library-view prompt-studio-view';
  section.hidden=true;
  section.innerHTML=`
    <header class="view-header prompt-studio-header">
      <div><div class="view-kicker" data-studio-kicker></div><h1 data-studio-title></h1><p data-studio-description></p></div>
      <div class="studio-header-actions"><button class="button small" type="button" data-studio-action="new">＋ ${ui('New','Новый')}</button><button class="button small" type="button" data-studio-action="snapshot">${ui('Snapshot','Версия')}</button><button class="button small" type="button" data-studio-action="export">${ui('Export','Экспорт')}</button></div>
    </header>
    <div id="promptStudioBody"></div>`;
  main.appendChild(section);
  localizeShell();
}

function ensureProject(){
  const current=currentPromptStudioProjectId();
  state.project=current?loadPromptStudioProject(current):null;
  if(!state.project){
    const first=listPromptStudioProjects()[0];
    state.project=first?loadPromptStudioProject(first.id):createAndSavePromptStudioProject({title:'New Prompt Studio project'});
  }
  refreshDerived();
}

function refreshDerived(){
  if(!state.project)return;
  state.project=refreshPromptStudioProject(state.project);
  state.lint=lintPromptProject(state.project);
  const score=$('#studioNavScore');if(score)score.textContent=String(state.lint.score);
}

function renderStudio(){
  const root=$('#promptStudioBody');if(!root||!state.project)return;
  refreshDerived();
  root.innerHTML=`
    ${state.error?`<div class="studio-global-error"><strong>${ui('Prompt Studio error','Ошибка Prompt Studio')}</strong><span>${esc(state.error)}</span><button type="button" data-studio-action="clear-error">×</button></div>`:''}
    <div class="prompt-studio-layout">
      <aside class="studio-left"><div id="studioProjectsPanel"></div><div id="studioSourcePanel"></div></aside>
      <main class="studio-editor"><div id="studioProjectToolbar"></div><div id="studioEditorTabs"></div><div id="studioEditorPanel"></div></main>
      <aside class="studio-right"><div id="studioRightPanel"></div></aside>
    </div>
    <input id="studioProjectImportFile" type="file" accept="application/json,.json" hidden>`;
  renderProjectsPanel();
  renderSourcePanel();
  renderProjectToolbar();
  renderEditorTabs();
  renderEditorPanel();
  renderRight();
}

function renderProjectsPanel(){
  const root=$('#studioProjectsPanel');if(!root)return;
  const projects=listPromptStudioProjects();
  root.innerHTML=`<section class="studio-panel studio-projects-panel"><div class="studio-panel-head"><div><span>${ui('Local workspace','Локальная работа')}</span><strong>${ui('Projects','Проекты')}</strong></div><button type="button" class="studio-icon-btn" data-studio-action="new" title="${attr(ui('New project','Новый проект'))}">＋</button></div>
  <select id="studioProjectSelect">${projects.map(item=>`<option value="${attr(item.id)}" ${item.id===state.project.id?'selected':''}>${esc(item.title)} · ${item.score??'—'}</option>`).join('')}</select>
  <div class="studio-mini-actions"><button type="button" data-studio-action="duplicate">${ui('Duplicate','Дубликат')}</button><button type="button" data-studio-action="import-project">${ui('Import','Импорт')}</button><button type="button" data-studio-action="delete-project">${ui('Delete','Удалить')}</button></div></section>`;
}

function renderSourcePanel(){
  const root=$('#studioSourcePanel');if(!root)return;
  const stats=promptStudioSourceStats();
  const results=searchPromptStudioSources(state.sourceQuery,state.sourceKind,28);
  root.innerHTML=`<section class="studio-panel studio-source-panel"><div class="studio-panel-head"><div><span>${ui('Fork, never overwrite','Создаёт fork, не меняет источник')}</span><strong>${ui('Source library','Библиотека источников')}</strong></div><span class="studio-count">${stats.curated+stats.originals+stats.research}</span></div>
  <div class="studio-source-kinds">${[['all',ui('All','Все')],['curated',`Curated ${stats.curated}`],['original',`Originals ${stats.originals}`],['research',`Research ${stats.research}`]].map(([id,label])=>`<button type="button" data-source-kind="${id}" class="${state.sourceKind===id?'is-active':''}">${esc(label)}</button>`).join('')}</div>
  <label class="studio-search"><span>⌕</span><input id="studioSourceSearch" type="search" value="${attr(state.sourceQuery)}" placeholder="${attr(ui('Search cases, creators, Collections…','Кейсы, авторы, Collections…'))}"></label>
  ${state.researchError?`<div class="studio-source-warning">${ui('Research snapshot unavailable; curated and Originals still work.','Research snapshot недоступен; curated и Originals работают.')}</div>`:''}
  <div class="studio-source-results" id="studioSourceResults">${results.map(sourceRow).join('')||`<div class="studio-empty-small">${ui('Nothing found','Ничего не найдено')}</div>`}</div></section>`;
}

function sourceRow(entry){
  const risk=entry.riskFlags?.length?`<span class="studio-risk">${entry.riskFlags.length} risk</span>`:'';
  return `<article class="studio-source-row" data-source-kind-value="${attr(entry.kind)}"><div class="studio-source-kind">${sourceIcon(entry.kind)}</div><div class="studio-source-main"><strong>${esc(entry.title)}</strong><span>${esc(entry.subtitle)}</span></div><div class="studio-source-side">${risk}<button type="button" data-studio-source-kind="${attr(entry.kind)}" data-studio-source-id="${attr(entry.id)}">${ui('Fork','В Studio')}</button></div></article>`;
}

function renderProjectToolbar(){
  const root=$('#studioProjectToolbar');if(!root)return;
  const p=state.project;
  root.innerHTML=`<div class="studio-project-toolbar"><input id="studioProjectTitle" class="studio-title-input" value="${attr(p.title)}" aria-label="Project title"><div class="studio-meta-controls"><label>${ui('Mode','Режим')}<select id="studioMode">${PROMPT_STUDIO_MODES.map(value=>`<option value="${value}" ${p.mode===value?'selected':''}>${esc(value)}</option>`).join('')}</select></label><label>${ui('Aspect','Формат')}<select id="studioAspect">${['16:9','9:16','1:1','4:3','3:4','21:9'].map(value=>`<option value="${value}" ${p.aspect===value?'selected':''}>${value}</option>`).join('')}</select></label><label>${ui('Duration','Длительность')}<input id="studioDuration" type="number" min="1" max="30" value="${p.duration}"><span>s</span></label><div class="studio-save-state"><span>●</span>${ui('local autosave','local autosave')}</div></div></div>`;
}

function renderEditorTabs(){
  const root=$('#studioEditorTabs');if(!root)return;
  const tabs=[['sections',ui('Editor','Редактор')],['references',ui('References','Референсы')],['compiled',ui('Compiled prompt','Готовый промпт')],['source',ui('Source','Источник')],['history',ui('History','История')]];
  root.innerHTML=`<nav class="studio-editor-tabs">${tabs.map(([id,label])=>`<button type="button" data-studio-tab="${id}" class="${state.activeTab===id?'is-active':''}">${esc(label)}${id==='references'?` <span>${state.project.references.length}</span>`:''}</button>`).join('')}</nav>`;
}

function renderEditorPanel(){
  const root=$('#studioEditorPanel');if(!root)return;
  if(state.activeTab==='references')root.innerHTML=referencesPanel();
  else if(state.activeTab==='compiled')root.innerHTML=compiledPanel();
  else if(state.activeTab==='source')root.innerHTML=sourcePanel();
  else if(state.activeTab==='history')root.innerHTML=historyPanel();
  else root.innerHTML=sectionsPanel();
}

function sectionsPanel(){
  const p=state.project;
  const active=p.sections.find(item=>item.id===state.activeSection)||p.sections[0];
  const issuesBySection=new Map();
  for(const issue of state.lint.issues){if(!issue.sectionId)continue;issuesBySection.set(issue.sectionId,(issuesBySection.get(issue.sectionId)||0)+1);}
  return `<div class="studio-sections-layout"><aside class="studio-section-nav">${p.sections.map(section=>`<button type="button" data-section-id="${section.id}" class="${section.id===active.id?'is-active':''} ${section.enabled===false?'is-disabled':''}"><span>${esc(section.label)}</span>${issuesBySection.get(section.id)?`<b>${issuesBySection.get(section.id)}</b>`:''}</button>`).join('')}</aside><section class="studio-section-editor"><div class="studio-section-head"><div><span>${ui('Structured prompt block','Структурный блок')}</span><h2>${esc(active.label)}</h2></div><label><input id="studioSectionEnabled" type="checkbox" ${active.enabled!==false?'checked':''}> ${ui('Include in compile','Включать')}</label></div><textarea id="studioSectionTextarea" data-section-id="${active.id}" spellcheck="true" placeholder="${attr(sectionPlaceholder(active.id))}">${esc(active.content)}</textarea><div class="studio-editor-foot"><span>${wordCount(active.content)} ${ui('words','слов')}</span><div class="studio-insert-refs">${p.references.filter(ref=>ref.enabled!==false).map(ref=>`<button type="button" data-insert-ref="${attr(ref.token)}" title="${attr(ref.name)}">${esc(ref.token)}</button>`).join('')}</div></div></section></div>`;
}

function referencesPanel(){
  const p=state.project;
  return `<div class="studio-references-panel"><div class="studio-panel-title"><div><span>${ui('Reference manager','Менеджер референсов')}</span><h2>${ui('Ingredients with explicit jobs','Ingredients с явными ролями')}</h2><p>${ui('Every reference controls only the property you assign to it. Local files stay in this browser.','Каждый референс контролирует только назначенную ему роль. Локальные файлы остаются в браузере.')}</p></div><button class="button small" type="button" data-studio-action="add-reference">＋ ${ui('Reference','Референс')}</button></div><div class="studio-reference-list">${p.references.map(referenceCard).join('')||`<div class="studio-empty"><strong>${ui('No references yet','Пока нет референсов')}</strong><span>${ui('Add an image/video URL or a local file.','Добавь URL изображения/видео или локальный файл.')}</span></div>`}</div></div>`;
}

function referenceCard(ref){
  const asset=state.assets.get(ref.localAssetKey);
  return `<article class="studio-reference-card" data-ref-id="${attr(ref.id)}"><div class="studio-ref-token"><strong>${esc(ref.token)}</strong><label><input type="checkbox" data-ref-field="enabled" ${ref.enabled!==false?'checked':''}> ${ui('on','вкл')}</label></div><div class="studio-ref-fields"><label>${ui('Name','Название')}<input data-ref-field="name" value="${attr(ref.name)}"></label><label>${ui('Type','Тип')}<select data-ref-field="mediaType">${['image','video','unknown'].map(value=>`<option value="${value}" ${ref.mediaType===value?'selected':''}>${value}</option>`).join('')}</select></label><label>${ui('Job','Роль')}<select data-ref-field="role">${REFERENCE_ROLES.map(value=>`<option value="${value}" ${ref.role===value?'selected':''}>${value}</option>`).join('')}</select></label><label class="studio-ref-lock"><input type="checkbox" data-ref-field="locked" ${ref.locked?'checked':''}> ${ui('Lock across clip','Lock по всему клипу')}</label><label class="studio-ref-uri">URL<input data-ref-field="uri" value="${attr(ref.uri)}" placeholder="https://…"></label><label class="studio-ref-notes">${ui('Notes / exact job','Примечание / точная роль')}<textarea data-ref-field="notes" rows="2">${esc(ref.notes)}</textarea></label></div><div class="studio-ref-actions"><button type="button" data-ref-action="insert">${ui('Insert token','Вставить token')}</button><label class="studio-file-button">${asset?ui('Replace local file','Заменить файл'):ui('Attach local file','Локальный файл')}<input type="file" data-ref-file accept="image/*,video/*" hidden></label><button type="button" data-ref-action="remove" class="danger">${ui('Remove','Удалить')}</button></div>${asset?`<div class="studio-ref-asset">Local: ${esc(asset.name)} · ${formatBytes(asset.size)}</div>`:''}</article>`;
}

function compiledPanel(){
  const prompt=compilePromptProject(state.project);
  return `<div class="studio-compiled"><div class="studio-panel-title"><div><span>${ui('Canonical compile','Каноническая сборка')}</span><h2>${ui('Generation prompt','Промпт для генерации')}</h2><p>${state.lint.metrics.words} ${ui('words','слов')} · ${state.project.references.filter(ref=>ref.enabled!==false).length} refs · ${state.lint.metrics.beats} beats</p></div><button class="button small" type="button" data-studio-action="copy-compiled">${ui('Copy','Копировать')}</button></div><textarea readonly id="studioCompiledPrompt">${esc(prompt)}</textarea><div class="studio-compile-boundary">${ui('Editor rules are not emitted into the generation prompt. Reference jobs are emitted because they are production controls.','Правила редактора не попадают в generation prompt. Роли референсов попадают — это production controls.')}</div></div>`;
}

function sourcePanel(){
  const source=state.project.source;
  if(!source)return `<div class="studio-empty"><strong>${ui('Manual project','Ручной проект')}</strong><span>${ui('This project is not forked from a library source.','Этот проект не создан из библиотечного источника.')}</span></div>`;
  const raw=source.rawPrompt||source.excerpt||'';
  return `<div class="studio-source-detail"><div class="studio-panel-title"><div><span>${esc(source.kind)}</span><h2>${esc(source.title||source.id||'Source')}</h2><p>${esc([source.author,source.sourcePlatform||source.sourcePoolLabel||source.sourcePool].filter(Boolean).join(' · '))}</p></div>${source.sourceUrl?`<a class="button small" href="${attr(source.sourceUrl)}" target="_blank" rel="noopener">${ui('Open source','Источник')} ↗</a>`:''}</div>${source.riskFlags?.length?`<div class="studio-risk-banner"><strong>${ui('Research risk is preserved','Research risk сохранён')}</strong><span>${esc(source.riskFlags.join(' · '))}</span></div>`:''}<div class="studio-source-note">${ui('Source material is provenance/reference only. Editing this Studio project never changes the source case.','Исходник — только provenance/reference. Редактирование проекта не меняет исходный кейс.')}</div><textarea readonly>${esc(raw||ui('No full prompt is stored for this source.','Полного промпта для этого источника нет.'))}</textarea></div>`;
}

function historyPanel(){
  const revisions=listPromptStudioRevisions(state.project.id);
  return `<div class="studio-history"><div class="studio-panel-title"><div><span>${ui('Local versions','Локальные версии')}</span><h2>${ui('Revision history','История изменений')}</h2><p>${revisions.length} / 25</p></div><button class="button small" type="button" data-studio-action="snapshot">＋ ${ui('Snapshot','Версия')}</button></div><div class="studio-history-list">${revisions.map(revision=>`<article><div><strong>${esc(revision.reason)}</strong><span>${formatDate(revision.createdAt)}</span></div><button type="button" data-restore-revision="${attr(revision.id)}">${ui('Restore','Восстановить')}</button></article>`).join('')||`<div class="studio-empty-small">${ui('No saved revisions yet','Версий пока нет')}</div>`}</div></div>`;
}

function renderRight(){
  const root=$('#studioRightPanel');if(!root||!state.project)return;
  state.lint=lintPromptProject(state.project);
  root.innerHTML=`${lintPanel()}${rulesPanel()}${aiPanel()}${stagedPatchPanel()}`;
  const score=$('#studioNavScore');if(score)score.textContent=String(state.lint.score);
}

function lintPanel(){
  const lint=state.lint;
  return `<section class="studio-panel studio-lint-panel"><div class="studio-score-row"><div class="studio-score" data-grade="${lint.grade}"><strong>${lint.score}</strong><span>${lint.grade}</span></div><div><span>${ui('Live Porter lint','Live Porter lint')}</span><strong>${lint.errors} ${ui('errors','ошибок')} · ${lint.warnings} ${ui('warnings','warning')}</strong><small>${lint.metrics.words}w · ${lint.metrics.references} refs · ${lint.metrics.beats} beats</small></div></div><div class="studio-issues">${lint.issues.slice(0,12).map(issue=>`<button type="button" data-lint-section="${attr(issue.sectionId||'')}" data-severity="${issue.severity}"><b>${issue.severity==='error'?'!':issue.severity==='warning'?'△':'·'}</b><span>${esc(issue.message)}</span></button>`).join('')||`<div class="studio-lint-clean">✓ ${ui('No lint issues','Нет lint-ошибок')}</div>`}</div></section>`;
}

function rulesPanel(){
  const rules=state.project.customRules||[];
  return `<section class="studio-panel studio-rules-panel"><div class="studio-panel-head"><div><span>${ui('Persistent per-project policy','Постоянные правила проекта')}</span><strong>${ui('Editor rules','Правила редактора')}</strong></div><span class="studio-count">${rules.length}</span></div><div class="studio-rule-list">${rules.map((rule,index)=>`<div><span>${esc(rule)}</span><button type="button" data-remove-rule="${index}">×</button></div>`).join('')}</div><div class="studio-rule-add"><input id="studioRuleInput" placeholder="${attr(ui('e.g. Never use compound camera moves','напр. Никогда не совмещать несколько camera moves'))}"><button type="button" data-studio-action="add-rule">＋</button></div></section>`;
}

function aiPanel(){
  const caps=state.aiCapabilities;
  const modelStatus=caps?.builtInAI?.availability||'checking';
  const translatorStatus=caps?.translator?.availability||'checking';
  return `<section class="studio-panel studio-ai-panel"><div class="studio-panel-head"><div><span>${ui('Patch-only co-editor','AI редактор через staged patch')}</span><strong>${ui('Local AI assistant','Локальный AI assistant')}</strong></div><span class="studio-ai-badge" data-status="${attr(modelStatus)}">${esc(aiStatusLabel(modelStatus))}</span></div><div class="studio-ai-capabilities"><span>LanguageModel: <b>${esc(modelStatus)}</b></span><span>RU→EN: <b>${esc(translatorStatus)}</b></span><span>fallback: <b>rules</b></span></div><div class="studio-ai-presets">${PROMPT_STUDIO_AI_PRESETS.map(preset=>`<button type="button" data-ai-preset="${preset.id}" ${state.aiBusy?'disabled':''}>${esc(ru()?preset.labelRu:preset.label)}</button>`).join('')}</div><textarea id="studioAIInstruction" rows="3" placeholder="${attr(ui('Custom instruction: make the packshot calmer, preserve @ref01 geometry…','Например: сделай packshot спокойнее, сохрани геометрию @ref01…'))}" ${state.aiBusy?'disabled':''}>${esc(state.aiInstruction)}</textarea><button class="button primary studio-ai-run" type="button" data-studio-action="run-ai" ${state.aiBusy?'disabled':''}>${state.aiBusy?ui('Working…','Работаю…'):ui('Stage AI edit','Подготовить AI-правки')}</button><div id="studioAIStatus">${aiStatusHtml()}</div><div class="studio-ai-boundary">${ui('AI can only stage section changes. It cannot apply, publish, change curated cases or write to GitHub.','AI может только подготовить изменения секций. Он не может применить их, опубликовать или изменить curated/GitHub.')}</div></section>`;
}

function stagedPatchPanel(){
  const staged=state.stagedPatch;
  if(!staged)return '';
  if(!staged.ok)return `<section class="studio-panel studio-patch-panel is-error"><div class="studio-panel-head"><strong>${ui('AI edit failed','AI-правка не получилась')}</strong><button type="button" data-studio-action="reject-patch">×</button></div><p>${esc(staged.error||'Unknown error')}</p></section>`;
  const patch=staged.patch;
  return `<section class="studio-panel studio-patch-panel"><div class="studio-panel-head"><div><span>${esc(staged.backend)}</span><strong>${esc(patch.summary)}</strong></div><span class="studio-count">${patch.changes.length}</span></div>${staged.warnings?.length?`<div class="studio-patch-warnings">${staged.warnings.map(item=>`<p>${esc(item)}</p>`).join('')}</div>`:''}<div class="studio-diff-list">${patch.changes.map(change=>diffCard(change)).join('')||`<div class="studio-empty-small">${ui('No section changes','Нет изменений секций')}</div>`}</div><div class="studio-patch-actions"><button class="button primary" type="button" data-studio-action="apply-patch" ${patch.changes.length?'':'disabled'}>${ui('Apply staged patch','Применить правки')}</button><button class="button" type="button" data-studio-action="reject-patch">${ui('Reject','Отменить')}</button></div></section>`;
}

function diffCard(change){
  const before=state.project.sections.find(item=>item.id===change.sectionId)?.content||'';
  const label=PROMPT_SECTION_DEFINITIONS.find(item=>item.id===change.sectionId)?.label||change.sectionId;
  return `<article class="studio-diff-card"><div><strong>${esc(label)}</strong><span>${esc(change.reason)}</span></div><details><summary>${ui('Show diff','Показать diff')}</summary><div class="studio-diff-columns"><pre>${esc(before||'∅')}</pre><pre>${esc(change.content||'∅')}</pre></div></details></article>`;
}

function bindEvents(){
  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-case-view="prompt-studio"]');
    if(nav){event.preventDefault();showStudio();return;}
    const tab=event.target.closest('[data-studio-tab]');if(tab){state.activeTab=tab.dataset.studioTab;renderEditorTabs();renderEditorPanel();return;}
    const section=event.target.closest('[data-section-id]');if(section){state.activeSection=section.dataset.sectionId;state.activeTab='sections';renderEditorTabs();renderEditorPanel();return;}
    const kind=event.target.closest('[data-source-kind]');if(kind){state.sourceKind=kind.dataset.sourceKind;renderSourcePanel();return;}
    const fork=event.target.closest('[data-studio-source-id]');if(fork){forkSource(fork.dataset.studioSourceKind,fork.dataset.studioSourceId);return;}
    const insert=event.target.closest('[data-insert-ref]');if(insert){insertToken(insert.dataset.insertRef);return;}
    const lint=event.target.closest('[data-lint-section]');if(lint?.dataset.lintSection){state.activeSection=lint.dataset.lintSection;state.activeTab='sections';renderEditorTabs();renderEditorPanel();return;}
    const revision=event.target.closest('[data-restore-revision]');if(revision){restoreRevision(revision.dataset.restoreRevision);return;}
    const removeRule=event.target.closest('[data-remove-rule]');if(removeRule){removeCustomRule(Number(removeRule.dataset.removeRule));return;}
    const aiPreset=event.target.closest('[data-ai-preset]');if(aiPreset){stageAIEdit(aiPreset.dataset.aiPreset);return;}
    const refAction=event.target.closest('[data-ref-action]');if(refAction){handleReferenceAction(refAction.closest('[data-ref-id]')?.dataset.refId,refAction.dataset.refAction);return;}
    const action=event.target.closest('[data-studio-action]')?.dataset.studioAction;
    if(action)handleStudioAction(action);
  });

  document.addEventListener('input',event=>{
    if(event.target.id==='studioSourceSearch'){state.sourceQuery=event.target.value;renderSourceResultsOnly();return;}
    if(event.target.id==='studioProjectTitle'){state.project.title=event.target.value;projectChanged(false);return;}
    if(event.target.id==='studioSectionTextarea'){
      const section=state.project.sections.find(item=>item.id===event.target.dataset.sectionId);if(section)section.content=event.target.value;
      projectChanged(false,true);return;
    }
    if(event.target.id==='studioAIInstruction'){state.aiInstruction=event.target.value;return;}
    const refField=event.target.closest('[data-ref-field]');if(refField){updateReferenceField(refField);return;}
  });

  document.addEventListener('change',event=>{
    if(event.target.id==='studioProjectSelect'){switchProject(event.target.value);return;}
    if(event.target.id==='studioMode'){state.project.mode=event.target.value;projectChanged();return;}
    if(event.target.id==='studioAspect'){state.project.aspect=event.target.value;projectChanged();return;}
    if(event.target.id==='studioDuration'){state.project.duration=Math.max(1,Math.min(30,Number(event.target.value||6)));projectChanged();return;}
    if(event.target.id==='studioSectionEnabled'){const section=state.project.sections.find(item=>item.id===state.activeSection);if(section)section.enabled=event.target.checked;projectChanged();renderEditorPanel();return;}
    if(event.target.id==='studioProjectImportFile'){importProjectFile(event.target.files?.[0]);return;}
    const refFile=event.target.closest('[data-ref-file]');if(refFile){attachReferenceFile(refFile.closest('[data-ref-id]')?.dataset.refId,refFile.files?.[0]);return;}
    const refField=event.target.closest('[data-ref-field]');if(refField){updateReferenceField(refField);return;}
  });

  window.addEventListener('porter-language-change',()=>{localizeNav();localizeShell();renderStudio();});
  window.addEventListener('beforeunload',()=>{if(state.project)savePromptStudioProject(state.project,{revision:false,reason:'before unload'});ai.destroy();});
  window.addEventListener('porter-open-prompt-studio',event=>openStudioFromDetail(event.detail||{}));
}

function handleStudioAction(action){
  if(action==='new'){newProject();return;}
  if(action==='duplicate'){const copy=duplicatePromptStudioProject(state.project.id);if(copy)setProject(copy);return;}
  if(action==='snapshot'){createPromptStudioRevision(state.project,'manual snapshot');state.activeTab='history';renderEditorTabs();renderEditorPanel();return;}
  if(action==='export'){downloadText(exportPromptStudioProject(state.project),`${safeName(state.project.title)}.porter-prompt-studio.json`,'application/json');return;}
  if(action==='import-project'){$('#studioProjectImportFile')?.click();return;}
  if(action==='delete-project'){deleteCurrentProject();return;}
  if(action==='copy-compiled'){navigator.clipboard?.writeText(compilePromptProject(state.project));return;}
  if(action==='add-reference'){addReference();return;}
  if(action==='add-rule'){addCustomRule();return;}
  if(action==='run-ai'){stageAIEdit('');return;}
  if(action==='apply-patch'){applyStagedPatch();return;}
  if(action==='reject-patch'){state.stagedPatch=null;renderRight();return;}
  if(action==='clear-error'){state.error='';renderStudio();return;}
}

function showStudio(){
  activateCustomWorkspace('promptStudioView','[data-case-view="prompt-studio"]');
  renderStudio();
}

function newProject(){
  const project=createAndSavePromptStudioProject({title:'New Prompt Studio project'});
  setProject(project);
}

function switchProject(id){
  flushSave();
  const project=loadPromptStudioProject(id);if(project)setProject(project);
}

function setProject(project){
  state.project=project;
  state.activeTab='sections';state.activeSection='objective';state.stagedPatch=null;state.error='';
  reloadAssets().then(renderStudio);renderStudio();
}

function deleteCurrentProject(){
  const id=state.project.id;
  if(!window.confirm(ui('Delete this local Prompt Studio project and its revision history?','Удалить локальный проект Prompt Studio и его историю?')))return;
  deletePromptStudioProject(id);
  ensureProject();reloadAssets().then(renderStudio);renderStudio();
}

function forkSource(kind,id){
  const entry=getPromptStudioSource(kind,id);if(!entry)return;
  const fork=forkPromptStudioSource({kind,source:entry.item});
  savePromptStudioProject(fork,{revision:false,reason:`forked from ${kind}:${id}`});
  setProject(fork);showStudio();
}

function openStudioFromDetail(detail){
  if(detail.kind&&detail.id&&getPromptStudioSource(detail.kind,detail.id)){forkSource(detail.kind,detail.id);return;}
  if(detail.prompt||detail.rawPrompt){const fork=forkPromptStudioSource({kind:'manual',source:{title:detail.title||'Imported prompt',prompt:detail.prompt||detail.rawPrompt,mode:detail.mode,aspect:detail.aspect,duration:detail.duration}});savePromptStudioProject(fork,{revision:false,reason:'opened in Prompt Studio'});setProject(fork);showStudio();return;}
  showStudio();
}

function insertToken(token){
  state.activeTab='sections';
  const section=state.project.sections.find(item=>item.id===state.activeSection);if(!section)return;
  const textarea=$('#studioSectionTextarea');
  if(textarea){const start=textarea.selectionStart??textarea.value.length;const end=textarea.selectionEnd??start;textarea.value=`${textarea.value.slice(0,start)}${token}${textarea.value.slice(end)}`;section.content=textarea.value;textarea.focus();textarea.selectionStart=textarea.selectionEnd=start+token.length;projectChanged(false,true);return;}
  section.content=`${section.content}${section.content?' ':''}${token}`;projectChanged();
}

function addReference(){
  const index=state.project.references.length;
  state.project.references.push({id:`ref-${Date.now().toString(36)}-${index}`,token:referenceToken(index),name:`Reference ${index+1}`,mediaType:'image',role:'other',locked:false,uri:'',localAssetKey:'',notes:'',enabled:true});
  projectChanged();state.activeTab='references';renderEditorTabs();renderEditorPanel();
}

function updateReferenceField(field){
  const card=field.closest('[data-ref-id]');const ref=state.project.references.find(item=>item.id===card?.dataset.refId);if(!ref)return;
  const key=field.dataset.refField;
  ref[key]=field.type==='checkbox'?field.checked:field.value;
  projectChanged(false,true);
}

async function handleReferenceAction(refId,action){
  const ref=state.project.references.find(item=>item.id===refId);if(!ref)return;
  if(action==='insert'){state.activeTab='sections';renderEditorTabs();renderEditorPanel();requestAnimationFrame(()=>insertToken(ref.token));return;}
  if(action==='remove'){
    if(ref.localAssetKey)await deletePromptStudioAsset(ref.localAssetKey).catch(()=>{});
    state.project.references=state.project.references.filter(item=>item.id!==refId);projectChanged();await reloadAssets();renderEditorPanel();renderRight();
  }
}

async function attachReferenceFile(refId,file){
  if(!file||!refId)return;
  const ref=state.project.references.find(item=>item.id===refId);if(!ref)return;
  try{
    if(ref.localAssetKey)await deletePromptStudioAsset(ref.localAssetKey).catch(()=>{});
    const meta=await putPromptStudioAsset(file,{projectId:state.project.id,referenceId:ref.id,name:file.name});
    ref.localAssetKey=meta.key;ref.name=ref.name||file.name;ref.mediaType=file.type.startsWith('video/')?'video':'image';
    projectChanged();await reloadAssets();renderEditorPanel();renderRight();
  }catch(error){setError(error);}
}

async function reloadAssets(){
  state.assets=new Map();
  if(!state.project)return;
  try{for(const asset of await listPromptStudioAssets(state.project.id))state.assets.set(asset.key,asset);}catch{}
}

function addCustomRule(){
  const input=$('#studioRuleInput');const value=String(input?.value||'').trim();if(!value)return;
  if(!state.project.customRules.includes(value))state.project.customRules.push(value);
  projectChanged();renderRight();
}
function removeCustomRule(index){state.project.customRules.splice(index,1);projectChanged();renderRight();}

function projectChanged(fullRender=true,liveOnly=false){
  refreshDerived();scheduleSave();
  if(fullRender){renderProjectToolbar();renderProjectsPanel();renderRight();if(!liveOnly)renderEditorPanel();}
  else {renderRight();const score=$('#studioNavScore');if(score)score.textContent=String(state.lint.score);}
}

function scheduleSave(){
  clearTimeout(state.saveTimer);
  state.saveTimer=setTimeout(()=>{state.project=savePromptStudioProject(state.project,{revision:false,reason:'autosave'});state.saveTimer=null;},420);
}
function flushSave(){clearTimeout(state.saveTimer);state.saveTimer=null;if(state.project)state.project=savePromptStudioProject(state.project,{revision:false,reason:'switch project'});}

async function stageAIEdit(preset){
  if(state.aiBusy)return;
  state.aiBusy=true;state.aiProgress={phase:'starting'};state.stagedPatch=null;renderRight();
  try{state.stagedPatch=await ai.stageEdit(state.project,{preset,instruction:state.aiInstruction});}
  catch(error){state.stagedPatch={ok:false,error:String(error?.message||error),backend:'ai',patch:null,warnings:[]};}
  finally{state.aiBusy=false;state.aiCapabilities=await getPromptStudioAICapabilities();renderRight();}
}

function applyStagedPatch(){
  if(!state.stagedPatch?.ok||!state.stagedPatch.patch)return;
  try{
    createPromptStudioRevision(state.project,`before ${state.stagedPatch.backend} patch`);
    state.project=applyPromptStudioPatch(state.project,state.stagedPatch.patch,{source:state.stagedPatch.backend});
    state.project=savePromptStudioProject(state.project,{revision:false,reason:'applied staged patch'});
    state.stagedPatch=null;renderStudio();
  }catch(error){setError(error);}
}

function restoreRevision(id){
  const restored=restorePromptStudioRevision(state.project.id,id);if(restored)setProject(restored);
}

async function importProjectFile(file){
  if(!file)return;
  try{const project=importPromptStudioProject(await file.text());setProject(project);}catch(error){setError(error);}
}

function renderSourceResultsOnly(){
  const root=$('#studioSourceResults');if(!root)return;
  const results=searchPromptStudioSources(state.sourceQuery,state.sourceKind,28);
  root.innerHTML=results.map(sourceRow).join('')||`<div class="studio-empty-small">${ui('Nothing found','Ничего не найдено')}</div>`;
}

function renderAIStatus(){
  const root=$('#studioAIStatus');if(root)root.innerHTML=aiStatusHtml();
}
function aiStatusHtml(){
  const progress=state.aiProgress;
  if(!progress)return `<div class="studio-ai-status">${ui('Edits are staged as a diff before Apply.','Правки сначала показываются diff-ом.')}</div>`;
  if(progress.phase?.includes('download')){const pct=Math.round(Math.max(0,Math.min(1,Number(progress.loaded||0)/Math.max(1,Number(progress.total||1))))*100);return `<div class="studio-ai-status"><span>${esc(progress.phase)}</span><div><i style="width:${pct}%"></i></div><b>${pct}%</b></div>`;}
  return `<div class="studio-ai-status"><span>${esc(progress.detail||progress.phase||'working')}</span></div>`;
}

function replaceProjectFromExtension(nextProject,options={}){
  if(!nextProject||typeof nextProject!=='object')throw new Error('Prompt Studio replaceProject requires a project object.');
  if(!state.project)throw new Error('Prompt Studio has no active project.');
  const reason=String(options.reason||'external project update');
  const preserveIdentity=options.preserveIdentity!==false;
  if(options.snapshot!==false)createPromptStudioRevision(state.project,`before ${reason}`);
  const candidate={
    ...JSON.parse(JSON.stringify(nextProject)),
    id:preserveIdentity?state.project.id:nextProject.id,
    createdAt:preserveIdentity?state.project.createdAt:nextProject.createdAt
  };
  state.project=refreshPromptStudioProject(candidate,options.now||Date.now());
  state.project=savePromptStudioProject(state.project,{revision:false,reason});
  state.stagedPatch=null;
  state.error='';
  refreshDerived();
  reloadAssets().then(renderStudio);
  renderStudio();
  try{window.dispatchEvent(new CustomEvent('porter-prompt-studio-project-replaced',{detail:{projectId:state.project.id,reason}}));}catch{}
  return JSON.parse(JSON.stringify(state.project));
}

function updateProjectFromExtension(partial,options={}){
  const patch=partial&&typeof partial==='object'?partial:{};
  const next={...JSON.parse(JSON.stringify(state.project)),...JSON.parse(JSON.stringify(patch))};
  return replaceProjectFromExtension(next,{...options,preserveIdentity:true});
}

function exposePublicApi(){
  window.porterPromptStudio={
    open:showStudio,
    openSource:(detail)=>openStudioFromDetail(detail||{}),
    getProject:()=>JSON.parse(JSON.stringify(state.project)),
    replaceProject:(nextProject,options)=>replaceProjectFromExtension(nextProject,options||{}),
    updateProject:(partial,options)=>updateProjectFromExtension(partial,options||{}),
    createRevision:(reason='extension snapshot')=>{createPromptStudioRevision(state.project,String(reason));return listPromptStudioRevisions(state.project.id);},
    compile:()=>compilePromptProject(state.project),
    lint:()=>lintPromptProject(state.project)
  };
}

function localizeNav(){const label=$('[data-prompt-studio-nav]');if(label)label.textContent=ui('Prompt Studio','Промпт Студио');}
function localizeShell(){
  const kicker=$('[data-studio-kicker]');const title=$('[data-studio-title]');const description=$('[data-studio-description]');
  if(kicker)kicker.textContent=ui('Structured prompt editor · references · rules · local AI','Структурный редактор · референсы · правила · локальный AI');
  if(title)title.textContent='Prompt Studio';
  if(description)description.textContent=ui('Fork any case or reference, edit production controls by section, lint continuously and apply AI changes only after reviewing a staged diff.','Загружай любой кейс или референс, правь production controls по секциям, получай live lint и применяй AI-правки только после просмотра diff.');
}

function sourceIcon(kind){return {curated:'◆',original:'◫',research:'⌁'}[kind]||'·';}
function aiStatusLabel(status){return ({available:'local AI',downloadable:'download',downloading:'loading',unavailable:'rules only',checking:'…',unknown:'check'})[status]||status;}
function sectionPlaceholder(id){return ({objective:'What must the clip communicate or prove?',subject:'Exact subject identity, geometry and important attributes.',environment:'Location, spatial rule and background behavior.',composition:'Framing, lens/angle intent and hierarchy.',camera:'One dominant camera rule.',action:'Visible action, state change and physical behavior.',timing:'Beat 1 / Beat 2 / Beat 3 / endpoint.',lighting:'Light direction, quality and continuity.',materials:'Surface, liquid, fabric, particles and physical response.',style:'Specific art direction, not generic “cinematic”.',continuity:'What must stay identical across the clip?',constraints:'Non-negotiable production constraints.',avoid:'Known failure modes and things the model must not invent.'})[id]||'';}
function wordCount(value){return String(value||'').trim().split(/\s+/).filter(Boolean).length;}
function formatDate(value){try{return new Intl.DateTimeFormat(ru()?'ru-RU':'en-GB',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value||'');}}
function formatBytes(value){const n=Number(value||0);if(n<1024)return`${n} B`;if(n<1024*1024)return`${(n/1024).toFixed(1)} KB`;return`${(n/1024/1024).toFixed(1)} MB`;}
function safeName(value){return String(value||'prompt-studio').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,90)||'prompt-studio';}
function downloadText(text,filename,type='text/plain'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
function setError(error){state.error=String(error?.message||error);renderStudio();}
