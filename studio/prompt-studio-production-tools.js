import { getLanguage } from './i18n.js';
import {
  PROMPT_STUDIO_INGREDIENT_TYPES,
  normalizePromptStudioTools,
  normalizeVariables,
  normalizeIngredients,
  setProjectVariable,
  deleteProjectVariable,
  addProjectIngredient,
  updateProjectIngredient,
  deleteProjectIngredient,
  insertIngredientIntoSection,
  resolveVariablesInSection,
  buildPromptStudioVariableReport,
  listTemplateVariables,
  resolvePromptStudioTemplate
} from './prompt-studio-ingredients.js';
import {
  PROMPT_STUDIO_SHOT_TYPES,
  normalizePromptStudioTimeline,
  addTimelineBeat,
  updateTimelineBeat,
  deleteTimelineBeat,
  moveTimelineBeat,
  fitTimelineToProjectDuration,
  timelineWithTimeRanges,
  compileTimelineToTiming,
  syncTimelineToTimingSection,
  importTimelineFromTiming,
  lintPromptStudioTimeline,
  timelineSyncState
} from './prompt-studio-timeline.js';
import {
  ensurePromptStudioIngredientStarters,
  loadPromptStudioIngredientLibrary,
  upsertPromptStudioLibraryIngredient,
  deletePromptStudioLibraryIngredient
} from './prompt-studio-ingredient-library.js';

const state={
  projectId:'',
  baseUpdatedAt:'',
  tab:'timeline',
  expanded:true,
  dirty:false,
  draft:{variables:[],ingredients:[],timeline:null},
  library:[],
  ingredientView:'project',
  message:'',
  error:'',
  queued:false,
  mounted:false
};

ensurePromptStudioIngredientStarters();
state.library=loadPromptStudioIngredientLibrary();
bindProductionTools();
scheduleMount();

function bindProductionTools(){
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-studio-tools-action]')?.dataset.studioToolsAction;
    if(!action)return;
    if(action==='toggle'){state.expanded=!state.expanded;render();return;}
    if(action==='tab'){state.tab=event.target.closest('[data-studio-tools-tab]')?.dataset.studioToolsTab||state.tab;render();return;}
    if(action==='apply'){applyToolsDraft();return;}
    if(action==='discard'){reloadDraft(true);render();return;}
    if(action==='add-variable'){addVariableRow();return;}
    if(action==='delete-variable'){deleteVariableRow(event.target.closest('[data-variable-key]')?.dataset.variableKey);return;}
    if(action==='copy-variable'){copyText(`{{${event.target.closest('[data-variable-key]')?.dataset.variableKey||''}}}`);return;}
    if(action==='resolve-active-section'){resolveActiveSection();return;}
    if(action==='ingredient-view'){state.ingredientView=event.target.closest('[data-ingredient-view]')?.dataset.ingredientView||'project';render();return;}
    if(action==='add-ingredient'){addIngredient();return;}
    if(action==='delete-ingredient'){deleteIngredient(event.target.closest('[data-ingredient-id]')?.dataset.ingredientId);return;}
    if(action==='insert-ingredient'){insertIngredient(event.target.closest('[data-ingredient-id]')?.dataset.ingredientId,event.target.closest('[data-ingredient-scope]')?.dataset.ingredientScope||'project');return;}
    if(action==='save-shared'){saveIngredientShared(event.target.closest('[data-ingredient-id]')?.dataset.ingredientId);return;}
    if(action==='add-shared-to-project'){addSharedToProject(event.target.closest('[data-ingredient-id]')?.dataset.ingredientId);return;}
    if(action==='delete-shared'){deleteShared(event.target.closest('[data-ingredient-id]')?.dataset.ingredientId);return;}
    if(action==='add-beat'){addBeat();return;}
    if(action==='delete-beat'){deleteBeat(event.target.closest('[data-beat-id]')?.dataset.beatId);return;}
    if(action==='move-beat'){moveBeat(event.target.closest('[data-beat-id]')?.dataset.beatId,event.target.closest('[data-direction]')?.dataset.direction);return;}
    if(action==='fit-timeline'){fitTimeline();return;}
    if(action==='import-timing'){importTiming();return;}
    if(action==='sync-timing'){syncTiming();return;}
    if(action==='copy-timing'){copyText(compileTimelineToTiming(projectWithDraft()));return;}
  });

  document.addEventListener('input',event=>{
    const field=event.target.closest('[data-studio-tools-field]');
    if(!field)return;
    if(field.dataset.variableKey!==undefined)updateVariableDraft(field);
    if(field.dataset.ingredientId!==undefined)updateIngredientDraft(field);
    if(field.dataset.beatId!==undefined)updateBeatDraft(field);
    markDirty();
    updateHeaderOnly();
  });
  document.addEventListener('change',event=>{
    const field=event.target.closest('[data-studio-tools-field]');
    if(!field)return;
    if(field.dataset.variableKey!==undefined)updateVariableDraft(field);
    if(field.dataset.ingredientId!==undefined)updateIngredientDraft(field);
    if(field.dataset.beatId!==undefined)updateBeatDraft(field);
    markDirty();
    updateHeaderOnly();
  });

  window.addEventListener('porter-prompt-studio-project-replaced',event=>{
    const project=window.porterPromptStudio?.getProject?.();
    if(!project)return;
    if(project.id!==state.projectId){loadDraftFromProject(project);render();return;}
    if(!state.dirty&&project.updatedAt!==state.baseUpdatedAt){loadDraftFromProject(project);render();}
  });
  window.addEventListener('porter-prompt-studio-change',()=>{
    const project=window.porterPromptStudio?.getProject?.();
    if(!project)return;
    if(project.id!==state.projectId){loadDraftFromProject(project);render();return;}
    if(!state.dirty&&project.updatedAt!==state.baseUpdatedAt){loadDraftFromProject(project);render();}
  });
  window.addEventListener('porter-prompt-studio-ingredient-library-change',()=>{state.library=loadPromptStudioIngredientLibrary();if(state.ingredientView==='shared')render();});
  window.addEventListener('porter-language-change',render);
  window.addEventListener('porter-workspace-change',event=>{if(event.detail?.viewId==='promptStudioView')scheduleMount();});
  new MutationObserver(scheduleMount).observe(document.body,{childList:true,subtree:true});
}

