import { CASE_INTELLIGENCE } from './case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from './multi-source-index.js';
import { collectionLabel, getLanguage } from './i18n.js';
import { buildOperationsState } from './operations-engine.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const ru = () => getLanguage() === 'ru';
const ui = (en, ruText) => ru() ? ruText : en;

const PREFIXES = {
  deepReview: 'porterDeepReviewDraft:',
  mediaEvidence: 'porterDeepReviewMediaEvidence:',
  promotion: 'porterPromotionEditorial:'
};

const state = {
  corpus: null,
  queue: null,
  coverage: null,
  sourceHealth: null,
  operations: null,
  loadErrors: {},
  candidateMap: new Map()
};

injectNavigation();
injectView();
bindEvents();
loadSnapshots();

function injectNavigation() {
  const nav = $('.sidebar-nav');
  if (!nav || $('[data-case-view="operations"]', nav)) return;
  const button = document.createElement('button');
  button.className = 'nav-tab';
  button.type = 'button';
  button.dataset.caseView = 'operations';
  button.innerHTML = '<span class="nav-icon">◎</span><span data-ops-nav-label></span><span class="ops-nav-status" id="opsNavStatus"></span>';
  nav.insertBefore(button, nav.firstChild);
  localizeShell();
}

function injectView() {
  const page = $('.page');
  if (!page || $('#operationsView')) return;
  const section = document.createElement('section');
  section.id = 'operationsView';
  section.className = 'library-view operations-view';
  section.hidden = true;
  section.innerHTML = '<div id="operationsBody" class="operations-loading"></div>';
  page.insertBefore(section, page.firstChild);
}

async function loadSnapshots() {
  const specs = [
    ['corpus', './case-candidates.json'],
    ['queue', './case-review-queue.json'],
    ['coverage', './coverage-plan.json'],
    ['sourceHealth', './source-health.json']
  ];
  const results = await Promise.allSettled(specs.map(([, url]) => fetchJson(url)));
  results.forEach((result, index) => {
    const [key] = specs[index];
    if (result.status === 'fulfilled') state[key] = result.value;
    else state.loadErrors[key] = String(result.reason?.message || result.reason || 'unavailable');
  });
  state.candidateMap = new Map((state.corpus?.candidates || []).map(item => [item.id, item]));
  rebuildOperations();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function curatedCases() {
  return [...new Map([
    ...CASE_INTELLIGENCE.map(item => [item.id, { id:item.id, title:item.title }]),
    ...MULTI_SOURCE_CASES.map(item => [item.id, { id:item.id, title:item.title }])
  ]).values()];
}

function localWork() {
  return {
    deepReviewDrafts: storageIds(PREFIXES.deepReview),
    mediaEvidenceDrafts: storageIds(PREFIXES.mediaEvidence),
    promotionDrafts: storageIds(PREFIXES.promotion)
  };
}

function storageIds(prefix) {
  const ids = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) ids.push(key.slice(prefix.length));
  }
  return [...new Set(ids)].sort();
}

function rebuildOperations() {
  state.operations = buildOperationsState({
    curatedCases: curatedCases(),
    corpus: state.corpus,
    queue: state.queue,
    coverage: state.coverage,
    sourceHealth: state.sourceHealth,
    local: localWork()
  });
  updateNavStatus();
  render();
}

function bindEvents() {
  document.addEventListener('click', event => {
    const tab = event.target.closest('[data-case-view="operations"]');
    if (tab) {
      event.preventDefault();
      showOperations();
      return;
    }

    const action = event.target.closest('[data-ops-action]');
    if (action) {
      event.preventDefault();
      executeAction(action.dataset.opsAction);
      return;
    }

    const review = event.target.closest('[data-ops-review]');
    if (review) {
      event.preventDefault();
      openDeepReview(review.dataset.opsReview);
      return;
    }

    const target = event.target.closest('[data-ops-view]');
    if (target) {
      event.preventDefault();
      openView(target.dataset.opsView);
    }
  });

  window.addEventListener('porter-language-change', () => {
    localizeShell();
    render();
  });
  window.addEventListener('storage', event => {
    if (Object.values(PREFIXES).some(prefix => event.key?.startsWith(prefix))) rebuildOperations();
  });
  window.addEventListener('focus', () => {
    const local = state.operations?.local;
    const current = localWork();
    if (!local || JSON.stringify(local) !== JSON.stringify(current)) rebuildOperations();
  });
}

