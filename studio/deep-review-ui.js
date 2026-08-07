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
const STORAGE_PREFIX = 'porterDeepReviewDraft:';

const state = {
  queue: null,
  corpus: null,
  selectedId: null,
  query: '',
  collection: 'all',
  sourcePool: 'all'
};

injectNav();
injectView();
injectSidebar();
bindGlobalEvents();
localizeShell();
loadData();

function injectNav() {
  const nav = $('.sidebar-nav');
  if (!nav || $('[data-case-view="deep-review"]', nav)) return;
  const button = document.createElement('button');
  button.className = 'nav-tab';
  button.type = 'button';
  button.dataset.caseView = 'deep-review';
  button.innerHTML = '<span class="nav-icon">✓</span><span data-deep-nav-label></span><span class="deep-nav-count" id="deepReviewNavCount">—</span>';
  const corpusTab = $('[data-case-view="corpus"]', nav);
  if (corpusTab) corpusTab.insertAdjacentElement('afterend', button);
  else nav.appendChild(button);
}

function injectView() {
  const main = $('.page');
  if (!main || $('#deepReviewView')) return;
  const section = document.createElement('section');
  section.id = 'deepReviewView';
  section.className = 'library-view deep-review-view';
  section.hidden = true;
  section.innerHTML = `
    <header class="view-header deep-review-header">
      <div>
        <div class="view-kicker" data-deep-kicker></div>
        <h1 data-deep-title></h1>
        <p data-deep-description></p>
      </div>
    </header>
    <div id="deepReviewBody" class="deep-review-loading" aria-live="polite"></div>`;
  main.appendChild(section);
}

function injectSidebar() {
  const sidebar = $('.sidebar');
  const footer = $('.sidebar-footer');
  if (!sidebar || !footer || $('[data-sidebar-view="deep-review"]')) return;
  const section = document.createElement('section');
  section.className = 'sidebar-filter-panel';
  section.dataset.sidebarView = 'deep-review';
  section.innerHTML = `
    <div class="sidebar-section-title" data-deep-filter-title></div>
    <label class="sidebar-search"><span data-deep-search-label></span><div class="sidebar-search-field"><span class="search-icon">⌕</span><input id="deepReviewSearch" type="search" autocomplete="off" /></div></label>
    <label><span data-deep-collection-label></span><select id="deepReviewCollection"></select></label>
    <label><span data-deep-source-label></span><select id="deepReviewSource"></select></label>
    <div class="deep-review-sidebar-note" data-deep-sidebar-note></div>
    <button class="sidebar-reset" id="resetDeepReview" type="button"></button>`;
  sidebar.insertBefore(section, footer);
}