function scheduleMount(){
  if(state.queued)return;
  state.queued=true;
  queueMicrotask(()=>{state.queued=false;mountOrRefresh();});
}

function mountOrRefresh(){
  const api=window.porterPromptStudio;
  const project=api?.getProject?.();
  const editor=document.querySelector('#promptStudioView .studio-editor');
  const toolbar=editor?.querySelector('.studio-project-toolbar');
  if(!api||!project||!editor||!toolbar)return;
  if(!state.projectId)loadDraftFromProject(project);
  if(project.id!==state.projectId)loadDraftFromProject(project);
  let root=editor.querySelector('#studioProductionTools');
  if(!root){
    root=document.createElement('section');
    root.id='studioProductionTools';
    root.className='studio-production-tools';
    toolbar.insertAdjacentElement('afterend',root);
    state.mounted=true;
    render();
  }else if(!state.mounted){state.mounted=true;render();}
}

function render(){
  const root=document.querySelector('#studioProductionTools');
  const project=window.porterPromptStudio?.getProject?.();
  if(!root||!project)return;
  if(project.id!==state.projectId)loadDraftFromProject(project);
  const variables=normalizeVariables(state.draft.variables);
  const ingredients=normalizeIngredients(state.draft.ingredients);
  const timeline=normalizePromptStudioTimeline({duration:project.duration,sections:project.sections,timeline:state.draft.timeline});
  const lint=lintPromptStudioTimeline({...project,variables,ingredients,timeline});
  const sync=timelineSyncState({...project,timeline});
  const variableReport=buildPromptStudioVariableReport({...project,variables,ingredients,timeline});
  root.dataset.expanded=state.expanded?'true':'false';
  root.innerHTML=`
    <header class="studio-tools-header">
      <button type="button" class="studio-tools-collapse" data-studio-tools-action="toggle" aria-expanded="${state.expanded?'true':'false'}">${state.expanded?'▾':'▸'}</button>
      <div class="studio-tools-title"><span>${t('Production graph','Production graph')}</span><strong>${t('Variables · Ingredients · Shot Timeline','Variables · Ingredients · Shot Timeline')}</strong></div>
      <nav class="studio-tools-tabs">
        ${toolTab('variables',t('Variables','Переменные'),variables.length,variableReport.unresolved.length)}
        ${toolTab('ingredients',t('Ingredients','Ингредиенты'),ingredients.length,0)}
        ${toolTab('timeline',t('Timeline','Таймлайн'),timeline.beats.filter(item=>item.enabled!==false).length,lint.issues.filter(item=>item.severity==='error'||item.severity==='warning').length)}
      </nav>
      <div class="studio-tools-state" data-dirty="${state.dirty?'true':'false'}"><span>${state.dirty?t('staged','staged'):t('saved','saved')}</span></div>
    </header>
    ${state.expanded?`<div class="studio-tools-body">${state.tab==='variables'?renderVariables(variables,variableReport):state.tab==='ingredients'?renderIngredients(ingredients):renderTimeline(project,timeline,lint,sync)}</div>
    <footer class="studio-tools-footer"><div>${state.error?`<span class="studio-tools-error">${esc(state.error)}</span>`:state.message?`<span class="studio-tools-message">${esc(state.message)}</span>`:`<span>${t('Tools changes are staged until Apply.','Изменения tools staged до Apply.')}</span>`}</div><div><button type="button" class="button small" data-studio-tools-action="discard" ${state.dirty?'':'disabled'}>${t('Discard','Сбросить')}</button><button type="button" class="button primary small" data-studio-tools-action="apply" ${state.dirty?'':'disabled'}>${t('Apply tools','Применить tools')}</button></div></footer>`:''}`;
}

