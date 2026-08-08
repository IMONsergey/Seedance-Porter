#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildCurationStagingPack, renderCurationStagingHtml, indexCuratedCaseLocations } from '../studio/curation-staging-engine.js';

const args=parseArgs(process.argv.slice(2));
if(!args.draft||!args.rotation){
  console.error('Usage: node scripts/build-curation-staging-pack.mjs --draft <curation-draft.json> --rotation <rotation-plan.json> [--outdir staging]');
  process.exit(2);
}

const draft=JSON.parse(await readFile(resolve(args.draft),'utf8'));
const rotation=JSON.parse(await readFile(resolve(args.rotation),'utf8'));
const runtime=await import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href);
const multi=await import(pathToFileURL(resolve('studio/multi-source-index.js')).href);
const currentCases=[
  ...runtime.CASE_INTELLIGENCE.map(item=>({...item,collections:item.intelligence?.collections||[],evidenceStatus:item.intelligence?.reviewStatus||'prompt-reviewed'})),
  ...multi.MULTI_SOURCE_CASES.map(item=>({...item,collections:item.collections||[],evidenceStatus:item.reviewStatus||item.evidenceStatus||'unknown'}))
];

const fileSpecs=[
  ['studio/digest-data.js','industry-digest'],
  ['studio/multi-source-cases.js','multi-source'],
  ['studio/multi-source-cases-batch2.js','multi-source'],
  ['studio/multi-source-cases-batch3.js','multi-source'],
  ['studio/multi-source-cases-batch4.js','multi-source'],
  ['studio/multi-source-cases-batch5.js','multi-source']
];
const fileSources=[];
for(const [file,dataFamily] of fileSpecs){
  try{fileSources.push({file,dataFamily,content:await readFile(resolve(file),'utf8')});}catch{}
}
const locations=indexCuratedCaseLocations(fileSources);
const outdir=resolve(args.outdir||'staging/curation');
const pack=buildCurationStagingPack({curationDraft:draft,rotationPlan:rotation,currentCases,caseLocations:locations});
const base=safeName(pack.incoming.candidateId||'candidate');
const jsonPath=join(outdir,`${base}.staging-pack.json`);
const htmlPath=join(outdir,`${base}.staging-preview.html`);
await mkdir(dirname(jsonPath),{recursive:true});
await writeFile(jsonPath,`${JSON.stringify(pack,null,2)}\n`,'utf8');
await writeFile(htmlPath,renderCurationStagingHtml(pack),'utf8');
console.log(JSON.stringify({json:jsonPath,html:htmlPath,valid:pack.valid,implementationReady:pack.implementationReady,decision:pack.rotation.decision?.status||null,removeCaseId:pack.proposedRemoval?.id||null,removeLocation:pack.proposedRemoval?.repositoryLocation?.file||null,invariant:pack.invariant},null,2));
if(!pack.valid)process.exitCode=2;

function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--'))continue;const key=arg.slice(2);out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
function safeName(value){return String(value||'staging').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'');}
