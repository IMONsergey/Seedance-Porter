#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const enginePath='studio/prompt-studio-engine.js';
const regressionPath='scripts/validate-prompt-studio-regressions.mjs';
let engine=await readFile(enginePath,'utf8');
let regression=await readFile(regressionPath,'utf8');

const legacyOld="      notes:`Imported from ${match[0]}`,";
const legacyNew="      notes:`Imported legacy ${match[1]} ${legacyNumber} reference`,";
if(engine.includes(legacyOld)) engine=engine.replace(legacyOld,legacyNew);
if(!engine.includes(legacyNew)) throw new Error('Legacy reference note migration did not apply.');

const applyOld=`export function applyPromptStudioPatch(project, patch, options = {}) {\n  const validation = validatePromptStudioPatch(project, patch);\n  if (!validation.ok) throw new Error(validation.errors.join(' '));\n  const next = normalizeProject(project);\n  for (const change of validation.patch.changes) setSectionContent(next.sections, change.sectionId, change.content);\n  next.lastPatch = {\n    appliedAt:new Date(options.now || Date.now()).toISOString(),\n    backend:String(options.backend || 'manual'),\n    summary:validation.patch.summary,\n    changes:validation.patch.changes,\n    warnings:validation.patch.warnings\n  };\n  return refreshCompiled(next, next.lastPatch.appliedAt);\n}`;
const applyNew=`export function applyPromptStudioPatch(project, patch, options = {}) {\n  const validation = validatePromptStudioPatch(project, patch);\n  if (!validation.ok) throw new Error(validation.errors.join(' '));\n  const next = normalizeProject(project);\n  const auditChanges = validation.patch.changes.map(change => ({\n    ...change,\n    before:sectionValue(next, change.sectionId),\n    after:String(change.content || '')\n  }));\n  for (const change of auditChanges) setSectionContent(next.sections, change.sectionId, change.after);\n  next.lastPatch = {\n    appliedAt:new Date(options.now || Date.now()).toISOString(),\n    backend:String(options.backend || options.source || 'manual'),\n    summary:validation.patch.summary,\n    changes:auditChanges,\n    warnings:validation.patch.warnings\n  };\n  return refreshCompiled(next, next.lastPatch.appliedAt);\n}`;
if(engine.includes(applyOld)) engine=engine.replace(applyOld,applyNew);
if(!engine.includes('before:sectionValue(next, change.sectionId)')||!engine.includes('after:String(change.content || \'\')')) throw new Error('Patch audit before/after migration did not apply.');

const importOld=`  lintPromptProject,\n  inferReferencesFromPrompt\n} from '../studio/prompt-studio-engine.js';`;
const importNew=`  lintPromptProject,\n  inferReferencesFromPrompt,\n  applyPromptStudioPatch\n} from '../studio/prompt-studio-engine.js';`;
if(regression.includes(importOld)) regression=regression.replace(importOld,importNew);
if(!regression.includes('applyPromptStudioPatch')) throw new Error('Regression import migration failed.');

const legacyAnchor=`assert(!compiled.includes('[Image 1]')&&!compiled.includes('[Video 2]'),'Compiled fork must not retain rewritten legacy reference tokens.');`;
const auditBlock=`\nassert(!compiled.includes('Imported from [Image 1]')&&!compiled.includes('Imported from [Video 2]'),'Compiled reference jobs must not reintroduce legacy token syntax through reference notes.');\n\nconst auditBase=createPromptStudioProject({\n  id:'audit-fixture',\n  sections:[\n    {id:'objective',content:'Create a controlled audit fixture with one deliberate camera move.'},\n    {id:'camera',content:'locked camera'},\n    {id:'action',content:'The subject moves once and settles into a stable endpoint.'}\n  ]\n});\nconst auditApplied=applyPromptStudioPatch(auditBase,{summary:'Audit camera change',changes:[{sectionId:'camera',content:'one slow push-in',reason:'single camera rule'}],warnings:[]},{now:'2026-08-08T00:02:00.000Z',backend:'regression'});\nassert(auditApplied.lastPatch?.changes?.[0]?.before==='locked camera','Applied patch audit must preserve before-text.');\nassert(auditApplied.lastPatch?.changes?.[0]?.after==='one slow push-in','Applied patch audit must preserve after-text.');\nassert(auditApplied.lastPatch?.backend==='regression','Applied patch audit must preserve backend provenance.');`;
if(!regression.includes('Applied patch audit must preserve before-text.')){
  if(!regression.includes(legacyAnchor)) throw new Error('Regression legacy anchor not found.');
  regression=regression.replace(legacyAnchor,legacyAnchor+auditBlock);
}

await writeFile(enginePath,engine,'utf8');
await writeFile(regressionPath,regression,'utf8');
console.log('Prompt Studio engine legacy-reference and patch-audit fixes applied.');
