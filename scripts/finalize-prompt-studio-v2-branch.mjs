#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const [ui,sidebar,panel,pages,v2ci]=await Promise.all([
  readFile('studio/prompt-studio-ui.js','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('studio/prompt-studio-profile-panel.js','utf8'),
  readFile('.github/workflows/pages.yml','utf8'),
  readFile('.github/workflows/prompt-studio-v2-ci.yml','utf8')
]);
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
assert(ui.includes('function replaceProjectFromExtension('),'Project mutation API migration is missing.');
assert(ui.includes('replaceProject:(nextProject,options)=>replaceProjectFromExtension'),'Public replaceProject API migration is missing.');
assert(ui.includes('updateProject:(partial,options)=>updateProjectFromExtension'),'Public updateProject API migration is missing.');
assert(sidebar.includes("import './prompt-studio-rule-packs-bootstrap.js';"),'Rule Pack shell wiring migration is missing.');
assert(panel.includes('panel.dataset.renderSignature===renderSignature'),'Rule Pack panel idempotence migration is missing.');
assert(pages.includes('node scripts/validate-prompt-studio-v2-rule-packs.mjs'),'Pages v2 behavior validation wiring is missing.');
assert(pages.includes('node scripts/validate-prompt-studio-v2-production.mjs'),'Pages v2 production validation wiring is missing.');
assert(v2ci.includes('node scripts/validate-prompt-studio-v2-production.mjs'),'v2 matrix CI production validation wiring is missing.');
if(failures.length){console.error('Prompt Studio v2 branch is not ready for cleanup:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,projectMutationApi:true,rulePackMount:true,idempotentPanel:true,pagesGates:true,v2MatrixProductionGate:true},null,2));
