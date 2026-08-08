#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import {
  GENERATION_JOB_KIND,
  SeedanceRunnerError,
  buildGenerationResult,
  cancelQueuedSeedanceGeneration,
  downloadSeedanceGenerationOutput,
  retrieveSeedanceGeneration,
  submitSeedanceGeneration,
  waitForSeedanceGeneration
} from './seedance-modelark-runner-engine.mjs';
import { applyExportStudioLinkToJob, applyJobStudioLinkToResult } from './seedance-modelark-runner-lineage.mjs';

const [command,...argv]=process.argv.slice(2);

try{
  if(!command||['help','--help','-h'].includes(command)){printHelp();process.exit(0);}
  if(command==='submit')await submitCommand(argv);
  else if(command==='status')await statusCommand(argv);
  else if(command==='wait')await waitCommand(argv);
  else if(command==='cancel')await cancelCommand(argv);
  else if(command==='download')await downloadCommand(argv);
  else if(command==='run')await runCommand(argv);
  else throw new SeedanceRunnerError('unknown-command',`Unknown runner command: ${command}`);
}catch(error){
  const code=error instanceof SeedanceRunnerError?error.code:'runner-error';
  console.error(`[${code}] ${String(error?.message||error)}`);
  process.exit(1);
}

async function submitCommand(args){
  const parsed=parseArgs(args);const input=requirePositional(parsed,0,'Seedance export JSON');const output=resolve(parsed.options.out||defaultPath(input,'.job.json'));
  const bundle=await loadJson(input);const job=applyExportStudioLinkToJob(await submitSeedanceGeneration(bundle),bundle);await saveJson(output,job);printState('submitted',job,output);
}

async function statusCommand(args){
  const parsed=parseArgs(args);const input=requirePositional(parsed,0,'generation job JSON');const output=resolve(parsed.options.out||input);const job=requireJob(await loadJson(input));
  const current=await retrieveSeedanceGeneration(job);await saveJson(output,current);printState('status',current,output);
  if(current.terminal){const resultPath=parsed.options.result?resolve(parsed.options.result):'';if(resultPath){await saveJson(resultPath,applyJobStudioLinkToResult(buildGenerationResult(current),current));console.log(`result=${resultPath}`);}}
}

async function waitCommand(args){
  const parsed=parseArgs(args);const input=requirePositional(parsed,0,'generation job JSON');const output=resolve(parsed.options.out||input),resultPath=resolve(parsed.options.result||defaultPath(output,'.result.json'));const job=requireJob(await loadJson(input));
  const pollMs=secondsOption(parsed.options.poll,10)*1000,timeoutMs=secondsOption(parsed.options.timeout,3600)*1000;
  const completed=await waitForSeedanceGeneration(job,{pollMs,timeoutMs,onPoll:async current=>{await saveJson(output,current);printPoll(current);}});
  const result=applyJobStudioLinkToResult(completed.result,completed.job);await saveJson(output,completed.job);await saveJson(resultPath,result);printState('terminal',completed.job,output);console.log(`result=${resultPath}`);if(completed.job.status!=='succeeded')process.exitCode=2;
}

async function cancelCommand(args){
  const parsed=parseArgs(args);const input=requirePositional(parsed,0,'generation job JSON');const output=resolve(parsed.options.out||input);const job=requireJob(await loadJson(input));const cancelled=await cancelQueuedSeedanceGeneration(job);await saveJson(output,cancelled);printState('cancelled',cancelled,output);
}

async function downloadCommand(args){
  const parsed=parseArgs(args);const input=requirePositional(parsed,0,'succeeded generation job JSON');const job=requireJob(await loadJson(input));const output=resolve(parsed.options.out||defaultPath(input,'.mp4'));const downloaded=await downloadSeedanceGenerationOutput(job);await ensureParent(output);await writeFile(output,downloaded.bytes);console.log(`downloaded task=${job.taskId} bytes=${downloaded.contentLength} file=${output}`);
}

