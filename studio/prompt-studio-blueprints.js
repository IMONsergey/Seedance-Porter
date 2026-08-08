import { createPromptStudioProject, refreshPromptStudioProject } from './prompt-studio-engine.js';
import { normalizeVariables, normalizeIngredients } from './prompt-studio-ingredients.js';

const LIBRARY_KEY='porterPromptStudio:blueprints:v1';
const MAX_CUSTOM_BLUEPRINTS=100;

export const PROMPT_STUDIO_BLUEPRINTS=Object.freeze([
  {
    id:'blueprint-product-precision',label:'Product Precision',labelRu:'Точный продуктовый ролик',category:'Product',mode:'image-to-video',aspect:'16:9',duration:6,modelProfile:'product-precision',
    description:'Geometry-first product film with one dominant material event and edit-safe endpoint.',requiredReferenceRoles:['geometry'],
    customRules:['Preserve exact product geometry across every beat.','Use one dominant camera rule.','Reserve exact typography and labels for a graphics reference or post-production.'],
    variables:[{key:'product',value:'',description:'Hero product name/identity'},{key:'material',value:'',description:'Primary surface/material'}],
    sections:{objective:'Create a controlled product hero that proves exact geometry, material response and one readable state change.',subject:'@ref01 controls exact product geometry and identity.',camera:'Use one dominant camera move or a deliberately locked camera.',action:'Show one primary physical/material event, then settle into a stable endpoint.',materials:'Describe concrete surface response, reflections, contact, deformation or fluid behavior.',continuity:'Lock silhouette, proportions, seams, openings, controls, material response and lighting direction.',constraints:'One product instance unless duplication is intentional. No topology drift, invented parts or unrequested text.',avoid:'Avoid generic cinematic adjectives when observable material/camera behavior can be specified.'}
  },
  {
    id:'blueprint-character-continuity',label:'Character Continuity',labelRu:'Консистентность персонажа',category:'Character',mode:'image-to-video',aspect:'16:9',duration:8,modelProfile:'character-continuity',
    description:'Identity-locked character scene with explicit action and cross-shot continuity.',requiredReferenceRoles:['identity'],
    customRules:['Character identity is a hard lock.','Do not alter facial structure, age, hairstyle or wardrobe construction unless explicitly requested.'],
    variables:[{key:'character',value:'',description:'Character identity'}],
    sections:{objective:'Create a short character performance with stable identity and one legible emotional/physical progression.',subject:'@ref01 controls character identity.',camera:'Choose one dominant camera behavior per beat.',action:'Describe observable body/face action and one state change per beat.',continuity:'Lock face identity, age, body proportions, hairstyle, wardrobe construction, handedness and spatial relationships.',constraints:'No identity swap, duplicate person, wardrobe mutation or invented accessories.'}
  },
  {
    id:'blueprint-ui-motion',label:'UI / Interface Motion',labelRu:'UI / интерфейсная анимация',category:'UI',mode:'image-to-video',aspect:'16:9',duration:6,modelProfile:'ui-motion',
    description:'Interface animation with layout hierarchy, state transitions and typography safety boundaries.',requiredReferenceRoles:['geometry','graphics'],
    customRules:['Preserve UI hierarchy and component geometry.','Exact microcopy and brand typography remain reference-driven or post-produced.'],
    variables:[{key:'interface',value:'',description:'Product/interface name'}],
    sections:{objective:'Demonstrate one primary interface state change while preserving layout hierarchy and readability.',composition:'Keep component relationships and information hierarchy stable.',camera:'Prefer locked or minimal camera behavior so UI state change remains dominant.',action:'Animate one clear interface transition at a time.',continuity:'Preserve component geometry, layout alignment, icon placement and hierarchy.',constraints:'No invented microcopy, logo mutation, random panels, impossible scrolling or arbitrary cursor behavior.'}
  },
  {
    id:'blueprint-first-last',label:'First / Last Frame Transition',labelRu:'Переход первый / последний кадр',category:'Transition',mode:'first-last-frame',aspect:'16:9',duration:6,modelProfile:'first-last-frame',
    description:'Controlled transition between authoritative start and end compositions.',requiredReferenceRoles:['first-frame','last-frame'],
    customRules:['First and last frames are authoritative endpoints.','Do not sacrifice endpoint geometry to create the transition.'],
    sections:{objective:'Connect two approved endpoint compositions with one coherent physical or visual transition.',subject:'@ref01 is the authoritative first frame; @ref02 is the authoritative last frame.',camera:'Use camera behavior only if it is necessary to connect the endpoints.',action:'Describe the transformation path without adding unrelated events.',timing:'Beat 1 — establish the first approved state.\nBeat 2 — execute the single transition mechanism.\nBeat 3 — settle into the last approved state and hold.',continuity:'Preserve identity and geometry unless the intended transformation explicitly changes them.',constraints:'Do not invent a third endpoint or overshoot the last-frame composition.'}
  },
  {
    id:'blueprint-multimodal-ad',label:'Multimodal Reference Ad',labelRu:'Мультимодальная реклама',category:'Commercial',mode:'multi-reference',aspect:'16:9',duration:8,modelProfile:'seedance-general',
    description:'Multi-reference commercial setup with explicit reference jobs and no cross-reference leakage.',requiredReferenceRoles:['geometry','motion'],
    customRules:['Every reference must have one explicit job.','Do not let one reference silently control another reference’s assigned property.'],
    sections:{objective:'Create an independent commercial sequence using each reference only for its assigned production job.',subject:'Define which reference controls subject identity/geometry.',camera:'Define whether camera comes from the prompt or a specific motion/video reference.',action:'Define the visible commercial action independently from source-specific subject matter.',continuity:'State cross-reference locks and what must remain consistent.',constraints:'No cross-reference leakage. Do not copy source-specific IP, characters or brand elements unless they are intentionally provided.'}
  },
  {
    id:'blueprint-general-production',label:'General Production',labelRu:'Универсальный production',category:'General',mode:'text-to-video',aspect:'16:9',duration:6,modelProfile:'seedance-general',
    description:'Neutral production-ready structure for a new text-to-video concept.',requiredReferenceRoles:[],
    customRules:['One observable objective.','One dominant camera rule per beat.','End on a readable stable state.'],
    sections:{objective:'Define what this clip must visibly communicate or prove.',subject:'Describe the subject in concrete visual terms.',environment:'Define location, spatial rule and background behavior.',composition:'Define framing and visual hierarchy.',camera:'Choose one dominant camera rule.',action:'Describe the visible action/state change.',timing:'Use a concise beat plan appropriate to duration.',lighting:'Define light direction/quality only when it matters to the result.',materials:'Describe physical/material behavior when relevant.',continuity:'State what must remain identical across the clip.',constraints:'Add high-value failure boundaries.',avoid:'List known failure modes without duplicating the positive prompt.'}
  }
]);

