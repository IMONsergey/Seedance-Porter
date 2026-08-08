#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';
import { workflowPublishesStudioAsset, workflowRunsValidator } from './pages-publish-policy.mjs';

const [sidebar,bootstrap,guard,ui,engine,handoff,adapter,runner,exportSchema,jobSchema,resultSchema,pages,ci]=await Promise.all([
  readFile('studio/sidebar.js','utf8'),readFile('studio/prompt-studio-v7-bootstrap.js','utf8'),readFile('studio/prompt-studio-v7-workflow-guard.js','utf8'),readFile('studio/prompt-studio-v7-results-ui.js','utf8'),readFile('studio/prompt-studio-generation-results.js','utf8'),readFile('studio/prompt-studio-generation-handoff.js','utf8'),readFile('studio/prompt-studio-seedance-adapter.js','utf8'),readFile('scripts/seedance-modelark-runner-engine.mjs','utf8'),readFile('schemas/prompt-studio-seedance-export.schema.json','utf8'),readFile('schemas/prompt-studio-generation-job.schema.json','utf8'),readFile('schemas/prompt-studio-generation-result.schema.json','utf8'),readFile('.github/workflows/pages.yml','utf8'),readFile('.github/workflows/prompt-studio-v7-ci.yml','utf8')
]);
const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
const exportJson=JSON.parse(exportSchema),jobJson=JSON.parse(jobSchema),resultJson=JSON.parse(resultSchema);
const assets=['prompt-studio-generation-results.js','prompt-studio-v7-bootstrap.js','prompt-studio-v7-workflow-guard.js','prompt-studio-v7-results-ui.js','prompt-studio-v7.css'];
for(const asset of assets)assert(workflowPublishesStudioAsset(pages,asset),`Pages must publish ${asset}.`);
for(const validator of ['validate-prompt-studio-v7-generation-results.mjs','validate-prompt-studio-v7-ui.mjs','validate-prompt-studio-v7-production.mjs'])assert(workflowRunsValidator(pages,validator),`Pages must run ${validator}.`);
assert(sidebar.includes("import './prompt-studio-v7-bootstrap.js';"),'Shell must mount v7.');
assert(sidebar.indexOf("import './prompt-studio-v6-bootstrap.js';")<sidebar.indexOf("import './prompt-studio-v7-bootstrap.js';"),'V7 must mount after v6.');
assert(sidebar.indexOf("import './prompt-studio-v7-bootstrap.js';")<sidebar.indexOf("import './command-palette-bootstrap.js';"),'V7 must mount before Cmd-K.');
assert(bootstrap.includes("link.href='./prompt-studio-v7.css'")&&bootstrap.indexOf("await import('./prompt-studio-v7-workflow-guard.js')")<bootstrap.indexOf("await import('./prompt-studio-v7-results-ui.js')"),'V7 bootstrap must load guard before UI.');
assert(!ui.includes('fetch(')&&!ui.includes('XMLHttpRequest')&&!ui.includes('sendBeacon'),'V7 browser UI must not fetch provider/media content during import.');
assert(ui.includes('file.size>2*1024*1024')&&ui.includes('JSON.parse(await file.text())'),'V7 import must be local JSON parsing with a bounded file size.');
assert(ui.includes("snapshot:true")&&ui.includes('window.porterPromptStudio?.replaceProject'),'V7 project changes must use public revisioned Prompt Studio API.');
assert(!/\bstate\.project\b/.test(ui),'V7 UI must not access Prompt Studio private state.');
assert(ui.includes("target=\"_blank\"")&&ui.includes('rel="noopener noreferrer"'),'Generated media URLs may only be opened through explicit safe external links.');
assert(!ui.includes('<video')&&!ui.includes('<img'),'V7 Results workspace must not auto-embed remote output media.');
assert(guard.includes("MUTATING_ACTIONS=new Set(['save-stage','attach-stage-video','attach-stage-last','attach-record-video','attach-record-last','delete-record'])"),'V7 guard must cover every mutating Generation Results action.');
assert(guard.includes("document.querySelectorAll('[data-story-field]')")&&guard.includes("document.querySelectorAll('#studioV5Dock :disabled')"),'V7 guard must inherit staged Repair/Storyboard production signals without private-state coupling.');
assert(guard.includes("document.addEventListener('click',handleCapture,true)"),'V7 staged-work guard must block in capture phase before UI mutations.');
assert(engine.includes("MAX_PROMPT_STUDIO_GENERATION_RECORDS=50")&&engine.includes("PROMPT_STUDIO_GENERATION_RECORDS_KEY='generationResults'")&&engine.includes("PROMPT_STUDIO_GENERATION_PROVENANCE_KEY='generationOutputProvenance'"),'V7 must use bounded extension-safe history/provenance namespaces.');
assert(engine.includes('credential-like-field-present')&&engine.includes('containsCredentialLikeField'),'Generation manifest import must reject credential-like nested fields.');
assert(engine.includes("if(previous&&previous.exportHash!==incoming.exportHash)throw")&&engine.includes('recordRank(previous)>recordRank(incoming)'),'Generation history must reject task/hash conflicts and prevent stale job downgrade.');
assert(engine.includes("mediaType:kind==='video'?'video':'image'")&&engine.includes("role:kind==='video'?'motion':'first-frame'")&&engine.includes("locked:kind==='last-frame'"),'Explicit continuation must map video and last-frame output to correct reference semantics.');
assert(engine.includes('nextReferenceToken')&&engine.includes('@ref${String(index).padStart(2'), 'Generated output references must use stable next @refNN allocation.');
assert(handoff.includes("updatedAt:String(project.updatedAt||'')"),'Generation Handoff must include exact project updatedAt in hashed project identity.');
assert(adapter.includes('studioLink=buildStudioLink(handoff)')&&adapter.includes('handoffHash=String(handoff?.integrity?.contentHash'),'Seedance export must link project ID/version to exact Handoff hash.');
assert(runner.includes('studioLink:normalizeStudioLink(exportBundle.studioLink)')&&runner.includes('studioLink:normalizeStudioLink(job.studioLink)'),'External Runner must preserve safe Studio lineage from export to job/result.');
for(const schema of [exportJson,jobJson,resultJson])assert(schema.properties?.studioLink,'Export/job/result schemas must model optional Studio lineage.');
assert(!exportJson.required.includes('studioLink')&&!jobJson.required.includes('studioLink')&&!resultJson.required.includes('studioLink'),'Studio lineage must remain optional for backward compatibility with historical artifacts.');
assert(jobJson.$defs?.studioLink?.additionalProperties===false&&resultJson.$defs?.studioLink?.additionalProperties===false,'Runner manifest lineage schemas must be closed.');
assert(exportJson.properties?.studioLink?.anyOf?.some(item=>item.type==='null'),'Seedance export schema must allow absent/null lineage on historical integrations.');
assert(ci.includes('node: [20,22,24]')&&ci.includes('validate-prompt-studio-v7-generation-results.mjs')&&ci.includes('validate-prompt-studio-v7-ui.mjs')&&ci.includes('validate-prompt-studio-v7-production.mjs'),'V7 CI must run engine/UI/production contracts on Node 20/22/24.');
assert(ci.includes('seedance-modelark-runner-engine.mjs')&&ci.includes('prompt-studio-seedance-adapter.js')&&ci.includes("'schemas/prompt-studio*.json'"),'V7 CI must rerun across the complete browser→provider→Runner lineage surface.');
const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`V7 must preserve exact 100 curated cases; got ${curated.length}.`);assert(PROMPTS.length===192,`V7 must preserve 192 Porter Originals; got ${PROMPTS.length}.`);
if(failures.length){console.error('Prompt Studio v7 production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,curatedCases:curated.length,porterOriginals:PROMPTS.length,assets:assets.length,localImportOnly:true,stagedWorkGuard:true,lineageOptional:true,lineageClosed:true,historyMax:50,hashConflictBlocked:true,continuationRefs:true,runnerRoundTrip:true,browserNetwork:false,nodeMatrix:[20,22,24]},null,2));
