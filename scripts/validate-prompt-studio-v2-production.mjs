#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';
import { workflowPublishesStudioAsset, workflowRunsValidator } from './pages-publish-policy.mjs';

const [pages,sidebar,ui,panel,bootstrap,profiles,ai]=await Promise.all([
  readFile('.github/workflows/pages.yml','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('studio/prompt-studio-ui.js','utf8'),
  readFile('studio/prompt-studio-profile-panel.js','utf8'),
  readFile('studio/prompt-studio-rule-packs-bootstrap.js','utf8'),
  readFile('studio/prompt-studio-profiles.js','utf8'),
  readFile('studio/prompt-studio-ai.js','utf8')
]);

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
for(const asset of ['prompt-studio-profiles.js','prompt-studio-profile-panel.js','prompt-studio-rule-packs-bootstrap.js','prompt-studio-rule-packs.css']){
  assert(workflowPublishesStudioAsset(pages,asset),`Pages must publish ${asset}.`);
}
assert(workflowRunsValidator(pages,'validate-prompt-studio-v2-rule-packs.mjs'),'Pages must run Prompt Studio v2 Rule Pack behavior contract.');
assert(workflowRunsValidator(pages,'validate-prompt-studio-v2-production.mjs'),'Pages must run Prompt Studio v2 production contract.');
assert(sidebar.includes("import './prompt-studio-rule-packs-bootstrap.js';"),'Application shell must mount Rule Pack plugin.');
assert(sidebar.indexOf("import './prompt-studio-bootstrap.js';")<sidebar.indexOf("import './prompt-studio-rule-packs-bootstrap.js';"),'Rule Pack plugin must mount after Prompt Studio core.');
assert(sidebar.indexOf("import './prompt-studio-rule-packs-bootstrap.js';")<sidebar.indexOf("import './command-palette-bootstrap.js';"),'Rule Pack plugin should be available before global navigation helpers render Studio state.');
assert(ui.includes('function replaceProjectFromExtension('),'Prompt Studio core must expose a real external project replacement boundary.');
assert(ui.includes('createPromptStudioRevision(state.project,`before ${reason}`)'),'External project replacement must snapshot the active project before mutation.');
assert(ui.includes('replaceProject:(nextProject,options)=>replaceProjectFromExtension'),'Public Studio API must expose replaceProject().');
assert(ui.includes('updateProject:(partial,options)=>updateProjectFromExtension'),'Public Studio API must expose updateProject().');
assert(bootstrap.includes("await import('./prompt-studio-profile-panel.js')"),'Rule Pack bootstrap must mount profile panel.');
assert(bootstrap.includes("link.href='./prompt-studio-rule-packs.css'")||bootstrap.includes("link.href = './prompt-studio-rule-packs.css'"),'Rule Pack bootstrap must load plugin CSS.');
assert(panel.includes('api.replaceProject(next'),'Rule Pack panel must use the project API rather than hidden UI automation.');
assert(!panel.includes('.click()')&&!panel.includes('dispatchEvent(new Event'),'Rule Pack panel must not simulate click/change events for project mutation.');
assert(panel.includes('panel.dataset.renderSignature===renderSignature'),'MutationObserver profile panel must render idempotently and avoid self-trigger loops.');
assert(!panel.includes('state.project')&&!panel.includes('setSectionContent'),'Plugin must not reach into Prompt Studio internal state or section mutators.');
assert(profiles.includes('Product Precision')&&profiles.includes('Character Continuity')&&profiles.includes('UI / Interface Motion'),'v2 production bundle must include substantive Rule Packs.');
assert(ai.includes('customRules:project.customRules || []'),'Rule Pack rules must flow into the AI editing policy through customRules.');

const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];
assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`Prompt Studio v2 must preserve exact 100 curated cases; got ${curated.length}.`);
assert(PROMPTS.length===192,`Prompt Studio v2 must preserve all 192 Porter Originals; got ${PROMPTS.length}.`);

if(failures.length){console.error('Prompt Studio v2 production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,curatedCases:curated.length,porterOriginals:PROMPTS.length,rulePackPlugin:true,projectMutationApi:true,revisionBeforeExternalMutation:true,idempotentPluginRender:true,domSimulation:false,curatedMutation:false},null,2));