async function runCommand(args){
  const parsed=parseArgs(args);const input=requirePositional(parsed,0,'Seedance export JSON');const jobPath=resolve(parsed.options.job||defaultPath(input,'.job.json')),resultPath=resolve(parsed.options.result||defaultPath(input,'.result.json')),videoPath=resolve(parsed.options.video||defaultPath(input,'.mp4'));const pollMs=secondsOption(parsed.options.poll,10)*1000,timeoutMs=secondsOption(parsed.options.timeout,3600)*1000;
  const bundle=await loadJson(input);let job=applyExportStudioLinkToJob(await submitSeedanceGeneration(bundle),bundle);await saveJson(jobPath,job);printState('submitted',job,jobPath);
  const completed=await waitForSeedanceGeneration(job,{pollMs,timeoutMs,onPoll:async current=>{job=current;await saveJson(jobPath,current);printPoll(current);}});job=completed.job;const result=applyJobStudioLinkToResult(completed.result,job);await saveJson(jobPath,job);await saveJson(resultPath,result);printState('terminal',job,jobPath);console.log(`result=${resultPath}`);
  if(job.status!=='succeeded'){process.exitCode=2;return;}
  const downloaded=await downloadSeedanceGenerationOutput(job);await ensureParent(videoPath);await writeFile(videoPath,downloaded.bytes);console.log(`downloaded task=${job.taskId} bytes=${downloaded.contentLength} file=${videoPath}`);
}

function parseArgs(args){const positionals=[],options={};for(let index=0;index<args.length;index++){const value=args[index];if(!value.startsWith('--')){positionals.push(value);continue;}const key=value.slice(2);if(!key)continue;const next=args[index+1];if(next!=null&&!next.startsWith('--')){options[key]=next;index++;}else options[key]=true;}return{positionals,options};}
function requirePositional(parsed,index,label){const value=parsed.positionals[index];if(!value)throw new SeedanceRunnerError('argument-missing',`${label} is required.`);return resolve(value);}
function secondsOption(value,fallback){if(value==null||value===true)return fallback;const number=Number(value);if(!Number.isFinite(number)||number<=0)throw new SeedanceRunnerError('invalid-option',`Expected a positive number of seconds, received: ${value}`);return number;}
function requireJob(value){if(value?.kind!==GENERATION_JOB_KIND)throw new SeedanceRunnerError('invalid-job-file','Expected a Seedance Porter generation job manifest.');return value;}
async function loadJson(path){let text;try{text=await readFile(resolve(path),'utf8');}catch(error){throw new SeedanceRunnerError('file-read-failed',`Cannot read ${resolve(path)}: ${error.message}`);}try{return JSON.parse(text);}catch{throw new SeedanceRunnerError('json-invalid',`Invalid JSON: ${resolve(path)}`);}}
async function saveJson(path,value){const target=resolve(path);await ensureParent(target);await writeFile(target,`${JSON.stringify(value,null,2)}\n`,'utf8');}
async function ensureParent(path){await mkdir(dirname(path),{recursive:true});}
function defaultPath(input,suffix){const absolute=resolve(input),extension=extname(absolute);return extension?`${absolute.slice(0,-extension.length)}${suffix}`:`${absolute}${suffix}`;}
function printState(prefix,job,path){console.log(`${prefix} task=${job.taskId} status=${job.status} job=${resolve(path)}`);}
function printPoll(job){console.log(`poll task=${job.taskId} status=${job.status}`);}
function printHelp(){console.log(`Seedance Porter — external ModelArk generation runner\n\nCredentials:\n  ARK_API_KEY must be set in the process environment. There is intentionally no --api-key flag.\n\nCommands:\n  submit <export.json> [--out job.json]\n  status <job.json> [--out job.json] [--result result.json]\n  wait <job.json> [--out job.json] [--result result.json] [--poll 10] [--timeout 3600]\n  cancel <job.json> [--out job.json]\n  download <job.json> [--out video.mp4]\n  run <export.json> [--job job.json] [--result result.json] [--video video.mp4] [--poll 10] [--timeout 3600]\n\nSafety:\n  cancel only cancels queued tasks. It refuses running tasks and refuses to delete terminal provider records.\n  job/result manifests never persist ARK_API_KEY or Authorization headers.\n  Studio lineage is preserved when the provider export contains a valid studioLink.\n  generated video downloads do not send the ModelArk API key to the signed output URL.`);}
