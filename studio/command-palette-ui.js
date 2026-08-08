import { PROMPTS, SOURCES } from './library-data.js';
import { CASE_INTELLIGENCE, COLLECTION_GROUPS } from './case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from './multi-source-index.js';
import { SOURCE_UNIVERSE } from './source-universe.js';
import { getLanguage } from './i18n.js';
import { buildCommandIndex, searchCommandIndex, parseCommandQuery } from './command-palette-engine.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const ru = () => getLanguage() === 'ru';
const ui = (en, ruText) => ru() ? ruText : en;
const RECENT_KEY = 'porterCommandRecent';

const state = {
  open:false,
  query:'',
  activeIndex:0,
  index:[],
  results:[],
  researchCandidates:[],
  reviewQueue:[],
  recent:loadRecent()
};

injectTrigger();
injectPalette();
bindEvents();
rebuildIndex();
loadResearch();

function injectTrigger() {
  const header = $('.sidebar-header');
  const sidebar = $('.sidebar');
  if (!header || !sidebar || $('#globalCommandTrigger')) return;
  const button = document.createElement('button');
  button.id = 'globalCommandTrigger';
  button.className = 'global-command-trigger';
  button.type = 'button';
  header.insertAdjacentElement('afterend', button);
  localizeTrigger();
}

function injectPalette() {
  if ($('#globalCommandPalette')) return;
  const root = document.createElement('div');
  root.id = 'globalCommandPalette';
  root.className = 'command-palette';
  root.hidden = true;
  root.innerHTML = `
    <button class="command-palette-backdrop" type="button" data-command-close aria-label="Close"></button>
    <section class="command-palette-dialog" role="dialog" aria-modal="true" aria-label="Command palette">
      <div class="command-search-row"><span class="command-search-icon">⌕</span><input id="globalCommandSearch" type="search" autocomplete="off" spellcheck="false"><kbd id="commandEscapeHint">Esc</kbd></div>
      <div class="command-mode-hints" id="commandModeHints"></div>
      <div class="command-results" id="commandResults" role="listbox"></div>
      <div class="command-footer"><span id="commandResultCount"></span><div><kbd>↑</kbd><kbd>↓</kbd><span>${ui('navigate','выбор')}</span><kbd>↵</kbd><span>${ui('open','открыть')}</span></div></div>
    </section>`;
  document.body.appendChild(root);
  localizePalette();
}

async function loadResearch() {
  const [corpus, queue] = await Promise.allSettled([
    fetchJson('./case-candidates.json'),
    fetchJson('./case-review-queue.json')
  ]);
  state.researchCandidates = corpus.status === 'fulfilled' ? (corpus.value.candidates || []) : [];
  state.reviewQueue = queue.status === 'fulfilled' ? (queue.value.queue || []) : [];
  rebuildIndex();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache:'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function workspaces() {
  return [
    { id:'operations', title:ui('Operations','Операции'), subtitle:ui('What to do next','Что делать дальше'), keywords:['command center','health','priority','операции','приоритет'], action:{type:'workspace',view:'operations'} },
    { id:'digest', title:ui('Industry Digest','Индустриальный дайджест'), subtitle:'100 curated cases', keywords:['curated','cases','кейсы','дайджест'], action:{type:'workspace',view:'digest'} },
    { id:'corpus', title:ui('Research Corpus','Корпус исследований'), subtitle:'500–1000 candidate layer', keywords:['research','candidates','кандидаты','ресерч'], action:{type:'workspace',view:'corpus'} },
    { id:'prompts', title:ui('Porter Originals','Шаблоны Porter'), subtitle:'192 reusable cards', keywords:['originals','prompts','шаблоны','промпты'], action:{type:'workspace',view:'prompts'} },
    { id:'sources', title:ui('Sources','Источники'), subtitle:ui('Coverage + adapter health','Coverage + здоровье adapters'), keywords:['sources','coverage','health','источники'], action:{type:'workspace',view:'sources'} },
    { id:'deep-review', title:ui('Deep Review','Глубокий разбор'), subtitle:ui('Evidence-gated review queue','Evidence-gated review queue'), keywords:['review','evidence','разбор','ревью'], action:{type:'workspace',view:'deep-review'} },
    { id:'promotion', title:ui('Promotion','Подготовка кейса'), subtitle:ui('Deep review → curated draft','Deep review → curated draft'), keywords:['promotion','curation','curated draft','публикация'], action:{type:'workspace',view:'promotion'} }
  ];
}

