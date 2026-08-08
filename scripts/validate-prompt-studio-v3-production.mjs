#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';
import { workflowPublishesStudioAsset, workflowRunsValidator } from './pages-publish-policy.mjs';

const [pages,sidebar,bootstrap,tools,ingredients,timeline,library,schema]=await Promise.all([
  readFile('.github/workflows/pages.yml','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('studio/prompt-studio-production-tools-bootstrap.js','utf8'),
  readFile('studio/prompt-studio-production-tools.js','utf8'),
  readFile('studio/prompt-studio-ingredients.js','utf8'),
  readFile('studio/prompt-studio-timeline.js','utf8'),
  readFile('studio/prompt-studio-ingredient-library.js','utf8'),
  readFile('schemas/prompt-studio-production-tools.schema.json','utf8')
]);
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

for(const asset of [
  'prompt-studio-production-tools.css',
  'prompt-studio-production-tools-bootstrap.js',
  'prompt-studio-production-tools.js',
  'prompt-studio-ingredients.js',
  'prompt-studio-timeline.js',
  'prompt-studio-ingredient-library.js'
]) assert(workflowPublishesStudioAsset(pages,asset),`Pages must publish ${asset}.`);

assert(workflowRunsValidator(pages,'validate-prompt-studio-production-tools.mjs'),'Pages must run v3 engine contract.');
assert(workflowRunsValidator(pages,'validate-prompt-studio-v3-production.mjs'),'Pages must run v3 production contract.');
assert(sidebar.includes("import './prompt-studio-production-tools-bootstrap.js';"),'Application shell must mount Production Tools plugin.');
assert(sidebar.indexOf("import './prompt-studio-rule-packs-bootstrap.js';")<sidebar.indexOf("import './prompt-studio-production-tools-bootstrap.js';"),'Production Tools must mount after Rule Packs.');
assert(sidebar.indexOf("import './prompt-studio-production-tools-bootstrap.js';")<sidebar.indexOf("import './command-palette-bootstrap.js';"),'Production Tools should be available before global navigation helpers finish Studio decoration.');
assert(bootstrap.includes("link.href='./prompt-studio-production-tools.css'")||bootstrap.includes("link.href = './prompt-studio-production-tools.css'"),'Production Tools bootstrap must load CSS.');
assert(bootstrap.includes("await import('./prompt-studio-production-tools.js')"),'Production Tools bootstrap must mount the staged dock.');

assert(tools.includes('const state={')&&tools.includes('draft:{variables:[],ingredients:[],timeline:null}'),'Production Tools must maintain a dedicated staged draft.');
assert(tools.includes("api.replaceProject(next,{reason:'apply Production Tools draft',snapshot:true"),'Generic tools Apply must enter core through replaceProject with revision.');
assert(tools.includes('syncTimelineToTimingSection(base)'),'Timeline sync must be explicit and use the timeline engine.');
assert(tools.includes('insertIngredientIntoSection(base'),'Ingredient insertion must be explicit and use the ingredient engine.');
assert(tools.includes('resolveVariablesInSection(base'),'Variable resolution must be explicit and section-scoped.');
assert(!tools.includes('state.project'),'Production Tools plugin must not access Prompt Studio private state.');
assert(!tools.includes('.click()')&&!tools.includes('dispatchEvent(new Event'),'Production Tools must not mutate projects through hidden DOM automation.');
assert(tools.includes('data-variable-field="key"')&&tools.includes('readonly'),'Variable keys must be immutable in v3 UI to avoid silently breaking templates.');

assert(ingredients.includes('unresolved variables'),'Ingredient engine must block unresolved variables by default.');
assert(ingredients.includes('insertIngredientIntoSection'),'Ingredient engine must expose isolated target-section insertion.');
assert(timeline.includes('syncTimelineToTimingSection'),'Timeline engine must expose explicit Timing sync.');
assert(timeline.includes('beat-reference-unresolved'),'Timeline lint must detect unresolved beat references.');
assert(timeline.includes('beat-camera-overload'),'Timeline lint must detect per-beat camera overload.');
assert(library.includes("porterPromptStudio:ingredientLibrary:v1"),'Shared Ingredient Library must use a namespaced local store.');
assert(!library.includes('fetch(')&&!library.includes('XMLHttpRequest'),'Shared Ingredient Library must remain local-only.');
assert(schema.includes('prompt-studio-production-tools')||schema.includes('Prompt Studio Production Tools'),'v3 extension schema must exist.');

const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];
assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`Prompt Studio v3 must preserve exact 100 curated cases; got ${curated.length}.`);
assert(PROMPTS.length===192,`Prompt Studio v3 must preserve all 192 Porter Originals; got ${PROMPTS.length}.`);

if(failures.length){console.error('Prompt Studio v3 production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,curatedCases:curated.length,porterOriginals:PROMPTS.length,stagedTools:true,explicitTimingSync:true,explicitIngredientInsert:true,explicitVariableResolve:true,variableKeysImmutable:true,sharedIngredientLibrary:'local-only',privateStateAccess:false,domAutomation:false},null,2));