function showOperations() {
  const view = $('#operationsView');
  if (!view) return;
  document.querySelectorAll('.library-view, .source-view').forEach(node => { if (node.id !== 'operationsView') node.hidden = true; });
  view.hidden = false;
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('is-active'));
  $('[data-case-view="operations"]')?.classList.add('is-active');
  const sidebarState = $('#sidebarState'); if (sidebarState) sidebarState.checked = false;
  rebuildOperations();
}

function render() {
  const root = $('#operationsBody');
  if (!root) return;
  localizeShell();
  if (!state.operations) {
    root.className = 'operations-loading';
    root.textContent = ui('Loading operational state…', 'Загружаю operational state…');
    return;
  }
  const ops = state.operations;
  root.className = '';
  root.innerHTML = `
    <header class="ops-header">
      <div>
        <div class="view-kicker">${ui('Research → evidence → curation operations', 'Research → evidence → curation operations')}</div>
        <h1>${ui('Operations Command Center', 'Operations Command Center')}</h1>
        <p>${ui('One operational view of curated stability, research supply, source health, review work and curation backlog. Priorities are derived from the same snapshots used by the rest of Porter.', 'Один операционный экран для curated-стабильности, research supply, source health, review-работы и curation backlog. Приоритеты считаются из тех же snapshot’ов, которыми пользуется весь Porter.')}</p>
      </div>
      <div class="ops-health" data-health="${attr(ops.health)}"><span>${ui('system state', 'состояние системы')}</span><strong>${esc(healthLabel(ops.health))}</strong></div>
    </header>

    ${Object.keys(state.loadErrors).length ? `<div class="ops-warning"><strong>${ui('Partial operational data', 'Часть operational data недоступна')}</strong><span>${esc(Object.entries(state.loadErrors).map(([key,value])=>`${key}: ${value}`).join(' · '))}</span></div>` : ''}

    <section class="ops-pipeline">
      ${pipelineCard('curated', ops.pipeline.curated, '100', ui('Curated', 'Curated'), 'digest')}
      ${pipelineCard('research', ops.pipeline.research, ops.pipeline.researchTarget, ui('Research', 'Research'), 'corpus')}
      ${pipelineCard('queue', ops.pipeline.reviewQueue, null, ui('Review queue', 'Review queue'), 'deep-review')}
      ${pipelineCard('drafts', ops.pipeline.deepReviewDrafts, null, ui('Review drafts', 'Review drafts'), 'deep-review')}
      ${pipelineCard('promotion', ops.pipeline.promotionDrafts, null, ui('Promotion drafts', 'Promotion drafts'), 'promotion')}
      ${pipelineCard('sources', ops.pipeline.adapters.responding, ops.pipeline.adapters.enabled || null, ui('Sources responding', 'Sources отвечают'), 'sources')}
    </section>

    <section class="ops-grid">
      <article class="ops-panel ops-actions-panel">
        <div class="ops-panel-head"><div><span>${ui('Prioritized execution', 'Приоритет выполнения')}</span><strong>${ui('What to do now', 'Что делать сейчас')}</strong></div><span>${ops.actions.length}</span></div>
        <div class="ops-action-list">${ops.actions.map(actionRow).join('') || `<div class="ops-empty">${ui('No urgent actions. Keep reviewing the strategic queue.', 'Срочных действий нет. Продолжай strategic review queue.')}</div>`}</div>
      </article>

      <article class="ops-panel ops-snapshots-panel">
        <div class="ops-panel-head"><div><span>${ui('Data freshness', 'Свежесть данных')}</span><strong>${ui('Operational snapshots', 'Operational snapshots')}</strong></div></div>
        <div class="ops-snapshot-list">${Object.entries(ops.snapshots).map(([key,value]) => snapshotRow(key,value)).join('')}</div>
        <a class="button small" href="https://github.com/IMONsergey/Seedance-Porter/actions" target="_blank" rel="noopener">GitHub Actions ↗</a>
      </article>
    </section>

    <section class="ops-grid lower">
      <article class="ops-panel">
        <div class="ops-panel-head"><div><span>${ui('Coverage pressure', 'Давление по покрытию')}</span><strong>${ui('Top Collections', 'Top Collections')}</strong></div><button class="button small" type="button" data-ops-view="sources">${ui('Open Planner', 'Открыть Planner')}</button></div>
        <div class="ops-coverage-list">${(ops.topCoverage || []).map(coverageRow).join('') || `<div class="ops-empty">${ui('Coverage snapshot unavailable.', 'Coverage snapshot недоступен.')}</div>`}</div>
      </article>

      <article class="ops-panel">
        <div class="ops-panel-head"><div><span>${ui('Acquisition health', 'Acquisition health')}</span><strong>${ui('Source adapters', 'Source adapters')}</strong></div><button class="button small" type="button" data-ops-view="sources">${ui('Open Health', 'Открыть Health')}</button></div>
        <div class="ops-source-list">${sourceRows(ops)}</div>
      </article>
    </section>

    <section class="ops-grid lower">
      <article class="ops-panel">
        <div class="ops-panel-head"><div><span>${ui('Current browser work', 'Текущая локальная работа')}</span><strong>${ui('In progress', 'В работе')}</strong></div></div>
        ${localWorkHtml(ops.local)}
      </article>

      <article class="ops-panel">
        <div class="ops-panel-head"><div><span>${ui('Strategic queue', 'Стратегическая очередь')}</span><strong>${ui('Next review candidates', 'Следующие кандидаты')}</strong></div><button class="button small" type="button" data-ops-view="deep-review">${ui('Open Deep Review', 'Открыть Deep Review')}</button></div>
        <div class="ops-backlog-list">${(ops.topBacklog || []).slice(0,6).map(backlogRow).join('') || `<div class="ops-empty">${ui('Backlog snapshot unavailable.', 'Backlog snapshot недоступен.')}</div>`}</div>
      </article>
    </section>`;
}