function curatedCases() {
  const map = new Map();
  for (const item of CASE_INTELLIGENCE) {
    map.set(item.id, {
      id:item.id,
      title:item.title,
      author:item.author,
      sourcePlatform:'x',
      category:item.category,
      subcategory:item.subcategory,
      tags:item.tags || [],
      collections:item.intelligence?.collections || []
    });
  }
  for (const item of MULTI_SOURCE_CASES) {
    map.set(item.id, {
      id:item.id,
      title:item.title,
      author:item.author,
      sourcePlatform:item.sourcePlatform,
      category:item.category,
      subcategory:item.subcategory,
      tags:item.tags || [],
      collections:item.collections || []
    });
  }
  return [...map.values()];
}

function rebuildIndex() {
  state.index = buildCommandIndex({
    workspaces:workspaces(),
    collectionGroups:COLLECTION_GROUPS,
    curatedCases:curatedCases(),
    originals:PROMPTS,
    sources:SOURCES,
    sourceUniverse:SOURCE_UNIVERSE,
    researchCandidates:state.researchCandidates,
    reviewQueue:state.reviewQueue
  });
  updateResults();
}

function bindEvents() {
  document.addEventListener('click', event => {
    if (event.target.closest('#globalCommandTrigger')) { openPalette(); return; }
    if (event.target.closest('[data-command-close]')) { closePalette(); return; }
    const row = event.target.closest('[data-command-key]');
    if (row) {
      const result = state.results.find(entry => entry.item.key === row.dataset.commandKey);
      if (result) activateResult(result);
    }
  });

  document.addEventListener('input', event => {
    if (event.target.id !== 'globalCommandSearch') return;
    state.query = event.target.value;
    state.activeIndex = 0;
    updateResults();
  });

  document.addEventListener('mousemove', event => {
    const row = event.target.closest('[data-command-index]');
    if (!row || !state.open) return;
    const index = Number(row.dataset.commandIndex);
    if (Number.isFinite(index) && index !== state.activeIndex) {
      state.activeIndex = index;
      syncActiveRow();
    }
  });

  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      state.open ? closePalette() : openPalette();
      return;
    }
    if (!state.open) return;
    if (event.key === 'Escape') { event.preventDefault(); closePalette(); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(1); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1); return; }
    if (event.key === 'Enter') { event.preventDefault(); const result=state.results[state.activeIndex]; if(result) activateResult(result); }
  }, true);

  window.addEventListener('porter-language-change', () => {
    localizeTrigger();
    localizePalette();
    rebuildIndex();
  });
}

function openPalette() {
  const root = $('#globalCommandPalette');
  if (!root) return;
  state.open = true;
  root.hidden = false;
  document.body.classList.add('command-palette-open');
  const input = $('#globalCommandSearch');
  if (input) {
    input.value = state.query;
    requestAnimationFrame(() => { input.focus(); input.select(); });
  }
  updateResults();
}

function closePalette() {
  const root = $('#globalCommandPalette');
  if (!root) return;
  state.open = false;
  root.hidden = true;
  document.body.classList.remove('command-palette-open');
}

function updateResults() {
  state.results = searchCommandIndex(state.index, state.query, { limit:36, recent:state.recent });
  state.activeIndex = Math.max(0, Math.min(state.activeIndex, Math.max(0,state.results.length-1)));
  renderResults();
}