export function getPromptStudioBlueprint(id){
  const builtin=PROMPT_STUDIO_BLUEPRINTS.find(item=>item.id===id);if(builtin)return{...clone(builtin),builtin:true};
  const custom=loadPromptStudioBlueprintLibrary().find(item=>item.id===id);return custom?{...clone(custom),builtin:false}:null;
}
export function listPromptStudioBlueprints(){return[...PROMPT_STUDIO_BLUEPRINTS.map(item=>({...clone(item),builtin:true})),...loadPromptStudioBlueprintLibrary().map(item=>({...item,builtin:false}))];}

export function instantiatePromptStudioBlueprint(blueprintOrId,options={}){
  const blueprint=resolveBlueprint(blueprintOrId);if(!blueprint)throw new Error('Unknown Prompt Studio blueprint.');const now=options.now||Date.now();
  let project=createPromptStudioProject({title:String(options.title||blueprint.label||'Blueprint project'),mode:blueprint.mode||'text-to-video',aspect:blueprint.aspect||'16:9',duration:blueprint.duration||6,modelProfile:blueprint.modelProfile||'seedance-general',customRules:blueprint.customRules||[],sections:Object.entries(blueprint.sections||{}).map(([id,content])=>({id,content})),now});
  project.variables=normalizeVariables(blueprint.variables||[]);project.ingredients=normalizeIngredients(blueprint.ingredients||[]);if(blueprint.timeline)project.timeline=clone(blueprint.timeline);project.blueprint={id:blueprint.id,label:blueprint.label,appliedAt:new Date(now).toISOString(),mode:'new-project'};return refreshPromptStudioProject(project,now);
}

export function applyPromptStudioBlueprint(project,blueprintOrId,options={}){
  const blueprint=resolveBlueprint(blueprintOrId);if(!blueprint)throw new Error('Unknown Prompt Studio blueprint.');const next=clone(project);const sectionPolicy=String(options.sectionPolicy||'fill-empty'),settingsPolicy=String(options.settingsPolicy||'preserve'),extensionsPolicy=String(options.extensionsPolicy||'preserve');
  if(!['fill-empty','replace-defined'].includes(sectionPolicy))throw new Error('sectionPolicy must be fill-empty or replace-defined.');if(!['preserve','blueprint'].includes(settingsPolicy))throw new Error('settingsPolicy must be preserve or blueprint.');if(!['preserve','blueprint'].includes(extensionsPolicy))throw new Error('extensionsPolicy must be preserve or blueprint.');
  if(settingsPolicy==='blueprint'){next.mode=blueprint.mode||next.mode;next.aspect=blueprint.aspect||next.aspect;next.duration=Number(blueprint.duration||next.duration);next.modelProfile=blueprint.modelProfile||next.modelProfile;next.customRules=[...new Set([...(next.customRules||[]),...(blueprint.customRules||[])])];}
  for(const[id,content]of Object.entries(blueprint.sections||{})){const section=(next.sections||[]).find(item=>item.id===id);if(!section)continue;if(sectionPolicy==='replace-defined'||!String(section.content||'').trim())section.content=String(content||'');}
  if(extensionsPolicy==='blueprint'){if(blueprint.variables)next.variables=mergeVariables(next.variables,blueprint.variables);if(blueprint.ingredients)next.ingredients=normalizeIngredients([...(next.ingredients||[]),...(blueprint.ingredients||[])]);if(blueprint.timeline)next.timeline=clone(blueprint.timeline);}
  next.blueprint={id:blueprint.id,label:blueprint.label,appliedAt:new Date(options.now||Date.now()).toISOString(),mode:'apply',sectionPolicy,settingsPolicy,extensionsPolicy};return refreshPromptStudioProject(next,options.now||Date.now());
}

