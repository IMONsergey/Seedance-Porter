import { getMediaEmbed, mediaEmbedHtml } from './media-embed.js';
import { getLanguage } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const ru = () => getLanguage() === 'ru';
const ui = (en, ruText) => ru() ? ruText : en;
const STORAGE_PREFIX = 'porterDeepReviewMediaEvidence:';

let corpusById = new Map();
let activeCandidateId = null;
let saveTimer = null;

loadCorpus();
bindGlobalEvents();
observeEditor();

async function loadCorpus() {
  try {
    const response = await fetch('./case-candidates.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const corpus = await response.json();
    corpusById = new Map((corpus.candidates || []).map(item => [item.id, item]));
  } catch {
    corpusById = new Map();
  }
  mountForCurrentEditor();
}

function bindGlobalEvents() {
  window.addEventListener('porter-language-change', () => {
    const form = $('#deepReviewForm');
    if (form) mountForCandidate(form.dataset.candidateId, true);
  });

  document.addEventListener('click', event => {
    const add = event.target.closest('#reviewTimelineAdd');
    if (add) { addTimelineMarker(); return; }

    const remove = event.target.closest('[data-remove-review-marker]');
    if (remove) { removeTimelineMarker(remove.dataset.removeReviewMarker); return; }

    const seek = event.target.closest('[data-seek-review-marker]');
    if (seek) { seekToMarker(seek.dataset.seekReviewMarker); return; }

    const copy = event.target.closest('#reviewTimelineCopy');
    if (copy) { copyTimelineJson(); return; }

    const copyNotes = event.target.closest('#reviewTimelineCopyNotes');
    if (copyNotes) { copyTimelineNotes(); return; }

    const exportButton = event.target.closest('#reviewTimelineExport');
    if (exportButton) { exportTimelineJson(); return; }

    const useTime = event.target.closest('#reviewUseCurrentTime');
    if (useTime) {
      const video = $('[data-review-media] video');
      const input = $('#reviewMarkerTime');
      if (video && input) input.value = formatTime(video.currentTime || 0);
    }
  });
}

function observeEditor() {
  const body = $('#deepReviewBody');
  if (!body) {
    queueMicrotask(observeEditor);
    return;
  }
  new MutationObserver(mountForCurrentEditor).observe(body, { childList: true, subtree: false });
  mountForCurrentEditor();
}

function mountForCurrentEditor() {
  const form = $('#deepReviewForm');
  if (!form) { activeCandidateId = null; return; }
  const candidateId = form.dataset.candidateId;
  if (!candidateId) return;
  mountForCandidate(candidateId, activeCandidateId === candidateId && Boolean($('[data-review-media]')));
}

function mountForCandidate(candidateId, force = false) {
  const form = $('#deepReviewForm');
  const editor = form?.closest('.deep-review-editor');
  const top = $('.deep-editor-top', editor);
  if (!form || !editor || !top || form.dataset.candidateId !== candidateId) return;
  if (!force && activeCandidateId === candidateId && $('[data-review-media]', editor)) return;
  $('[data-review-media]', editor)?.remove();
  activeCandidateId = candidateId;

  const candidate = corpusById.get(candidateId) || {};
  const sourceVideoUrl = form.elements.sourceVideoUrl?.value.trim() || candidate.sourceVideoUrl || '';
  const sourceUrl = candidate.sourceUrl || sourceVideoUrl || '';
  const mediaItem = {
    ...candidate,
    id: candidateId,
    title: candidate.title || candidateId,
    sourceUrl,
    sourceVideoUrl,
    previewUrl: candidate.previewUrl || ''
  };
  const descriptor = getMediaEmbed(mediaItem);
  const evidence = loadEvidence(candidateId);
  const section = document.createElement('section');
  section.className = 'review-media-workspace';
  section.dataset.reviewMedia = candidateId;
  section.innerHTML = reviewMediaHtml(mediaItem, descriptor, evidence);
  top.insertAdjacentElement('afterend', section);
  bindNativeVideo(section, evidence);
  renderTimelineList(evidence);
}

function reviewMediaHtml(item, descriptor, evidence) {
  const native = descriptor?.type === 'direct-video';
  const typeLabel = descriptor ? descriptorTypeLabel(descriptor.type) : ui('source fallback', 'fallback источника');
  return `
    <div class="review-media-head">
      <div><span>${ui('Observation surface', 'Поверхность наблюдения')}</span><h3>${ui('Source Review Player', 'Source Review Player')}</h3><p>${ui('Watch and annotate the source next to the evidence form. Player telemetry never marks the review complete by itself.', 'Смотри и размечай источник рядом с evidence form. Телеметрия плеера никогда сама не подтверждает просмотр.')}</p></div>
      <div class="review-media-type">${esc(typeLabel)}</div>
    </div>
    <div class="review-media-grid">
      <div class="review-player-column">
        ${mediaEmbedHtml(item, { autoplay: false })}
        <div class="review-playback-evidence" data-native-playback="${native ? 'true' : 'false'}">
          <div><span>${ui('Current time', 'Текущий timecode')}</span><strong id="reviewCurrentTime">${formatTime(evidence.playback?.lastTime || 0)}</strong></div>
          <div><span>${ui('Played coverage', 'Проиграно')}</span><strong id="reviewPlayedCoverage">${native ? `${Number(evidence.playback?.coveragePercent || 0)}%` : '—'}</strong></div>
          <div class="review-coverage-track"><i id="reviewCoverageBar" style="width:${native ? Number(evidence.playback?.coveragePercent || 0) : 0}%"></i></div>
          <small>${native ? ui('Playback coverage is a helper signal, not evidence attestation.', 'Playback coverage — вспомогательный сигнал, а не evidence attestation.') : ui('Cross-origin embeds do not expose playback time. Enter marker timecodes manually.', 'Cross-origin embed не отдаёт playback time. Timecode маркеров вводится вручную.')}</small>
        </div>
      </div>
      <div class="review-timeline-column">
        <div class="review-timeline-title"><div><span>${ui('Optional companion evidence', 'Дополнительные evidence notes')}</span><strong>${ui('Observation timeline', 'Таймлайн наблюдений')}</strong></div><span id="reviewMarkerCount">${evidence.markers.length}</span></div>
        <div class="review-marker-controls">
          <select id="reviewMarkerType">${markerTypeOptions()}</select>
          <div class="review-time-field"><input id="reviewMarkerTime" inputmode="decimal" value="${formatTime(evidence.playback?.lastTime || 0)}" placeholder="00:00"><button class="button small" type="button" id="reviewUseCurrentTime" ${native ? '' : 'disabled'}>${ui('Use player', 'Из плеера')}</button></div>
          <textarea id="reviewMarkerNote" rows="2" placeholder="${attr(ui('What exactly happened at this moment?', 'Что именно произошло в этот момент?'))}"></textarea>
          <button class="button primary small" type="button" id="reviewTimelineAdd">＋ ${ui('Add marker', 'Добавить маркер')}</button>
        </div>
        <div class="review-timeline-list" id="reviewTimelineList"></div>
        <div class="review-timeline-actions">
          <button class="button small" type="button" id="reviewTimelineCopyNotes">${ui('Copy notes', 'Копировать notes')}</button>
          <button class="button small" type="button" id="reviewTimelineCopy">${ui('Copy timeline JSON', 'Копировать JSON')}</button>
          <button class="button small" type="button" id="reviewTimelineExport">${ui('Export timeline', 'Экспорт timeline')}</button>
        </div>
      </div>
    </div>
    <div class="review-media-boundary"><strong>${ui('Evidence boundary.', 'Граница доказательности.')}</strong> ${ui('Timeline markers and playback coverage are reviewer aids. Only the separate manual complete-video checkbox plus the required observed fields can unlock deep-reviewed export.', 'Маркеры и playback coverage помогают reviewer’у. Deep-reviewed export открывается только отдельным ручным подтверждением полного просмотра и заполнением обязательных observed-полей.')}</div>`;
}

function bindNativeVideo(root, evidence) {
  const video = $('video', root);
  if (!video) return;
  const sync = () => {
    const current = Number(video.currentTime || 0);
    const duration = Number(video.duration || evidence.playback?.duration || 0);
    const ranges = videoPlayedRanges(video);
    const coverage = duration > 0 ? Math.min(100, Math.round((ranges.reduce((sum, range) => sum + Math.max(0, range[1] - range[0]), 0) / duration) * 100)) : Number(evidence.playback?.coveragePercent || 0);
    evidence.playback = { duration, playedRanges: ranges, coveragePercent: coverage, lastTime: current, updatedAt: new Date().toISOString() };
    setText('#reviewCurrentTime', formatTime(current));
    setText('#reviewPlayedCoverage', `${coverage}%`);
    const bar = $('#reviewCoverageBar'); if (bar) bar.style.width = `${coverage}%`;
    const timeInput = $('#reviewMarkerTime');
    if (timeInput && document.activeElement !== timeInput) timeInput.value = formatTime(current);
    scheduleSave(evidence);
  };
  video.addEventListener('loadedmetadata', sync);
  video.addEventListener('timeupdate', sync);
  video.addEventListener('pause', sync);
  video.addEventListener('ended', sync);
}

function videoPlayedRanges(video) {
  const ranges = [];
  try {
    for (let index = 0; index < video.played.length; index += 1) ranges.push([Number(video.played.start(index).toFixed(2)), Number(video.played.end(index).toFixed(2))]);
  } catch {}
  return mergeRanges(ranges);
}

function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range[0] > last[1] + 0.35) merged.push([...range]);
    else last[1] = Math.max(last[1], range[1]);
  }
  return merged;
}

