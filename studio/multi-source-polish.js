import { MULTI_SOURCE_CASES } from './multi-source-cases.js';
import { getLanguage } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const ru = () => getLanguage() === 'ru';

function localizePlatformFilter() {
  const select = $('#digestPlatform');
  if (!select) return;
  const label = select.closest('label')?.querySelector(':scope > span');
  if (label) label.textContent = ru() ? 'Платформа' : 'Platform';
  const all = [...select.options].find(option => option.value === 'all');
  if (all) all.textContent = ru() ? 'Все платформы' : 'All platforms';
}

function localizeSourceUniverse() {
  const root = $('#sourceUniverseSummary');
  if (!root) return;
  const title = $('.source-universe-head h3', root);
  const paragraph = $('.source-universe-head p', root);
  const count = $('.source-universe-count', root);
  if (title) title.textContent = ru() ? 'Вселенная источников' : 'Source Universe';
  if (paragraph) paragraph.textContent = ru()
    ? 'X — только один канал creator-signal. Поиск охватывает награды, design/motion-архивы, production-прессу, официальные showcase и страницы агентств/студий.'
    : 'X is one creator-signal channel. Discovery spans awards, design/motion archives, production press, first-party showcases and studio case pages.';
  if (count) count.innerHTML = `<strong>31</strong> ${ru()?'платформа':'platforms'} · <strong>${MULTI_SOURCE_CASES.length}</strong> ${ru()?'новых кейсов':'new curated cases'}`;
}

function syncCollectionCounts() {
  const root = $('#caseCollections');
  if (!root) return;
  $$('[data-collection]', root).forEach(button => {
    const strong = $('strong', button);
    if (!strong) return;
    if (!button.dataset.baseCount) button.dataset.baseCount = String(Number.parseInt(strong.textContent || '0', 10) || 0);
    const base = Number(button.dataset.baseCount || 0);
    const collection = button.dataset.collection;
    const extra = collection === 'all' ? MULTI_SOURCE_CASES.length : MULTI_SOURCE_CASES.filter(item => item.collections?.includes(collection)).length;
    strong.textContent = String(base + extra);
  });
}

function update() {
  localizePlatformFilter();
  localizeSourceUniverse();
  syncCollectionCounts();
}

const sidebar = document.querySelector('.sidebar');
if (sidebar) new MutationObserver(update).observe(sidebar, { childList:true, subtree:true });
const sourceView = document.querySelector('#sourceView');
if (sourceView) new MutationObserver(update).observe(sourceView, { childList:true, subtree:true });
window.addEventListener('porter-language-change', () => requestAnimationFrame(update));
queueMicrotask(update);
