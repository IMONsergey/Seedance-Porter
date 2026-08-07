import { getLanguage, t } from './i18n.js';

function escapeAttr(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function cloudflareDescriptor(item, autoplay = false) {
  try {
    const url = new URL(item.previewUrl || '');
    if (!url.hostname.endsWith('cloudflarestream.com')) return null;
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    if (!videoId) return null;
    const params = new URLSearchParams();
    params.set('preload', 'metadata');
    if (autoplay) params.set('autoplay', 'true');
    const query = params.toString();
    return {
      type: 'cloudflare-stream',
      title: t('media.sourceVideo'),
      src: `${url.origin}/${videoId}/iframe${query ? `?${query}` : ''}`,
      aspect: item.aspect === '9:16' ? '9 / 16' : item.aspect === '1:1' ? '1 / 1' : item.aspect === '4:3' ? '4 / 3' : '16 / 9'
    };
  } catch {
    return null;
  }
}

function xDescriptor(item) {
  const match = String(item.sourceUrl || '').match(/(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/i);
  if (!match) return null;
  const params = new URLSearchParams({
    id: match[1],
    theme: 'light',
    dnt: 'true',
    hideThread: 'true',
    frame: 'false',
    lang: getLanguage() === 'ru' ? 'ru' : 'en'
  });
  return {
    type: 'x-post',
    title: t('media.embeddedPost'),
    src: `https://platform.twitter.com/embed/Tweet.html?${params.toString()}`,
    aspect: null
  };
}

export function getMediaEmbed(item, options = {}) {
  const autoplay = Boolean(options.autoplay);
  if (item?.embedUrl) return { type: 'custom', title: t('media.sourceVideo'), src: item.embedUrl, aspect: item.aspect || '16 / 9' };
  return cloudflareDescriptor(item, autoplay) || xDescriptor(item) || null;
}

export function mediaEmbedHtml(item, options = {}) {
  const descriptor = getMediaEmbed(item, options);
  if (!descriptor) {
    return `<div class="source-media-fallback"><img src="${escapeAttr(item.previewUrl)}" alt="${escapeAttr(item.title)}"/><div><strong>${escapeAttr(t('media.unavailable'))}</strong><a href="${escapeAttr(item.sourceUrl)}" target="_blank" rel="noopener">${escapeAttr(t('media.openFallback'))} ↗</a></div></div>`;
  }
  const aspectStyle = descriptor.aspect ? `style="aspect-ratio:${descriptor.aspect}"` : '';
  const className = descriptor.type === 'x-post' ? 'source-media-frame is-x' : 'source-media-frame';
  return `<div class="source-media-shell" data-media-type="${escapeAttr(descriptor.type)}"><iframe class="${className}" ${aspectStyle} src="${escapeAttr(descriptor.src)}" title="${escapeAttr(descriptor.title)}" loading="eager" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}

export function mediaPlayButtonHtml(item) {
  if (!getMediaEmbed(item)) return '';
  return `<button class="media-play-button" type="button" data-play-digest="${escapeAttr(item.id)}" aria-label="${escapeAttr(t('media.play'))}"><span aria-hidden="true">▶</span><span>${escapeAttr(t('media.play'))}</span></button>`;
}
