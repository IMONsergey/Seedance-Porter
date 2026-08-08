#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildCuratedRotationPlan } from '../studio/rotation-engine.js';

const args=parseArgs(process.argv.slice(2));
if(!args.draft){console.error('Usage: node scripts/build-rotation-plan.mjs --draft <curation-draft.json> [--coverage studio/coverage-plan.json] [--corpus studio/case-candidates.json] [--output rotation-plan.json]');process.exit(2);}

const draft=JSON.parse(await readFile(resolve(args.draft),'utf8'));
const coveragePath=resolve(args.coverage||'studio/coverage-plan.json');
const corpusPath=resolve(args.corpus||'studio/case-candidates.json');
const coverage=await readOptionalJson(coveragePath);
const corpus=await readOptionalJson(corpusPath);
const candidateId=String(draft?.candidateId||draft?.case?.id||draft?.curatedCase?.id||'');
const candidate=(corpus?.candidates||[]).find(item=>item.id===candidateId)||null;

const runtime=await import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href);
const multi=await import(pathToFileURL(resolve('studio/multi-source-index.js')).href);
const currentCases=[
  ...runtime.CASE_INTELLIGENCE.map(item=>({...item,collections:item.intelligence?.collections||[],evidenceStatus:item.intelligence?.reviewStatus||'prompt-reviewed'})),
  ...multi.MULTI_SOURCE_CASES.map(item=>({...item,collections:item.collections||[],evidenceStatus:item.reviewStatus||item.evidenceStatus||'unknown'}))
];

const plan=buildCuratedRotationPlan({incomingDraft:draft,candidate,currentCases,coveragePlan:coverage});
const output=resolve(args.output||`${safeName(candidateId||'candidate')}.rotation-plan.json`);
await mkdir(dirname(output),{recursive:true});
await writeFile(output,`${JSON.stringify(plan,null,2)}\n`,'utf8');
console.log(JSON.stringify({output,valid:plan.valid,decision:plan.decision,recommendedReplacement:plan.recommendedReplacement?.removeCaseId||null,incomingGain:plan.incomingStrategicGain?.score||0,confidence:plan.confidence},null,2));
if(!plan.valid)process.exitCode=2;

async function readOptionalJson(path){try{return JSON.parse(await readFile(path,'utf8'));}catch{return null;}}
function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--'))continue;const key=arg.slice(2);out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
function safeName(value){return String(value||'rotation').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'');}