function pipelineCard(kind, value, target, label, view) {
  const targetText = target == null ? '' : ` / ${target}`;
  const percentage = target ? Math.min(100, Math.round((Number(value || 0) / Math.max(1, Number(target))) * 100)) : null;
  return `<button class="ops-pipeline-card" type="button" data-ops-view="${attr(view)}" data-kind="${attr(kind)}"><span>${esc(label)}</span><strong>${Number(value || 0)}${targetText}</strong>${percentage == null ? '' : `<i><b style="width:${percentage}%"></b></i>`}</button>`;
}

function actionRow(action) {
  return `<article class="ops-action-row" data-severity="${attr(action.severity)}"><div class="ops-action-priority">${action.priority}</div><div><strong>${esc(actionTitle(action))}</strong><p>${esc(actionDescription(action))}</p></div><button class="button small ${action.priority >= 85 ? 'primary' : ''}" type="button" data-ops-action="${attr(action.id)}">${esc(actionButton(action))}</button></article>`;
}

function actionTitle(action) {
  const data = action.data || {};
  const labels = {
    'curated-contract': [
      `Curated DOM contract drifted: ${data.actual}/${data.expected}`,
      `Curated DOM contract отклонился: ${data.actual}/${data.expected}`
    ],
    'missing-snapshots': [
      `Research snapshots missing: ${(data.snapshots || []).join(', ')}`,
      `Нет research snapshot’ов: ${(data.snapshots || []).join(', ')}`
    ],
    'stale-snapshots': [
      'Research operations snapshots are stale',
      'Research operations snapshot’ы устарели'
    ],
    'research-deficit': [
      `Research Corpus is ${data.deficit} candidates below target`,
      `Research Corpus не хватает ${data.deficit} кандидатов до цели`
    ],
    'source-repair': [
      `${data.count} source adapter(s) need attention`,
      `${data.count} source adapter(ов) требуют внимания`
    ],
    'finish-reviews': [
      `Finish ${data.count} Deep Review draft(s)`,
      `Закончить ${data.count} Deep Review draft(ов)`
    ],
    'finish-promotions': [
      `Finish ${data.count} Promotion draft(s)`,
      `Закончить ${data.count} Promotion draft(ов)`
    ],
    'critical-coverage': [
      `${data.count} Collections are critical`,
      `${data.count} Collections в critical-состоянии`
    ],
    'queue-depth': [
      `Review queue is shallow: ${data.actual}/${data.target}`,
      `Review queue слишком короткая: ${data.actual}/${data.target}`
    ],
    'high-coverage': [
      `${data.count} Collections still need coverage work`,
      `${data.count} Collections всё ещё требуют усиления`
    ],
    'expand-sources': [
      'High-value source adapters can be expanded',
      'Есть high-value source adapters для расширения'
    ],
    'continue-review': [
      'Continue the strategic Deep Review queue',
      'Продолжить strategic Deep Review queue'
    ]
  };
  return ui(...(labels[action.type] || [action.type, action.type]));
}

