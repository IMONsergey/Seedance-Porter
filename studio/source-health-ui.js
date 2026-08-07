import { getLanguage } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const ru = () => getLanguage() === 'ru';
const ui = (en, ruText) => ru() ? ruText : en;

let health = null;
let loadError = null;

injectRoot();
bindEvents();
loadHealth();

function injectRoot() {
  const sourceView = $('#sourceView');
  if (!sourceView || $('#sourceAdapterHealth')) return;
  const root = document.createElement('section');
  root.id = 'sourceAdapterHealth';
  root.className = 'source-adapter-health';
  sourceView.appendChild(root);
  placeAfterPlanner();
  render();
}

function placeAfterPlanner() {
  const sourceView = $('#sourceView');
  const planner = $('#coveragePlanner', sourceView);
  const root = $('#sourceAdapterHealth', sourceView);
  if (!sourceView || !root) return false;
  if (planner) {
    if (planner.nextElementSibling !== root) planner.insertAdjacentElement('afterend', root);
    return true;
  }
  return false;
}

async function loadHealth() {
  try {
    const response = await fetch('./source-health.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    health = await response.json();
  } catch (error) {
    loadError = String(error?.message || error);
  }
  render();
}

function bindEvents() {
  window.addEventListener('porter-language-change', render);
  const sourceView = $('#sourceView');
  if (sourceView) {
    const observer = new MutationObserver(() => placeAfterPlanner());
    observer.observe(sourceView, { childList: true, subtree: false });
  }
}

function render() {
  const root = $('#sourceAdapterHealth');
  if (!root) return;
  placeAfterPlanner();

  if (!health) {
    root.innerHTML = `<div class="source-health-loading"><strong>${ui('Source Adapter Health', 'Состояние source adapters')}</strong><span>${loadError ? `${ui('Snapshot unavailable:', 'Снапшот недоступен:')} ${esc(loadError)}` : ui('Loading source-health snapshot…', 'Загружаю source-health snapshot…')}</span></div>`;
    return;
  }

  const adapters = health.adapters || [];
  const summary = health.summary || {};
  root.innerHTML = `
    <div class="source-health-head">
      <div>
        <span>${ui('Acquisition infrastructure', 'Инфраструктура acquisition')}</span>
        <h3>${ui('Source Adapter Health', 'Source Adapter Health')}</h3>
        <p>${ui('Runtime reliability plus actual research yield after global dedupe, risk filtering and balancing. This is where we decide which crawlers deserve more investment.', 'Надёжность runtime + реальная отдача после global dedupe, risk filtering и балансировки. Здесь видно, какие crawler’ы стоит развивать, а какие — чинить или не масштабировать.')}</p>
      </div>
      <div class="source-health-summary"><strong>${Number(summary.responding || 0)}/${Number(summary.enabled || 0)}</strong><span>${ui('responding', 'отвечают')}</span></div>
    </div>

    <div class="source-health-metrics">
      ${metric(summary.registered, ui('registered adapters', 'зарегистрировано'))}
      ${metric(summary.contributing, ui('contributing', 'дают кандидатов'))}
      ${metric(summary.highValue, ui('high-value', 'high-value'))}
      ${metric(summary.needsRepair, ui('need repair', 'нужно чинить'))}
      ${metric(summary.selectedCandidates, ui('selected candidates', 'selected кандидатов'))}
      ${metric(summary.highQualityCandidates, ui('score 70+', 'score 70+'))}
    </div>

    <div class="source-health-table">
      <div class="source-health-row head"><span>${ui('Adapter', 'Adapter')}</span><span>${ui('Runtime', 'Runtime')}</span><span>${ui('Discovered', 'Found')}</span><span>${ui('Selected', 'Selected')}</span><span>70+</span><span>${ui('Trace', 'Trace')}</span><span>${ui('Preview', 'Preview')}</span><span>${ui('Weak', 'Weak')}</span><span>${ui('Health', 'Health')}</span><span>${ui('Recommendation', 'Что делать')}</span></div>
      ${adapters.map(adapterRow).join('')}
    </div>

    <div class="source-health-footnote">${ui(
      'Selection yield is intentionally not called a duplicate rate: final contribution is also affected by risk filtering, cross-source dedupe, Collection balancing and the global corpus limit.',
      'Selection yield специально не называется duplicate rate: на финальный вклад влияют ещё risk filtering, cross-source dedupe, балансировка Collections и общий лимит корпуса.'
    )}</div>`;
}

function metric(value, label) {
  return `<article><strong>${Number(value || 0)}</strong><span>${esc(label)}</span></article>`;
}

function adapterRow(item) {
  const runtime = item.runtime || {};
  const yieldData = item.yield || {};
  const healthData = item.health || {};
  const discovered = Number(runtime.discovered || 0);
  const selected = Number(yieldData.selected || 0);
  const selectionYield = yieldData.selectionYieldPercent == null ? '—' : `${yieldData.selectionYieldPercent}%`;
  return `<article class="source-health-row" data-status="${attr(healthData.status || 'unknown')}">
    <span class="source-health-name"><strong>${esc(item.label || item.id)}</strong><small>${esc(item.stage || '')} · ${esc(item.kind || '')}</small><a href="${attr(item.upstream || '#')}" target="_blank" rel="noopener">${ui('upstream', 'upstream')} ↗</a></span>
    <span><b class="runtime-dot ${runtime.ok ? 'ok' : 'bad'}"></b>${runtime.ok ? ui('OK', 'OK') : ui('Fail', 'Ошибка')}</span>
    <span><strong>${discovered}</strong></span>
    <span><strong>${selected}</strong><small>${selectionYield}</small></span>
    <span><strong>${Number(yieldData.highQuality || 0)}</strong><small>${Number(yieldData.highQualityRatePercent || 0)}%</small></span>
    <span><strong>${Number(yieldData.averageTraceability || 0)}</strong><small>/ 5</small></span>
    <span><strong>${Number(yieldData.previewCoveragePercent || 0)}%</strong><small>${Number(yieldData.directSourceVideos || 0)} ${ui('video', 'video')}</small></span>
    <span><strong>${Number(yieldData.weakCollectionsServed || 0)}</strong><small>${Number(yieldData.collectionsServed || 0)} ${ui('total', 'всего')}</small></span>
    <span class="source-health-score"><strong>${Number(healthData.score || 0)}</strong><small>${esc(statusLabel(healthData.status))}</small><i><b style="width:${Math.max(0, Math.min(100, Number(healthData.score || 0)))}%"></b></i></span>
    <span><span class="source-health-recommendation">${esc(recommendationLabel(healthData.recommendation))}</span>${runtime.error ? `<small title="${attr(runtime.error)}">${ui('runtime error', 'runtime error')}</small>` : ''}</span>
  </article>`;
}

function statusLabel(value) {
  const labels = {
    'high-value': ['high-value', 'high-value'],
    productive: ['productive', 'полезный'],
    'low-yield': ['low-yield', 'низкая отдача'],
    'zero-yield': ['zero-yield', 'нулевой yield'],
    dormant: ['dormant', 'нет данных'],
    failed: ['failed', 'сломался']
  };
  return ui(...(labels[value] || [value || 'unknown', value || 'unknown']));
}

function recommendationLabel(value) {
  const labels = {
    'repair-adapter': ['repair adapter', 'починить adapter'],
    'inspect-upstream-structure': ['inspect upstream', 'проверить upstream'],
    'inspect-duplicates-risk-and-parser-quality': ['inspect yield', 'разобрать низкий yield'],
    'improve-provenance-before-scaling': ['fix provenance first', 'сначала provenance'],
    'expand-this-source': ['expand this source', 'расширять источник'],
    'keep-and-deepen': ['keep + deepen', 'сохранять и углублять'],
    'keep-monitoring': ['keep monitoring', 'оставить и наблюдать'],
    disabled: ['disabled', 'выключен']
  };
  return ui(...(labels[value] || [value || '—', value || '—']));
}
