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
assert(ui.includes('replaceProject:(nextProject,options)=>replaceProjectFromExtension'),'replaceProject API missing.');
assert(ui.includes('updateProject:(partial,options)=>updateProjectFromExtension'),'updateProject API missing.');
assert(sidebar.includes("import './prompt-studio-rule-packs-bootstrap.js';"),'Rule Pack plugin mount missing.');
assert(panel.includes('panel.dataset.renderSignature===renderSignature'),'Rule Pack render signature guard missing.');
assert(pages.includes('node scripts/validate-prompt-studio-v2-rule-packs.mjs'),'Pages v2 behavior gate missing.');
assert(pages.includes('node scripts/validate-prompt-studio-v2-production.mjs'),'Pages v2 production gate missing.');
assert(v2ci.includes('node scripts/validate-prompt-studio-v2-production.mjs'),'v2 matrix production gate missing.');
if(failures.length){console.error('Prompt Studio v2 release state incomplete:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,releaseReady:true},null,2));
