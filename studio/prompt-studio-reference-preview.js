import { promptStudioAssetObjectUrl, revokePromptStudioAssetObjectUrl } from './prompt-studio-assets.js';

const objectUrls = new Map();
let queued = false;
let generation = 0;

bindReferencePreviewLayer();
scheduleRender();

function bindReferencePreviewLayer() {
  new MutationObserver(scheduleRender).observe(document.body, { childList:true, subtree:true });
  window.addEventListener('porter-prompt-studio-change', scheduleRender);
  window.addEventListener('porter-workspace-change', event => {
    if (event.detail?.viewId === 'promptStudioView') scheduleRender();
  });
  window.addEventListener('beforeunload', revokeAll);
}

function scheduleRender() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    renderVisibleReferencePreviews();
  });
}

async function renderVisibleReferencePreviews() {
  const project = window.porterPromptStudio?.getProject?.();
  if (!project) return;
  const currentGeneration = ++generation;
  const byId = new Map((project.references || []).map(ref => [ref.id, ref]));
  const cards = [...document.querySelectorAll('.studio-reference-card[data-ref-id]')];

  for (const card of cards) {
    if (currentGeneration !== generation) return;
    const ref = byId.get(card.dataset.refId);
    if (!ref) continue;
    const signature = previewSignature(ref);
    const existing = card.querySelector('.studio-reference-preview');
    if (existing?.dataset.previewSignature === signature) continue;
    existing?.remove();

    const preview = document.createElement('div');
    preview.className = 'studio-reference-preview';
    preview.dataset.previewSignature = signature;
    preview.dataset.mediaType = ref.mediaType || 'unknown';

    const mediaUrl = await resolveMediaUrl(ref);
    if (currentGeneration !== generation) return;
    if (mediaUrl) {
      const media = ref.mediaType === 'video' ? document.createElement('video') : document.createElement('img');
      media.src = mediaUrl;
      if (media.tagName === 'VIDEO') {
        media.controls = true;
        media.muted = true;
        media.playsInline = true;
        media.preload = 'metadata';
      } else {
        media.alt = ref.name || ref.token || 'Prompt Studio reference';
        media.loading = 'lazy';
      }
      media.addEventListener('error', () => showFallback(preview, ref), { once:true });
      preview.appendChild(media);
    } else {
      showFallback(preview, ref);
    }

    const caption = document.createElement('div');
    caption.className = 'studio-reference-preview-caption';
    const title = document.createElement('strong');
    title.textContent = ref.token || 'reference';
    const detail = document.createElement('span');
    detail.textContent = [ref.role || 'other', ref.locked ? 'LOCKED' : '', ref.localAssetKey ? 'local' : ref.uri ? 'URL' : ''].filter(Boolean).join(' · ');
    caption.append(title, detail);
    preview.appendChild(caption);

    const tokenRow = card.querySelector('.studio-ref-token');
    tokenRow?.insertAdjacentElement('afterend', preview);
  }
}

async function resolveMediaUrl(ref) {
  if (ref.localAssetKey) {
    if (objectUrls.has(ref.localAssetKey)) return objectUrls.get(ref.localAssetKey);
    try {
      const url = await promptStudioAssetObjectUrl(ref.localAssetKey);
      if (url) objectUrls.set(ref.localAssetKey, url);
      return url;
    } catch {
      return '';
    }
  }
  const uri = String(ref.uri || '').trim();
  if (!/^https?:\/\//i.test(uri)) return '';
  return uri;
}

function showFallback(root, ref) {
  root.querySelector('img,video')?.remove();
  if (root.querySelector('.studio-reference-preview-empty')) return;
  const empty = document.createElement('div');
  empty.className = 'studio-reference-preview-empty';
  const icon = document.createElement('span');
  icon.textContent = ref.mediaType === 'video' ? '▶' : ref.mediaType === 'image' ? '▧' : '◇';
  const label = document.createElement('small');
  label.textContent = ref.localAssetKey ? 'Local asset unavailable' : ref.uri ? 'Preview unavailable' : 'Attach a local file or URL';
  empty.append(icon, label);
  root.prepend(empty);
}

function previewSignature(ref) {
  return [ref.localAssetKey, ref.uri, ref.mediaType, ref.role, ref.locked, ref.name].map(value => String(value ?? '')).join('|');
}

function revokeAll() {
  for (const url of objectUrls.values()) revokePromptStudioAssetObjectUrl(url);
  objectUrls.clear();
}
