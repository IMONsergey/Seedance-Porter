#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyCuratedSwapImplementation } from '../studio/curated-swap-guard-engine.js';
import { indexCuratedCaseLocations } from '../studio/curation-staging-engine.js';

const args=parseArgs(process.argv.slice(2));
if(!args.baseline){console.error('Usage: node scripts/verify-curated-swap-implementation.mjs --baseline <swap-baseline.json> [--output verification.json]');process.exit(2);}
const baseline=JSON.parse(await readFile(resolve(args.baseline),'utf8'));
const runtime=await import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href);
const multi=await import(pathToFileURL(resolve('studio/multi-source-index.js')).href);
const afterCases=[
  ...runtime.CASE_INTELLIGENCE.map(item=>({...item,collections:item.intelligence?.collections||[]})),
  ...multi.MULTI_SOURCE_CASES.map(item=>({...item,collections:item.collections||[]}))
];
const fileSpecs=[
  ['studio/digest-data.js','industry-digest'],
  ['studio/multi-source-cases.js','multi-source'],
  ['studio/multi-source-cases-batch2.js','multi-source'],
  ['studio/multi-source-cases-batch3.js','multi-source'],
  ['studio/multi-source-cases-batch4.js','multi-source'],
  ['studio/multi-source-cases-batch5.js','multi-source']
];
const sources=[];
for(const [file,dataFamily] of fileSpecs){try{sources.push({file,dataFamily,content:await readFile(resolve(file),'utf8')});}catch{}}
const afterLocations=indexCuratedCaseLocations(sources);
const verification=await verifyCuratedSwapImplementation({baseline,afterCases,afterLocations});
if(args.output)await writeFile(resolve(args.output),`${JSON.stringify(verification,null,2)}\n`,'utf8');
console.log(JSON.stringify({valid:verification.valid,removeCaseId:verification.staging.removeCaseId,candidateId:verification.staging.candidateId,after:verification.after.curatedCases,unique:verification.after.uniqueCases,errors:verification.errors,warnings:verification.warnings,verificationHash:verification.verificationHash},null,2));
if(!verification.valid)process.exitCode=1;

function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--'))continue;const key=arg.slice(2);out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
