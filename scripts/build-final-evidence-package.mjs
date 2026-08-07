#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildFinalEvidencePackage } from '../studio/evidence-package-engine.js';

const args=parseArgs(process.argv.slice(2));
if(!args.review){
  console.error('Usage: node scripts/build-final-evidence-package.mjs --review <deep-review.json> [--media review-media.json] [--candidate candidate.json | --corpus studio/case-candidates.json] [--output package.json]');
  process.exit(2);
}

const review=JSON.parse(await readFile(resolve(args.review),'utf8'));
let candidate=null;
if(args.candidate) candidate=JSON.parse(await readFile(resolve(args.candidate),'utf8'));
if(!candidate && args.corpus){
  const corpus=JSON.parse(await readFile(resolve(args.corpus),'utf8'));
  candidate=(corpus.candidates||[]).find(item=>item.id===review.candidateId)||null;
}
if(!candidate){
  try{
    const corpus=JSON.parse(await readFile(resolve('studio/case-candidates.json'),'utf8'));
    candidate=(corpus.candidates||[]).find(item=>item.id===review.candidateId)||null;
  }catch{}
}
if(!candidate) candidate={id:review.candidateId,sourceUrl:review.sourceVideoUrl,sourceVideoUrl:review.sourceVideoUrl};

const media=args.media?JSON.parse(await readFile(resolve(args.media),'utf8')):null;
const pkg=await buildFinalEvidencePackage({candidate,deepReview:review,mediaEvidence:media});
const output=resolve(args.output||`${safeName(review.candidateId)}.final-evidence.json`);
await mkdir(dirname(output),{recursive:true});
await writeFile(output,`${JSON.stringify(pkg,null,2)}\n`,'utf8');
console.log(JSON.stringify({output,candidateId:pkg.candidateId,packageHash:pkg.integrity.packageHash,components:Object.keys(pkg.integrity.components),riskFlags:pkg.candidate.riskFlags},null,2));

function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--'))continue;const key=arg.slice(2);out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
function safeName(value){return String(value||'evidence').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'');}
