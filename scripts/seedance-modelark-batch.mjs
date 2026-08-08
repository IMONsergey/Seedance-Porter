#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { buildSeedanceBatchResult, cancelQueuedSeedanceBatch, createSeedanceBatchJob, refreshSeedanceBatchJob, runSeedanceBatch } from './seedance-modelark-batch-engine.mjs';

const [command,...argv]=process.argv.slice(2);
try{
  if(!command||['help','--help','-h'].includes(command)){help();process.exit(0);}
  if(command==='create')await createCommand(argv);
  else if(command==='run')await runCommand(argv);
  else if(command==='status')await statusCommand(argv);
  else if(command==='cancel')await cancelCommand(argv);
  else if(command==='result')await resultCommand(argv);
  else throw new Error(`Unknown batch command: ${command}`);
}catch(error){console.error(`[${error?.code||'batch-error'}] ${String(error?.message||error)}`);process.exit(1);}

async function createCommand(args){const parsed=parseArgs(args),planPath=positional(parsed,0,'batch plan JSON'),jobPath=resolve(parsed.options.out||defaultPath(planPath,'.batch-job.json')),plan=await loadJson(planPath),concurrency=intOption(parsed.options.concurrency,2,1,8);const job=await createSeedanceBatchJob(plan,{concurrency});await saveJson(jobPath,job);print(job,jobPath);}
async function runCommand(args){const parsed=parseArgs(args),planPath=positional(parsed,0,'batch plan JSON'),jobPath=resolve(parsed.options.job||defaultPath(planPath,'.batch-job.json')),plan=await loadJson(planPath);let job;try{job=await loadJson(jobPath);}catch{job=await createSeedanceBatchJob(plan,{concurrency:intOption(parsed.options.concurrency,2,1,8)});await saveJson(jobPath,job);}job=await runSeedanceBatch(plan,job,{concurrency:intOption(parsed.options.concurrency,job.localConcurrency||2,1,8),pollMs:seconds(parsed.options.poll,10)*1000,timeoutMs:seconds(parsed.options.timeout,3600)*1000,onState:async current=>{await saveJson(jobPath,current);print(current,jobPath);}});await saveJson(jobPath,job);if(isComplete(job)){const resultPath=resolve(parsed.options.result||defaultPath(planPath,'.batch-result.json'));await saveJson(resultPath,buildSeedanceBatchResult(job));console.log(`result=${resultPath}`);}else process.exitCode=2;}
async function statusCommand(args){const parsed=parseArgs(args),planPath=positional(parsed,0,'batch plan JSON'),jobPath=positional(parsed,1,'batch job JSON'),plan=await loadJson(planPath);let job=await loadJson(jobPath);job=await refreshSeedanceBatchJob(plan,job);await saveJson(parsed.options.out?resolve(parsed.options.out):jobPath,job);print(job,jobPath);}
async function cancelCommand(args){const parsed=parseArgs(args),planPath=positional(parsed,0,'batch plan JSON'),jobPath=positional(parsed,1,'batch job JSON'),plan=await loadJson(planPath);let job=await loadJson(jobPath);job=await cancelQueuedSeedanceBatch(plan,job);await saveJson(parsed.options.out?resolve(parsed.options.out):jobPath,job);print(job,jobPath);}
async function resultCommand(args){const parsed=parseArgs(args),jobPath=positional(parsed,0,'batch job JSON'),job=await loadJson(jobPath),result=buildSeedanceBatchResult(job),out=resolve(parsed.options.out||defaultPath(jobPath,'.batch-result.json'));await saveJson(out,result);console.log(`result=${out}`);}

function parseArgs(args){const positionals=[],options={};for(let i=0;i<args.length;i++){const value=args[i];if(!value.startsWith('--')){positionals.push(value);continue;}const key=value.slice(2),next=args[i+1];if(next!=null&&!next.startsWith('--')){options[key]=next;i++;}else options[key]=true;}return{positionals,options};}
function positional(parsed,index,label){const value=parsed.positionals[index];if(!value)throw new Error(`${label} is required.`);return resolve(value);}
function intOption(value,fallback,min,max){if(value==null||value===true)return fallback;const number=Number(value);if(!Number.isInteger(number)||number<min||number>max)throw new Error(`Expected integer ${min}-${max}, received ${value}.`);return number;}
function seconds(value,fallback){if(value==null||value===true)return fallback;const number=Number(value);if(!Number.isFinite(number)||number<=0)throw new Error(`Expected positive seconds, received ${value}.`);return number;}
function isComplete(job){return ['succeeded','completed-with-errors'].includes(String(job?.status||''));}
async function loadJson(path){const text=await readFile(resolve(path),'utf8');return JSON.parse(text);}
async function saveJson(path,value){await mkdir(dirname(resolve(path)),{recursive:true});await writeFile(resolve(path),`${JSON.stringify(value,null,2)}\n`,'utf8');}
function defaultPath(input,suffix){const absolute=resolve(input),extension=extname(absolute);return extension?`${absolute.slice(0,-extension.length)}${suffix}`:`${absolute}${suffix}`;}
function print(job,path){const counts={};for(const item of job.items||[])counts[item.status]=(counts[item.status]||0)+1;console.log(`batch=${job.batchId} status=${job.status} concurrency=${job.localConcurrency} counts=${JSON.stringify(counts)} job=${resolve(path)}`);}
function help(){console.log(`Seedance Porter — external ModelArk Batch Runner\n\nCredentials:\n  ARK_API_KEY must be set in the process environment. No --api-key flag exists.\n\nCommands:\n  create <batch-plan.json> [--out batch-job.json] [--concurrency 2]\n  run <batch-plan.json> [--job batch-job.json] [--result batch-result.json] [--concurrency 2] [--poll 10] [--timeout 3600]\n  status <batch-plan.json> <batch-job.json> [--out batch-job.json]\n  cancel <batch-plan.json> <batch-job.json> [--out batch-job.json]\n  result <batch-job.json> [--out batch-result.json]\n\nSafety:\n  Local concurrency is a client-side limit, not a claim about your ModelArk account quota.\n  A network failure during POST before a task ID is known becomes submission-uncertain and is never auto-retried.\n  Interrupted polling with a known task ID resumes that task without another POST.\n  cancel delegates to the single-task queued-only cancellation contract.`);}