export function capturePromptStudioBlueprint(project,input={}){
  const now=new Date(input.now||Date.now()).toISOString();return normalizeBlueprint({id:String(input.id||`custom-blueprint-${randomId()}`),label:String(input.label||project.title||'Custom Blueprint'),labelRu:String(input.labelRu||''),category:String(input.category||'Custom'),description:String(input.description||''),mode:project.mode,aspect:project.aspect,duration:project.duration,modelProfile:project.modelProfile,requiredReferenceRoles:[...(input.requiredReferenceRoles||[])],customRules:[...(project.customRules||[])],variables:normalizeVariables(project.variables||[]),ingredients:input.includeIngredients===false?[]:normalizeIngredients(project.ingredients||[]),timeline:input.includeTimeline===false?null:clone(project.timeline||null),sections:Object.fromEntries((project.sections||[]).filter(section=>section.enabled!==false&&String(section.content||'').trim()).map(section=>[section.id,String(section.content)])),createdAt:now,updatedAt:now});
}

export function loadPromptStudioBlueprintLibrary(){try{const parsed=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]');return(Array.isArray(parsed)?parsed:[]).map(normalizeBlueprint).filter(Boolean).slice(0,MAX_CUSTOM_BLUEPRINTS);}catch{return[];}}
export function savePromptStudioBlueprint(blueprint){const normalized=normalizeBlueprint(blueprint);if(!normalized)throw new Error('Invalid blueprint.');const items=loadPromptStudioBlueprintLibrary();const index=items.findIndex(item=>item.id===normalized.id);const now=new Date().toISOString();if(index>=0)items[index]={...normalized,createdAt:items[index].createdAt||normalized.createdAt||now,updatedAt:now};else items.unshift({...normalized,createdAt:normalized.createdAt||now,updatedAt:now});persist(items);return normalized;}
export function deletePromptStudioBlueprint(id){const items=loadPromptStudioBlueprintLibrary().filter(item=>item.id!==id);persist(items);return items;}
export function resetPromptStudioBlueprintLibrary(){persist([]);return[];}

function resolveBlueprint(value){if(typeof value==='string')return getPromptStudioBlueprint(value);return normalizeBlueprint(value);}
function normalizeBlueprint(value){if(!value||typeof value!=='object')return null;const id=String(value.id||'').trim();if(!id)return null;return{id,label:String(value.label||id),labelRu:String(value.labelRu||''),category:String(value.category||'Custom'),description:String(value.description||''),mode:String(value.mode||'text-to-video'),aspect:String(value.aspect||'16:9'),duration:Number(value.duration||6),modelProfile:String(value.modelProfile||'seedance-general'),requiredReferenceRoles:[...new Set((value.requiredReferenceRoles||[]).map(String))],customRules:[...new Set((value.customRules||[]).map(String))],variables:normalizeVariables(value.variables||[]),ingredients:normalizeIngredients(value.ingredients||[]),timeline:value.timeline?clone(value.timeline):null,sections:Object.fromEntries(Object.entries(value.sections||{}).map(([id,content])=>[String(id),String(content||'')])),createdAt:String(value.createdAt||''),updatedAt:String(value.updatedAt||'')};}
function mergeVariables(current,incoming){const map=new Map(normalizeVariables(current||[]).map(item=>[item.key,item]));for(const item of normalizeVariables(incoming||[]))if(!map.has(item.key))map.set(item.key,item);return normalizeVariables([...map.values()]);}
function persist(items){try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(items.slice(0,MAX_CUSTOM_BLUEPRINTS)));window?.dispatchEvent?.(new CustomEvent('porter-prompt-studio-blueprint-library-change',{detail:{count:items.length}}));}catch(error){if(typeof localStorage!=='undefined')throw error;}}
function clone(value){return JSON.parse(JSON.stringify(value??null));}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,12)||Math.random().toString(36).slice(2,14);}catch{return Math.random().toString(36).slice(2,14);}}