async function loadData() {
  const [queueResult, corpusResult] = await Promise.allSettled([
    fetchJson('./case-review-queue.json'),
    fetchJson('./case-candidates.json')
  ]);
  state.queue = queueResult.status === 'fulfilled' ? queueResult.value : { queue: [], stats: { queue: 0 }, error: String(queueResult.reason || 'queue unavailable') };
  state.corpus = corpusResult.status === 'fulfilled' ? corpusResult.value : { candidates: [], stats: { candidates: 0 }, error: String(corpusResult.reason || 'corpus unavailable') };

  const count = $('#deepReviewNavCount');
  if (count) count.textContent = String(state.queue?.stats?.queue ?? state.queue?.queue?.length ?? 0);
  populateFilters();
  const first = filteredQueue()[0];
  if (!state.selectedId && first) state.selectedId = first.candidateId;
  if (!$('#deepReviewView')?.hidden) renderWorkspace();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function bindGlobalEvents() {
  document.addEventListener('click', event => {
    const tab = event.target.closest('[data-case-view="deep-review"]');
    if (tab) {
      event.preventDefault();
      showDeepReview();
      return;
    }
    if (event.target.closest('.nav-tab[data-view], [data-case-view="corpus"]')) hideDeepReview();

    const queueItem = event.target.closest('[data-review-candidate]');
    if (queueItem) {
      saveCurrentForm();
      state.selectedId = queueItem.dataset.reviewCandidate;
      renderWorkspace();
      return;
    }

    if (event.target.closest('#resetDeepReview')) {
      state.query = '';
      state.collection = 'all';
      state.sourcePool = 'all';
      const search = $('#deepReviewSearch');
      const collection = $('#deepReviewCollection');
      const source = $('#deepReviewSource');
      if (search) search.value = '';
      if (collection) collection.value = 'all';
      if (source) source.value = 'all';
      state.selectedId = filteredQueue()[0]?.candidateId || null;
      renderWorkspace();
    }
  });

  document.addEventListener('input', event => {
    if (event.target.id === 'deepReviewSearch') {
      state.query = event.target.value;
      state.selectedId = filteredQueue()[0]?.candidateId || null;
      renderWorkspace();
      return;
    }
    if (event.target.closest('#deepReviewForm')) handleFormMutation();
  });

  document.addEventListener('change', event => {
    if (event.target.id === 'deepReviewCollection') {
      state.collection = event.target.value;
      state.selectedId = filteredQueue()[0]?.candidateId || null;
      renderWorkspace();
      return;
    }
    if (event.target.id === 'deepReviewSource') {
      state.sourcePool = event.target.value;
      state.selectedId = filteredQueue()[0]?.candidateId || null;
      renderWorkspace();
      return;
    }
    if (event.target.closest('#deepReviewForm')) handleFormMutation();
  });

  window.addEventListener('porter-language-change', () => {
    localizeShell();
    populateFilters();
    if (!$('#deepReviewView')?.hidden) renderWorkspace();
  });
}

function showDeepReview() {
  for (const id of ['digestView', 'promptView', 'sourceView', 'corpusView']) {
    const element = $(`#${id}`);
    if (element) element.hidden = true;
  }
  const view = $('#deepReviewView');
  if (view) view.hidden = false;
  $$('.nav-tab').forEach(tab => tab.classList.remove('is-active'));
  $('[data-case-view="deep-review"]')?.classList.add('is-active');
  const sidebarState = $('#sidebarState');
  if (sidebarState) sidebarState.checked = false;
  renderWorkspace();
}

function hideDeepReview() {
  saveCurrentForm();
  const view = $('#deepReviewView');
  if (view) view.hidden = true;
}

function localizeShell() {
  setText('[data-deep-nav-label]', ui('Deep Review', 'Глубокий разбор'));
  setText('[data-deep-kicker]', ui('Evidence workspace · full-video review required', 'Evidence workspace · нужен просмотр полного видео'));
  setText('[data-deep-title]', ui('Deep Review Workspace', 'Deep Review Workspace'));
  setText('[data-deep-description]', ui(
    'Turn research candidates into evidence-backed production knowledge. A case cannot become deep-reviewed until the full source video is watched and observed behavior is recorded.',
    'Превращает кандидатов из ресерча в подтверждённые production-знания. Кейс нельзя пометить deep-reviewed, пока полное исходное видео не просмотрено и наблюдаемое поведение не зафиксировано.'
  ));
  setText('[data-deep-filter-title]', ui('Filter review queue', 'Фильтры очереди'));
  setText('[data-deep-search-label]', ui('Search', 'Поиск'));
  setText('[data-deep-collection-label]', ui('Target Collection', 'Целевая коллекция'));
  setText('[data-deep-source-label]', ui('Source pool', 'Источник'));
  setText('[data-deep-sidebar-note]', ui('Drafts autosave only in this browser. Exported JSON is not automatically committed or curated.', 'Черновики сохраняются только в этом браузере. Экспортированный JSON сам по себе не коммитится и не становится curated-кейсом.'));
  setText('#resetDeepReview', ui('Reset filters', 'Сбросить фильтры'));
  const search = $('#deepReviewSearch');
  if (search) search.placeholder = ui('Candidate, creator, source…', 'Кандидат, автор, источник…');
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function populateFilters() {
  const collection = $('#deepReviewCollection');
  if (collection) {
    const groups = COLLECTION_GROUPS.map(group => `<optgroup label="${attr(groupLabel(group.title))}">${group.items.map(name => `<option value="${attr(slug(name))}">${esc(collectionLabel(name))}</option>`).join('')}</optgroup>`).join('');
    collection.innerHTML = `<option value="all">${ui('All Collections', 'Все коллекции')}</option>${groups}`;
    collection.value = state.collection;
  }

  const source = $('#deepReviewSource');
  if (source) {
    const pools = [...new Map((state.queue?.queue || []).map(item => [item.sourcePool || 'unknown', sourcePoolLabel(item.sourcePool)])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
    source.innerHTML = `<option value="all">${ui('All source pools', 'Все источники')}</option>${pools.map(([id, label]) => `<option value="${attr(id)}">${esc(label)}</option>`).join('')}`;
    source.value = state.sourcePool;
  }
}

function groupLabel(value) {
  if (!ru()) return value;
  if (value === 'Commercial') return 'Коммерческие';
  if (value === 'Motion language') return 'Язык движения';
  return value;
}

function sourcePoolLabel(id) {
  const candidate = (state.corpus?.candidates || []).find(item => item.sourcePool === id);
  return candidate?.sourcePoolLabel || id || ui('Unknown source', 'Неизвестный источник');
}

function filteredQueue() {
  const q = state.query.trim().toLowerCase();
  return (state.queue?.queue || []).filter(item => {
    if (state.collection !== 'all' && item.targetCollection !== state.collection && !(item.collectionCandidates || []).includes(state.collection)) return false;
    if (state.sourcePool !== 'all' && item.sourcePool !== state.sourcePool) return false;
    if (!q) return true;
    return [item.title, item.author, item.sourcePool, item.targetCollectionTitle, ...(item.collectionCandidates || [])].join(' ').toLowerCase().includes(q);
  });
}

function candidateMeta(candidateId) {
  return (state.corpus?.candidates || []).find(item => item.id === candidateId) || null;
}

function renderWorkspace() {
  const body = $('#deepReviewBody');
  if (!body) return;
  if (!state.queue || !state.corpus) {
    body.className = 'deep-review-loading';
    body.textContent = ui('Loading deep-review queue…', 'Загружаю очередь deep review…');
    return;
  }
  if (state.queue.error || !(state.queue.queue || []).length) {
    body.className = 'deep-review-loading';
    body.innerHTML = `<div class="deep-review-pending"><strong>${ui('Deep-review queue has not been generated yet.', 'Очередь deep review ещё не сгенерирована.')}</strong><span>${ui('The Pages build will publish case-review-queue.json when the Research Corpus pipeline produces it.', 'Pages build опубликует case-review-queue.json, когда Research Corpus pipeline сможет его собрать.')}</span></div>`;
    return;
  }

  const items = filteredQueue();
  if (!items.some(item => item.candidateId === state.selectedId)) state.selectedId = items[0]?.candidateId || null;
  const selected = items.find(item => item.candidateId === state.selectedId) || null;
  body.className = '';
  body.innerHTML = `
    <div class="deep-review-summary">
      <div><strong>${items.length}</strong><span>${ui('candidates in current queue view', 'кандидатов в текущей очереди')}</span></div>
      <div><strong>${localDraftCount()}</strong><span>${ui('local drafts', 'локальных черновиков')}</span></div>
      <div><strong>${localCompletedCount()}</strong><span>${ui('locally completed reviews', 'локально завершённых review')}</span></div>
    </div>
    <div class="deep-review-shell">
      <aside class="deep-review-queue" aria-label="${attr(ui('Deep-review queue', 'Очередь deep review'))}">
        <div class="deep-queue-head"><strong>${ui('Review queue', 'Очередь')}</strong><span>${items.length}</span></div>
        <div class="deep-queue-list">${items.map(queueRow).join('')}</div>
      </aside>
      <section class="deep-review-editor">${selected ? editorHtml(selected) : emptyEditor()}</section>
    </div>`;

  bindEditorEvents();
  updateGate();
}

function queueRow(item) {
  const draft = loadDraft(item.candidateId, false);
  const status = draft?.localCompletionAt ? 'complete' : draftHasWork(draft) ? 'draft' : 'new';
  const statusText = status === 'complete' ? ui('reviewed', 'reviewed') : status === 'draft' ? ui('draft', 'черновик') : ui('new', 'новый');
  const collectionName = collectionLabel(COLLECTIONS.find(entry => entry.id === item.targetCollection)?.title || item.targetCollectionTitle || item.targetCollection);
  return `<button class="deep-queue-row${item.candidateId === state.selectedId ? ' is-active' : ''}" type="button" data-review-candidate="${attr(item.candidateId)}">
    <span class="deep-queue-priority">${esc(item.priority)}</span>
    <span class="deep-queue-main"><strong>${esc(item.title)}</strong><small>${esc(collectionName)} · ${esc(item.author || '')}</small></span>
    <span class="deep-queue-status ${status}">${esc(statusText)}</span>
  </button>`;
}

function editorHtml(item) {
  const meta = candidateMeta(item.candidateId);
  const draft = loadDraft(item.candidateId, true, item);
  const validation = validateDraft(draft);
  const sourceUrl = item.sourceUrl || meta?.sourceUrl || '';
  const preview = item.previewUrl || meta?.previewUrl || '';
  const collectionName = collectionLabel(COLLECTIONS.find(entry => entry.id === item.targetCollection)?.title || item.targetCollectionTitle || item.targetCollection);
  return `
    <div class="deep-editor-top">
      <div class="deep-editor-source">
        <div class="deep-editor-preview">${preview ? `<img src="${attr(preview)}" loading="lazy" referrerpolicy="no-referrer" alt="${attr(item.title)}">` : '<span>▦</span>'}</div>
        <div><div class="view-kicker">${esc(sourcePoolLabel(item.sourcePool))} · ${esc(collectionName)}</div><h2>${esc(item.title)}</h2><p>${esc(item.author || '')}</p></div>
      </div>
      <div class="deep-editor-links">${sourceUrl ? `<a class="button" href="${attr(sourceUrl)}" target="_blank" rel="noopener">${ui('Open full source video', 'Открыть полное видео')} ↗</a>` : ''}${item.archiveUrl && item.archiveUrl !== sourceUrl ? `<a class="button ghost" href="${attr(item.archiveUrl)}" target="_blank" rel="noopener">${ui('Archive', 'Архив')} ↗</a>` : ''}</div>
    </div>

    <div class="deep-evidence-gate ${validation.ok ? 'is-ready' : ''}" id="deepEvidenceGate">
      <div><span>${ui('Evidence gate', 'Evidence gate')}</span><strong>${validation.ok ? ui('Ready to export deep review', 'Можно экспортировать deep review') : ui(`${validation.blockers.length} blockers remain`, `Осталось блокеров: ${validation.blockers.length}`)}</strong></div>
      <div class="deep-gate-progress"><i style="width:${validation.progress}%"></i></div>
      <p>${validation.ok ? ui('All required observed evidence is present. Export will set reviewStatus to deep-reviewed.', 'Все обязательные наблюдаемые данные заполнены. При экспорте reviewStatus станет deep-reviewed.') : esc(validation.blockers.slice(0, 4).join(' · '))}</p>
    </div>

    <form id="deepReviewForm" class="deep-review-form" data-candidate-id="${attr(item.candidateId)}">
      ${evidenceAttestationHtml(draft, sourceUrl)}
      ${promptAnatomyHtml(draft)}
      ${visualReviewHtml(draft)}
      ${transferHtml(draft)}
      <section class="deep-review-actions-section">
        <div class="deep-local-state"><span>${ui('Autosave', 'Автосохранение')}</span><strong id="deepSaveState">${ui('Saved locally', 'Сохранено локально')}</strong></div>
        <div class="deep-review-actions">
          <button class="button ghost" type="button" id="deepResetDraft">${ui('Reset local draft', 'Сбросить черновик')}</button>
          <button class="button" type="button" id="deepCopyReview" ${validation.ok ? '' : 'disabled'}>${ui('Copy deep-review JSON', 'Скопировать deep-review JSON')}</button>
          <button class="button primary" type="button" id="deepExportReview" ${validation.ok ? '' : 'disabled'}>${ui('Export review JSON', 'Экспортировать review JSON')}</button>
        </div>
      </section>
    </form>`;
}

function evidenceAttestationHtml(draft, sourceUrl) {
  return `<section class="deep-review-section evidence-attestation">
    <div class="deep-section-head"><div><span>${ui('Evidence requirement', 'Требование к доказательности')}</span><h3>${ui('Full-video observation', 'Просмотр полного видео')}</h3></div><span class="deep-required">required</span></div>
    <p>${ui('Do not check this until you have watched the complete source video. A prompt, thumbnail, GIF preview or source description is not enough.', 'Не отмечай этот пункт, пока не просмотрел полное исходное видео. Промпта, превью, GIF или описания источника недостаточно.')}</p>
    <label class="deep-attest"><input type="checkbox" name="completeVideoWatched" ${draft.evidenceAttestation?.completeVideoWatched ? 'checked' : ''}><span><strong>${ui('I watched the complete source video', 'Я просмотрел полное исходное видео')}</strong><small>${ui('This unlocks deep-reviewed status only after all observed fields are also complete.', 'Это разрешает deep-reviewed только после заполнения всех наблюдаемых полей.')}</small></span></label>
    <label>${ui('Source video URL', 'Ссылка на полное видео')}<input name="sourceVideoUrl" type="url" value="${attr(draft.sourceVideoUrl || sourceUrl || '')}" placeholder="https://…"></label>
  </section>`;
}

function promptAnatomyHtml(draft) {
  const p = draft.promptAnatomy || {};
  return `<section class="deep-review-section">
    <div class="deep-section-head"><div><span>${ui('Stage 1', 'Этап 1')}</span><h3>${ui('Prompt anatomy', 'Анатомия промпта')}</h3></div><span>${ui('requested behavior', 'что было запрошено')}</span></div>
    ${textarea('thesis', ui('Thesis', 'Тезис'), p.thesis, ui('What production logic is this prompt trying to create?', 'Какую production-логику пытается создать промпт?'))}
    ${textarea('signatureMove', ui('Requested signature move', 'Заявленная главная фишка'), p.signatureMove, ui('One concise mechanism, not the subject matter.', 'Один механизм, а не сюжет/объект.'))}
    ${textarea('shotBreakdown', ui('Requested shot / beat breakdown', 'Запрошенные кадры / биты'), lines(p.shotBreakdown), ui('One shot or continuous beat per line.', 'Один кадр или непрерывный бит на строку.'))}
    ${textarea('causalMechanics', ui('Causal mechanics', 'Причинная механика'), lines(p.causalMechanics), ui('At least two: instruction → expected visible effect.', 'Минимум два: инструкция → ожидаемый видимый эффект.'))}
    ${textarea('referenceStrategy', ui('Reference strategy', 'Стратегия референсов'), p.referenceStrategy, ui('What each reference is supposed to control.', 'Что именно должен контролировать каждый референс.'))}
    ${textarea('motionLanguage', ui('Requested motion language', 'Запрошенный язык движения'), lines(p.motionLanguage), ui('One camera or subject-motion rule per line.', 'Одно правило камеры или движения объекта на строку.'))}
    ${textarea('failureRisks', ui('Expected failure risks', 'Ожидаемые риски'), lines(p.failureRisks), ui('At least two likely failure modes.', 'Минимум два вероятных сбоя.'))}
  </section>`;
}

function visualReviewHtml(draft) {
  const v = draft.visualReview || {};
  const shots = Array.isArray(v.observedShots) && v.observedShots.length ? v.observedShots : [emptyObservedShot(1)];
  return `<section class="deep-review-section visual-review-section">
    <div class="deep-section-head"><div><span>${ui('Stage 2', 'Этап 2')}</span><h3>${ui('Observed visual review', 'Наблюдаемый визуальный разбор')}</h3></div><span>${ui('what actually happened', 'что реально произошло')}</span></div>
    <p class="deep-section-note">${ui('Record only what is visible in the complete output. Do not copy the prompt into observed fields.', 'Фиксируй только то, что реально видно в полном output. Не копируй промпт в observed-поля.')}</p>
    <div id="observedShots" class="observed-shot-list">${shots.map((shot, index) => observedShotHtml(shot, index)).join('')}</div>
    <button class="button small" type="button" id="addObservedShot">＋ ${ui('Add observed shot', 'Добавить наблюдаемый кадр')}</button>
    <div class="deep-two-col">
      <div>${textarea('observedTransitions', ui('Observed transitions', 'Наблюдаемые переходы'), lines(v.observedTransitions), ui('One actual transition per line.', 'Один реально увиденный переход на строку.'))}<label class="deep-mini-check"><input type="checkbox" name="noTransitionsObserved" ${v.noTransitionsObserved ? 'checked' : ''}>${ui('No transitions observed', 'Переходов не было')}</label></div>
      <div>${textarea('observedArtifacts', ui('Observed artifacts / compromises', 'Артефакты / компромиссы'), lines(v.observedArtifacts), ui('Visible failures only.', 'Только реально видимые сбои.'))}<label class="deep-mini-check"><input type="checkbox" name="noArtifactsObserved" ${v.noArtifactsObserved ? 'checked' : ''}>${ui('No visible artifacts observed', 'Видимых артефактов не обнаружено')}</label></div>
    </div>
    ${textarea('observedMotion', ui('Observed motion', 'Наблюдаемое движение'), lines(v.observedMotion), ui('Camera, body, object and material motion actually visible.', 'Реально видимое движение камеры, тела, объекта и материалов.'))}
    ${textarea('observedContinuity', ui('Observed continuity', 'Наблюдаемая непрерывность'), lines(v.observedContinuity), ui('What stayed stable and what drifted.', 'Что сохранилось, а что поплыло.'))}
    ${textarea('verifiedSignatureMove', ui('Verified signature move', 'Подтверждённая главная фишка'), v.verifiedSignatureMove, ui('Revise the prompt hypothesis using observed evidence.', 'Перепроверь гипотезу промпта по наблюдаемому результату.'))}
    ${textarea('whyItWorked', ui('Why the observed result works', 'Почему наблюдаемый результат работает'), lines(v.whyItWorked), ui('At least two observed reasons.', 'Минимум две причины из наблюдаемого результата.'))}
    ${textarea('whatDidNotWork', ui('What did not work', 'Что не сработало'), lines(v.whatDidNotWork), ui('Optional, but record meaningful compromises.', 'Необязательно, но фиксируй существенные компромиссы.'))}
  </section>`;
}

function observedShotHtml(shot, index) {
  const n = index + 1;
  return `<article class="observed-shot" data-observed-shot="${index}">
    <div class="observed-shot-head"><strong>${ui('Observed shot', 'Наблюдаемый кадр')} ${n}</strong>${index > 0 ? `<button type="button" class="deep-remove-shot" data-remove-shot="${index}" aria-label="${attr(ui('Remove shot', 'Удалить кадр'))}">×</button>` : ''}</div>
    <div class="deep-two-col">
      <label>${ui('Framing', 'Кадрирование')}<input data-shot-field="observedFraming" value="${attr(shot.observedFraming || '')}" placeholder="${attr(ui('wide, macro, medium…', 'общий, макро, средний…'))}"></label>
      <label>${ui('Camera', 'Камера')}<input data-shot-field="observedCamera" value="${attr(shot.observedCamera || '')}" placeholder="${attr(ui('static, push-in, tracking…', 'статика, push-in, tracking…'))}"></label>
    </div>
    <label>${ui('Observed action', 'Наблюдаемое действие')}<textarea data-shot-field="observedAction" rows="2">${esc(shot.observedAction || '')}</textarea></label>
    <div class="deep-two-col">
      <label>${ui('Prompt match', 'Соответствие промпту')}<select data-shot-field="promptMatch">${['strong','partial','weak','invented'].map(value => `<option value="${value}" ${shot.promptMatch === value ? 'selected' : ''}>${promptMatchLabel(value)}</option>`).join('')}</select></label>
      <label>${ui('Attention mechanic', 'Механика внимания')}<input data-shot-field="attentionMechanic" value="${attr(shot.attentionMechanic || '')}" placeholder="${attr(ui('What makes the viewer look here?', 'Почему взгляд цепляется сюда?'))}"></label>
    </div>
    <label>${ui('Notes', 'Заметки')}<textarea data-shot-field="notes" rows="2">${esc(shot.notes || '')}</textarea></label>
  </article>`;
}

function promptMatchLabel(value) {
  return ({ strong: ui('Strong match', 'Сильное соответствие'), partial: ui('Partial', 'Частично'), weak: ui('Weak', 'Слабо'), invented: ui('Model invented it', 'Модель это придумала') })[value] || value;
}

function transferHtml(draft) {
  const t = draft.transfer || {};
  return `<section class="deep-review-section transfer-review-section">
    <div class="deep-section-head"><div><span>${ui('Stage 3', 'Этап 3')}</span><h3>${ui('Transferable production pattern', 'Переносимый production-паттерн')}</h3></div><span>${ui('abstract the mechanism', 'отделить механизм от сюжета')}</span></div>
    ${textarea('transferablePattern', ui('Transferable pattern', 'Переносимый паттерн'), t.transferablePattern, ui('Describe production logic that survives after replacing source subject matter.', 'Опиши production-логику, которая сохранится после замены исходного сюжета.'))}
    ${textarea('doTransfer', ui('Do transfer', 'Переносить'), lines(t.doTransfer), ui('One reusable mechanism per line.', 'Один переиспользуемый механизм на строку.'))}
    ${textarea('doNotTransfer', ui('Do not transfer', 'Не переносить'), lines(t.doNotTransfer), ui('Characters, trademarks, wording, incidental locations…', 'Персонажи, товарные знаки, формулировки, случайные локации…'))}
    ${textarea('bestFor', ui('Best for', 'Лучше всего подходит для'), lines(t.bestFor), ui('Project types / industries where the pattern is useful.', 'Типы проектов / индустрии, где паттерн полезен.'))}
  </section>`;
}

function textarea(name, label, value, placeholder) {
  return `<label>${esc(label)}<textarea name="${attr(name)}" rows="3" placeholder="${attr(placeholder)}">${esc(value || '')}</textarea></label>`;
}

function emptyEditor() {
  return `<div class="deep-empty-editor"><strong>${ui('No candidates match the filters.', 'Нет кандидатов по выбранным фильтрам.')}</strong><span>${ui('Change the queue filters in the sidebar.', 'Измени фильтры очереди слева.')}</span></div>`;
}

function bindEditorEvents() {
  const form = $('#deepReviewForm');
  if (!form) return;
  $('#addObservedShot')?.addEventListener('click', () => {
    const draft = collectDraft(form);
    draft.visualReview.observedShots.push(emptyObservedShot(draft.visualReview.observedShots.length + 1));
    saveDraft(draft);
    renderWorkspace();
  });
  $$('[data-remove-shot]', form).forEach(button => button.addEventListener('click', () => {
    const draft = collectDraft(form);
    draft.visualReview.observedShots.splice(Number(button.dataset.removeShot), 1);
    draft.visualReview.observedShots.forEach((shot, index) => { shot.n = index + 1; });
    saveDraft(draft);
    renderWorkspace();
  }));
  $('#deepResetDraft')?.addEventListener('click', () => {
    localStorage.removeItem(`${STORAGE_PREFIX}${form.dataset.candidateId}`);
    renderWorkspace();
  });
  $('#deepCopyReview')?.addEventListener('click', async () => {
    const draft = collectDraft(form);
    const validation = validateDraft(draft);
    if (!validation.ok) return;
    const review = buildFinalReview(draft);
    await navigator.clipboard.writeText(JSON.stringify(review, null, 2));
    markLocalCompletion(draft);
    flashSaveState(ui('Copied and marked complete locally', 'Скопировано и отмечено завершённым локально'));
    renderWorkspace();
  });
  $('#deepExportReview')?.addEventListener('click', () => {
    const draft = collectDraft(form);
    const validation = validateDraft(draft);
    if (!validation.ok) return;
    const review = buildFinalReview(draft);
    exportJson(review, `${safeFilename(draft.candidateId)}.deep-review.json`);
    markLocalCompletion(draft);
    renderWorkspace();
  });
}

function handleFormMutation() {
  const form = $('#deepReviewForm');
  if (!form) return;
  const draft = collectDraft(form);
  saveDraft(draft);
  flashSaveState(ui('Saved locally', 'Сохранено локально'));
  updateGate(draft);
}

function saveCurrentForm() {
  const form = $('#deepReviewForm');
  if (!form) return;
  saveDraft(collectDraft(form));
}

function collectDraft(form) {
  const candidateId = form.dataset.candidateId;
  const previous = loadDraft(candidateId, true) || defaultDraft(candidateId);
  const shots = $$('[data-observed-shot]', form).map((root, index) => ({
    n: index + 1,
    observedFraming: $('[data-shot-field="observedFraming"]', root)?.value.trim() || '',
    observedCamera: $('[data-shot-field="observedCamera"]', root)?.value.trim() || '',
    observedAction: $('[data-shot-field="observedAction"]', root)?.value.trim() || '',
    promptMatch: $('[data-shot-field="promptMatch"]', root)?.value || '',
    attentionMechanic: $('[data-shot-field="attentionMechanic"]', root)?.value.trim() || '',
    notes: $('[data-shot-field="notes"]', root)?.value.trim() || ''
  }));

  return {
    ...previous,
    candidateId,
    reviewStatus: 'draft',
    sourceVideoUrl: form.elements.sourceVideoUrl?.value.trim() || '',
    evidenceAttestation: {
      completeVideoWatched: Boolean(form.elements.completeVideoWatched?.checked),
      attestedAt: form.elements.completeVideoWatched?.checked ? (previous.evidenceAttestation?.attestedAt || new Date().toISOString()) : null
    },
    promptAnatomy: {
      thesis: form.elements.thesis?.value.trim() || '',
      signatureMove: form.elements.signatureMove?.value.trim() || '',
      shotBreakdown: parseLines(form.elements.shotBreakdown?.value),
      causalMechanics: parseLines(form.elements.causalMechanics?.value),
      referenceStrategy: form.elements.referenceStrategy?.value.trim() || '',
      motionLanguage: parseLines(form.elements.motionLanguage?.value),
      failureRisks: parseLines(form.elements.failureRisks?.value)
    },
    visualReview: {
      observedShots: shots,
      observedTransitions: parseLines(form.elements.observedTransitions?.value),
      noTransitionsObserved: Boolean(form.elements.noTransitionsObserved?.checked),
      observedMotion: parseLines(form.elements.observedMotion?.value),
      observedArtifacts: parseLines(form.elements.observedArtifacts?.value),
      noArtifactsObserved: Boolean(form.elements.noArtifactsObserved?.checked),
      observedContinuity: parseLines(form.elements.observedContinuity?.value),
      verifiedSignatureMove: form.elements.verifiedSignatureMove?.value.trim() || '',
      whyItWorked: parseLines(form.elements.whyItWorked?.value),
      whatDidNotWork: parseLines(form.elements.whatDidNotWork?.value)
    },
    transfer: {
      transferablePattern: form.elements.transferablePattern?.value.trim() || '',
      doTransfer: parseLines(form.elements.doTransfer?.value),
      doNotTransfer: parseLines(form.elements.doNotTransfer?.value),
      bestFor: parseLines(form.elements.bestFor?.value)
    },
    updatedAt: new Date().toISOString()
  };
}

function defaultDraft(candidateId, queueItem = null) {
  return {
    schemaVersion: 1,
    candidateId,
    reviewStatus: 'draft',
    sourceVideoUrl: queueItem?.sourceUrl || '',
    evidenceAttestation: { completeVideoWatched: false, attestedAt: null },
    promptAnatomy: { thesis: '', signatureMove: '', shotBreakdown: [], causalMechanics: [], referenceStrategy: '', motionLanguage: [], failureRisks: [] },
    visualReview: { observedShots: [emptyObservedShot(1)], observedTransitions: [], noTransitionsObserved: false, observedMotion: [], observedArtifacts: [], noArtifactsObserved: false, observedContinuity: [], verifiedSignatureMove: '', whyItWorked: [], whatDidNotWork: [] },
    transfer: { transferablePattern: '', doTransfer: [], doNotTransfer: [], bestFor: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    localCompletionAt: null
  };
}

function emptyObservedShot(n) {
  return { n, observedFraming: '', observedCamera: '', observedAction: '', promptMatch: '', attentionMechanic: '', notes: '' };
}

function loadDraft(candidateId, create = false, queueItem = null) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${candidateId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return create ? defaultDraft(candidateId, queueItem) : null;
}

function saveDraft(draft) {
  try { localStorage.setItem(`${STORAGE_PREFIX}${draft.candidateId}`, JSON.stringify(draft)); } catch {}
}

function draftHasWork(draft) {
  if (!draft) return false;
  const copy = JSON.stringify(draft);
  return Boolean(draft.evidenceAttestation?.completeVideoWatched || draft.promptAnatomy?.thesis || draft.visualReview?.verifiedSignatureMove || draft.transfer?.transferablePattern || (draft.visualReview?.observedShots || []).some(shot => shot.observedAction));
}

function localDraftCount() {
  return (state.queue?.queue || []).filter(item => draftHasWork(loadDraft(item.candidateId, false))).length;
}

function localCompletedCount() {
  return (state.queue?.queue || []).filter(item => Boolean(loadDraft(item.candidateId, false)?.localCompletionAt)).length;
}

function validateDraft(draft) {
  const blockers = [];
  const checks = [];
  const requireCheck = (ok, message) => { checks.push(Boolean(ok)); if (!ok) blockers.push(message); };
  const p = draft.promptAnatomy || {};
  const v = draft.visualReview || {};
  const t = draft.transfer || {};

  requireCheck(draft.evidenceAttestation?.completeVideoWatched, ui('Confirm complete-video viewing', 'Подтверди просмотр полного видео'));
  requireCheck(/^https?:\/\//i.test(draft.sourceVideoUrl || ''), ui('Add the full source video URL', 'Добавь ссылку на полное видео'));
  requireCheck(String(p.thesis || '').length >= 20, ui('Write the prompt-analysis thesis', 'Заполни тезис prompt-разбора'));
  requireCheck(String(p.signatureMove || '').length >= 10, ui('Describe the requested signature move', 'Опиши заявленную главную фишку'));
  requireCheck((p.shotBreakdown || []).length >= 1, ui('Add requested shot / beat breakdown', 'Добавь разбор запрошенных кадров / битов'));
  requireCheck((p.causalMechanics || []).length >= 2, ui('Add at least two causal mechanics', 'Добавь минимум две причинные механики'));
  requireCheck(String(p.referenceStrategy || '').length >= 5, ui('Describe reference strategy', 'Опиши стратегию референсов'));
  requireCheck((p.motionLanguage || []).length >= 1, ui('Add requested motion language', 'Добавь запрошенный язык движения'));
  requireCheck((p.failureRisks || []).length >= 2, ui('Add at least two failure risks', 'Добавь минимум два риска'));

  const observedShots = v.observedShots || [];
  requireCheck(observedShots.length >= 1 && observedShots.every(shot => shot.observedFraming && shot.observedCamera && shot.observedAction && ['strong','partial','weak','invented'].includes(shot.promptMatch) && shot.attentionMechanic), ui('Complete every observed-shot field', 'Заполни все обязательные поля наблюдаемых кадров'));
  requireCheck((v.observedTransitions || []).length >= 1 || v.noTransitionsObserved, ui('Record transitions or explicitly mark none', 'Зафиксируй переходы или явно отметь, что их не было'));
  requireCheck((v.observedMotion || []).length >= 1, ui('Record observed motion', 'Зафиксируй наблюдаемое движение'));
  requireCheck((v.observedArtifacts || []).length >= 1 || v.noArtifactsObserved, ui('Record artifacts or explicitly mark none', 'Зафиксируй артефакты или явно отметь, что их не было'));
  requireCheck((v.observedContinuity || []).length >= 1, ui('Record observed continuity', 'Зафиксируй наблюдаемую непрерывность'));
  requireCheck(String(v.verifiedSignatureMove || '').length >= 10, ui('Verify or revise the signature move', 'Подтверди или пересобери главную фишку'));
  requireCheck((v.whyItWorked || []).length >= 2, ui('Add at least two observed reasons why it works', 'Добавь минимум две наблюдаемые причины, почему это работает'));

  requireCheck(String(t.transferablePattern || '').length >= 20, ui('Write the transferable pattern', 'Опиши переносимый паттерн'));
  requireCheck((t.doTransfer || []).length >= 1, ui('Add what should transfer', 'Добавь, что переносим'));
  requireCheck((t.doNotTransfer || []).length >= 1, ui('Add what must not transfer', 'Добавь, что нельзя переносить'));

  const passed = checks.filter(Boolean).length;
  const progress = Math.round((passed / Math.max(1, checks.length)) * 100);
  return { ok: blockers.length === 0, blockers, progress, passed, total: checks.length };
}

function updateGate(draft = null) {
  const form = $('#deepReviewForm');
  if (!form) return;
  const current = draft || collectDraft(form);
  const validation = validateDraft(current);
  const gate = $('#deepEvidenceGate');
  if (gate) {
    gate.classList.toggle('is-ready', validation.ok);
    const strong = $('strong', gate);
    if (strong) strong.textContent = validation.ok ? ui('Ready to export deep review', 'Можно экспортировать deep review') : ui(`${validation.blockers.length} blockers remain`, `Осталось блокеров: ${validation.blockers.length}`);
    const progress = $('.deep-gate-progress i', gate);
    if (progress) progress.style.width = `${validation.progress}%`;
    const paragraph = $('p', gate);
    if (paragraph) paragraph.textContent = validation.ok ? ui('All required observed evidence is present. Export will set reviewStatus to deep-reviewed.', 'Все обязательные наблюдаемые данные заполнены. При экспорте reviewStatus станет deep-reviewed.') : validation.blockers.slice(0, 4).join(' · ');
  }
  const copy = $('#deepCopyReview');
  const exportButton = $('#deepExportReview');
  if (copy) copy.disabled = !validation.ok;
  if (exportButton) exportButton.disabled = !validation.ok;
}

function buildFinalReview(draft) {
  const validation = validateDraft(draft);
  if (!validation.ok) throw new Error('Deep-review evidence gate is not complete.');
  return {
    schemaVersion: 1,
    candidateId: draft.candidateId,
    reviewStatus: 'deep-reviewed',
    reviewedAt: new Date().toISOString(),
    sourceVideoUrl: draft.sourceVideoUrl,
    evidenceAttestation: {
      completeVideoWatched: true,
      attestedAt: draft.evidenceAttestation.attestedAt || new Date().toISOString(),
      method: 'manual-complete-video-review'
    },
    promptAnatomy: draft.promptAnatomy,
    visualReview: {
      observedShots: draft.visualReview.observedShots,
      observedTransitions: draft.visualReview.observedTransitions,
      observedMotion: draft.visualReview.observedMotion,
      observedArtifacts: draft.visualReview.observedArtifacts,
      observedContinuity: draft.visualReview.observedContinuity,
      verifiedSignatureMove: draft.visualReview.verifiedSignatureMove,
      whyItWorked: draft.visualReview.whyItWorked,
      whatDidNotWork: draft.visualReview.whatDidNotWork
    },
    transfer: draft.transfer
  };
}

function markLocalCompletion(draft) {
  draft.localCompletionAt = new Date().toISOString();
  saveDraft(draft);
}

function exportJson(value, filename) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function flashSaveState(message) {
  const node = $('#deepSaveState');
  if (!node) return;
  node.textContent = message;
  clearTimeout(flashSaveState.timer);
  flashSaveState.timer = setTimeout(() => { if (node) node.textContent = ui('Saved locally', 'Сохранено локально'); }, 1200);
}

function parseLines(value) {
  return String(value || '').split(/\n+/).map(line => line.trim()).filter(Boolean);
}

function lines(value) {
  return Array.isArray(value) ? value.join('\n') : String(value || '');
}

function safeFilename(value) {
  return String(value || 'case-review').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '');
}
