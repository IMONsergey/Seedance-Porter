#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const [media, player, bootstrap, schema, sidebar] = await Promise.all([
  readFile('studio/media-embed.js', 'utf8'),
  readFile('studio/deep-review-player.js', 'utf8'),
  readFile('studio/deep-review-player-bootstrap.js', 'utf8'),
  readFile('schemas/review-media-evidence.schema.json', 'utf8'),
  readFile('studio/sidebar.js', 'utf8')
]);

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

// Shared media renderer must distinguish page URLs from actual direct video URLs.
assert(media.includes('function isDirectVideoUrl'), 'Media embed layer must explicitly distinguish direct video files from source pages.');
assert(media.includes('video\\.twimg\\.com'), 'Direct Twitter/X video CDN URLs must be supported.');
assert(media.includes("type: 'direct-video'"), 'Direct video descriptor is required.');
assert(media.includes("type: 'youtube'"), 'YouTube embed descriptor is required.');
assert(media.includes("type: 'vimeo'"), 'Vimeo embed descriptor is required.');
assert(media.includes("type: 'x-post'"), 'X source-post embed fallback must remain supported.');
assert(media.includes('<video class=\\"source-media-video\\"') || media.includes('<video class="source-media-video"'), 'Direct media must render with native video controls.');
assert(!media.includes('crossorigin="anonymous"'), 'Direct source video must not require upstream CORS when no pixel access is needed.');

// Review Player must be a companion evidence tool only.
assert(player.includes("porterDeepReviewMediaEvidence:"), 'Review Player must store companion evidence under its own localStorage namespace.');
assert(player.includes('video.played'), 'Native playback coverage must derive from actual played ranges.');
assert(player.includes('coveragePercent'), 'Playback coverage percentage must be persisted.');
for (const marker of ['shot-boundary','transition','artifact','continuity','signature-move','note']) {
  assert(player.includes(`'${marker}'`) || player.includes(`"${marker}"`), `Missing timeline marker type: ${marker}`);
}
assert(player.includes('seedance-porter-review-media-evidence'), 'Timeline export kind must be stable.');
assert(player.includes('Playback coverage and markers are reviewer aids only'), 'Timeline export must preserve the evidence boundary.');
assert(player.includes('never') || player.includes('never automatically'), 'Visible UI must explain that telemetry does not auto-complete evidence.');
assert(!player.includes('porterDeepReviewDraft:'), 'Review Player must never mutate the core Deep Review draft namespace.');
assert(!player.includes("reviewStatus: 'deep-reviewed'"), 'Review Player must never assign deep-reviewed status.');
assert(!player.includes('buildFinalReview('), 'Review Player must never invoke core Deep Review finalization.');
assert(!player.includes('completeVideoWatched.checked'), 'Review Player must never programmatically check the full-video attestation.');
assert(!/completeVideoWatched\s*=\s*true/.test(player), 'Review Player must never set completeVideoWatched=true.');

// Mounting and schema.
assert(bootstrap.includes("link.href = './deep-review-player.css'"), 'Review Player bootstrap must load its CSS.');
assert(bootstrap.includes("await import('./deep-review-player.js')"), 'Review Player bootstrap must lazy-mount the player module.');
assert(schema.includes('seedance-porter-review-media-evidence'), 'Companion evidence schema must lock the export kind.');
assert(schema.includes('coveragePercent'), 'Companion schema must validate playback coverage.');
assert(schema.includes('shot-boundary') && schema.includes('signature-move'), 'Companion schema must validate marker taxonomy.');
assert(schema.includes('"maximum": 100'), 'Playback coverage must be bounded at 100%.');

// Sidebar is allowed to lag before bootstrap wiring in early branch construction, but final contract requires it.
assert(sidebar.includes("import './deep-review-bootstrap.js';"), 'Core Deep Review bootstrap must remain mounted.');

if (failures.length) {
  console.error('Review Player contract failed:\n' + failures.map(item => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  mediaTypes: ['direct-video','cloudflare-stream','youtube','vimeo','x-post'],
  nativePlaybackCoverage: true,
  markerTypes: ['shot-boundary','transition','artifact','continuity','signature-move','note'],
  companionStorage: 'porterDeepReviewMediaEvidence:*',
  autoAttestation: false,
  autoDeepReviewed: false
}, null, 2));