function actionDescription(action) {
  const data = action.data || {};
  if (action.type === 'finish-reviews') return candidateNames(data.candidateIds).join(' · ');
  if (action.type === 'finish-promotions') return candidateNames(data.candidateIds).join(' · ');
  if (action.type === 'source-repair') return (data.adapters || []).map(item => `${item.label} — ${item.status}`).join(' · ');
  if (action.type === 'critical-coverage' || action.type === 'high-coverage') return (data.collections || []).map(item => `${collectionLabel(item.title)} ${item.priority}`).join(' · ');
  if (action.type === 'expand-sources') return (data.adapters || []).map(item => `${item.label} ${item.score}`).join(' · ');
  if (action.type === 'stale-snapshots') return (data.snapshots || []).map(item => `${item.key}: ${item.ageHours}h`).join(' · ');
  if (action.type === 'research-deficit') return ui(`Current ${data.actual}; operating minimum ${data.target}.`, `Сейчас ${data.actual}; operating minimum ${data.target}.`);
  if (action.type === 'missing-snapshots') return ui('Pages can still serve curated content, but research operations are running partially.', 'Curated часть может работать, но research operations сейчас частичные.');
  if (action.type === 'continue-review') return data.candidate?.title || ui('Use the highest-priority queued candidate.', 'Возьми самого приоритетного кандидата из queue.');
  return ui('Open the relevant workspace and resolve this operational pressure.', 'Открой нужный workspace и закрой этот operational pressure.');
}

function actionButton(action) {
  if (action.targetView === 'deep-review') return ui('Open review', 'Открыть review');
  if (action.targetView === 'promotion') return ui('Open Promotion', 'Открыть Promotion');
  if (action.targetView === 'corpus') return ui('Open Corpus', 'Открыть Corpus');
  if (action.targetView === 'digest') return ui('Open Digest', 'Открыть Digest');
  return ui('Open Sources', 'Открыть Sources');
}

function snapshotRow(key, value) {
  const labels = { corpus:'Research Corpus', queue:'Review Queue', coverage:'Coverage Plan', sourceHealth:'Source Health' };
  const stateLabel = !value.available ? ui('missing', 'нет') : value.stale ? ui('stale', 'устарел') : ui('fresh', 'свежий');
  return `<article data-state="${!value.available ? 'missing' : value.stale ? 'stale' : 'fresh'}"><div><strong>${labels[key] || key}</strong><span>${value.generatedAt ? formatDate(value.generatedAt) : ui('no timestamp', 'нет timestamp')}</span></div><div><strong>${esc(stateLabel)}</strong><span>${value.ageHours == null ? '—' : `${value.ageHours}h`}</span></div></article>`;
}

function coverageRow(item) {
  return `<article><div><strong>${esc(collectionLabel(item.title || item.id))}</strong><span>${esc(item.nextAction || '')}</span></div><div><strong>${Number(item.priority || 0)}</strong><i><b style="width:${Math.max(0,Math.min(100,Number(item.priority||0)))}%"></b></i></div></article>`;
}

