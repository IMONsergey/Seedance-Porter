import { COLLECTION_GROUPS } from './case-intelligence-runtime.js';
import { collectionLabel, getLanguage } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const ru = () => getLanguage() === 'ru';
const ui = (en, ruText) => ru() ? ruText : en;
const slug = value => String(value || '').toLowerCase().replace(/\//g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const COLLECTIONS = COLLECTION_GROUPS.flatMap(group => group.items.map(title => ({ group: group.title, title, id: slug(title) })));

const state = {
  corpus: null,
  query: '',
  sourcePool: 'all',
  collection: 'all',
  scoreMin: 0,
  page: 1,
  pageSize: 36
};

injectNav();
injectView();
injectSidebar();
bindEvents();
localizeCorpus();
loadCorpus();

function injectNav() {
  const nav = $('.sidebar-nav');
  if (!nav || $('[data-case-view="corpus"]', nav)) return;
  const button = document.createElement('button');
  button.className = 'nav-tab';
  button.type = 'button';
  button.dataset.caseView = 'corpus';
  button.innerHTML = '<span class="nav-icon">▦</span><span data-corpus-nav-label></span><span class="corpus-nav-count" id="corpusNavCount">—</span>';
  const digestTab = $('.nav-tab[data-view="digest"]', nav);
  if (digestTab) digestTab.insertAdjacentElement('afterend', button);
  else nav.appendChild(button);
}

function injectView() {
  const main = $('.page');
  if (!main || $('#corpusView')) return;
  const section = document.createElement('section');
  section.id = 'corpusView';
  section.className = 'library-view corpus-view';
  section.hidden = true;
  section.innerHTML = `
    <header class="view-header corpus-header">
      <div>
        <div class="view-kicker" data-corpus-kicker></div>
        <h1 data-corpus-title></h1>
        <p data-corpus-description></p>
      </div>
    </header>
    <div id="corpusBody" class="corpus-loading" aria-live="polite"></div>`;
  main.appendChild(section);
}

function injectSidebar() {
  const sidebar = $('.sidebar');
  const footer = $('.sidebar-footer');
  if (!sidebar || !footer || $('[data-sidebar-view="corpus"]')) return;
  const section = document.createElement('section');
  section.className = 'sidebar-filter-panel';
  section.dataset.sidebarView = 'corpus';
  section.innerHTML = `
    <div class="sidebar-section-title" data-corpus-filter-title></div>
    <label class="sidebar-search"><span data-corpus-search-label></span><div class="sidebar-search-field"><span class="search-icon">⌕</span><input id="corpusSearch" type="search" autocomplete="off" /></div></label>
    <label><span data-corpus-collection-label></span><select id="corpusCollection"></select></label>
    <label><span data-corpus-source-label></span><select id="corpusSource"></select></label>
    <label><span data-corpus-score-label></span><select id="corpusScore"></select></label>
    <div class="sidebar-subtitle" data-corpus-coverage-label></div>
    <div class="corpus-gap-table" id="corpusGaps"></div>
    <button class="sidebar-reset" id="resetCorpus" type="button"></button>`;
  sidebar.insertBefore(section, footer);
}

function bindEvents() {
  document.addEventListener('click', event => {
    const corpusTab = event.target.closest('[data-case-view="corpus"]');
    if (corpusTab) {
      event.preventDefault();
      showCorpus();
      return;
    }
    if (event.target.closest('.nav-tab[data-view]')) hideCorpus();
    const gap = event.target.closest('[data-corpus-collection]');
    if (gap) {
      state.collection = gap.dataset.corpusCollection;
      const select = $('#corpusCollection');
      if (select) select.value = state.collection;
      state.page = 1;
      renderCorpus();
    }
  });

  document.addEventListener('input', event => {
    if (event.target.id !== 'corpusSearch') return;
    state.query = event.target.value;
    state.page = 1;
    renderCorpus();
  });

  document.addEventListener('change', event => {
    if (event.target.id === 'corpusSource') state.sourcePool = event.target.value;
    else if (event.target.id === 'corpusCollection') state.collection = event.target.value;
    else if (event.target.id === 'corpusScore') state.scoreMin = Number(event.target.value);
    else return;
    state.page = 1;
    renderCorpus();
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('#resetCorpus')) return;
    state.query = '';
    state.sourcePool = 'all';
    state.collection = 'all';
    state.scoreMin = 0;
    state.page = 1;
    const search = $('#corpusSearch');
    const source = $('#corpusSource');
    const collection = $('#corpusCollection');
    const score = $('#corpusScore');
    if (search) search.value = '';
    if (source) source.value = 'all';
    if (collection) collection.value = 'all';
    if (score) score.value = '0';
    renderCorpus();
  });

  document.addEventListener('keydown', event => {
    if ($('#corpusView')?.hidden || event.key !== '/' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    $('#corpusSearch')?.focus();
  }, true);

  window.addEventListener('porter-language-change', () => {
    localizeCorpus();
    renderGaps();
    if (!$('#corpusView')?.hidden) renderCorpus();
  });
}

function showCorpus() {
  for (const id of ['digestView', 'promptView', 'sourceView']) {
    const element = $(`#${id}`);
    if (element) element.hidden = true;
  }
  const view = $('#corpusView');
  if (view) view.hidden = false;
  $$('.nav-tab').forEach(tab => tab.classList.remove('is-active'));
  $('[data-case-view="corpus"]')?.classList.add('is-active');
  const sidebarState = $('#sidebarState');
  if (sidebarState) sidebarState.checked = false;
  renderCorpus();
}

function hideCorpus() {
  const view = $('#corpusView');
  if (view) view.hidden = true;
}

async function loadCorpus() {
  try {
    const response = await fetch('./case-candidates.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const corpus = await response.json();
    if (!Array.isArray(corpus.candidates)) throw new Error('Invalid corpus snapshot');
    state.corpus = corpus;
  } catch (error) {
    state.corpus = { candidates: [], stats: { candidates: 0 }, error: String(error?.message || error) };
  }
  updateNavCount();
  populateSourceFilter();
  renderGaps();
  if (!$('#corpusView')?.hidden) renderCorpus();
}

function updateNavCount() {
  const count = $('#corpusNavCount');
  if (!count) return;
  count.textContent = String(state.corpus?.stats?.candidates ?? state.corpus?.candidates?.length ?? 0);
}

function populateSourceFilter() {
  const select = $('#corpusSource');
  if (!select) return;
  const pools = [...new Map((state.corpus?.candidates || []).map(item => [item.sourcePool, item.sourcePoolLabel || item.sourcePool])).entries()]
    .filter(([id]) => id)
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  select.innerHTML = `<option value="all">${ui('All source pools', 'Все источники')}</option>${pools.map(([id, label]) => `<option value="${attr(id)}">${esc(label)}</option>`).join('')}`;
  select.value = state.sourcePool;
}

function localizeCorpus() {
  const navLabel = $('[data-corpus-nav-label]');
  if (navLabel) navLabel.textContent = ui('Research Corpus', 'Корпус исследований');
  const kicker = $('[data-corpus-kicker]');
  const title = $('[data-corpus-title]');
  const description = $('[data-corpus-description]');
  if (kicker) kicker.textContent = ui('500–1000 research candidates · separate from curated cases', '500–1000 кандидатов для исследования · отдельно от отобранных кейсов');
  if (title) title.textContent = ui('Research Corpus', 'Корпус исследований');
  if (description) description.textContent = ui(
    'A large discovery layer for finding useful Seedance patterns. Candidate does not mean recommended: promotion to Industry Digest requires prompt analysis, complete-video review and a verified transferable pattern.',
    'Большой слой насмотренности и поиска полезных паттернов Seedance. Кандидат ещё не означает рекомендацию: в Industry Digest кейс попадает только после разбора промпта, просмотра полного видео и проверки переносимого production-паттерна.'
  );
  setText('[data-corpus-filter-title]', ui('Filter research corpus', 'Фильтры корпуса'));
  setText('[data-corpus-search-label]', ui('Search', 'Поиск'));
  setText('[data-corpus-collection-label]', ui('Collection', 'Коллекция'));
  setText('[data-corpus-source-label]', ui('Source pool', 'Источник'));
  setText('[data-corpus-score-label]', ui('Research score', 'Оценка ресерча'));
  setText('[data-corpus-coverage-label]', ui('Coverage', 'Покрытие коллекций'));
  setText('#resetCorpus', ui('Reset filters', 'Сбросить фильтры'));
  const search = $('#corpusSearch');
  if (search) search.placeholder = ui('Product, logo, camera…', 'Продукт, лого, камера…');
  populateCollectionFilter();
  populateScoreFilter();
  populateSourceFilter();
}

function populateCollectionFilter() {
  const select = $('#corpusCollection');
  if (!select) return;
  const groups = COLLECTION_GROUPS.map(group => `<optgroup label="${attr(groupLabel(group.title))}">${group.items.map(name => `<option value="${attr(slug(name))}">${esc(collectionLabel(name))}</option>`).join('')}</optgroup>`).join('');
  select.innerHTML = `<option value="all">${ui('All Collections', 'Все коллекции')}</option>${groups}`;
  select.value = state.collection;
}

function populateScoreFilter() {
  const select = $('#corpusScore');
  if (!select) return;
  select.innerHTML = `<option value="0">${ui('Any score', 'Любая оценка')}</option><option value="70">70+</option><option value="80">80+</option><option value="90">90+</option>`;
  select.value = String(state.scoreMin);
}

function groupLabel(value) {
  if (!ru()) return value;
  if (value === 'Digital / Design') return 'Digital / Design';
  if (value === 'Commercial') return 'Коммерческие';
  if (value === 'Motion language') return 'Язык движения';
  return value;
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function filteredCandidates() {
  const q = state.query.trim().toLowerCase();
  return (state.corpus?.candidates || []).filter(item => {
    if (state.sourcePool !== 'all' && item.sourcePool !== state.sourcePool) return false;
    if (state.collection !== 'all' && !item.collections?.includes(state.collection)) return false;
    if (Number(item.score || 0) < state.scoreMin) return false;
    if (!q) return true;
    return [item.title, item.author, item.excerpt, item.sourcePoolLabel, ...(item.collections || [])].join(' ').toLowerCase().includes(q);
  });
}

function renderCorpus() {
  const body = $('#corpusBody');
  if (!body) return;
  if (!state.corpus) {
    body.className = 'corpus-loading';
    body.textContent = ui('Loading research corpus…', 'Загружаю корпус исследований…');
    return;
  }
  if (state.corpus.error || !state.corpus.candidates.length) {
    body.className = 'corpus-loading';
    body.innerHTML = `<div class="corpus-pending"><strong>${ui('Corpus snapshot has not been generated yet.', 'Снапшот корпуса ещё не сгенерирован.')}</strong><span>${ui('The curated 100-case Industry Digest is unaffected. Run the Research Corpus workflow to populate this layer.', 'Отобранный Industry Digest из 100 кейсов продолжает работать отдельно. Для наполнения этого слоя нужно запустить workflow Research Corpus.')}</span></div>`;
    return;
  }

  const items = filteredCandidates();
  const pages = Math.max(1, Math.ceil(items.length / state.pageSize));
  state.page = Math.min(state.page, pages);
  const slice = items.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
  const stats = state.corpus.stats || {};
  const activeCollection = state.collection === 'all' ? ui('All Collections', 'Все коллекции') : collectionLabel(COLLECTIONS.find(entry => entry.id === state.collection)?.title || state.collection);

  body.className = '';
  body.innerHTML = `
    <div class="corpus-summary">
      ${statCard(stats.candidates ?? state.corpus.candidates.length, ui('selected candidates', 'отобрано кандидатов'))}
      ${statCard(stats.creators ?? '—', ui('creator / source labels', 'авторов / source labels'))}
      ${statCard(stats.sourcePools ?? '—', ui('automated source pools', 'автоматических пулов'))}
      ${statCard(stats.averageScore ?? '—', ui('average research score', 'средняя оценка'))}
    </div>
    <div class="corpus-notice"><strong>${ui('Candidate ≠ curated case.', 'Кандидат ≠ отобранный кейс.')}</strong> ${ui('This layer is for discovery. Deep review requires the complete source video; prompt text and a thumbnail are not enough.', 'Этот слой нужен для поиска. Для deep review обязательно смотреть полное исходное видео — промпта и превью недостаточно.')}</div>
    <div class="results-meta"><div><strong>${items.length}</strong> ${ui('matching candidates', 'кандидатов')}</div><div>${esc(activeCollection)}</div></div>
    <div class="corpus-grid">${slice.map(corpusCard).join('')}</div>
    ${pagination(pages)}`;

  $('#corpusPrev')?.addEventListener('click', () => { state.page = Math.max(1, state.page - 1); renderCorpus(); scrollCorpus(); });
  $('#corpusNext')?.addEventListener('click', () => { state.page = Math.min(pages, state.page + 1); renderCorpus(); scrollCorpus(); });
  $$('.corpus-preview img', body).forEach(img => img.addEventListener('error', () => replaceBrokenPreview(img), { once: true }));
}

function statCard(value, label) {
  return `<div class="corpus-stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
}

function corpusCard(item) {
  const names = (item.collections || []).slice(0, 4).map(id => collectionLabel(COLLECTIONS.find(entry => entry.id === id)?.title || id));
  const preview = item.previewUrl
    ? `<img loading="lazy" referrerpolicy="no-referrer" src="${attr(item.previewUrl)}" alt="${attr(ui('Source preview', 'Превью источника'))}: ${attr(item.title)}">`
    : placeholder();
  const sourceLabel = item.sourcePoolLabel || item.sourcePool || ui('Public source', 'Публичный источник');
  return `<article class="corpus-card">
    <div class="corpus-preview">${preview}<span class="corpus-score" title="${attr(ui('Research score, not output quality', 'Оценка ресерча, а не качества генерации'))}">${esc(item.score ?? '—')}</span></div>
    <div class="corpus-card-body">
      <div class="corpus-meta">${esc(sourceLabel)} · ${ui('candidate', 'кандидат')}</div>
      <h3>${esc(item.title)}</h3>
      <div class="corpus-author">${esc(item.author || ui('Unknown creator', 'Автор не указан'))}</div>
      <div class="corpus-excerpt">${esc(item.excerpt || ui('Open the original source to inspect this candidate.', 'Открой исходный источник для изучения этого кандидата.'))}</div>
      <div class="corpus-collections">${names.map(name => `<span>${esc(name)}</span>`).join('')}</div>
      <div class="corpus-actions">
        <a href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">${ui('Open source', 'Открыть источник')} ↗</a>
        ${item.archiveUrl && item.archiveUrl !== item.sourceUrl ? `<a href="${attr(item.archiveUrl)}" target="_blank" rel="noopener">${ui('Archive', 'Архив')} ↗</a>` : ''}
      </div>
    </div>
  </article>`;
}

function placeholder() {
  return `<div class="corpus-placeholder"><span>▦</span><small>${ui('Source candidate', 'Кандидат из источника')}</small></div>`;
}

function replaceBrokenPreview(img) {
  const root = img.closest('.corpus-preview');
  if (!root) return;
  img.remove();
  if (!$('.corpus-placeholder', root)) root.insertAdjacentHTML('afterbegin', placeholder());
}

function pagination(pages) {
  if (pages <= 1) return '';
  return `<div class="corpus-pagination"><button id="corpusPrev" type="button" ${state.page <= 1 ? 'disabled' : ''} aria-label="${attr(ui('Previous page', 'Предыдущая страница'))}">←</button><span>${ui('Page', 'Страница')} ${state.page} / ${pages}</span><button id="corpusNext" type="button" ${state.page >= pages ? 'disabled' : ''} aria-label="${attr(ui('Next page', 'Следующая страница'))}">→</button></div>`;
}

function renderGaps() {
  const root = $('#corpusGaps');
  if (!root) return;
  const counts = state.corpus?.stats?.collectionCounts || {};
  root.innerHTML = COLLECTIONS.map(item => `<button class="corpus-gap-row${state.collection === item.id ? ' is-active' : ''}" type="button" data-corpus-collection="${attr(item.id)}"><span>${esc(collectionLabel(item.title))}</span><span>${Number(counts[item.id] || 0)}</span></button>`).join('');
}

function scrollCorpus() {
  $('#corpusView')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
