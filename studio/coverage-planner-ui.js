import { CASE_INTELLIGENCE, COLLECTION_GROUPS } from './case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from './multi-source-index.js';
import { collectionLabel, getLanguage } from './i18n.js';
import { buildCoveragePlan } from './coverage-planner-engine.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const ru = () => getLanguage() === 'ru';
const ui = (en, ruText) => ru() ? ruText : en;
const DRAFT_PREFIX = 'porterDeepReviewDraft:';

const state = {
  corpus: null,
  queue: null,
  plan: null,
  group: 'all',
  action: 'all',
  backlogLimit: 18
};

injectPlanner();
bindEvents();
loadPlannerData();

function injectPlanner() {
  const sourceView = $('#sourceView');
  if (!sourceView || $('#coveragePlanner')) return;
  const root = document.createElement('section');
  root.id = 'coveragePlanner';
  root.className = 'coverage-planner';
  const audit = $('#coverageAudit', sourceView);
  if (audit) audit.insertAdjacentElement('afterend', root);
  else sourceView.appendChild(root);
  render();
}

async function loadPlannerData() {
  const [corpus, queue] = await Promise.allSettled([
    fetchJson('./case-candidates.json'),
    fetchJson('./case-review-queue.json')
  ]);
  state.corpus = corpus.status === 'fulfilled' ? corpus.value : { candidates: [], error: String(corpus.reason || 'corpus unavailable') };
  state.queue = queue.status === 'fulfilled' ? queue.value : { queue: [], error: String(queue.reason || 'queue unavailable') };
  rebuildPlan();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function curatedCases() {
  const map = new Map();
  for (const item of CASE_INTELLIGENCE) {
    map.set(item.id, {
      id: item.id,
      title: item.title,
      sourcePlatform: 'x',
      collections: item.intelligence?.collections || []
    });
  }
  for (const item of MULTI_SOURCE_CASES) {
    map.set(item.id, {
      id: item.id,
      title: item.title,
      sourcePlatform: item.sourcePlatform,
      collections: item.collections || []
    });
  }
  return [...map.values()];
}

function localDraftCandidateIds() {
  const ids = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(DRAFT_PREFIX)) continue;
    ids.push(key.slice(DRAFT_PREFIX.length));
  }
  return ids;
}

function rebuildPlan() {
  state.plan = buildCoveragePlan({
    collectionGroups: COLLECTION_GROUPS,
    curatedCases: curatedCases(),
    candidates: state.corpus?.candidates || [],
    queue: state.queue?.queue || [],
    localDraftCandidateIds: localDraftCandidateIds()
  });
  render();
}

function bindEvents() {
  document.addEventListener('change', event => {
    if (event.target.id === 'plannerGroup') {
      state.group = event.target.value;
      render();
    }
    if (event.target.id === 'plannerAction') {
      state.action = event.target.value;
      render();
    }
  });

  document.addEventListener('click', event => {
    const review = event.target.closest('[data-plan-review]');
    if (review) {
      event.preventDefault();
      openDeepReview(review.dataset.planReview);
      return;
    }
    const expand = event.target.closest('#plannerExpandBacklog');
    if (expand) {
      state.backlogLimit = Math.min(30, state.backlogLimit + 12);
      render();
    }
  });

  window.addEventListener('porter-language-change', render);
  window.addEventListener('storage', event => {
    if (event.key?.startsWith(DRAFT_PREFIX)) rebuildPlan();
  });

  const sourceView = $('#sourceView');
  if (sourceView) {
    new MutationObserver(() => {
      if (!sourceView.hidden) rebuildPlan();
    }).observe(sourceView, { attributes: true, attributeFilter: ['hidden'] });
  }
}

