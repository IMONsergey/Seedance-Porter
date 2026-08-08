#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const path='studio/sidebar.js';
let source=await readFile(path,'utf8');
if(source.includes("import './prompt-studio-rule-packs-bootstrap.js';")){
  console.log('Prompt Studio Rule Pack plugin already mounted.');
  process.exit(0);
}
const anchor="import './prompt-studio-bootstrap.js';";
if(!source.includes(anchor)){
  console.error('Prompt Studio bootstrap anchor not found; refusing to patch sidebar.');
  process.exit(2);
}
source=source.replace(anchor,`${anchor}\nimport './prompt-studio-rule-packs-bootstrap.js';`);
if(!source.includes("import './prompt-studio-rule-packs-bootstrap.js';")){
  console.error('Prompt Studio Rule Pack wiring failed verification.');
  process.exit(3);
}
await writeFile(path,source,'utf8');
console.log('Prompt Studio Rule Pack plugin mounted successfully.');
