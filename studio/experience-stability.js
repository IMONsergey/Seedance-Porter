import { INDUSTRY_DIGEST } from './digest-data.js';
import { t } from './i18n.js';
import { mediaEmbedHtml } from './media-embed.js';

function stabilizeLanguageLabel() {
  const label = document.querySelector('.language-switch-label');
  if (!label) return;
  label.removeAttribute('data-i18n');
  const next = t('language.label');
  if (label.textContent !== next) label.textContent = next;
}

function restoreDrawerMedia() {
  const drawer = document.querySelector('#drawerContent');
  if (!drawer || drawer.querySelector('[data-source-media-enhanced]')) return;
  const title = drawer.querySelector('#drawerTitle')?.textContent?.trim();
  const item = INDUSTRY_DIGEST.find(entry => entry.title === title);
  const body = drawer.querySelector('[data-digest-body]');
  if (!item || !body) return;
  const wrapper = document.createElement('div');
  wrapper.dataset.sourceMediaEnhanced = 'true';
  wrapper.className = 'drawer-source-media';
  wrapper.innerHTML = mediaEmbedHtml(item, { autoplay: false });
  body.parentElement.insertBefore(wrapper, body);
}

queueMicrotask(stabilizeLanguageLabel);
window.addEventListener('porter-language-change', () => {
  stabilizeLanguageLabel();
  requestAnimationFrame(restoreDrawerMedia);
});