function renderVariables(variables,report){
  const active=activeSectionId();
  return `<div class="studio-tools-variables">
    <div class="studio-tools-section-head"><div><span>${t('Project variables','Переменные проекта')}</span><strong>${variables.length}</strong></div><div><button type="button" data-studio-tools-action="resolve-active-section" ${active?'':'disabled'}>${active?t('Resolve in active section','Resolve в активной секции'):t('Open a section first','Сначала открой секцию')}</button><button type="button" data-studio-tools-action="add-variable">＋ ${t('Variable','Переменная')}</button></div></div>
    ${report.unresolved.length?`<div class="studio-tools-warning"><strong>${t('Unresolved variables','Неразрешённые переменные')}</strong><span>${report.unresolved.map(item=>`{{${esc(item.key)}}} · ${item.scopes.length}`).join(' · ')}</span></div>`:''}
    <div class="studio-variable-table">${variables.length?variables.map(variable=>`<article data-variable-key="${attr(variable.key)}"><label><span>key</span><input data-studio-tools-field data-variable-key="${attr(variable.key)}" data-variable-field="key" value="${attr(variable.key)}"></label><label><span>${t('value','значение')}</span><input data-studio-tools-field data-variable-key="${attr(variable.key)}" data-variable-field="value" value="${attr(variable.value)}"></label><label><span>${t('description','описание')}</span><input data-studio-tools-field data-variable-key="${attr(variable.key)}" data-variable-field="description" value="${attr(variable.description)}"></label><div class="studio-variable-actions"><button type="button" data-studio-tools-action="copy-variable">{{…}}</button><button type="button" data-studio-tools-action="delete-variable">×</button></div></article>`).join(''):`<div class="studio-tools-empty">${t('Variables let reusable ingredient templates adapt to this project.','Variables позволяют ingredient-шаблонам адаптироваться под конкретный проект.')}</div>`}</div>
    <div class="studio-tools-boundary">${t('Variable tokens are resolved only when you explicitly insert/resolve them. Studio never silently changes prompt sections.','Variable tokens resolve только по явной команде insert/resolve. Studio не переписывает секции автоматически.')}</div>
  </div>`;
}