function sourceRows(ops) {
  const attention = ops.sourceAttention || [];
  const leaders = ops.sourceLeaders || [];
  const combined = [...attention.map(item=>({...item,_kind:'attention'})), ...leaders.filter(item=>!attention.some(a=>a.id===item.id)).map(item=>({...item,_kind:'leader'}))].slice(0,8);
  return combined.length ? combined.map(item => `<article data-kind="${item._kind}"><div><strong>${esc(item.label || item.id)}</strong><span>${esc(item.health?.recommendation || item.health?.status || '')}</span></div><div><strong>${Number(item.health?.score || 0)}</strong><span>${Number(item.yield?.selected || 0)} ${ui('selected', 'selected')}</span></div></article>`).join('') : `<div class="ops-empty">${ui('No source-health rows available.', 'Нет данных source-health.')}</div>`;
}

function localWorkHtml(local) {
  const rows = [
    ['deep-review', local.deepReviewDrafts, ui('Deep Review drafts', 'Deep Review drafts')],
    ['media', local.mediaEvidenceDrafts, ui('Media evidence timelines', 'Media evidence timelines')],
    ['promotion', local.promotionDrafts, ui('Promotion drafts', 'Promotion drafts')]
  ];
  return `<div class="ops-local-list">${rows.map(([type, ids, label]) => `<article><div><strong>${esc(label)}</strong><span>${ids.length ? candidateNames(ids).join(' · ') : ui('none', 'нет')}</span></div><strong>${ids.length}</strong></article>`).join('')}</div>`;
}

function backlogRow(item) {
  return `<article><div><span>${item.rank || '—'}</span><div><strong>${esc(item.title || item.candidateId)}</strong><small>${esc(collectionLabel(item.targetCollectionTitle || item.targetCollection || ''))} · ${esc(item.sourcePoolLabel || item.sourcePool || '')}</small></div></div>${item.queued ? `<button class="button small" type="button" data-ops-review="${attr(item.candidateId)}">${ui('Review', 'Ревью')}</button>` : `<button class="button small" type="button" data-ops-view="sources">${ui('Plan', 'План')}</button>`}</article>`;
}

function executeAction(actionId) {
  const action = state.operations?.actions.find(item => item.id === actionId);
  if (!action) return;
  if (action.targetView === 'deep-review' && action.candidateId) return openDeepReview(action.candidateId);
  openView(action.targetView);
  requestAnimationFrame(() => {
    if (action.type === 'source-repair') $('#sourceAdapterHealth')?.scrollIntoView({ behavior:'smooth', block:'start' });
    if (action.type === 'critical-coverage' || action.type === 'high-coverage' || action.type === 'queue-depth') $('#coveragePlanner')?.scrollIntoView({ behavior:'smooth', block:'start' });
  });
}

function openView(view) {
  const selectors = {
    digest:'[data-view="digest"]', prompts:'[data-view="prompts"]', sources:'[data-view="sources"]', corpus:'[data-case-view="corpus"]', 'deep-review':'[data-case-view="deep-review"]', promotion:'[data-case-view="promotion"]', operations:'[data-case-view="operations"]'
  };
  $(selectors[view] || '')?.click();
}

function openDeepReview(candidateId) {
  openView('deep-review');
  requestAnimationFrame(() => {
    $('#resetDeepReview')?.click();
    requestAnimationFrame(() => {
      const row = $(`[data-review-candidate="${CSS.escape(candidateId)}"]`);
      row?.click();
      row?.scrollIntoView({ behavior:'smooth', block:'nearest' });
    });
  });
}

function candidateNames(ids) {
  return (ids || []).slice(0,4).map(id => state.candidateMap.get(id)?.title || id);
}

function updateNavStatus() {
  const node = $('#opsNavStatus');
  if (!node || !state.operations) return;
  const high = state.operations.actions.filter(action => action.priority >= 80).length;
  node.textContent = high ? String(high) : '✓';
  node.dataset.health = state.operations.health;
}

function localizeShell() {
  const label = $('[data-ops-nav-label]');
  if (label) label.textContent = ui('Operations', 'Операции');
}

function healthLabel(value) {
  const labels = { critical:['Critical','Critical'], attention:['Attention','Требует внимания'], watch:['Watch','Наблюдать'], healthy:['Healthy','Healthy'] };
  return ui(...(labels[value] || [value,value]));
}

function formatDate(value) {
  try { return new Intl.DateTimeFormat(ru() ? 'ru-RU' : 'en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }).format(new Date(value)); }
  catch { return value; }
}
