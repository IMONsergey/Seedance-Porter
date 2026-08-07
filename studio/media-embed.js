import { getLanguage, t } from './i18n.js';

function escapeAttr(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function aspectFor(item) {
  return item?.aspect === '9:16' ? '9 / 16' : item?.aspect === '1:1' ? '1 / 1' : item?.aspect === '4:3' ? '4 / 3' : '16 / 9';
}

function directVideoDescriptor(item) {
  const explicit = String(item?.sourceVideoUrl || '').trim();
  if (explicit) {
    return { type: 'direct-video', title: t('media.sourceVideo'), src: explicit, aspect: aspectFor(item) };
  }
  const candidates = [item?.sourceUrl, item?.previewUrl].filter(Boolean).map(String);
  const direct = candidates.find(value => /(?:\.mp4|\.webm|\.m4v|\.mov)(?:$|[?#])/i.test(value) || /video\.twimg\.com\//i.test(value));
  return direct ? { type: 'direct-video', title: t('media.sourceVideo'), src: direct, aspect: aspectFor(item) } : null;
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
    return {
      type: 'cloudflare-stream',
      title: t('media.sourceVideo'),
      src: `${url.origin}/${videoId}/iframe?${params.toString()}`,
      aspect: aspectFor(item)
    };
  } catch {
    return null;
  }
}

function youtubeDescriptor(item) {
  const raw = String(item?.sourceUrl || item?.archiveUrl || '').trim();
  try {
    const url = new URL(raw);
    let id = '';
    if (/youtu\.be$/i.test(url.hostname)) id = url.pathname.split('/').filter(Boolean)[0] || '';
    if (/youtube\.com$/i.test(url.hostname) || /youtube-nocookie\.com$/i.test(url.hostname)) {
      id = url.searchParams.get('v') || url.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/i)?.[1] || '';
    }
    if (!id) return null;
    return { type: 'youtube', title: t('media.sourceVideo'), src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`, aspect: aspectFor(item) };
  } catch { return null; }
}

function vimeoDescriptor(item) {
  const raw = String(item?.sourceUrl || item?.archiveUrl || '').trim();
  try {
    const url = new URL(raw);
    if (!/(?:^|\.)vimeo\.com$/i.test(url.hostname)) return null;
    const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1] || '';
    if (!id) return null;
    return { type: 'vimeo', title: t('media.sourceVideo'), src: `https://player.vimeo.com/video/${id}?dnt=1`, aspect: aspectFor(item) };
  } catch { return null; }
}

function xDescriptor(item) {
  const match = String(item.sourceUrl || '').match(/(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/i);
  if (!match) return null;
  const params = new URLSearchParams({ id: match[1], theme: 'light', dnt: 'true', hideThread: 'true', frame: 'false', lang: getLanguage() === 'ru' ? 'ru' : 'en' });
  return { type: 'x-post', title: t('media.embeddedPost'), src: `https://platform.twitter.com/embed/Tweet.html?${params.toString()}`, aspect: null };
}

export function getMediaEmbed(item, options = {}) {
  const autoplay = Boolean(options.autoplay);
  if (item?.embedUrl) return { type: 'custom', title: t('media.sourceVideo'), src: item.embedUrl, aspect: item.aspect || '16 / 9' };
  return directVideoDescriptor(item)
    || cloudflareDescriptor(item, autoplay)
    || youtubeDescriptor(item)
    || vimeoDescriptor(item)
    || xDescriptor(item)
    || null;
}

export function mediaEmbedHtml(item, options = {}) {
  const descriptor = getMediaEmbed(item, options);
  if (!descriptor) {
    const preview = item?.previewUrl ? `<img src="${escapeAttr(item.previewUrl)}" alt="${escapeAttr(item.title)}"/>` : '<div class="source-media-empty" aria-hidden="true">▶</div>';
    return `<div class="source-media-fallback">${preview}<div><strong>${escapeAttr(t('media.unavailable'))}</strong>${item?.sourceUrl ? `<a href="${escapeAttr(item.sourceUrl)}" target="_blank" rel="noopener">${escapeAttr(t('media.openFallback'))} ↗</a>` : ''}</div></div>`;
  }
  const aspectStyle = descriptor.aspect ? `style="aspect-ratio:${descriptor.aspect}"` : '';
  if (descriptor.type === 'direct-video') {
    return `<div class="source-media-shell" data-media-type="direct-video"><video class="source-media-video" ${aspectStyle} src="${escapeAttr(descriptor.src)}" controls preload="metadata" playsinline crossorigin="anonymous"></video></div>`;
  }
  const className = descriptor.type === 'x-post' ? 'source-media-frame is-x' : 'source-media-frame';
  return `<div class="source-media-shell" data-media-type="${escapeAttr(descriptor.type)}"><iframe class="${className}" ${aspectStyle} src="${escapeAttr(descriptor.src)}" title="${escapeAttr(descriptor.title)}" loading="eager" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}

export function mediaPlayButtonHtml(item) {
  if (!getMediaEmbed(item)) return '';
  return `<button class="media-play-button" type="button" data-play-digest="${escapeAttr(item.id)}" aria-label="${escapeAttr(t('media.play'))}"><span aria-hidden="true">▶</span><span>${escapeAttr(t('media.play'))}</span></button>`;
}
