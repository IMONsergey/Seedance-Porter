import { MULTI_SOURCE_CASES } from './multi-source-index.js';
import { getLanguage } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const ru = () => getLanguage() === 'ru';

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function localizePlatformFilter() {
  const select = $('#digestPlatform');
  if (!select) return false;
  const label = select.closest('label')?.querySelector(':scope > span');
  setText(label, ru() ? 'Платформа' : 'Platform');
  const all = [...select.options].find(option => option.value === 'all');
  setText(all, ru() ? 'Все платформы' : 'All platforms');
  return true;
}

function localizeSourceUniverse() {
  const root = $('#sourceUniverseSummary');
  if (!root) return false;
  setText($('.source-universe-head h3', root), ru() ? 'Вселенная источников' : 'Source Universe');
  setText(
    $('.source-universe-head p', root),
    ru()
      ? 'X — только один канал creator-signal. Поиск охватывает награды, design/motion-архивы, production-прессу, официальные showcase и страницы агентств/студий.'
      : 'X is one creator-signal channel. Discovery spans awards, design/motion archives, production press, first-party showcases and studio case pages.'
  );
  const count = $('.source-universe-count', root);
  if (count) {
    const next = `<strong>31</strong> ${ru() ? 'платформа' : 'platforms'} · <strong>${MULTI_SOURCE_CASES.length}</strong> ${ru() ? 'новых кейсов' : 'new curated cases'}`;
    if (count.innerHTML !== next) count.innerHTML = next;
  }
  return true;
}

function syncCollectionCounts() {
  const root = $('#caseCollections');
  if (!root) return false;
  $$('[data-collection]', root).forEach(button => {
    const strong = $('strong', button);
    if (!strong) return;
    if (!button.dataset.baseCount) {
      button.dataset.baseCount = String(Number.parseInt(strong.textContent || '0', 10) || 0);
    }
    const base = Number(button.dataset.baseCount || 0);
    const collection = button.dataset.collection;
    const extra = collection === 'all'
      ? MULTI_SOURCE_CASES.length
      : MULTI_SOURCE_CASES.filter(item => item.collections?.includes(collection)).length;
    const next = String(base + extra);
    if (strong.textContent !== next) strong.textContent = next;
  });
  return true;
}

function update() {
  localizePlatformFilter();
  localizeSourceUniverse();
  syncCollectionCounts();
}

function settleMount(attempt = 0) {
  update();
  if (attempt >= 10) return;
  const ready = Boolean($('#digestPlatform') && $('#caseCollections') && $('#sourceUniverseSummary'));
  if (!ready) requestAnimationFrame(() => settleMount(attempt + 1));
}

window.addEventListener('porter-language-change', () => requestAnimationFrame(() => settleMount()));
window.addEventListener('load', () => requestAnimationFrame(() => settleMount()));
queueMicrotask(() => settleMount());
