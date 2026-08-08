#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

async function patchFile(path, transforms){let source=await readFile(path,'utf8');for(const transform of transforms)source=transform(source);await writeFile(path,source,'utf8');}
function insertAfter(anchor,addition){return source=>{if(source.includes(addition.trim()))return source;if(!source.includes(anchor))throw new Error(`Missing anchor: ${anchor}`);return source.replace(anchor,`${anchor}${addition}`);};}
function replaceExact(from,to){return source=>{if(source.includes(to))return source;if(!source.includes(from))throw new Error(`Missing replacement anchor: ${from.slice(0,90)}`);return source.replace(from,to);};}

await patchFile('studio/sidebar.js',[
  insertAfter("import './prompt-studio-v4-bootstrap.js';\n","import './prompt-studio-v5-bootstrap.js';\n")
]);

await patchFile('.github/workflows/pages.yml',[
  insertAfter("      - name: Validate Prompt Studio v4 production wiring\n        run: node scripts/validate-prompt-studio-v4-production.mjs\n",`\n      - name: Validate Prompt Studio v5 Repair Blueprints and Seedance engines\n        run: node scripts/validate-prompt-studio-v5-engines.mjs\n\n      - name: Validate Prompt Studio v5 workflow guard behavior\n        run: node scripts/validate-prompt-studio-v5-workflow-guard.mjs\n\n      - name: Validate Prompt Studio v5 production wiring\n        run: node scripts/validate-prompt-studio-v5-production.mjs\n`),
  insertAfter("          test -f _site/prompt-studio-v4.css\n","          test -f _site/prompt-studio-v5-bootstrap.js\n          test -f _site/prompt-studio-v5.css\n")
]);

await patchFile('scripts/validate-pages-contract.mjs',[
  insertAfter("  'prompt-studio-v4.css','prompt-studio-v4-bootstrap.js','prompt-studio-v4-ui.js','prompt-studio-v4-workflow-guard.js','prompt-studio-storyboard.js','prompt-studio-variants.js','prompt-studio-generation-handoff.js',\n","  'prompt-studio-v5.css','prompt-studio-v5-bootstrap.js','prompt-studio-v5-ui.js','prompt-studio-v5-workflow-guard.js','prompt-studio-repair.js','prompt-studio-blueprints.js','prompt-studio-seedance-adapter.js',\n"),
  insertAfter("  'validate-prompt-studio-v4-production.mjs',\n","  'validate-prompt-studio-v5-engines.mjs',\n  'validate-prompt-studio-v5-workflow-guard.mjs',\n  'validate-prompt-studio-v5-production.mjs',\n"),
  replaceExact("for (const builtAsset of ['sidebar.js','prompt-studio-ui.js','prompt-studio.css','prompt-studio-rule-packs-bootstrap.js','prompt-studio-production-tools-bootstrap.js','prompt-studio-v4-bootstrap.js','prompt-studio-v4.css']) {","for (const builtAsset of ['sidebar.js','prompt-studio-ui.js','prompt-studio.css','prompt-studio-rule-packs-bootstrap.js','prompt-studio-production-tools-bootstrap.js','prompt-studio-v4-bootstrap.js','prompt-studio-v4.css','prompt-studio-v5-bootstrap.js','prompt-studio-v5.css']) {"),
  replaceExact("promptStudio:'v1+v2+v3+v4 production-critical + extension-persistence-safe + workflow-guarded'","promptStudio:'v1+v2+v3+v4+v5 production-critical + staged-workflow-guarded + provider-export-only'")
]);

const [sidebar,pages,contract]=await Promise.all([readFile('studio/sidebar.js','utf8'),readFile('.github/workflows/pages.yml','utf8'),readFile('scripts/validate-pages-contract.mjs','utf8')]);
if(!sidebar.includes("import './prompt-studio-v5-bootstrap.js';"))throw new Error('v5 sidebar wiring failed');
for(const validator of ['validate-prompt-studio-v5-engines.mjs','validate-prompt-studio-v5-workflow-guard.mjs','validate-prompt-studio-v5-production.mjs'])if(!pages.includes(validator)||!contract.includes(validator))throw new Error(`v5 validator wiring failed: ${validator}`);
for(const asset of ['prompt-studio-v5-bootstrap.js','prompt-studio-v5.css'])if(!pages.includes(`test -f _site/${asset}`))throw new Error(`v5 built assertion missing: ${asset}`);
console.log('Prompt Studio v5 wiring applied and verified.');
