#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

await patchPages();
await patchV2Ci();
console.log('Prompt Studio v2 production validation wiring is complete.');

async function patchPages(){
  const path='.github/workflows/pages.yml';
  let source=await readFile(path,'utf8');
  if(!source.includes('node scripts/validate-prompt-studio-v2-rule-packs.mjs')){
    const anchor=`      - name: Validate Prompt Studio production wiring\n        run: node scripts/validate-prompt-studio-production.mjs`;
    if(!source.includes(anchor))throw new Error('Pages Prompt Studio production validation anchor not found.');
    source=source.replace(anchor,`${anchor}\n\n      - name: Validate Prompt Studio v2 Rule Packs\n        run: node scripts/validate-prompt-studio-v2-rule-packs.mjs`);
  }
  if(!source.includes('node scripts/validate-prompt-studio-v2-production.mjs')){
    const anchor=`      - name: Validate Prompt Studio v2 Rule Packs\n        run: node scripts/validate-prompt-studio-v2-rule-packs.mjs`;
    if(!source.includes(anchor))throw new Error('Pages Prompt Studio v2 behavior validation anchor not found.');
    source=source.replace(anchor,`${anchor}\n\n      - name: Validate Prompt Studio v2 production wiring\n        run: node scripts/validate-prompt-studio-v2-production.mjs`);
  }
  await writeFile(path,source,'utf8');
}

async function patchV2Ci(){
  const path='.github/workflows/prompt-studio-v2-ci.yml';
  let source=await readFile(path,'utf8');
  if(!source.includes("- 'scripts/validate-prompt-studio-v2-production.mjs'")){
    const pathAnchor=`      - 'scripts/validate-prompt-studio-v2-rule-packs.mjs'`;
    if(!source.includes(pathAnchor))throw new Error('Prompt Studio v2 CI path anchor not found.');
    source=source.replaceAll(pathAnchor,`${pathAnchor}\n      - 'scripts/validate-prompt-studio-v2-production.mjs'`);
  }
  if(!source.includes('run: node scripts/validate-prompt-studio-v2-production.mjs')){
    const anchor=`      - name: Validate Rule Pack isolation and project mutation API\n        run: node scripts/validate-prompt-studio-v2-rule-packs.mjs`;
    if(!source.includes(anchor))throw new Error('Prompt Studio v2 CI behavior anchor not found.');
    source=source.replace(anchor,`${anchor}\n      - name: Validate Rule Pack production wiring\n        run: node scripts/validate-prompt-studio-v2-production.mjs`);
  }
  if(!source.includes('node --check scripts/validate-prompt-studio-v2-production.mjs')){
    const syntaxAnchor=`          node --check scripts/validate-prompt-studio-v2-rule-packs.mjs`;
    if(!source.includes(syntaxAnchor))throw new Error('Prompt Studio v2 CI syntax anchor not found.');
    source=source.replace(syntaxAnchor,`${syntaxAnchor}\n          node --check scripts/validate-prompt-studio-v2-production.mjs`);
  }
  await writeFile(path,source,'utf8');
}
