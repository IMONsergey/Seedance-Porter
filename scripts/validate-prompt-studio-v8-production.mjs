#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';

const paths={sidebar:'studio/sidebar.js',bootstrap:'studio/prompt-studio-v8-bootstrap.js',ui:'studio/prompt-studio-v8-batch-ui.js',batch:'studio/prompt-studio-generation-batch.js',history:'studio/prompt-studio-generation-results.js',runnerCli:'scripts/seedance-modelark-runner.mjs',runnerLineage:'scripts/seedance-modelark-runner-lineage.mjs',batchRunner:'scripts/seedance-modelark-batch-engine.mjs',batchCli:'scripts/seedance-modelark-batch.mjs',pkg:'package.json',ignore:'.gitignore',planSchema:'schemas/prompt-studio-generation-batch-plan.schema.json',jobSchema:'schemas/prompt-studio-generation-batch-job.schema.json',resultSchema:'schemas/prompt-studio-generation-batch-result.schema.json',singleJobSchema:'schemas/prompt-studio-generation-job.schema.json',singleResultSchema:'schemas/prompt-studio-generation-result.schema.json',context:'docs/PROJECT-CONTEXT.md',roadmap:'docs/ROADMAP.md',decisions:'docs/ARCHITECTURE-DECISIONS.md',state:'docs/PROJECT-STATE.json',agents:'AGENTS.md'};
const entries=await Promise.all(Object.entries(paths).map(async([key,path])=>[key,await readFile(path,'utf8')]));const text=Object.fromEntries(entries),failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
const pkg=JSON.parse(text.pkg),planSchema=JSON.parse(text.planSchema),jobSchema=JSON.parse(text.jobSchema),resultSchema=JSON.parse(text.resultSchema),singleJobSchema=JSON.parse(text.singleJobSchema),singleResultSchema=JSON.parse(text.singleResultSchema),projectState=JSON.parse(text.state);

const order=['prompt-studio-v6-bootstrap.js','prompt-studio-v7-bootstrap.js','prompt-studio-v8-bootstrap.js','command-palette-bootstrap.js'].map(name=>text.sidebar.indexOf(name));assert(order.every(index=>index>=0)&&order.every((value,index)=>index===0||value>order[index-1]),'Sidebar must mount v6 → v7 → v8 → Cmd-K in order.');
assert(text.bootstrap.includes("prompt-studio-v8.css")&&text.bootstrap.includes("prompt-studio-v8-batch-ui.js"),'V8 bootstrap must load V8 CSS and batch UI.');
assert(text.ui.includes('buildPromptStudioVariantBatchPlan')&&text.ui.includes('savePromptStudioBatchResult'),'V8 UI must use canonical batch plan/result engines.');
assert(text.ui.includes('window.porterPromptStudio?.replaceProject')&&text.ui.includes('snapshot:true')&&text.ui.includes('preserveIdentity:true'),'V8 project mutation must use revisioned public Prompt Studio API.');
for(const marker of ['fetch(','XMLHttpRequest','sendBeacon','ARK_API_KEY','Authorization:'])assert(!text.ui.includes(marker),`V8 browser UI must not contain provider execution/credential marker: ${marker}`);
assert(text.batch.includes('MAX_PROMPT_STUDIO_BATCH_ITEMS=20'),'V8 browser plan must remain bounded to 20 items.');
assert(text.batch.includes('autoSubmit:false')&&text.batch.includes('browserNetwork:false')&&text.batch.includes('clientSecrets:false')&&text.batch.includes('ambiguousSubmissionRetry:false'),'Batch plan must hard-lock no-browser/no-secret/no-ambiguous-retry policy.');
assert(text.batch.includes('validatePromptStudioGenerationArtifact(item.result)'),'Batch result import must validate every terminal V7 result item.');
assert(text.batch.includes('PROMPT_STUDIO_BATCH_LINKS_KEY')&&text.batch.includes('variantHash')&&text.batch.includes('planHash'),'Batch return path must preserve batch/variant/export lineage.');
assert(text.batchRunner.includes('MAX_BATCH_CONCURRENCY=8')&&text.batchRunner.includes("status:ambiguous?'submission-uncertain':'blocked'"),'External Batch Runner must bound local concurrency and distinguish ambiguous submission.');
assert(text.batchRunner.includes("status:'interrupted'")&&text.batchRunner.includes('if(!item.job)'),'Known-task interruption must remain resumable without unconditional new POST.');
assert(text.batchRunner.includes('automaticRetry:false')&&text.batchRunner.includes('ambiguousSubmissionRetry:false'),'Batch job policy must forbid automatic retries.');
assert(text.batchCli.includes('Local concurrency is a client-side limit')&&text.batchCli.includes('submission-uncertain')&&text.batchCli.includes('known task ID'),'CLI help must explain local concurrency and duplicate-paid-request safety.');
assert(pkg.scripts?.['seedance:batch']==='node scripts/seedance-modelark-batch.mjs','package.json must expose seedance:batch.');
assert(pkg.scripts?.['validate:seedance-batch']==='node scripts/validate-seedance-modelark-batch.mjs','package.json must expose validate:seedance-batch.');
for(const pattern of ['*.batch-plan.json','*.batch-job.json','*.batch-result.json'])assert(text.ignore.includes(pattern),`.gitignore must exclude operational artifact ${pattern}.`);

