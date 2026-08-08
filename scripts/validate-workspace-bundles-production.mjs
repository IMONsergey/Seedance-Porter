#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { workflowPublishesStudioAsset, workflowRunsValidator } from './pages-publish-policy.mjs';

const [pages,sidebar,bootstrap,ui,engine,schema]=await Promise.all([
  readFile('.github/workflows/pages.yml','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('studio/workspace-bundle-bootstrap.js','utf8'),
  readFile('studio/workspace-bundle-ui.js','utf8'),
  readFile('studio/workspace-bundle-engine.js','utf8'),
  readFile('schemas/workspace-bundle.schema.json','utf8')
]);
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
for(const asset of ['workspace-bundle.css','workspace-bundle-bootstrap.js','workspace-bundle-engine.js','workspace-bundle-ui.js'])assert(workflowPublishesStudioAsset(pages,asset),`Pages must publish ${asset}.`);
assert(workflowRunsValidator(pages,'validate-workspace-bundles.mjs'),'Pages must run Workspace Bundle safety contract.');
assert(workflowRunsValidator(pages,'validate-workspace-bundles-production.mjs'),'Pages must run Workspace Bundle production contract.');
assert(sidebar.includes("import './workspace-bundle-bootstrap.js';"),'Application shell must mount Workspace Bundles.');
assert(sidebar.indexOf("import './operations-bootstrap.js';") < sidebar.indexOf("import './workspace-bundle-bootstrap.js';"),'Workspace Bundles must mount after Operations workspace exists.');
assert(bootstrap.includes("link.href = './workspace-bundle.css'"),'Workspace Bundle bootstrap must load CSS.');
assert(ui.includes('porterDeepReviewDraft:')&&ui.includes('porterDeepReviewMediaEvidence:')&&ui.includes('porterPromotionEditorial:'),'Bundle UI must use only the three approved local namespaces.');
assert(engine.includes('autoApproval:false')||engine.includes('autoApproval: false'),'Bundle engine must explicitly deny auto approval.');
assert(engine.includes('autoGitHubWrite:false')||engine.includes('autoGitHubWrite: false'),'Bundle engine must explicitly deny GitHub writes.');
assert(schema.includes('seedance-porter-workspace-bundle'),'Schema must lock workspace bundle kind.');
assert(!engine.includes('INDUSTRY_DIGEST.push')&&!engine.includes('MULTI_SOURCE_CASES.push'),'Bundle engine must never mutate curated datasets.');
const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];
assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`Workspace Bundle production baseline must be exact 100 curated cases; got ${curated.length}.`);
if(failures.length){console.error('Workspace Bundle production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,curatedCases:curated.length,publicationPolicy:'shared',transportOnly:true,autoApproval:false,autoGitHubWrite:false},null,2));