function addTimelineMarker() {
  if (!activeCandidateId) return;
  const evidence = loadEvidence(activeCandidateId);
  const type = $('#reviewMarkerType')?.value || 'note';
  const timeValue = $('#reviewMarkerTime')?.value || '';
  const seconds = parseTime(timeValue);
  const note = $('#reviewMarkerNote')?.value.trim() || '';
  if (!note) return;
  evidence.markers.push({
    id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    timeSeconds: Number.isFinite(seconds) ? seconds : null,
    timecode: Number.isFinite(seconds) ? formatTime(seconds) : String(timeValue).trim(),
    note,
    createdAt: new Date().toISOString()
  });
  evidence.markers.sort((a, b) => (a.timeSeconds ?? Number.MAX_SAFE_INTEGER) - (b.timeSeconds ?? Number.MAX_SAFE_INTEGER));
  saveEvidence(evidence);
  const noteInput = $('#reviewMarkerNote'); if (noteInput) noteInput.value = '';
  renderTimelineList(evidence);
}

function removeTimelineMarker(markerId) {
  if (!activeCandidateId) return;
  const evidence = loadEvidence(activeCandidateId);
  evidence.markers = evidence.markers.filter(marker => marker.id !== markerId);
  saveEvidence(evidence);
  renderTimelineList(evidence);
}

