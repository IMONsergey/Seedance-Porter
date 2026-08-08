#!/usr/bin/env node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createPromptStudioProject, refreshPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { capturePromptStudioVariant, createPromptStudioVariantSet } from '../studio/prompt-studio-variants.js';
import { buildPromptStudioVariantBatchPlan } from '../studio/prompt-studio-generation-batch.js';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};const dir=await mkdtemp(join(tmpdir(),'seedance-batch-cli-'));
try{
  const plan=await makePlan(),planPath=join(dir,'test.batch-plan.json'),jobPath=join(dir,'test.batch-job.json');await writeFile(planPath,`${JSON.stringify(plan,null,2)}\n`,'utf8');
  const first=run(['create',planPath,'--out',jobPath,'--concurrency','1']);assert(first.status===0,'First explicit create must produce a new batch job manifest.');
  const original=await readFile(jobPath,'utf8');assert(original.includes('seedance-porter-generation-batch-job'),'Created job file must contain the canonical batch job kind.');
  const second=run(['create',planPath,'--out',jobPath,'--concurrency','1']);assert(second.status!==0&&`${second.stderr}${second.stdout}`.includes('batch-job-exists'),'Second create targeting an existing job must fail with batch-job-exists.');
  assert(await readFile(jobPath,'utf8')===original,'Refused duplicate create must leave the existing resumable job bytes unchanged.');

  const corrupt='{ "kind": "seedance-porter-generation-batch-job",';await writeFile(jobPath,corrupt,'utf8');
  const resume=run(['run',planPath,'--job',jobPath,'--concurrency','1']);assert(resume.status!==0&&`${resume.stderr}${resume.stdout}`.includes('json-invalid'),'Run with a malformed existing job must fail closed with json-invalid before execution.');
  assert(await readFile(jobPath,'utf8')===corrupt,'Malformed existing job must never be replaced by a newly created job.');

  if(failures.length){console.error('Seedance ModelArk Batch CLI contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,firstCreate:true,duplicateCreateRefused:true,existingJobPreserved:true,malformedResumeFailClosed:true,malformedJobPreserved:true},null,2));
}finally{await rm(dir,{recursive:true,force:true});}

function run(args){return spawnSync(process.execPath,['scripts/seedance-modelark-batch.mjs',...args],{cwd:process.cwd(),encoding:'utf8',env:{...process.env,ARK_API_KEY:''}});}
async function makePlan(){const project=createPromptStudioProject({id:'batch-cli-project',title:'Batch CLI validation',mode:'text-to-video',aspect:'16:9',duration:6,now:'2026-08-08T18:30:00.000Z',sections:[{id:'objective',content:'Create one controlled object film.'},{id:'subject',content:'One matte object.'},{id:'camera',content:'Static medium shot.'},{id:'action',content:'One visible highlight moves across the object.'},{id:'continuity',content:'Keep geometry stable.'},{id:'constraints',content:'No text, logo or duplicate object.'}]});let set=createPromptStudioVariantSet(project,{id:'base',label:'Base',now:'2026-08-08T18:30:01.000Z'});const variant=refreshPromptStudioProject({...structuredClone(project),sections:project.sections.map(section=>section.id==='camera'?{...section,content:'Slow controlled push-in.'}:section)},'2026-08-08T18:30:02.000Z');set=capturePromptStudioVariant(variant,set,'Push',{id:'push',now:'2026-08-08T18:30:03.000Z'});project.variants=set;return buildPromptStudioVariantBatchPlan(project,['push'],{now:'2026-08-08T18:31:00.000Z',provider:{resolution:'720p'}});}