assert(text.runnerCli.includes('applyExportStudioLinkToJob')&&text.runnerCli.includes('applyJobStudioLinkToResult'),'Single Runner CLI must preserve Studio lineage through job/result manifests.');
assert(text.runnerLineage.includes('projectId')&&text.runnerLineage.includes('projectUpdatedAt')&&text.runnerLineage.includes('handoffHash'),'Single Runner lineage helper must remain limited to safe Studio lineage fields.');
assert(text.history.includes('recordRank(previous)>=recordRank(record)')&&text.history.includes('conflicts with an existing export hash'),'V7 generation history must be monotonic and same-task hash-conflict safe.');
assert(singleJobSchema.properties?.studioLink&&singleResultSchema.properties?.studioLink,'Single Runner job/result schemas must allow optional safe Studio lineage.');

assert(planSchema.properties?.items?.maxItems===20&&planSchema.properties?.policy?.properties?.autoSubmit?.const===false,'Batch Plan schema must enforce 20-item and no-auto-submit bounds.');
assert(jobSchema.properties?.localConcurrency?.maximum===8&&jobSchema.properties?.policy?.properties?.ambiguousSubmissionRetry?.const===false,'Batch Job schema must enforce local concurrency <=8 and no ambiguous submission retry.');
assert(resultSchema.properties?.status?.enum?.includes('completed-with-errors'),'Batch Result schema must represent mixed/manual-review terminal batches.');
for(const schema of [planSchema,jobSchema,resultSchema])assert(schema.additionalProperties===false,'Batch protocol schemas must be closed at the top level.');

assert(text.context.includes('Active work: **v8 Variant Batch Generation / Batch Runner**'),'Canonical PROJECT-CONTEXT must identify V8 as active work.');
assert(text.roadmap.includes('## NOW — v8 Variant Batch Generation'),'Living roadmap must identify V8 as NOW.');
assert(text.decisions.includes('ADR-016 — Ambiguous paid submission state must fail closed'),'ADR log must retain ambiguous paid-submission decision.');
assert(projectState.active?.phase==='prompt-studio-v8-variant-batch-generation'&&projectState.active?.branch==='feat/prompt-studio-v8-batch-generation','Machine-readable PROJECT-STATE must identify actual V8 active phase/branch.');
assert(text.agents.includes('docs/PROJECT-CONTEXT.md')&&text.agents.includes('docs/ROADMAP.md')&&text.agents.includes('docs/PROJECT-STATE.json'),'AGENTS.md must require canonical project memory.');

const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`V8 must preserve exactly 100 unique curated cases; got ${curated.length}.`);assert(PROMPTS.length===192,`V8 must preserve exactly 192 Porter Originals; got ${PROMPTS.length}.`);

if(failures.length){console.error('Prompt Studio v8 production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,mountOrder:['v6','v7','v8','cmd-k'],browserProviderExecution:false,batchMaxItems:20,localConcurrencyMax:8,ambiguousAutoRetry:false,resumableKnownTask:true,singleRunnerLineage:true,monotonicGenerationHistory:true,projectMemoryCanonical:true,curatedCases:curated.length,porterOriginals:PROMPTS.length},null,2));
