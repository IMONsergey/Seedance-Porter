#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = parseArgs(process.argv.slice(2));
const INPUT = resolve(args.input || 'studio/case-candidates.json');
const OUTPUT = resolve(args.output || 'studio/case-review-queue.json');
const LIMIT = Math.max(10, Math.min(200, Number(args.limit || 90)));

const corpus = JSON.parse(await readFile(INPUT, 'utf8'));
const intelModule = await import(pathToFileURL(resolve('studio/case-intelligence-data.js')).href);
const { CASE_INTELLIGENCE, COLLECTIONS } = intelModule;

const curatedCoverage = Object.fromEntries(COLLECTIONS.map(collection => [collection.id, 0]));
const deepCoverage = Object.fromEntries(COLLECTIONS.map(collection => [collection.id, 0]));
for (const intel of Object.values(CASE_INTELLIGENCE)) {
  for (const collection of intel.collections || []) {
    curatedCoverage[collection] = (curatedCoverage[collection] || 0) + 1;
    if (intel.reviewStatus === 'deep-reviewed') deepCoverage[collection] = (deepCoverage[collection] || 0) + 1;
  }
}

const candidates = [...(corpus.candidates || [])]
  .filter(item => item.reviewStatus === 'candidate' && !item.riskFlags?.length)
  .sort((a,b) => b.score - a.score || b.metrics?.sourceTraceability - a.metrics?.sourceTraceability || a.title.localeCompare(b.title));

const selected = [];
const used = new Set();
const collectionOrder = [...COLLECTIONS]
  .sort((a,b) => (deepCoverage[a.id] || 0) - (deepCoverage[b.id] || 0) || (curatedCoverage[a.id] || 0) - (curatedCoverage[b.id] || 0));

while (selected.length < LIMIT) {
  let progress = false;
  for (const collection of collectionOrder) {
    if (selected.length >= LIMIT) break;
    const next = candidates.find(item => !used.has(item.id) && item.collections?.includes(collection.id));
    if (!next) continue;
    used.add(next.id);
    selected.push(queueItem(next, collection.id, selected.length + 1));
    progress = true;
  }
  if (!progress) break;
}
for (const item of candidates) {
  if (selected.length >= LIMIT) break;
  if (used.has(item.id)) continue;
  used.add(item.id);
  selected.push(queueItem(item, item.collections?.[0] || 'camera', selected.length + 1));
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: {
    promotionRule: 'candidate -> prompt-reviewed -> deep-reviewed -> curated',
    visualEvidenceRule: 'Do not mark deep-reviewed until the complete source video has been visually inspected. Prompt text and thumbnails are insufficient.',
    minimumAnalysis: ['shotBreakdown','causalMechanics','signatureMove','referenceStrategy','motionLanguage','transferablePattern','failureRisks'],
    minimumVisualReview: ['observedShots','observedTransitions','observedMotion','observedArtifacts','observedContinuity','verifiedSignatureMove']
  },
  currentCoverage: { curated: curatedCoverage, deepReviewed: deepCoverage },
  stats: {
    queue: selected.length,
    collectionsRepresented: new Set(selected.map(item => item.targetCollection)).size,
    averageCandidateScore: Math.round(selected.reduce((sum,item)=>sum+item.score,0) / Math.max(1,selected.length))
  },
  queue: selected
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: OUTPUT, ...payload.stats }, null, 2));

function queueItem(item, targetCollection, priority) {
  return {
    priority,
    candidateId: item.id,
    title: item.title,
    author: item.author,
    sourceUrl: item.sourceUrl,
    archiveUrl: item.archiveUrl,
    previewUrl: item.previewUrl,
    sourcePool: item.sourcePool,
    score: item.score,
    targetCollection,
    collectionCandidates: item.collections,
    reviewStatus: 'candidate',
    checklist: {
      promptAnatomy: [
        'Identify actual requested shot count and each shot function.',
        'Separate camera movement from subject/object movement.',
        'Identify continuity locks, reference jobs and physical constraints.',
        'Write causal hypothesis: why each instruction should affect the output.',
        'Extract one transferable production pattern without copying source subject matter.'
      ],
      visualReview: [
        'Watch the complete source video, not only thumbnail/preview.',
        'Record observed shot boundaries and actual framing/camera behavior.',
        'Record what the model followed, ignored, compressed or invented.',
        'Record transitions, pacing, material/physics behavior and continuity.',
        'Record visible artifacts and compromises.',
        'Verify or revise the signature move based on observed output.',
        'Only then change reviewStatus to deep-reviewed.'
      ]
    }
  };
}

function parseArgs(argv) { const out={}; for(let i=0;i<argv.length;i++){ const a=argv[i]; if(a.startsWith('--')){ const k=a.slice(2); const v=argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true; out[k]=v; } } return out; }