function renderResults() {
  const root = $('#commandResults');
  if (!root) return;
  const parsed = parseCommandQuery(state.query);
  $('#commandModeHints').innerHTML = modeHints(parsed);
  $('#commandResultCount').textContent = `${state.results.length} ${ui('results','результатов')}`;
  root.innerHTML = state.results.length ? state.results.map((result,index) => resultRow(result,index)).join('') : `<div class="command-empty"><strong>${ui('Nothing found','Ничего не найдено')}</strong><span>${ui('Try another phrase or use >, #, @ filters.','Попробуй другой запрос или фильтры >, #, @.')}</span></div>`;
  syncActiveRow();
}

function resultRow(result,index) {
  const item = result.item;
  const active = index === state.activeIndex;
  const meta = item.kind === 'research' && item.metadata?.queued ? ui('queued for review','в review queue') : kindLabel(item.kind);
  const score = item.kind === 'research' ? `<span class="command-score">${Number(item.metadata?.score || 0)}</span>` : '';
  return `<button class="command-result-row${active?' is-active':''}" type="button" role="option" aria-selected="${active?'true':'false'}" data-command-key="${attr(item.key)}" data-command-index="${index}"><span class="command-kind" data-kind="${attr(item.kind)}">${esc(kindIcon(item.kind))}</span><span class="command-result-main"><strong>${highlight(item.title,state.query)}</strong><small>${esc(item.subtitle || meta)}</small></span><span class="command-result-side"><span>${esc(meta)}</span>${score}<kbd>↵</kbd></span></button>`;
}

function syncActiveRow() {
  document.querySelectorAll('[data-command-index]').forEach(row => {
    const active = Number(row.dataset.commandIndex) === state.activeIndex;
    row.classList.toggle('is-active',active);
    row.setAttribute('aria-selected',active?'true':'false');
  });
  const row = $(`[data-command-index="${state.activeIndex}"]`);
  row?.scrollIntoView({ block:'nearest' });
}

function moveActive(delta) {
  if (!state.results.length) return;
  state.activeIndex = (state.activeIndex + delta + state.results.length) % state.results.length;
  syncActiveRow();
}

function activateResult(result) {
  remember(result.item.key);
  closePalette();
  const action = result.item.action || {};
  if (action.type === 'workspace') return openView(action.view);
  if (action.type === 'collection') return openCollection(action.collection);
  if (action.type === 'curated') return openCurated(action.id);
  if (action.type === 'original') return openOriginal(action.id);
  if (action.type === 'research') return openResearch(action.query || result.item.title);
  if (action.type === 'review-candidate') return openDeepReview(action.candidateId);
  if (action.type === 'source') return openSource(action.query || result.item.title);
  if (action.type === 'creator') return openCreator(action.creator);
}

function openView(view) {
  const selectors = { operations:'[data-case-view="operations"]', digest:'[data-view="digest"]', corpus:'[data-case-view="corpus"]', prompts:'[data-view="prompts"]', sources:'[data-view="sources"]', 'deep-review':'[data-case-view="deep-review"]', promotion:'[data-case-view="promotion"]' };
  $(selectors[view] || '[data-view="digest"]')?.click();
}

function openCollection(collection) {
  openView('digest');
  requestAnimationFrame(() => {
    $('#resetDigest')?.click();
    requestAnimationFrame(() => document.querySelector(`#caseCollections [data-collection="${CSS.escape(collection)}"]`)?.click());
  });
}

function openCurated(id) {
  openView('digest');
  requestAnimationFrame(() => {
    $('#resetDigest')?.click();
    document.querySelector('#caseCollections [data-collection="all"]')?.click();
    requestAnimationFrame(() => {
      const card = document.querySelector(`#digestGrid [data-digest-id="${CSS.escape(id)}"]`);
      card?.scrollIntoView({ behavior:'smooth', block:'center' });
      card?.click();
    });
  });
}