function renderIngredients(ingredients){
  const items=state.ingredientView==='project'?ingredients:state.library;
  const active=activeSectionId();
  return `<div class="studio-tools-ingredients">
    <div class="studio-tools-section-head"><div class="studio-ingredient-view-tabs"><button type="button" data-studio-tools-action="ingredient-view" data-ingredient-view="project" class="${state.ingredientView==='project'?'is-active':''}">${t('Project','Проект')} ${ingredients.length}</button><button type="button" data-studio-tools-action="ingredient-view" data-ingredient-view="shared" class="${state.ingredientView==='shared'?'is-active':''}">${t('Shared library','Общая библиотека')} ${state.library.length}</button></div><div>${state.ingredientView==='project'?`<button type="button" data-studio-tools-action="add-ingredient">＋ ${t('Ingredient','Ингредиент')}</button>`:''}</div></div>
    <div class="studio-ingredient-list">${items.length?items.map(item=>ingredientCard(item,state.ingredientView,active)).join(''):`<div class="studio-tools-empty">${t('No ingredients yet. Build reusable production blocks instead of copy-pasting prompt prose.','Ингредиентов пока нет. Собирай переиспользуемые production-блоки вместо копипаста текста.')}</div>`}</div>
  </div>`;
}

function ingredientCard(item,scope,activeSection){
  const project=projectWithDraft();
  const resolved=resolvePromptStudioTemplate(item.template,project.variables||[]);
  return `<article class="studio-ingredient-card" data-ingredient-id="${attr(item.id)}" data-ingredient-scope="${scope}">
    <div class="studio-ingredient-card-head"><div><span>${esc(item.type)} → ${esc(item.defaultSection)}</span><strong>${esc(item.label)}</strong></div><div>${scope==='project'?`<button type="button" data-studio-tools-action="save-shared">${t('Save shared','В общую')}</button><button type="button" data-studio-tools-action="delete-ingredient">×</button>`:`<button type="button" data-studio-tools-action="add-shared-to-project">${t('Add to project','В проект')}</button><button type="button" data-studio-tools-action="delete-shared">×</button>`}</div></div>
    ${scope==='project'?`<div class="studio-ingredient-fields"><label>${t('Label','Название')}<input data-studio-tools-field data-ingredient-id="${attr(item.id)}" data-ingredient-field="label" value="${attr(item.label)}"></label><label>${t('Type','Тип')}<select data-studio-tools-field data-ingredient-id="${attr(item.id)}" data-ingredient-field="type">${PROMPT_STUDIO_INGREDIENT_TYPES.map(type=>`<option value="${type}" ${type===item.type?'selected':''}>${type}</option>`).join('')}</select></label><label>${t('Target section','Секция')}<input data-studio-tools-field data-ingredient-id="${attr(item.id)}" data-ingredient-field="defaultSection" value="${attr(item.defaultSection)}"></label></div><textarea data-studio-tools-field data-ingredient-id="${attr(item.id)}" data-ingredient-field="template" rows="3">${esc(item.template)}</textarea>`:`<pre>${esc(item.template)}</pre>`}
    <div class="studio-ingredient-resolution" data-unresolved="${resolved.unresolved.length?'true':'false'}"><span>${resolved.unresolved.length?`${t('Missing','Нет')}: ${resolved.unresolved.map(key=>`{{${key}}}`).join(', ')}`:t('Resolved preview','Resolved preview')}</span><p>${esc(resolved.text)}</p></div>
    <div class="studio-ingredient-actions"><button type="button" data-studio-tools-action="insert-ingredient" ${resolved.unresolved.length?'disabled':''}>${activeSection?t('Insert in active section','Вставить в активную секцию'):t('Insert in target section','Вставить в target section')}</button></div>
  </article>`;
}

