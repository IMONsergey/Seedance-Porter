#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildPromotionAnalysis, buildCuratedImplementationDraft } from '../studio/promotion-engine.js';

const args = parseArgs(process.argv.slice(2));
if (!args.review) {
  console.error('Usage: node scripts/build-curation-draft.mjs --review <deep-review.json> [--corpus studio/case-candidates.json] [--editorial editorial.json] [--output draft.json] [--strict]');
  process.exit(64);
}

const reviewPath = resolve(args.review);
const corpusPath = resolve(args.corpus || 'studio/case-candidates.json');
const review = JSON.parse(await readFile(reviewPath, 'utf8'));
const corpus = JSON.parse(await readFile(corpusPath, 'utf8'));
const candidate = (corpus.candidates || []).find(item => item.id === review.candidateId);
const analysis = buildPromotionAnalysis(review, candidate);

let output = analysis;
let kind = analysis.kind;
if (args.editorial) {
  const editorial = JSON.parse(await readFile(resolve(args.editorial), 'utf8'));
  output = buildCuratedImplementationDraft(analysis, editorial);
  kind = output.kind;
}

const destination = resolve(args.output || defaultOutput(review.candidateId, Boolean(args.editorial)));
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output: destination,
  kind,
  candidateId: review.candidateId,
  candidateFound: Boolean(candidate),
  readiness: analysis.readiness
}, null, 2));

if ((args.strict === true || String(args.strict).toLowerCase() === 'true') && !analysis.readiness.eligibleForEditorialReview) {
  process.exit(2);
}

function defaultOutput(candidateId, editorial) {
  const safe = String(candidateId || 'candidate').replace(/[^a-z0-9._-]+/gi, '-');
  return `outputs/curation/${safe}.${editorial ? 'curated-draft' : 'readiness'}.json`;
}

function parseArgs(argv) {
  const output = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    output[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
  }
  return output;
}