function openDeepReview(candidateId) {
  const tab = $('[data-case-view="deep-review"]');
  if (!tab) return;
  tab.click();
  requestAnimationFrame(() => {
    $('#resetDeepReview')?.click();
    requestAnimationFrame(() => {
      const item = $(`[data-review-candidate="${CSS.escape(candidateId)}"]`);
      item?.click();
      item?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

function render() {
  const root = $('#coveragePlanner');
  if (!root) return;
  if (!state.plan) {
    root.innerHTML = `<div class="planner-loading">${ui('Building strategic coverage plan…', 'Строю стратегический план покрытия…')}</div>`;
    return;
  }

  const plan = state.plan;
  const corpusPending = Boolean(state.corpus?.error);
  const queuePending = Boolean(state.queue?.error);
  const filteredCollections = plan.collections.filter(item => {
    if (state.group !== 'all' && item.groupId !== state.group) return false;
    if (state.action !== 'all' && item.nextAction !== state.action) return false;
    return true;
  });
  const backlog = plan.backlog.slice(0, state.backlogLimit);

  root.innerHTML = `
    <div class="planner-head">
      <div>
        <span>${ui('Strategic research operations', 'Стратегические research-операции')}</span>
        <h3>${ui('Coverage Planner 2.0', 'Coverage Planner 2.0')}</h3>
        <p>${ui('Combines curated depth, research supply, source diversity and the Deep Review queue to decide what should happen next.', 'Объединяет curated-покрытие, запас кандидатов, разнообразие источников и Deep Review queue, чтобы решать, что делать следующим.')}</p>
      </div>
      <div class="planner-health"><strong>${plan.summary.criticalCollections}</strong><span>${ui('critical collections', 'критических Collections')}</span></div>
    </div>

    ${corpusPending || queuePending ? `<div class="planner-warning"><strong>${ui('Partial planner data', 'Planner работает на частичных данных')}</strong><span>${esc([state.corpus?.error, state.queue?.error].filter(Boolean).join(' · '))}</span></div>` : ''}

    <div class="planner-metrics">
      ${metric(plan.summary.curatedCases, ui('curated cases', 'curated-кейсов'))}
      ${metric(plan.summary.researchCandidates, ui('safe research candidates', 'research-кандидатов'))}
      ${metric(plan.summary.highQualityCandidates, ui('research score 70+', 'кандидатов 70+'))}
      ${metric(plan.summary.queuedCandidates, ui('in review queue', 'в review queue'))}
      ${metric(plan.summary.localReviewDrafts, ui('local reviews in progress', 'локальных review-черновиков'))}
      ${metric(plan.summary.automatedSourcePools, ui('automated source pools', 'автоматических source pools'))}
    </div>

    <div class="planner-funnel">
      ${funnel(ui('Discovery starved', 'Не хватает discovery'), plan.pipeline.discoveryStarved)}
      ${funnel(ui('Need source diversity', 'Нужны другие источники'), plan.pipeline.sourceDiversityStarved)}
      ${funnel(ui('Ready to queue', 'Можно ставить в queue'), plan.pipeline.readyToQueue)}
      ${funnel(ui('Review now', 'Ревьюить сейчас'), plan.pipeline.readyToReview)}
      ${funnel(ui('Review in progress', 'Review уже идёт'), plan.pipeline.reviewInProgress)}
      ${funnel(ui('Curated floor reached', 'Curated floor закрыт'), plan.pipeline.curatedFloorReached)}
    </div>

    <div class="planner-toolbar">
      <div><strong>${ui('Collection priority map', 'Карта приоритетов Collections')}</strong><span>${ui('Targets: 5 curated · 15 research · 6 high-quality · 3 source pools · 4 queued', 'Цели: 5 curated · 15 research · 6 high-quality · 3 source pools · 4 queued')}</span></div>
      <div class="planner-filters">
        <select id="plannerGroup">${groupOptions()}</select>
        <select id="plannerAction">${actionOptions()}</select>
      </div>
    </div>

    <div class="planner-collection-table">
      <div class="planner-collection-row head"><span>${ui('Collection', 'Collection')}</span><span>${ui('Curated', 'Curated')}</span><span>${ui('Research', 'Research')}</span><span>70+</span><span>${ui('Pools', 'Pools')}</span><span>${ui('Queue', 'Queue')}</span><span>${ui('Priority', 'Приоритет')}</span><span>${ui('Next', 'Дальше')}</span></div>
      ${filteredCollections.map(collectionRow).join('') || `<div class="planner-empty">${ui('No collections match these filters.', 'Нет Collections под эти фильтры.')}</div>`}
    </div>

    <div class="planner-columns">
      <section class="planner-panel backlog-panel">
        <div class="planner-panel-head"><div><span>${ui('Execution backlog', 'Операционный backlog')}</span><strong>${ui('Next candidates to process', 'Следующие кандидаты в работу')}</strong></div><span>${Math.min(backlog.length, plan.backlog.length)} / ${plan.backlog.length}</span></div>
        <div class="planner-backlog">${backlog.map(backlogRow).join('') || `<div class="planner-empty">${ui('No candidate backlog yet.', 'Backlog кандидатов пока пуст.')}</div>`}</div>
        ${state.backlogLimit < plan.backlog.length ? `<button id="plannerExpandBacklog" class="button small" type="button">${ui('Show more', 'Показать ещё')}</button>` : ''}
      </section>

      <section class="planner-panel source-yield-panel">
        <div class="planner-panel-head"><div><span>${ui('Acquisition intelligence', 'Эффективность источников')}</span><strong>${ui('Which automated pools feed weak Collections', 'Какие source pools реально закрывают слабые Collections')}</strong></div></div>
        <div class="planner-source-list">${plan.sourcePools.slice(0, 12).map(sourcePoolRow).join('') || `<div class="planner-empty">${ui('No source-pool data yet.', 'Пока нет данных по source pools.')}</div>`}</div>
      </section>
    </div>
  `;
}

function metric(value, label) {
  return `<article><strong>${Number(value || 0)}</strong><span>${esc(label)}</span></article>`;
}

function funnel(label, value) {
  return `<article><span>${esc(label)}</span><strong>${Number(value || 0)}</strong></article>`;
}

function groupOptions() {
  const labels = new Map(COLLECTION_GROUPS.map(group => [group.id, group.title]));
  return `<option value="all">${ui('All groups', 'Все группы')}</option>${[...labels].map(([id, title]) => `<option value="${attr(id)}" ${state.group === id ? 'selected' : ''}>${esc(groupLabel(title))}</option>`).join('')}`;
}

function actionOptions() {
  const actions = ['discover', 'diversify-sources', 'queue-for-review', 'review-now', 'finish-review', 'expand-depth', 'maintain'];
  return `<option value="all">${ui('All next actions', 'Все действия')}</option>${actions.map(action => `<option value="${attr(action)}" ${state.action === action ? 'selected' : ''}>${esc(actionLabel(action))}</option>`).join('')}`;
}

function groupLabel(value) {
  if (!ru()) return value;
  if (value === 'Commercial') return 'Коммерческие';
  if (value === 'Motion language') return 'Язык движения';
  return value;
}

function collectionRow(item) {
  return `<div class="planner-collection-row" data-health="${attr(item.health)}">
    <span><strong>${esc(collectionLabel(item.title))}</strong><small>${esc(groupLabel(item.groupTitle))}</small></span>
    <span>${item.curated}<i>${targetDelta(item.curated, state.plan.targets.curatedPerCollection)}</i></span>
    <span>${item.research}<i>${targetDelta(item.research, state.plan.targets.researchPerCollection)}</i></span>
    <span>${item.highQualityResearch}<i>${targetDelta(item.highQualityResearch, state.plan.targets.highQualityResearchPerCollection)}</i></span>
    <span>${item.sourcePools}<i>${targetDelta(item.sourcePools, state.plan.targets.sourcePoolsPerCollection)}</i></span>
    <span>${item.queuedForReview}<i>${item.localReviewDrafts ? `${item.localReviewDrafts} ${ui('draft', 'черн.')}` : targetDelta(item.queuedForReview, state.plan.targets.queuedForReviewPerCollection)}</i></span>
    <span><b>${item.priority}</b><em class="planner-priority-bar"><i style="width:${item.priority}%"></i></em></span>
    <span><span class="planner-action-chip" data-action="${attr(item.nextAction)}">${esc(actionLabel(item.nextAction))}</span></span>
  </div>`;
}

function targetDelta(value, target) {
  const remaining = Math.max(0, target - value);
  return remaining ? `−${remaining}` : '✓';
}

function backlogRow(item) {
  const canReview = item.queued;
  return `<article class="planner-backlog-row">
    <div class="planner-rank">${item.rank}</div>
    <div class="planner-backlog-main">
      <div class="planner-backlog-meta"><span>${esc(collectionLabel(item.targetCollectionTitle))}</span><span>${esc(item.sourcePoolLabel || item.sourcePool)}</span><span>${item.candidateScore}</span></div>
      <strong>${esc(item.title)}</strong>
      <small>${esc(item.author || '')}</small>
      <p>${item.reasons.map(reason => esc(reasonLabel(reason))).join(' · ')}</p>
    </div>
    <div class="planner-backlog-actions">
      ${canReview ? `<button class="button small primary" type="button" data-plan-review="${attr(item.candidateId)}">${ui('Review', 'Ревью')}</button>` : ''}
      ${item.sourceUrl ? `<a class="button small" href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">${ui('Source', 'Источник')} ↗</a>` : ''}
    </div>
  </article>`;
}

function sourcePoolRow(item) {
  return `<article class="planner-source-row">
    <div><strong>${esc(item.sourcePoolLabel || item.sourcePool)}</strong><span>${item.candidates} ${ui('candidates', 'кандидатов')} · ${item.highQuality} 70+</span></div>
    <div><span>${ui('weak collections', 'слабых Collections')}</span><strong>${item.weakCollectionsServed}</strong></div>
    <div><span>${ui('traceability', 'traceability')}</span><strong>${item.averageTraceability}</strong></div>
    <div><span>${ui('preview', 'preview')}</span><strong>${item.previewCoverage}%</strong></div>
    <div class="planner-source-value"><span>${ui('value', 'ценность')}</span><strong>${item.acquisitionValue}</strong></div>
  </article>`;
}

function actionLabel(value) {
  const labels = {
    discover: ['Discover more candidates', 'Искать больше кандидатов'],
    'diversify-sources': ['Diversify sources', 'Расширять источники'],
    'queue-for-review': ['Queue high-quality cases', 'Ставить сильные кейсы в queue'],
    'review-now': ['Deep review now', 'Deep review сейчас'],
    'finish-review': ['Finish review drafts', 'Закончить review-черновики'],
    'expand-depth': ['Expand depth', 'Наращивать глубину'],
    maintain: ['Maintain', 'Поддерживать']
  };
  return ui(...(labels[value] || [value, value]));
}

function reasonLabel(value) {
  const labels = {
    'curated coverage below floor': ['curated below floor', 'curated ниже минимума'],
    'research pool below target': ['research supply gap', 'не хватает research-кандидатов'],
    'source diversity below target': ['source diversity gap', 'мало разных источников'],
    'high research score': ['high research score', 'высокий research score'],
    'strong source traceability': ['strong traceability', 'сильная traceability'],
    'already in deep-review queue': ['already queued', 'уже в review queue']
  };
  return ui(...(labels[value] || [value, value]));
}
