#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const [ui,sidebar]=await Promise.all([
  readFile('studio/prompt-studio-ui.js','utf8'),
  readFile('studio/sidebar.js','utf8')
]);
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
assert(ui.includes('function replaceProjectFromExtension('),'Prompt Studio project replacement helper has not landed.');
assert(ui.includes('replaceProject:(nextProject,options)=>replaceProjectFromExtension'),'Public replaceProject() API has not landed.');
assert(ui.includes('updateProject:(partial,options)=>updateProjectFromExtension'),'Public updateProject() API has not landed.');
assert(sidebar.includes("import './prompt-studio-rule-packs-bootstrap.js';"),'Rule Pack plugin is not mounted in sidebar shell.');
if(failures.length){console.error('Prompt Studio v2 migration state is incomplete:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,projectMutationApi:true,rulePackPluginMounted:true},null,2));
