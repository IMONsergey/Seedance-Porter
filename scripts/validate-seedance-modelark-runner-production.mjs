#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';

const [engine,cli,jobSchema,resultSchema,packageJson,ci,sidebar,pages]=await Promise.all([
  readFile('scripts/seedance-modelark-runner-engine.mjs','utf8'),readFile('scripts/seedance-modelark-runner.mjs','utf8'),readFile('schemas/prompt-studio-generation-job.schema.json','utf8'),readFile('schemas/prompt-studio-generation-result.schema.json','utf8'),readFile('package.json','utf8'),readFile('.github/workflows/seedance-modelark-runner-ci.yml','utf8'),readFile('studio/sidebar.js','utf8'),readFile('.github/workflows/pages.yml','utf8')
]);
const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
const pkg=JSON.parse(packageJson),job=JSON.parse(jobSchema),result=JSON.parse(resultSchema);
assert(engine.includes("MODELARK_TASKS_ENDPOINT='https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks'"),'Runner must pin official ModelArk task endpoint.');
assert(engine.includes("TERMINAL_TASK_STATUSES=Object.freeze(['succeeded','failed','cancelled','expired'])"),'Runner must model current terminal task statuses.');
assert(engine.includes("apiKey=process.env.ARK_API_KEY")&&engine.includes("Authorization:`Bearer ${apiKey}`"),'Runner key must come from ARK_API_KEY environment and be used only for outbound auth.');
assert(engine.includes("assertSecretValueAbsent(exportBundle,key,'export')")&&engine.includes('redactSecretStrings')&&engine.includes('[REDACTED]'),'Runner must reject key-bearing exports and redact echoed secret values.');
assert(engine.includes("if(current.status==='running')throw")&&engine.includes("terminal-record-delete-refused")&&engine.includes("if(current.status!=='queued')throw"),'Cancel must be queued-only and refuse destructive terminal deletion.');
assert(engine.includes("resolveRequester(requester)(url,{method:'GET'})")&&!engine.includes("resolveRequester(requester)(url,{method:'GET',headers:authHeaders"),'Generated media download must not forward provider authorization to output CDN.');
assert(engine.includes('hashStableJson(exportBundle)')&&engine.includes('exportSummary:summarizeExport(exportBundle)'),'Job manifest must persist hash/summary instead of raw provider payload.');
assert(cli.includes('There is intentionally no --api-key flag.')&&!cli.includes('options.api-key')&&!cli.includes('options.apiKey'),'CLI must not accept API keys as command-line arguments.');
for(const command of ['submit','status','wait','cancel','download','run'])assert(cli.includes(`command==='${command}'`),`CLI must expose ${command} command.`);
assert(cli.includes('onPoll:async current=>{await saveJson(output,current)')&&cli.includes('onPoll:async current=>{job=current;await saveJson(jobPath,current)'),'Wait/run must persist resumable job state on every poll.');
assert(pkg.scripts?.['seedance:runner']==='node scripts/seedance-modelark-runner.mjs','package.json must expose seedance:runner.');
assert(pkg.scripts?.['validate:seedance-runner']==='node scripts/validate-seedance-modelark-runner.mjs','package.json must expose runner validation.');
assert(job.additionalProperties===false&&job.properties?.policy?.properties?.secretPersisted?.const===false&&job.properties?.policy?.properties?.apiKeySource?.const==='environment','Job schema must be closed and secret-safe.');
assert(job.properties?.providerMeta?.additionalProperties===false,'Job providerMeta must be closed against arbitrary provider fields/credential leakage.');
assert(Array.isArray(job.allOf)&&job.allOf.length>=3,'Job schema must encode terminal/non-terminal lifecycle consistency.');
assert(result.additionalProperties===false&&result.properties?.policy?.properties?.secretPersisted?.const===false&&result.properties?.terminal?.const===true,'Result schema must be closed, terminal and secret-safe.');
assert(result.properties?.providerMeta?.additionalProperties===false,'Result providerMeta must be closed against arbitrary provider fields/credential leakage.');
assert(Array.isArray(result.allOf)&&result.allOf.length>=2,'Result schema must bind succeeded boolean/output semantics to final status.');
assert(job.properties?.endpoint?.const==='https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks','Job schema must pin official provider endpoint.');
assert(Array.isArray(job.properties?.status?.enum)&&['submitted','queued','running','succeeded','failed','cancelled','expired','unknown'].every(status=>job.properties.status.enum.includes(status)),'Job schema must model internal + provider lifecycle states.');
assert(Array.isArray(result.properties?.status?.enum)&&['succeeded','failed','cancelled','expired'].every(status=>result.properties.status.enum.includes(status)),'Result schema must contain only terminal provider states.');
assert(ci.includes('node: [20,22,24]')&&ci.includes('npm run validate:seedance-runner')&&ci.includes('validate-seedance-modelark-runner-production.mjs'),'Runner CI must run behavioral + production contracts on Node 20/22/24.');
assert(ci.includes('prompt-studio-seedance-adapter.js')&&ci.includes('prompt-studio-seedance-export.schema.json'),'Runner CI must rerun when upstream provider export protocol changes.');
assert(!sidebar.includes('seedance-modelark-runner'),'Browser sidebar must never import server-side runner.');
assert(!pages.includes('seedance-modelark-runner.mjs'),'GitHub Pages workflow must not execute or publish external provider runner.');
const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`Runner work must preserve exact 100 curated cases; got ${curated.length}.`);assert(PROMPTS.length===192,`Runner work must preserve 192 Porter Originals; got ${PROMPTS.length}.`);
if(failures.length){console.error('Seedance ModelArk runner production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,externalOnly:true,environmentKeyOnly:true,secretPersistence:false,queuedOnlyCancel:true,terminalDeleteRefused:true,resumablePolling:true,downloadAuthorization:false,jobSchemaClosed:true,resultSchemaClosed:true,lifecycleSchemaStrict:true,nodeMatrix:[20,22,24],curatedCases:curated.length,porterOriginals:PROMPTS.length},null,2));
