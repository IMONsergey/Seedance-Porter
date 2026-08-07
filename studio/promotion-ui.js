import { COLLECTION_GROUPS } from './case-intelligence-runtime.js';
import { collectionLabel, getLanguage } from './i18n.js';
import { buildPromotionAnalysis, buildCuratedImplementationDraft, validateEditorialGate } from './promotion-engine.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const ru = () => getLanguage() === 'ru';
const ui = (en, ruText) => ru() ? ruText : en;
const slug = value => String(value || '').toLowerCase().replace(/\//g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const COLLECTIONS = COLLECTION_GROUPS.flatMap(group => group.items.map(title => ({ group: group.title, title, id: slug(title) })));
const EDITORIAL_PREFIX = 'porterPromotionEditorial:';

const state = {
  corpus: null,
  review: null,
  analysis: null,
  parseError: ''
};

injectNav();
injectView();
bindGlobalEvents();
localizeShell();
loadCorpus();

function injectNav() {
  const nav = $('.sidebar-nav');
  if (!nav || $('[data-case-view="promotion"]', nav)) return;
  const button = document.createElement('button');
  button.className = 'nav-tab';
  button.type = 'button';
  button.dataset.caseView = 'promotion';
  button.innerHTML = '<span class="nav-icon">↑</span><span data-promotion-nav-label></span>';
  const deepTab = $('[data-case-view="deep-review"]', nav);
  if (deepTab) deepTab.insertAdjacentElement('afterend', button);
  else nav.appendChild(button);
}

function injectView() {
  const main = $('.page');
  if (!main || $('#promotionView')) return;
  const section = document.createElement('section');
  section.id = 'promotionView';
  section.className = 'library-view promotion-view';
  section.hidden = true;
  section.innerHTML = `
    <header class="view-header promotion-header">
      <div>
        <div class="view-kicker" data-promotion-kicker></div>
        <h1 data-promotion-title></h1>
        <p data-promotion-description></p>
      </div>
    </header>
    <div id="promotionBody"></div>`;
  main.appendChild(section);
}

async function loadCorpus() {
  try {
    const response = await fetch('./case-candidates.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.corpus = await response.json();
  } catch (error) {
    state.corpus = { candidates: [], error: String(error?.message || error) };
  }
  if (!$('#promotionView')?.hidden) render();
}

function bindGlobalEvents() {
  document.addEventListener('click', event => {
    const promotionTab = event.target.closest('[data-case-view="promotion"]');
    if (promotionTab) {
      event.preventDefault();
      showPromotion();
      return;
    }
    const otherTab = event.target.closest('.nav-tab[data-view], [data-case-view]');
    if (otherTab && otherTab.dataset.caseView !== 'promotion') hidePromotion();
  });

  window.addEventListener('porter-language-change', () => {
    localizeShell();
    if (!$('#promotionView')?.hidden) render();
  });
}

function showPromotion() {
  for (const id of ['digestView', 'promptView', 'sourceView', 'corpusView', 'deepReviewView']) {
    const element = $(`#${id}`);
    if (element) element.hidden = true;
  }
  const view = $('#promotionView');
  if (view) view.hidden = false;
  $$('.nav-tab').forEach(tab => tab.classList.remove('is-active'));
  $('[data-case-view="promotion"]')?.classList.add('is-active');
  const sidebarState = $('#sidebarState');
  if (sidebarState) sidebarState.checked = false;
  render();
}

function hidePromotion() {
  const view = $('#promotionView');
  if (view) view.hidden = true;
}

function localizeShell() {
  setText('[data-promotion-nav-label]', ui('Promotion', 'Промоут в curated'));
  setText('[data-promotion-kicker]', ui('Deep review → editorial gate → curated implementation draft', 'Deep review → editorial gate → curated implementation draft'));
  setText('[data-promotion-title]', ui('Curation Promotion Workspace', 'Curation Promotion Workspace'));
  setText('[data-promotion-description]', ui(
    'Evaluate a completed deep-review against current corpus metadata, resolve attribution/editorial checks, then export an implementation draft. This workspace never writes directly to Industry Digest.',
    'Проверяет готовый deep-review вместе с метаданными корпуса, проводит editorial/атрибуционный gate и экспортирует implementation draft. Этот workspace никогда сам не записывает кейс в Industry Digest.'
  ));
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function render() {
  const body = $('#promotionBody');
  if (!body) return;
  body.innerHTML = `
    <div class="promotion-layout">
      <section class="promotion-import-panel">${importPanelHtml()}</section>
      <section class="promotion-main">${state.analysis ? analysisHtml() : emptyAnalysisHtml()}</section>
    </div>`;
  bindImportEvents();
  if (state.analysis) bindEditorialEvents();
}

function importPanelHtml() {
  const reviewLabel = state.review?.candidateId ? `${state.review.candidateId} · ${state.review.reviewStatus}` : ui('No review loaded', 'Review не загружен');
  return `
    <div class="promotion-panel-head"><span>${ui('Input', 'Вход')}</span><h3>${ui('Deep-review JSON', 'Deep-review JSON')}</h3></div>
    <div class="promotion-loaded-review ${state.review ? 'has-review' : ''}"><strong>${esc(reviewLabel)}</strong><span>${state.review ? ui('Loaded into readiness analysis', 'Загружен в readiness analysis') : ui('Export a review from Deep Review Workspace first.', 'Сначала экспортируй review из Deep Review Workspace.')}</span></div>
    <label class="promotion-file-drop" id="promotionDropZone">
      <input id="promotionReviewFile" type="file" accept="application/json,.json" />
      <strong>${ui('Choose deep-review JSON', 'Выбрать deep-review JSON')}</strong>
      <span>${ui('or drop the file here', 'или перетащи файл сюда')}</span>
    </label>
    <div class="promotion-or"><span>${ui('or paste JSON', 'или вставь JSON')}</span></div>
    <textarea id="promotionReviewPaste" rows="9" placeholder="{ &quot;reviewStatus&quot;: &quot;deep-reviewed&quot;, … }"></textarea>
    <button class="button primary promotion-wide" id="promotionParseReview" type="button">${ui('Analyze review', 'Проанализировать review')}</button>
    ${state.parseError ? `<div class="promotion-error"><strong>${ui('Cannot analyze JSON', 'Не удалось разобрать JSON')}</strong><span>${esc(state.parseError)}</span></div>` : ''}
    <div class="promotion-policy"><strong>${ui('No automatic curation', 'Никакого автокурейта')}</strong><span>${ui('This tool creates files only. A reviewed repository code change is still required to add a curated case.', 'Инструмент только создаёт файлы. Для добавления curated-кейса всё равно нужен отдельный проверенный code change в репозитории.')}</span></div>`;
}

function emptyAnalysisHtml() {
  return `<div class="promotion-empty"><strong>${ui('Load a completed deep-review JSON.', 'Загрузи готовый deep-review JSON.')}</strong><span>${ui('The workspace will join it to the current Research Corpus candidate and show hard blockers, advisories and editorial readiness.', 'Workspace свяжет его с кандидатом из текущего Research Corpus и покажет hard blockers, advisories и editorial readiness.')}</span></div>`;
}

function analysisHtml() {
  const analysis = state.analysis;
  const readiness = analysis.readiness;
  const candidateFound = Boolean(analysis.source);
  const editorial = loadEditorial(analysis.candidateId, analysis);
  const gate = validateEditorialGate(analysis, editorial);
  return `
    <div class="promotion-score-card ${readiness.eligibleForEditorialReview ? 'eligible' : 'blocked'}">
      <div class="promotion-score"><strong>${readiness.score}</strong><span>/100</span></div>
      <div><span>${ui('Curation readiness', 'Готовность к curation')}</span><h2>${tierLabel(readiness.tier)}</h2><p>${readiness.eligibleForEditorialReview ? ui('Evidence can enter editorial review. It is not curated yet.', 'Evidence можно передавать в editorial review. Кейс ещё не curated.') : ui('Hard blockers must be resolved before editorial promotion.', 'Перед editorial promotion нужно снять hard blockers.')}</p></div>
    </div>
    ${!candidateFound ? `<div class="promotion-blockers"><strong>${ui('Candidate metadata missing', 'Не найдены метаданные кандидата')}</strong><span>${ui('The review candidateId is not present in the currently deployed corpus snapshot.', 'candidateId из review отсутствует в текущем snapshot корпуса.')}</span></div>` : sourceEvidenceHtml(analysis)}
    ${readiness.blockers.length ? issueList(ui('Hard blockers', 'Hard blockers'), readiness.blockers, 'blocker') : ''}
    ${readiness.advisories.length ? issueList(ui('Advisories', 'Advisories'), readiness.advisories, 'advisory') : ''}
    ${patternHtml(analysis)}
    ${editorialHtml(analysis, editorial, gate)}
  `;
}

function sourceEvidenceHtml(analysis) {
  const source = analysis.source;
  const evidence = analysis.evidence;
  const match = evidence.promptMatch || {};
  return `<section class="promotion-section">
    <div class="promotion-section-head"><div><span>${ui('Source + evidence', 'Источник + evidence')}</span><h3>${esc(source.title)}</h3></div><a class="button small" href="${attr(source.sourceUrl)}" target="_blank" rel="noopener">${ui('Open source', 'Открыть источник')} ↗</a></div>
    <div class="promotion-facts">
      <div><span>${ui('Creator', 'Автор')}</span><strong>${esc(source.author || '—')}</strong></div>
      <div><span>${ui('Source pool', 'Источник')}</span><strong>${esc(source.sourcePoolLabel || source.sourcePool || '—')}</strong></div>
      <div><span>${ui('Observed shots', 'Наблюдаемых кадров')}</span><strong>${evidence.observedShotCount}</strong></div>
      <div><span>${ui('Prompt match', 'Соответствие промпту')}</span><strong>${Number(match.strong || 0)} strong · ${Number(match.partial || 0)} partial · ${Number(match.weak || 0)} weak · ${Number(match.invented || 0)} invented</strong></div>
    </div>
    ${source.excerpt ? `<blockquote class="promotion-excerpt">${esc(source.excerpt)}</blockquote>` : ''}
  </section>`;
}

function issueList(title, items, type) {
  return `<section class="promotion-issues ${type}"><strong>${esc(title)}</strong>${items.map(item => `<span>${esc(item)}</span>`).join('')}</section>`;
}

function patternHtml(analysis) {
  const pattern = analysis.pattern;
  return `<section class="promotion-section">
    <div class="promotion-section-head"><div><span>${ui('Verified production mechanism', 'Подтверждённый production-механизм')}</span><h3>${ui('What survives curation', 'Что переживает curation')}</h3></div></div>
    <div class="promotion-pattern-lead"><span>${ui('Verified signature move', 'Подтверждённая главная фишка')}</span><strong>${esc(pattern.verifiedSignatureMove)}</strong></div>
    <p>${esc(pattern.transferablePattern)}</p>
    <div class="promotion-two-col">
      <div><span class="promotion-small-head">${ui('Transfer', 'Переносить')}</span>${listHtml(pattern.doTransfer)}</div>
      <div><span class="promotion-small-head">${ui('Do not transfer', 'Не переносить')}</span>${listHtml(pattern.doNotTransfer)}</div>
    </div>
    <div class="promotion-adaptation-brief"><span>${ui('Independent adaptation brief', 'Brief для независимой адаптации')}</span><p>${esc(analysis.adaptationBrief.objective)}</p><div class="promotion-beats">${analysis.adaptationBrief.beatStructure.map(beat => `<article><strong>${beat.beat}</strong><span>${esc(beat.framing)} · ${esc(beat.camera)}</span><p>${esc(beat.attentionMechanic)}</p></article>`).join('')}</div></div>
  </section>`;
}

function listHtml(values) {
  return `<ul>${(values || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function editorialHtml(analysis, editorial, gate) {
  const canEdit = analysis.readiness.eligibleForEditorialReview;
  const collectionSet = new Set(editorial.collections || []);
  return `<section class="promotion-section editorial-section ${canEdit ? '' : 'is-locked'}">
    <div class="promotion-section-head"><div><span>${ui('Editorial gate', 'Editorial gate')}</span><h3>${ui('Curated implementation draft', 'Curated implementation draft')}</h3></div><span class="promotion-gate-status ${gate.ok ? 'ready' : ''}" id="promotionGateStatus">${gate.ok ? ui('Ready', 'Готово') : `${gate.blockers.length} blockers`}</span></div>
    <p class="promotion-note">${ui('The Porter Adaptation must be independently written from the verified mechanism. Do not paste the source prompt or simply rename its subject.', 'Porter Adaptation нужно написать независимо от подтверждённого механизма. Нельзя вставлять исходный промпт или просто переименовать его объект.')}</p>
    ${!canEdit ? `<div class="promotion-editor-lock">${ui('Resolve readiness hard blockers before the editorial gate can be completed.', 'Сначала сними hard blockers readiness — только потом можно завершать editorial gate.')}</div>` : ''}
    <form id="promotionEditorialForm" data-candidate-id="${attr(analysis.candidateId)}">
      <div class="promotion-two-col">
        <label>${ui('Final title', 'Финальный title')}<input name="title" value="${attr(editorial.title || '')}" ${canEdit ? '' : 'disabled'}></label>
        <label>${ui('Russian title', 'Русский title')}<input name="titleRu" value="${attr(editorial.titleRu || '')}" ${canEdit ? '' : 'disabled'}></label>
        <label>${ui('Category', 'Категория')}<input name="category" value="${attr(editorial.category || '')}" placeholder="Product / Beauty" ${canEdit ? '' : 'disabled'}></label>
        <label>${ui('Subcategory', 'Подкатегория')}<input name="subcategory" value="${attr(editorial.subcategory || '')}" placeholder="Luxury fragrance" ${canEdit ? '' : 'disabled'}></label>
      </div>
      <label>${ui('Tags', 'Теги')}<input name="tags" value="${attr((editorial.tags || []).join(', '))}" placeholder="beauty, material, macro" ${canEdit ? '' : 'disabled'}></label>
      <fieldset class="promotion-collections" ${canEdit ? '' : 'disabled'}><legend>${ui('Collections', 'Коллекции')}</legend>${COLLECTION_GROUPS.map(group => `<div><strong>${esc(groupLabel(group.title))}</strong>${group.items.map(name => { const id = slug(name); return `<label><input type="checkbox" name="collection" value="${attr(id)}" ${collectionSet.has(id) ? 'checked' : ''}><span>${esc(collectionLabel(name))}</span></label>`; }).join('')}</div>`).join('')}</fieldset>
      <label>${ui('Observed-evidence Why it works', 'Why it works на основе наблюдаемого evidence')}<textarea name="whyItWorks" rows="5" ${canEdit ? '' : 'disabled'} placeholder="${attr(ui('Write from observed evidence, not from the source description.', 'Пиши по наблюдаемому результату, а не по описанию источника.'))}">${esc(editorial.whyItWorks || '')}</textarea></label>
      <label>${ui('Independent Porter Adaptation', 'Независимая Porter Adaptation')}<textarea name="porterAdaptation" rows="10" ${canEdit ? '' : 'disabled'} placeholder="${attr(ui('Rewrite from the transferable mechanism for a new generic/reusable project. Do not copy source wording.', 'Перепиши механизм для нового переиспользуемого проекта. Не копируй формулировки источника.'))}">${esc(editorial.porterAdaptation || '')}</textarea></label>
      <label>${ui('Editorial notes', 'Editorial notes')}<textarea name="notes" rows="3" ${canEdit ? '' : 'disabled'}>${esc(editorial.notes || '')}</textarea></label>
      <div class="promotion-checks">${editorialCheck('attributionVerified', ui('Original creator/source attribution verified', 'Атрибуция оригинального автора/источника проверена'), editorial, canEdit)}${editorialCheck('sourceRightsChecked', ui('Source / rights / excerpt policy checked', 'Источник / права / политика excerpt проверены'), editorial, canEdit)}${editorialCheck('previewVerified', ui('Preview/player strategy verified', 'Preview/player стратегия проверена'), editorial, canEdit)}${editorialCheck('namedIpRiskCleared', ui('Named-IP / celebrity risk cleared', 'Named-IP / celebrity risk очищен'), editorial, canEdit)}${editorialCheck('independentAdaptationConfirmed', ui('Porter Adaptation was written independently', 'Porter Adaptation написана независимо'), editorial, canEdit)}${editorialCheck('sourceWordingNotCopied', ui('Source prompt wording was not copied', 'Формулировки source prompt не копировались'), editorial, canEdit)}</div>
      <div class="promotion-gate-blockers" id="promotionGateBlockers">${gate.blockers.slice(0, 6).map(item => `<span>${esc(item)}</span>`).join('')}</div>
      <div class="promotion-actions">
        <button class="button ghost" type="button" id="promotionCopyAnalysis">${ui('Copy readiness JSON', 'Скопировать readiness JSON')}</button>
        <button class="button" type="button" id="promotionExportAnalysis">${ui('Export readiness', 'Экспорт readiness')}</button>
        <button class="button" type="button" id="promotionCopyDraft" ${gate.ok ? '' : 'disabled'}>${ui('Copy curated draft', 'Скопировать curated draft')}</button>
        <button class="button primary" type="button" id="promotionExportDraft" ${gate.ok ? '' : 'disabled'}>${ui('Export curated draft', 'Экспортировать curated draft')}</button>
      </div>
    </form>
  </section>`;
}

function editorialCheck(name, label, editorial, enabled) {
  return `<label><input type="checkbox" name="${attr(name)}" ${editorial[name] ? 'checked' : ''} ${enabled ? '' : 'disabled'}><span>${esc(label)}</span></label>`;
}

function groupLabel(value) {
  if (!ru()) return value;
  if (value === 'Commercial') return 'Коммерческие';
  if (value === 'Motion language') return 'Язык движения';
  return value;
}

function tierLabel(tier) {
  if (tier === 'strong-editorial-candidate') return ui('Strong editorial candidate', 'Сильный кандидат для editorial');
  if (tier === 'editorial-review') return ui('Editorial review', 'Editorial review');
  return ui('Needs work', 'Нужно доработать');
}

function bindImportEvents() {
  $('#promotionParseReview')?.addEventListener('click', () => {
    const raw = $('#promotionReviewPaste')?.value || '';
    tryLoadReview(raw);
  });
  $('#promotionReviewFile')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    tryLoadReview(await file.text());
  });
  const drop = $('#promotionDropZone');
  drop?.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('is-dragging'); });
  drop?.addEventListener('dragleave', () => drop.classList.remove('is-dragging'));
  drop?.addEventListener('drop', async event => {
    event.preventDefault();
    drop.classList.remove('is-dragging');
    const file = event.dataTransfer?.files?.[0];
    if (file) tryLoadReview(await file.text());
  });
}

function tryLoadReview(raw) {
  try {
    const review = typeof raw === 'string' ? JSON.parse(raw) : raw;
    state.review = review;
    state.parseError = '';
    const candidate = (state.corpus?.candidates || []).find(item => item.id === review.candidateId) || null;
    state.analysis = buildPromotionAnalysis(review, candidate);
  } catch (error) {
    state.review = null;
    state.analysis = null;
    state.parseError = String(error?.message || error);
  }
  render();
}

function bindEditorialEvents() {
  const form = $('#promotionEditorialForm');
  if (!form) return;
  form.addEventListener('input', () => updateEditorialGate());
  form.addEventListener('change', () => updateEditorialGate());
  $('#promotionCopyAnalysis')?.addEventListener('click', async () => navigator.clipboard.writeText(JSON.stringify(state.analysis, null, 2)));
  $('#promotionExportAnalysis')?.addEventListener('click', () => exportJson(state.analysis, `${safeFilename(state.analysis.candidateId)}.curation-readiness.json`));
  $('#promotionCopyDraft')?.addEventListener('click', async () => {
    const editorial = collectEditorial(form);
    const gate = validateEditorialGate(state.analysis, editorial);
    if (!gate.ok) return;
    const draft = buildCuratedImplementationDraft(state.analysis, editorial);
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
  });
  $('#promotionExportDraft')?.addEventListener('click', () => {
    const editorial = collectEditorial(form);
    const gate = validateEditorialGate(state.analysis, editorial);
    if (!gate.ok) return;
    const draft = buildCuratedImplementationDraft(state.analysis, editorial);
    exportJson(draft, `${safeFilename(state.analysis.candidateId)}.curated-draft.json`);
  });
}

function updateEditorialGate() {
  const form = $('#promotionEditorialForm');
  if (!form || !state.analysis) return;
  const editorial = collectEditorial(form);
  saveEditorial(state.analysis.candidateId, editorial);
  const gate = validateEditorialGate(state.analysis, editorial);
  const status = $('#promotionGateStatus');
  if (status) {
    status.classList.toggle('ready', gate.ok);
    status.textContent = gate.ok ? ui('Ready', 'Готово') : `${gate.blockers.length} blockers`;
  }
  const blockers = $('#promotionGateBlockers');
  if (blockers) blockers.innerHTML = gate.blockers.slice(0, 6).map(item => `<span>${esc(item)}</span>`).join('');
  const copy = $('#promotionCopyDraft');
  const exportButton = $('#promotionExportDraft');
  if (copy) copy.disabled = !gate.ok;
  if (exportButton) exportButton.disabled = !gate.ok;
}

function collectEditorial(form) {
  return {
    title: form.elements.title?.value.trim() || '',
    titleRu: form.elements.titleRu?.value.trim() || '',
    category: form.elements.category?.value.trim() || '',
    subcategory: form.elements.subcategory?.value.trim() || '',
    tags: parseCsv(form.elements.tags?.value),
    collections: $$('input[name="collection"]:checked', form).map(input => input.value),
    whyItWorks: form.elements.whyItWorks?.value.trim() || '',
    porterAdaptation: form.elements.porterAdaptation?.value.trim() || '',
    notes: form.elements.notes?.value.trim() || '',
    attributionVerified: Boolean(form.elements.attributionVerified?.checked),
    sourceRightsChecked: Boolean(form.elements.sourceRightsChecked?.checked),
    previewVerified: Boolean(form.elements.previewVerified?.checked),
    namedIpRiskCleared: Boolean(form.elements.namedIpRiskCleared?.checked),
    independentAdaptationConfirmed: Boolean(form.elements.independentAdaptationConfirmed?.checked),
    sourceWordingNotCopied: Boolean(form.elements.sourceWordingNotCopied?.checked)
  };
}

function loadEditorial(candidateId, analysis) {
  try {
    const raw = localStorage.getItem(`${EDITORIAL_PREFIX}${candidateId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    title: analysis.source?.title || '',
    titleRu: '',
    category: '',
    subcategory: '',
    tags: [],
    collections: analysis.research?.collections || [],
    whyItWorks: '',
    porterAdaptation: '',
    notes: '',
    attributionVerified: false,
    sourceRightsChecked: false,
    previewVerified: false,
    namedIpRiskCleared: false,
    independentAdaptationConfirmed: false,
    sourceWordingNotCopied: false
  };
}

function saveEditorial(candidateId, value) {
  try { localStorage.setItem(`${EDITORIAL_PREFIX}${candidateId}`, JSON.stringify(value)); } catch {}
}

function parseCsv(value) {
  return [...new Set(String(value || '').split(/[,\n]+/).map(item => item.trim()).filter(Boolean))];
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

function safeFilename(value) {
  return String(value || 'candidate').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '');
}
