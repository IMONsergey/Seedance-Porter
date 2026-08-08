#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const path='.github/workflows/pages.yml';
let source=await readFile(path,'utf8');
if(source.includes('node scripts/validate-prompt-studio-v2-rule-packs.mjs')){
  console.log('Prompt Studio v2 Pages validator already wired.');
  process.exit(0);
}
const anchor=`      - name: Validate Prompt Studio production wiring\n        run: node scripts/validate-prompt-studio-production.mjs`;
if(!source.includes(anchor)){
  console.error('Prompt Studio production validation anchor not found; refusing to patch Pages workflow.');
  process.exit(2);
}
const addition=`${anchor}\n\n      - name: Validate Prompt Studio v2 Rule Packs\n        run: node scripts/validate-prompt-studio-v2-rule-packs.mjs`;
source=source.replace(anchor,addition);
if(!source.includes('node scripts/validate-prompt-studio-v2-rule-packs.mjs')){
  console.error('Prompt Studio v2 Pages migration failed verification.');
  process.exit(3);
}
await writeFile(path,source,'utf8');
console.log('Prompt Studio v2 Rule Pack validator wired into Pages.');
