#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { buildPromotionHandoffFromEvidence, renderPromotionHandoffHtml } from '../studio/promotion-handoff-engine.js';

const args=parseArgs(process.argv.slice(2));
if(!args.package){console.error('Usage: node scripts/build-promotion-handoff.mjs --package <final-evidence.json> [--outdir promotion-handoff]');process.exit(2);}
const evidencePackage=JSON.parse(await readFile(resolve(args.package),'utf8'));
const handoff=await buildPromotionHandoffFromEvidence({evidencePackage});
const outdir=resolve(args.outdir||'handoff/promotion');
const id=safeName(handoff.candidateId||'candidate');
await mkdir(outdir,{recursive:true});
const contextPath=join(outdir,`${id}.promotion-context.json`);
const reviewPath=join(outdir,`${id}.promotion-review.json`);
const htmlPath=join(outdir,`${id}.promotion-handoff.html`);
await writeFile(contextPath,`${JSON.stringify(handoff,null,2)}\n`,'utf8');
if(handoff.promotionInputReady===true&&handoff.promotionReviewInput)await writeFile(reviewPath,`${JSON.stringify(handoff.promotionReviewInput,null,2)}\n`,'utf8');
await writeFile(htmlPath,renderPromotionHandoffHtml(handoff),'utf8');
console.log(JSON.stringify({
  valid:handoff.valid,
  status:handoff.status,
  promotionInputReady:handoff.promotionInputReady,
  candidateId:handoff.candidateId,
  review:handoff.promotionInputReady?reviewPath:null,
  context:contextPath,
  html:htmlPath,
  quality:handoff.reviewQuality?{score:handoff.reviewQuality.score,grade:handoff.reviewQuality.grade,gate:handoff.reviewQuality.gate,minimum:handoff.reviewQuality.minimumScore,promotionReady:handoff.reviewQuality.promotionReady}:null,
  riskFlags:handoff.researchRisk?.flags||[],
  handoffHash:handoff.handoffHash||null
},null,2));
if(!handoff.valid)process.exitCode=2;
else if(!handoff.promotionInputReady)process.exitCode=3;

function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--'))continue;const key=arg.slice(2);out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
function safeName(value){return String(value||'handoff').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'');}