function renderTimeline(project,timeline,lint,sync){
  const ranges=timelineWithTimeRanges({...project,timeline});
  const enabled=ranges.filter(item=>item.enabled!==false);
  const total=enabled.reduce((sum,item)=>sum+item.duration,0);
  const ratio=Math.min(100,project.duration?total/project.duration*100:0);
  return `<div class="studio-tools-timeline">
    <div class="studio-timeline-toolbar"><div class="studio-timeline-duration"><div><i style="width:${ratio}%"></i></div><span>${total.toFixed(1)} / ${Number(project.duration||0).toFixed(1)}s</span><b data-sync="${sync.inSync?'true':'false'}">${sync.inSync?t('Timing synced','Timing synced'):t('Timing not synced','Timing не synced')}</b></div><div><button type="button" data-studio-tools-action="import-timing">${t('Import Timing','Import Timing')}</button><button type="button" data-studio-tools-action="fit-timeline">${t('Fit duration','Fit duration')}</button><button type="button" data-studio-tools-action="copy-timing">${t('Copy Timing','Copy Timing')}</button><button type="button" data-studio-tools-action="sync-timing" class="primary">${t('Sync → Timing','Sync → Timing')}</button><button type="button" data-studio-tools-action="add-beat">＋ ${t('Beat','Beat')}</button></div></div>
    ${lint.issues.length?`<div class="studio-timeline-lint"><strong>${lint.grade} · ${lint.score}</strong>${lint.issues.slice(0,8).map(issue=>`<span data-severity="${issue.severity}">${esc(issue.message)}</span>`).join('')}</div>`:''}
    <div class="studio-timeline-list">${ranges.length?ranges.map(beat=>timelineBeatCard(beat,project.references||[])).join(''):`<div class="studio-tools-empty">${t('Build beats as structured production events, then sync them into the Timing section explicitly.','Собери beats как структурированные production-события, затем явно синхронизируй их в Timing.')}</div>`}</div>
  </div>`;
}

function timelineBeatCard(beat,references){
  return `<article class="studio-timeline-beat" data-beat-id="${attr(beat.id)}" data-enabled="${beat.enabled?'true':'false'}">
    <div class="studio-beat-order"><button type="button" data-studio-tools-action="move-beat" data-direction="up">↑</button><strong>${beat.index+1}</strong><button type="button" data-studio-tools-action="move-beat" data-direction="down">↓</button></div>
    <div class="studio-beat-main">
      <div class="studio-beat-meta"><input data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="label" value="${attr(beat.label)}"><select data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="shotType">${PROMPT_STUDIO_SHOT_TYPES.map(type=>`<option value="${type}" ${type===beat.shotType?'selected':''}>${type}</option>`).join('')}</select><label><input type="number" min="0.1" max="30" step="0.1" data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="duration" value="${beat.duration}"><span>${esc(beat.timecode)}</span></label><label class="studio-beat-enabled"><input type="checkbox" data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="enabled" ${beat.enabled?'checked':''}><span>${t('on','on')}</span></label></div>
      <div class="studio-beat-fields"><label>${t('Purpose','Purpose')}<input data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="purpose" value="${attr(beat.purpose)}"></label><label>${t('Camera','Камера')}<input data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="camera" value="${attr(beat.camera)}"></label><label>${t('Action / state change','Action / state change')}<textarea data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="action" rows="2">${esc(beat.action)}</textarea></label><label>${t('References','Референсы')}<input data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="referenceTokens" value="${attr(beat.referenceTokens.join(', '))}" placeholder="${references.map(ref=>ref.token).join(', ')}"></label><label>${t('Notes','Заметки')}<input data-studio-tools-field data-beat-id="${attr(beat.id)}" data-beat-field="notes" value="${attr(beat.notes)}"></label></div>
    </div>
    <button type="button" class="studio-beat-delete" data-studio-tools-action="delete-beat">×</button>
  </article>`;
}

function toolTab(id,label,count,warnings){return`<button type="button" data-studio-tools-action="tab" data-studio-tools-tab="${id}" class="${state.tab===id?'is-active':''}"><span>${label}</span><b>${count}</b>${warnings?`<i>${warnings}</i>`:''}</button>`;}

