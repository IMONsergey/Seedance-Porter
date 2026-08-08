import {
  PROMPT_STUDIO_PROFILES,
  getPromptStudioProfile,
  applyPromptStudioProfile,
  getPromptStudioUserRules,
  getPromptStudioProfileCoverage
} from './prompt-studio-profiles.js';
import { getLanguage } from './i18n.js';

let queued=false;
let selectedProfile='';

bindProfilePanel();
scheduleRender();

function bindProfilePanel(){
  document.addEventListener('change',event=>{
    if(event.target.id!=='studioProfileSelect')return;
    selectedProfile=event.target.value;
    renderPanel();
  });
  document.addEventListener('click',event=>{
    const action=event.target.closest('[data-studio-profile-action]')?.dataset.studioProfileAction;
    if(action==='apply')applySelectedProfile();
    if(action==='recommended')applyRecommendedProfile();
  });
  window.addEventListener('porter-prompt-studio-change',scheduleRender);
  window.addEventListener('porter-prompt-studio-project-replaced',scheduleRender);
  window.addEventListener('porter-language-change',scheduleRender);
  window.addEventListener('porter-workspace-change',event=>{if(event.detail?.viewId==='promptStudioView')scheduleRender();});
  new MutationObserver(scheduleRender).observe(document.body,{childList:true,subtree:true});
}

function scheduleRender(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;renderPanel();});
}

function renderPanel(){
  const api=window.porterPromptStudio;
  const project=api?.getProject?.();
  const right=document.querySelector('#studioRightPanel .studio-right, .studio-right');
  if(!api||!project||!right)return;

  let panel=right.querySelector('#studioProfilePanel');
  if(!panel){
    panel=document.createElement('section');
    panel.id='studioProfilePanel';
    panel.className='studio-panel studio-profile-panel';
    const rules=right.querySelector('.studio-rules-panel');
    if(rules)rules.insertAdjacentElement('beforebegin',panel);else right.prepend(panel);
  }

  const recommended=inferRecommendedProfile(project);
  if(!selectedProfile||!PROMPT_STUDIO_PROFILES.some(profile=>profile.id===selectedProfile))selectedProfile=project.modelProfile||recommended.id;
  const selected=getPromptStudioProfile(selectedProfile);
  const active=getPromptStudioProfile(project.modelProfile);
  const coverage=getPromptStudioProfileCoverage(project);
  const userRules=getPromptStudioUserRules(project);
  const isCurrent=active.id===selected.id&&coverage.missing.length===0;
  const language=getLanguage();
  const renderSignature=JSON.stringify([project.id,project.updatedAt,project.modelProfile,project.customRules,selected.id,recommended.id,language]);
  if(panel.dataset.renderSignature===renderSignature)return;
  panel.dataset.renderSignature=renderSignature;

  panel.innerHTML=`
    <div class="studio-panel-head">
      <div><span>${t('Production policy','Production-политика')}</span><strong>${t('Rule Pack','Rule Pack')}</strong></div>
      <span class="studio-profile-status" data-active="${isCurrent?'true':'false'}">${isCurrent?t('active','active'):`${coverage.active}/${coverage.expected}`}</span>
    </div>
    <label class="studio-profile-select-label">${t('Profile','Профиль')}<select id="studioProfileSelect">${PROMPT_STUDIO_PROFILES.map(profile=>`<option value="${escapeAttr(profile.id)}" ${profile.id===selected.id?'selected':''}>${escapeHtml(language==='ru'?profile.labelRu:profile.label)}</option>`).join('')}</select></label>
    <div class="studio-profile-description">${escapeHtml(language==='ru'?selected.descriptionRu:selected.description)}</div>
    <div class="studio-profile-recommendation" data-match="${recommended.id===selected.id?'true':'false'}"><span>${t('Recommended','Рекомендуется')}</span><strong>${escapeHtml(language==='ru'?recommended.labelRu:recommended.label)}</strong><small>${escapeHtml(recommended.reason)}</small>${recommended.id!==selected.id?`<button type="button" data-studio-profile-action="recommended">${t('Select','Выбрать')}</button>`:''}</div>
    <details class="studio-profile-rules" ${isCurrent?'':'open'}><summary>${selected.rules.length} ${t('production rules','production-правил')}</summary><ol>${selected.rules.map(rule=>`<li>${escapeHtml(rule)}</li>`).join('')}</ol></details>
    <div class="studio-profile-meta"><span>${t('Current','Текущий')}: <b>${escapeHtml(language==='ru'?active.labelRu:active.label)}</b></span><span>${t('User rules preserved','Пользовательских правил')}: <b>${userRules.length}</b></span></div>
    <button class="button primary studio-profile-apply" type="button" data-studio-profile-action="apply" ${isCurrent?'disabled':''}>${isCurrent?t('Rule Pack active','Rule Pack активен'):t('Apply Rule Pack','Применить Rule Pack')}</button>
    <div class="studio-profile-boundary">${t('Applying a Rule Pack creates a revision, preserves your custom rules and never rewrites prompt sections automatically.','Применение Rule Pack создаёт версию, сохраняет твои custom rules и не переписывает секции промпта автоматически.')}</div>`;
}

function applySelectedProfile(){
  const api=window.porterPromptStudio;
  const project=api?.getProject?.();
  if(!api?.replaceProject||!project)return;
  const next=applyPromptStudioProfile(project,selectedProfile);
  api.replaceProject(next,{reason:`apply Rule Pack ${selectedProfile}`,snapshot:true,preserveIdentity:true});
  scheduleRender();
}

function applyRecommendedProfile(){
  const project=window.porterPromptStudio?.getProject?.();
  if(!project)return;
  selectedProfile=inferRecommendedProfile(project).id;
  renderPanel();
}

function inferRecommendedProfile(project){
  const tags=[project.title,project.mode,project.source?.title,project.source?.kind,...(project.tags||[])].filter(Boolean).join(' ').toLowerCase();
  if(project.mode==='first-last-frame')return recommendation('first-last-frame','first / last frame mode');
  if(/ui|interface|dashboard|saas|app|website/.test(tags))return recommendation('ui-motion','UI / interface source or tags');
  if(/character|fashion|person|portrait|human|sport|athlete/.test(tags))return recommendation('character-continuity','character / human continuity cues');
  if(/beauty|cosmetic|skin|serum|perfume|liquid|material|glass|macro|fabric/.test(tags))return recommendation('material-beauty','material / beauty / macro cues');
  if(/product|packshot|fmcg|electronics|automotive|device|commercial/.test(tags))return recommendation('product-precision','product / commercial precision cues');
  return recommendation('seedance-general','general production project');
}

function recommendation(id,reason){return{...getPromptStudioProfile(id),reason};}
function t(en,ruText){return getLanguage()==='ru'?ruText:en;}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function escapeAttr(value=''){return escapeHtml(value).replace(/`/g,'&#96;');}
