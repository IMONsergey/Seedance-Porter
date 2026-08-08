#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createPromptStudioProject } from '../studio/prompt-studio-engine.js';
import {
  PROMPT_STUDIO_PROFILES,
  getPromptStudioProfile,
  applyPromptStudioProfile,
  getPromptStudioUserRules,
  getPromptStudioProfileCoverage
} from '../studio/prompt-studio-profiles.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

assert(PROMPT_STUDIO_PROFILES.length===6,`Expected six first-class Rule Packs; got ${PROMPT_STUDIO_PROFILES.length}.`);
assert(new Set(PROMPT_STUDIO_PROFILES.map(profile=>profile.id)).size===PROMPT_STUDIO_PROFILES.length,'Rule Pack IDs must be unique.');
for(const profile of PROMPT_STUDIO_PROFILES){
  assert(profile.rules.length>=5,`Rule Pack ${profile.id} must carry a substantive production policy.`);
  assert(profile.label&&profile.labelRu,`Rule Pack ${profile.id} must have EN/RU labels.`);
}

const project=createPromptStudioProject({
  id:'v2-profile-test',
  title:'Product beauty hero',
  modelProfile:'seedance-general',
  sections:[
    {id:'objective',content:'Create a precise premium product hero with one readable visual event.'},
    {id:'camera',content:'One slow lateral move.'},
    {id:'action',content:'One highlight travels across the package and settles at the endpoint.'}
  ],
  references:[{id:'r1',token:'@ref01',name:'Product',mediaType:'image',role:'geometry',locked:true,uri:'https://example.com/product.png'}],
  customRules:['USER RULE: keep the background warm neutral.']
});
const originalSections=JSON.stringify(project.sections);
const originalReferences=JSON.stringify(project.references);
const originalSource=JSON.stringify(project.source);

const product=applyPromptStudioProfile(project,'product-precision');
assert(product.modelProfile==='product-precision','Applying Product Precision must update modelProfile.');
assert(product.customRules.includes('USER RULE: keep the background warm neutral.'),'Applying a Rule Pack must preserve user custom rules.');
assert(product.customRules.some(rule=>/silhouette, proportions/i.test(rule)),'Product Precision must add geometry-specific production rules.');
assert(JSON.stringify(product.sections)===originalSections,'Rule Pack application must not rewrite prompt sections.');
assert(JSON.stringify(product.references)===originalReferences,'Rule Pack application must not rewrite references.');
assert(JSON.stringify(product.source)===originalSource,'Rule Pack application must not rewrite source provenance.');

const character=applyPromptStudioProfile(product,'character-continuity');
assert(character.modelProfile==='character-continuity','Switching profiles must update modelProfile.');
assert(character.customRules.includes('USER RULE: keep the background warm neutral.'),'Switching profiles must preserve user rules.');
assert(!character.customRules.some(rule=>/Product silhouette, proportions/i.test(rule)),'Switching profiles must remove the previous pack rules instead of accumulating incompatible packs.');
assert(character.customRules.some(rule=>/Character face identity/i.test(rule)),'Character Continuity must add identity-specific production rules.');
const userRules=getPromptStudioUserRules(character);
assert(userRules.length===1&&userRules[0]==='USER RULE: keep the background warm neutral.','User-rule extraction must exclude all known pack rules.');
const coverage=getPromptStudioProfileCoverage(character);
assert(coverage.active===coverage.expected&&coverage.missing.length===0,'Applied profile must report complete active coverage.');
assert(getPromptStudioProfile('does-not-exist').id==='seedance-general','Unknown profile ID must safely resolve to General Production.');

const [ui,panel,bootstrap,sidebar,ai]=await Promise.all([
  readFile('studio/prompt-studio-ui.js','utf8'),
  readFile('studio/prompt-studio-profile-panel.js','utf8'),
  readFile('studio/prompt-studio-rule-packs-bootstrap.js','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('studio/prompt-studio-ai.js','utf8')
]);
assert(ui.includes('function replaceProjectFromExtension('),'Prompt Studio v2 must expose a real internal project replacement boundary.');
assert(ui.includes('replaceProject:(nextProject,options)=>replaceProjectFromExtension'),'Public Prompt Studio API must expose replaceProject().');
assert(ui.includes('updateProject:(partial,options)=>updateProjectFromExtension'),'Public Prompt Studio API must expose updateProject().');
assert(ui.includes('createPromptStudioRevision(state.project,`before ${reason}`)'),'External project replacement must create a revision before changing project state.');
assert(panel.includes('api.replaceProject(next'),'Rule Pack plugin must mutate projects only through the public replaceProject API.');
assert(!panel.includes('.click()')&&!panel.includes('dispatchEvent(new Event'),'Rule Pack plugin must not simulate hidden DOM clicks/change events to mutate project state.');
assert(panel.includes('getPromptStudioUserRules'),'Rule Pack panel must surface preserved user-rule state.');
assert(sidebar.includes("import './prompt-studio-rule-packs-bootstrap.js';"),'Application shell must mount the Rule Pack plugin.');
assert(bootstrap.includes("await import('./prompt-studio-profile-panel.js')"),'Rule Pack bootstrap must mount the profile panel.');
assert(ai.includes('customRules:project.customRules || []'),'Active pack rules must flow into the AI editor policy through project customRules.');
assert(!panel.includes('sections=')&&!panel.includes('.sections.'),'Profile panel must not directly mutate prompt sections.');

if(failures.length){console.error('Prompt Studio v2 Rule Pack contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,profiles:PROMPT_STUDIO_PROFILES.map(profile=>profile.id),projectMutationApi:['replaceProject','updateProject','createRevision'],userRulesPreserved:true,sectionsUntouched:true,referencesUntouched:true,domSimulation:false},null,2));