function seekToMarker(markerId) {
  if (!activeCandidateId) return;
  const evidence = loadEvidence(activeCandidateId);
  const marker = evidence.markers.find(item => item.id === markerId);
  const video = $('[data-review-media] video');
  if (!marker || !video || marker.timeSeconds == null) return;
  video.currentTime = marker.timeSeconds;
  video.focus();
}

function renderTimelineList(evidence) {
  const root = $('#reviewTimelineList');
  if (!root) return;
  setText('#reviewMarkerCount', String(evidence.markers.length));
  root.innerHTML = evidence.markers.length ? evidence.markers.map(marker => `<article class="review-marker-row" data-marker-type="${attr(marker.type)}"><button class="review-marker-time" type="button" data-seek-review-marker="${attr(marker.id)}" ${marker.timeSeconds == null || !$('[data-review-media] video') ? 'disabled' : ''}>${esc(marker.timecode || '—')}</button><div><strong>${esc(markerTypeLabel(marker.type))}</strong><p>${esc(marker.note)}</p></div><button class="review-marker-remove" type="button" data-remove-review-marker="${attr(marker.id)}" aria-label="${attr(ui('Remove marker', 'Удалить маркер'))}">×</button></article>`).join('') : `<div class="review-timeline-empty">${ui('No markers yet. Add only observations that help you write the structured review.', 'Маркеров пока нет. Добавляй только наблюдения, которые помогут заполнить structured review.')}</div>`;
}

async function copyTimelineJson() {
  if (!activeCandidateId) return;
  await navigator.clipboard.writeText(JSON.stringify(timelineExport(loadEvidence(activeCandidateId)), null, 2));
}