function loadDraftFromProject(project){
  const tools=normalizePromptStudioTools(project);
  state.projectId=project.id;
  state.baseUpdatedAt=project.updatedAt;
  state.draft={variables:tools.variables,ingredients:tools.ingredients,timeline:tools.timeline};
  state.dirty=false;state.error='';state.message='';
}
function reloadDraft(force=false){const project=window.porterPromptStudio?.getProject?.();if(project&&(force||!state.dirty))loadDraftFromProject(project);}
function projectWithDraft(){const project=window.porterPromptStudio?.getProject?.();return{...clone(project),variables:normalizeVariables(state.draft.variables),ingredients:normalizeIngredients(state.draft.ingredients),timeline:clone(state.draft.timeline)};}
function applyToolsDraft(){
  try{
    const api=window.porterPromptStudio;const current=api?.getProject?.();if(!api?.replaceProject||!current)return;
    const next={...clone(current),variables:normalizeVariables(state.draft.variables),ingredients:normalizeIngredients(state.draft.ingredients),timeline:clone(state.draft.timeline)};
    const saved=api.replaceProject(next,{reason:'apply Production Tools draft',snapshot:true,preserveIdentity:true});
    loadDraftFromProject(saved);state.message=t('Production Tools draft applied.','Production Tools draft применён.');render();
  }catch(error){setError(error);}
}
function markDirty(){state.dirty=true;state.error='';state.message='';}
function updateHeaderOnly(){const root=document.querySelector('#studioProductionTools');if(!root)return;root.querySelector('.studio-tools-state')?.setAttribute('data-dirty',state.dirty?'true':'false');const label=root.querySelector('.studio-tools-state span');if(label)label.textContent=state.dirty?t('staged','staged'):t('saved','saved');}

function addVariableRow(){
  let index=1;const keys=new Set(normalizeVariables(state.draft.variables).map(item=>item.key));while(keys.has(`variable_${index}`))index++;
  state.draft.variables=normalizeVariables([...(state.draft.variables||[]),{id:`var-variable_${index}`,key:`variable_${index}`,value:'',description:'',updatedAt:new Date().toISOString()}]);markDirty();render();
}
function deleteVariableRow(key){state.draft.variables=normalizeVariables(state.draft.variables).filter(item=>item.key!==key);markDirty();render();}
function updateVariableDraft(field){
  const key=field.dataset.variableKey;const item=state.draft.variables.find(entry=>entry.key===key);if(!item)return;
  const name=field.dataset.variableField;
  if(name==='key'){
    const temp=setProjectVariable({variables:state.draft.variables},field.value,item.value,item.description);state.draft.variables=temp.variables;
  }else if(name==='value')item.value=field.value;else if(name==='description')item.description=field.value;
}
function resolveActiveSection(){
  try{
    const sectionId=activeSectionId();if(!sectionId)throw new Error(t('Open a prompt section first.','Сначала открой секцию промпта.'));
    const api=window.porterPromptStudio;const current=api?.getProject?.();
    const base={...clone(current),variables:normalizeVariables(state.draft.variables),ingredients:normalizeIngredients(state.draft.ingredients),timeline:clone(state.draft.timeline)};
    const result=resolveVariablesInSection(base,sectionId);
    const saved=api.replaceProject(result.project,{reason:`resolve variables in ${sectionId}`,snapshot:true,preserveIdentity:true});loadDraftFromProject(saved);state.message=`${t('Resolved variables in','Variables resolved в')} ${sectionId}.`;render();
  }catch(error){setError(error);}
}

