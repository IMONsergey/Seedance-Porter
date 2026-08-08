#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildCuratedSwapBaseline } from '../studio/curated-swap-guard-engine.js';

const args=parseArgs(process.argv.slice(2));
if(!args.staging){console.error('Usage: node scripts/build-curated-swap-baseline.mjs --staging <staging-pack.json> [--output swap-baseline.json]');process.exit(2);}
const staging=JSON.parse(await readFile(resolve(args.staging),'utf8'));
const runtime=await import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href);
const multi=await import(pathToFileURL(resolve('studio/multi-source-index.js')).href);
const beforeCases=[
  ...runtime.CASE_INTELLIGENCE.map(item=>({...item,collections:item.intelligence?.collections||[]})),
  ...multi.MULTI_SOURCE_CASES.map(item=>({...item,collections:item.collections||[]}))
];
const baseline=await buildCuratedSwapBaseline({stagingPack:staging,beforeCases});
const output=resolve(args.output||`${safeName(staging.incoming?.candidateId||'candidate')}.swap-baseline.json`);
await mkdir(dirname(output),{recursive:true});
await writeFile(output,`${JSON.stringify(baseline,null,2)}\n`,'utf8');
console.log(JSON.stringify({output,valid:baseline.valid,baselineHash:baseline.baselineHash,removeCaseId:baseline.staging.removeCaseId,candidateId:baseline.staging.candidateId,invariant:baseline.invariant},null,2));
if(!baseline.valid)process.exitCode=2;

function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--'))continue;const key=arg.slice(2);out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
function safeName(value){return String(value||'swap').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'');}
