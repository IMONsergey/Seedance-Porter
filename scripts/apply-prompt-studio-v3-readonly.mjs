#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const path='studio/prompt-studio-production-tools.js';
let source=await readFile(path,'utf8');

const oldInput='data-variable-field="key" value="${attr(variable.key)}"';
const newInput='data-variable-field="key" value="${attr(variable.key)}" readonly';
if(!source.includes(newInput)){
  if(!source.includes(oldInput))throw new Error('Variable key input anchor not found.');
  source=source.replace(oldInput,newInput);
}

const oldUpdater=`  const name=field.dataset.variableField;\n  if(name==='key'){\n    const temp=setProjectVariable({variables:state.draft.variables},field.value,item.value,item.description);state.draft.variables=temp.variables;\n  }else if(name==='value')item.value=field.value;else if(name==='description')item.description=field.value;`;
const newUpdater=`  const name=field.dataset.variableField;\n  if(name==='value')item.value=field.value;else if(name==='description')item.description=field.value;`;
if(source.includes(oldUpdater))source=source.replace(oldUpdater,newUpdater);
if(source.includes("if(name==='key')"))throw new Error('Variable key rename path remains after migration.');
if(!source.includes('data-variable-field="key" value="${attr(variable.key)}" readonly'))throw new Error('Readonly key migration failed.');

await writeFile(path,source,'utf8');
console.log('Prompt Studio v3 variable keys are immutable.');