function addIngredient(){state.draft.ingredients=addProjectIngredient({ingredients:state.draft.ingredients},{label:'New ingredient',type:'constraint',defaultSection:'constraints',template:''}).ingredients;markDirty();render();}
function deleteIngredient(id){state.draft.ingredients=deleteProjectIngredient({ingredients:state.draft.ingredients},id).ingredients;markDirty();render();}
function updateIngredientDraft(field){
  const id=field.dataset.ingredientId;const name=field.dataset.ingredientField;
  try{state.draft.ingredients=updateProjectIngredient({ingredients:state.draft.ingredients},id,{[name]:field.value}).ingredients;}catch{}
}
function insertIngredient(id,scope){
  try{
    const api=window.porterPromptStudio;const current=api?.getProject?.();
    let ingredients=normalizeIngredients(state.draft.ingredients);
    if(scope==='shared'){
      const shared=state.library.find(item=>item.id===id);if(!shared)throw new Error('Shared ingredient not found.');
      const local={...clone(shared),id:`ingredient-${randomId()}`};ingredients=normalizeIngredients([...ingredients,local]);id=local.id;state.draft.ingredients=ingredients;markDirty();
    }
    const base={...clone(current),variables:normalizeVariables(state.draft.variables),ingredients,timeline:clone(state.draft.timeline)};
    const ingredient=ingredients.find(item=>item.id===id);const target=activeSectionId()||ingredient?.defaultSection;
    const result=insertIngredientIntoSection(base,id,target);
    const saved=api.replaceProject(result.project,{reason:`insert ingredient ${ingredient?.label||id} into ${result.targetSection}`,snapshot:true,preserveIdentity:true});loadDraftFromProject(saved);state.message=`${t('Inserted into','Вставлено в')} ${result.targetSection}.`;render();
  }catch(error){setError(error);}
}
function saveIngredientShared(id){const item=state.draft.ingredients.find(entry=>entry.id===id);if(!item)return;const shared={...clone(item),id:`library-${slug(item.label)||randomId()}`};upsertPromptStudioLibraryIngredient(shared);state.library=loadPromptStudioIngredientLibrary();state.message=t('Saved to shared Ingredient Library.','Сохранено в общую Ingredient Library.');render();}
function addSharedToProject(id){const item=state.library.find(entry=>entry.id===id);if(!item)return;state.draft.ingredients=normalizeIngredients([...state.draft.ingredients,{...clone(item),id:`ingredient-${randomId()}`}]);markDirty();state.ingredientView='project';render();}
function deleteShared(id){deletePromptStudioLibraryIngredient(id);state.library=loadPromptStudioIngredientLibrary();render();}

function addBeat(){const next=addTimelineBeat(projectWithDraft(),{});state.draft.timeline=next.timeline;markDirty();render();}
function deleteBeat(id){state.draft.timeline=deleteTimelineBeat(projectWithDraft(),id).timeline;markDirty();render();}
function moveBeat(id,direction){state.draft.timeline=moveTimelineBeat(projectWithDraft(),id,direction).timeline;markDirty();render();}
function updateBeatDraft(field){
  const id=field.dataset.beatId;const name=field.dataset.beatField;let value=field.type==='checkbox'?field.checked:field.value;
  if(name==='duration')value=Number(value||0);if(name==='referenceTokens')value=String(value||'').split(',');
  try{state.draft.timeline=updateTimelineBeat(projectWithDraft(),id,{[name]:value}).timeline;}catch{}
}
function fitTimeline(){state.draft.timeline=fitTimelineToProjectDuration(projectWithDraft()).timeline;markDirty();render();}
function importTiming(){const imported=importTimelineFromTiming(projectWithDraft());state.draft.timeline=imported.timeline;markDirty();state.message=t('Timing imported into staged timeline.','Timing импортирован в staged timeline.');render();}
function syncTiming(){
  try{
    const api=window.porterPromptStudio;const current=api?.getProject?.();const base={...clone(current),variables:normalizeVariables(state.draft.variables),ingredients:normalizeIngredients(state.draft.ingredients),timeline:clone(state.draft.timeline)};
    const next=syncTimelineToTimingSection(base);const saved=api.replaceProject(next,{reason:'sync Shot Timeline to Timing section',snapshot:true,preserveIdentity:true});loadDraftFromProject(saved);state.message=t('Shot Timeline synced to Timing.','Shot Timeline синхронизирован в Timing.');render();
  }catch(error){setError(error);}
}

function activeSectionId(){return document.querySelector('#studioSectionTextarea')?.dataset.sectionId||'';}
function setError(error){state.error=String(error?.message||error);state.message='';render();}
async function copyText(value){try{await navigator.clipboard.writeText(String(value||''));state.message=t('Copied.','Скопировано.');updateHeaderOnly();}catch(error){setError(error);}}
function t(en,ru){return getLanguage()==='ru'?ru:en;}
function esc(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function attr(value=''){return esc(value).replace(/`/g,'&#96;');}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
function slug(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,12)||Math.random().toString(36).slice(2,14);}catch{return Math.random().toString(36).slice(2,14);}}
