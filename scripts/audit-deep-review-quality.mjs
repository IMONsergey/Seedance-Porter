#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { auditDeepReviewQuality } from '../studio/review-quality-engine.js';

const args=parseArgs(process.argv.slice(2));
const input=args.review||args.input||process.argv.find((value,index)=>index>1&&!value.startsWith('--'));
if(!input){console.error('Usage: node scripts/audit-deep-review-quality.mjs --review <deep-review.json> [--output quality-audit.json] [--min-score 76]');process.exit(2);}
const review=JSON.parse(await readFile(resolve(input),'utf8'));
const audit=auditDeepReviewQuality(review,{expectedCandidateId:args.candidate||undefined});
if(args.output){const output=resolve(args.output);await mkdir(dirname(output),{recursive:true});await writeFile(output,`${JSON.stringify(audit,null,2)}\n`,'utf8');}
console.log(JSON.stringify(audit,null,2));
const minimum=Math.max(0,Math.min(100,Number(args['min-score']||76)));
if(audit.gate==='blocked')process.exitCode=2;
else if(audit.score<minimum)process.exitCode=3;

function parseArgs(argv){const out={};for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--'))continue;const key=arg.slice(2);out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}return out;}
