#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const path='studio/prompt-studio-ui.js';
let source=await readFile(path,'utf8');
if(source.includes('function replaceProjectFromExtension(')){
  console.log('Prompt Studio v2 API already present.');
  process.exit(0);
}

const pattern=/function exposePublicApi\(\)\{[\s\S]*?window\.porterPromptStudio=\{[\s\S]*?lint:\(\)=>lintPromptProject\(state\.project\)[\s\S]*?\};\s*\}/;
if(!pattern.test(source)){
  console.error('Prompt Studio public API anchor not found; refusing to rewrite the UI.');
  process.exit(2);
}

const replacement=`function replaceProjectFromExtension(nextProject,options={}){\n  if(!nextProject||typeof nextProject!=='object')throw new Error('Prompt Studio replaceProject requires a project object.');\n  if(!state.project)throw new Error('Prompt Studio has no active project.');\n  const reason=String(options.reason||'external project update');\n  const preserveIdentity=options.preserveIdentity!==false;\n  if(options.snapshot!==false)createPromptStudioRevision(state.project,\`before \${reason}\`);\n  const candidate={\n    ...JSON.parse(JSON.stringify(nextProject)),\n    id:preserveIdentity?state.project.id:nextProject.id,\n    createdAt:preserveIdentity?state.project.createdAt:nextProject.createdAt\n  };\n  state.project=refreshPromptStudioProject(candidate,options.now||Date.now());\n  state.project=savePromptStudioProject(state.project,{revision:false,reason});\n  state.stagedPatch=null;\n  state.error='';\n  refreshDerived();\n  reloadAssets().then(renderStudio);\n  renderStudio();\n  try{window.dispatchEvent(new CustomEvent('porter-prompt-studio-project-replaced',{detail:{projectId:state.project.id,reason}}));}catch{}\n  return JSON.parse(JSON.stringify(state.project));\n}\n\nfunction updateProjectFromExtension(partial,options={}){\n  const patch=partial&&typeof partial==='object'?partial:{};\n  const next={...JSON.parse(JSON.stringify(state.project)),...JSON.parse(JSON.stringify(patch))};\n  return replaceProjectFromExtension(next,{...options,preserveIdentity:true});\n}\n\nfunction exposePublicApi(){\n  window.porterPromptStudio={\n    open:showStudio,\n    openSource:(detail)=>openStudioFromDetail(detail||{}),\n    getProject:()=>JSON.parse(JSON.stringify(state.project)),\n    replaceProject:(nextProject,options)=>replaceProjectFromExtension(nextProject,options||{}),\n    updateProject:(partial,options)=>updateProjectFromExtension(partial,options||{}),\n    createRevision:(reason='extension snapshot')=>{createPromptStudioRevision(state.project,String(reason));return listPromptStudioRevisions(state.project.id);},\n    compile:()=>compilePromptProject(state.project),\n    lint:()=>lintPromptProject(state.project)\n  };\n}`;

source=source.replace(pattern,replacement);
if(!source.includes('replaceProject:(nextProject,options)=>replaceProjectFromExtension')){
  console.error('Migration replacement failed verification.');
  process.exit(3);
}
await writeFile(path,source,'utf8');
console.log('Prompt Studio project mutation API inserted successfully.');
