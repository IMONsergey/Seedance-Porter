#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = parseArgs(process.argv.slice(2));
const INPUT = resolve(args.input || 'studio/case-candidates.json');
const OUTPUT = resolve(args.output || 'studio/case-review-queue.json');
const LIMIT = Math.max(10, Math.min(200, Number(args.limit || 90)));

const corpus = JSON.parse(await readFile(INPUT, 'utf8'));
const runtime = await import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href);
const { CASE_INTELLIGENCE, COLLECTION_GROUPS } = runtime;
const collectionNames = COLLECTION_GROUPS.flatMap(group => group.items);
const collectionMap = new Map(collectionNames.map(name => [slug(name), name]));

const curatedCoverage = Object.fromEntries([...collectionMap.keys()].map(id => [id, 0]));
const deepCoverage = Object.fromEntries([...collectionMap.keys()].map(id => [id, 0]));
for (const item of CASE_INTELLIGENCE) {
  for (const name of item.intelligence?.collections || []) {
    const id = slug(name);
    curatedCoverage[id] = (curatedCoverage[id] || 0) + 1;
    if (item.intelligence?.reviewStatus === 'deep-reviewed') deepCoverage[id] = (deepCoverage[id] || 0) + 1;
  }
}

const candidates = [...(corpus.candidates || [])]
  .filter(item => item.reviewStatus === 'candidate' && !(item.riskFlags || []).length)
  .sort((a,b) => b.score - a.score || (b.metrics?.sourceTraceability || 0) - (a.metrics?.sourceTraceability || 0) || a.title.localeCompare(b.title));

const collectionOrder = [...collectionMap.keys()].sort((a,b) =>
  (deepCoverage[a] || 0) - (deepCoverage[b] || 0)
  || (curatedCoverage[a] || 0) - (curatedCoverage[b] || 0)
  || a.localeCompare(b)
);

const selected = [];
const used = new Set();
while (selected.length < LIMIT) {
  let progress = false;
  for (const collection of collectionOrder) {
    if (selected.length >= LIMIT) break;
    const next = candidates.find(item => !used.has(item.id) && item.collections?.includes(collection));
    if (!next) continue;
    used.add(next.id);
    selected.push(queueItem(next, collection, selected.length + 1));
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
    stateMachine: 'candidate -> prompt-reviewed -> deep-reviewed -> curated',
    visualEvidenceRule: 'Do not mark deep-reviewed until the complete source video has been visually inspected. Prompt text and thumbnails are insufficient.',
    minimumPromptAnalysis: ['shotBreakdown','causalMechanics','signatureMove','referenceStrategy','motionLanguage','transferablePattern','failureRisks'],
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

await mkdir(dirname(OUTPUT), { recursive:true });
await writeFile(OUTPUT, `${JSON.stringify(payload,null,2)}\n`, 'utf8');
console.log(JSON.stringify({ output:OUTPUT, ...payload.stats }, null, 2));

function queueItem(item,targetCollection,priority){
  return {
    priority,
    candidateId:item.id,
    title:item.title,
    author:item.author,
    sourceUrl:item.sourceUrl,
    archiveUrl:item.archiveUrl,
    previewUrl:item.previewUrl,
    sourcePool:item.sourcePool,
    score:item.score,
    targetCollection,
    targetCollectionTitle:collectionMap.get(targetCollection) || targetCollection,
    collectionCandidates:item.collections,
    reviewStatus:'candidate',
    checklist:{
      promptAnatomy:[
        'Identify the requested shot count and the function of every shot or continuous beat.',
        'Separate camera movement from subject/object movement.',
        'Identify continuity locks, reference jobs and physical constraints.',
        'Write a causal hypothesis for why each instruction should affect the output.',
        'Extract one transferable production pattern without copying source subject matter.'
      ],
      visualReview:[
        'Watch the complete source video, not only its thumbnail or prompt.',
        'Record observed shot boundaries and actual framing/camera behavior.',
        'Record what the model followed, compressed, ignored or invented.',
        'Record transitions, pacing, material/physics behavior and continuity.',
        'Record visible artifacts and compromises.',
        'Verify or revise the signature move using observed evidence.',
        'Only then change reviewStatus to deep-reviewed.'
      ]
    }
  };
}

function slug(value){ return String(value||'').toLowerCase().replace(/\//g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function parseArgs(argv){ const out={}; for(let i=0;i<argv.length;i++){ const arg=argv[i]; if(arg.startsWith('--')){ const key=arg.slice(2); out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true; } } return out; }