async function copyTimelineNotes() {
  if (!activeCandidateId) return;
  const evidence = loadEvidence(activeCandidateId);
  const text = evidence.markers.map(marker => `${marker.timecode || '—'} · ${markerTypeLabel(marker.type)} · ${marker.note}`).join('\n');
  await navigator.clipboard.writeText(text);
}

function exportTimelineJson() {
  if (!activeCandidateId) return;
  const value = timelineExport(loadEvidence(activeCandidateId));
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFilename(activeCandidateId)}.review-timeline.json`;
  document.body.appendChild(anchor);
  anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}

function timelineExport(evidence) {
  return {
    schemaVersion: 1,
    kind: 'seedance-porter-review-media-evidence',
    candidateId: evidence.candidateId,
    sourceVideoUrl: evidence.sourceVideoUrl || corpusById.get(evidence.candidateId)?.sourceVideoUrl || corpusById.get(evidence.candidateId)?.sourceUrl || '',
    playback: evidence.playback,
    markers: evidence.markers,
    exportedAt: new Date().toISOString(),
    evidenceBoundary: 'Playback coverage and markers are reviewer aids only. They do not constitute complete-video attestation or deep-reviewed status.'
  };
}

function loadEvidence(candidateId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${candidateId}`);
    if (raw) return normalizeEvidence(JSON.parse(raw), candidateId);
  } catch {}
  return normalizeEvidence({}, candidateId);
}

function normalizeEvidence(value, candidateId) {
  const candidate = corpusById.get(candidateId) || {};
  return {
    schemaVersion: 1,
    candidateId,
    sourceVideoUrl: value.sourceVideoUrl || candidate.sourceVideoUrl || candidate.sourceUrl || '',
    playback: {
      duration: Number(value.playback?.duration || 0),
      playedRanges: Array.isArray(value.playback?.playedRanges) ? value.playback.playedRanges : [],
      coveragePercent: Number(value.playback?.coveragePercent || 0),
      lastTime: Number(value.playback?.lastTime || 0),
      updatedAt: value.playback?.updatedAt || null
    },
    markers: Array.isArray(value.markers) ? value.markers : [],
    updatedAt: value.updatedAt || new Date().toISOString()
  };
}

function saveEvidence(value) {
  value.updatedAt = new Date().toISOString();
  try { localStorage.setItem(`${STORAGE_PREFIX}${value.candidateId}`, JSON.stringify(value)); } catch {}
}

function scheduleSave(value) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveEvidence(value), 800);
}

function markerTypeOptions() {
  return ['shot-boundary','transition','artifact','continuity','signature-move','note'].map(type => `<option value="${type}">${esc(markerTypeLabel(type))}</option>`).join('');
}

function markerTypeLabel(type) {
  const labels = {
    'shot-boundary': ['Shot / beat', 'Кадр / бит'],
    transition: ['Transition', 'Переход'],
    artifact: ['Artifact', 'Артефакт'],
    continuity: ['Continuity', 'Непрерывность'],
    'signature-move': ['Signature move', 'Главная фишка'],
    note: ['Observation', 'Наблюдение']
  };
  return ui(...(labels[type] || [type, type]));
}

function descriptorTypeLabel(type) {
  const labels = {
    'direct-video': ['direct video', 'direct video'],
    'cloudflare-stream': ['Cloudflare video', 'Cloudflare video'],
    youtube: ['YouTube embed', 'YouTube embed'],
    vimeo: ['Vimeo embed', 'Vimeo embed'],
    'x-post': ['X source post', 'X source post'],
    custom: ['source embed', 'source embed']
  };
  return ui(...(labels[type] || [type, type]));
}

function parseTime(value) {
  const text = String(value || '').trim();
  if (!text) return NaN;
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const parts = text.split(':').map(Number);
  if (parts.some(part => !Number.isFinite(part))) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}

function formatTime(value) {
  const seconds = Math.max(0, Number(value || 0));
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const remain = whole % 60;
  const tenths = Math.floor((seconds - whole) * 10);
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}${tenths ? `.${tenths}` : ''}`;
}

function safeFilename(value) { return String(value || 'review-media').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, ''); }
function setText(selector, value) { const node = $(selector); if (node) node.textContent = value; }
