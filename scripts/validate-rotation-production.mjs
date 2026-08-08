#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { workflowPublishesStudioAsset, workflowRunsValidator, workflowTriggersForPath } from './pages-publish-policy.mjs';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const [pages,sidebar,ui,engine,bootstrap,runtime,multi]=await Promise.all([
  readFile('.github/workflows/pages.yml','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('studio/rotation-ui.js','utf8'),
  readFile('studio/rotation-engine.js','utf8'),
  readFile('studio/rotation-bootstrap.js','utf8'),
  import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href),
  import(pathToFileURL(resolve('studio/multi-source-index.js')).href)
]);

for(const asset of ['rotation.css','rotation-bootstrap.js','rotation-engine.js','rotation-ui.js']){
  assert(workflowPublishesStudioAsset(pages,asset),`Pages must publish ${asset}.`);
}
assert(workflowRunsValidator(pages,'validate-rotation-planner.mjs'),'Pages must run the Rotation Planner contract before deploy.');
assert(workflowRunsValidator(pages,'validate-rotation-production.mjs'),'Pages must run the Rotation production contract before deploy.');
assert(workflowTriggersForPath(pages,'scripts/validate-rotation-planner.mjs'),'Pages workflow path triggers must include Rotation validator changes.');
assert(workflowTriggersForPath(pages,'scripts/build-rotation-plan.mjs'),'Pages workflow path triggers must include Rotation CLI changes.');
assert(sidebar.includes("import './rotation-bootstrap.js';"),'Application shell must mount Rotation Planner.');
assert(sidebar.indexOf("import './rotation-bootstrap.js';")>sidebar.indexOf("import './promotion-bootstrap.js';"),'Rotation Planner must mount after Promotion workspace.');
assert(bootstrap.includes("link.href = './rotation.css'"),'Rotation bootstrap must load CSS.');
assert(bootstrap.includes("await import('./rotation-ui.js')"),'Rotation bootstrap must mount UI.');
assert(engine.includes('ROTATION_TARGET_SIZE = 100'),'Rotation engine must keep exact-100 as an explicit invariant.');
assert(engine.includes('autoSwap:false')&&engine.includes('autoPublish:false'),'Rotation engine must explicitly prohibit automatic swap/publish.');
assert(engine.includes('doNotAutoReplace: true'),'Rotation report must preserve human-only replacement boundary.');
assert(!ui.includes('data-rotation-replace'),'Rotation UI must not expose a replacement action.');
assert(!ui.includes('INDUSTRY_DIGEST.push')&&!ui.includes('MULTI_SOURCE_CASES.push'),'Rotation UI must never mutate curated arrays.');
assert(!/digestGrid\.innerHTML\s*=/.test(ui)&&!/digestGrid\.append/.test(ui),'Rotation UI must never rewrite/append curated cards.');

const curated=new Set([...runtime.CASE_INTELLIGENCE.map(item=>item.id),...multi.MULTI_SOURCE_CASES.map(item=>item.id)]);
assert(curated.size===100,`Production Rotation Planner must compare against current exact-100 curated runtime; got ${curated.size}.`);

if(failures.length){console.error('Rotation production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,curatedCases:curated.size,pagesAssets:4,publicationPolicy:'shared',pagesPredeployValidation:true,autoSwap:false,autoPublish:false},null,2));
