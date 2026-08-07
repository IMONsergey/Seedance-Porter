import { MULTI_SOURCE_CASES } from './multi-source-index.js';
import { SOURCE_PLATFORMS, SOURCE_FAMILIES } from './source-universe.js';
import { getLanguage } from './i18n.js';
import { mountCaseBatch } from './multi-source-batch-runtime.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ru = () => getLanguage() === 'ru';
const ui = (en, ruText) => ru() ? ruText : en;

function ensurePlatformFilter() {
  const creator = $('#digestCreator');
  const panel = creator?.closest('[data-sidebar-view="digest"]');
  if (!creator || !panel) return;
  let select = $('#digestPlatform');
  if (!select) {
    const label = document.createElement('label');
    label.className = 'multi-platform-filter';
    label.innerHTML = `<span>${ui('Platform','Платформа')}</span><select id="digestPlatform"><option value="all">${ui('All platforms','Все платформы')}</option><option value="x">X / YouMind</option></select>`;
    creator.closest('label')?.insertAdjacentElement('afterend', label);
    select = $('#digestPlatform');
  }
  if (!select) return;
  const existing = new Set([...select.options].map(option => option.value));
  [...new Set(MULTI_SOURCE_CASES.map(item => item.sourcePlatform))]
    .map(id => SOURCE_PLATFORMS.find(platform => platform.id === id))
    .filter(Boolean)
    .sort((a,b) => a.label.localeCompare(b.label))
    .forEach(platform => {
      if (!existing.has(platform.id)) select.insertAdjacentHTML('beforeend', `<option value="${esc(platform.id)}">${esc(platform.label)}</option>`);
    });
}

function ensureSourceUniverseSummary() {
  const grid = $('#sourceGrid');
  if (!grid) return;
  let root = $('#sourceUniverseSummary');
  if (!root) {
    root = document.createElement('section');
    root.id = 'sourceUniverseSummary';
    root.className = 'source-universe-summary';
    grid.parentElement?.insertBefore(root, grid);
  }
  root.innerHTML = `<div class="source-universe-head"><div><h3>${ui('Source Universe','Вселенная источников')}</h3><p>${ui('X is only one creator-signal channel. The curated library also uses awards, motion archives, production press, official showcases and primary studio case pages.','X — только один creator-signal канал. Curated-библиотека также использует награды, motion-архивы, production-прессу, официальные showcase и первичные страницы студий.')}</p></div><div class="source-universe-count"><strong>${SOURCE_PLATFORMS.length}</strong> ${ui('platforms','платформ')} · <strong>${MULTI_SOURCE_CASES.length}</strong> ${ui('multi-source cases','multi-source кейсов')}</div></div><div class="source-family-row">${SOURCE_FAMILIES.map(family => `<span>${esc(family)}</span>`).join('')}</div>`;
}

function syncLanguage() {
  const select = $('#digestPlatform');
  if (select) {
    const label = select.closest('label')?.querySelector(':scope > span');
    if (label) label.textContent = ui('Platform','Платформа');
    const all = [...select.options].find(option => option.value === 'all');
    if (all) all.textContent = ui('All platforms','Все платформы');
  }
  ensureSourceUniverseSummary();
}

ensurePlatformFilter();
mountCaseBatch(MULTI_SOURCE_CASES, 'unified');
ensureSourceUniverseSummary();
window.addEventListener('porter-language-change', () => requestAnimationFrame(syncLanguage));
queueMicrotask(() => {
  ensurePlatformFilter();
  ensureSourceUniverseSummary();
});
