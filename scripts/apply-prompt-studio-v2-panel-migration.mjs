#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const path='studio/prompt-studio-profile-panel.js';
let source=await readFile(path,'utf8');
if(source.includes('panel.dataset.renderSignature===renderSignature')){
  console.log('Rule Pack panel render signature already present.');
  process.exit(0);
}
const anchor=`  const language=getLanguage();`;
if(!source.includes(anchor)){
  console.error('Rule Pack language anchor not found; refusing to patch panel.');
  process.exit(2);
}
const addition=`${anchor}\n  const renderSignature=JSON.stringify([project.id,project.updatedAt,project.modelProfile,project.customRules,selected.id,recommended.id,language]);\n  if(panel.dataset.renderSignature===renderSignature)return;\n  panel.dataset.renderSignature=renderSignature;`;
source=source.replace(anchor,addition);
if(!source.includes('panel.dataset.renderSignature===renderSignature')){
  console.error('Rule Pack panel idempotence migration failed verification.');
  process.exit(3);
}
await writeFile(path,source,'utf8');
console.log('Rule Pack panel render signature inserted.');