function openOriginal(id) {
  openView('prompts');
  requestAnimationFrame(() => {
    $('#resetFilters')?.click();
    requestAnimationFrame(() => {
      const card = document.querySelector(`#promptGrid [data-id="${CSS.escape(id)}"]`);
      card?.scrollIntoView({ behavior:'smooth', block:'center' });
      card?.click();
    });
  });
}

function openResearch(query) {
  openView('corpus');
  requestAnimationFrame(() => {
    const input = $('#corpusSearch');
    if (!input) return;
    input.value = query;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
  });
}

function openDeepReview(candidateId) {
  openView('deep-review');
  requestAnimationFrame(() => {
    $('#resetDeepReview')?.click();
    requestAnimationFrame(() => {
      const row = document.querySelector(`[data-review-candidate="${CSS.escape(candidateId)}"]`);
      row?.click();
      row?.scrollIntoView({ behavior:'smooth', block:'nearest' });
    });
  });
}

function openSource(query) {
  openView('sources');
  requestAnimationFrame(() => {
    const input = $('#sourceSearch');
    if (!input) return;
    input.value = query;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
  });
}

function openCreator(creator) {
  openView('digest');
  requestAnimationFrame(() => {
    $('#resetDigest')?.click();
    const select = $('#digestCreator');
    if (select && [...select.options].some(option => option.value === creator)) {
      select.value = creator;
      select.dispatchEvent(new Event('change',{bubbles:true}));
      return;
    }
    const input = $('#digestSearch');
    if (input) { input.value=creator; input.dispatchEvent(new Event('input',{bubbles:true})); }
  });
}

function modeHints(parsed) {
  const hints = [['>','workspaces'],['#','Collections'],['@','creators']];
  return hints.map(([prefix,label]) => `<button type="button" class="command-mode-chip${parsed.prefix===prefix?' is-active':''}" data-command-prefix="${prefix}"><kbd>${prefix}</kbd><span>${esc(label)}</span></button>`).join('');
}

function localizeTrigger() {
  const button = $('#globalCommandTrigger');
  if (!button) return;
  const shortcut = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '') ? '⌘K' : 'Ctrl K';
  button.innerHTML = `<span>⌕</span><strong>${ui('Search everything','Найти всё')}</strong><kbd>${shortcut}</kbd>`;
}

function localizePalette() {
  const input = $('#globalCommandSearch');
  if (input) input.placeholder = ui('Search cases, candidates, prompts, sources, workspaces…','Кейсы, кандидаты, промпты, источники, workspaces…');
}

function remember(key) {
  state.recent = [key,...state.recent.filter(value=>value!==key)].slice(0,8);
  try { localStorage.setItem(RECENT_KEY,JSON.stringify(state.recent)); } catch {}
}
function loadRecent() { try { const value=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]'); return Array.isArray(value)?value:[]; } catch { return []; } }

function kindLabel(kind) {
  const labels = { workspace:['workspace','workspace'], curated:['curated case','curated-кейс'], research:['research candidate','research-кандидат'], original:['Porter original','Porter original'], source:['source','источник'], collection:['Collection','Collection'], creator:['creator','автор'] };
  return ui(...(labels[kind]||[kind,kind]));
}
function kindIcon(kind) { return { workspace:'⌘', curated:'◆', research:'◇', original:'◫', source:'↗', collection:'#', creator:'@' }[kind] || '·'; }
function highlight(value,query) {
  const text=String(value||'');
  const parsed=parseCommandQuery(query).query;
  if(!parsed) return esc(text);
  const index=text.toLowerCase().indexOf(parsed.toLowerCase());
  if(index<0) return esc(text);
  return `${esc(text.slice(0,index))}<mark>${esc(text.slice(index,index+parsed.length))}</mark>${esc(text.slice(index+parsed.length))}`;
}
