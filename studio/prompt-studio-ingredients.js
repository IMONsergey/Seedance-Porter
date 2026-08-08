export const PROMPT_STUDIO_INGREDIENT_TYPES = Object.freeze([
  'subject','environment','composition','camera','action','lighting','material','style','continuity','constraint','avoid','other'
]);

export const PROMPT_STUDIO_STARTER_INGREDIENTS = Object.freeze([
  {
    id:'starter-product-geometry-lock',
    label:'Product geometry lock',
    type:'continuity',
    defaultSection:'continuity',
    template:'Keep {{product}} silhouette, proportions, seams, openings, controls and construction geometry identical across every beat. Do not morph topology to create transitions.',
    tags:['product','geometry','continuity']
  },
  {
    id:'starter-single-camera-rule',
    label:'Single camera rule',
    type:'camera',
    defaultSection:'camera',
    template:'Use one dominant {{camera_move}}. Keep lens character, camera height and movement direction coherent; do not stack competing camera moves.',
    tags:['camera','clarity']
  },
  {
    id:'starter-material-physics',
    label:'Material physics',
    type:'material',
    defaultSection:'materials',
    template:'{{material}} must respond consistently to gravity, contact, inertia, surface tension or elasticity as applicable, while preserving scene lighting direction and plausible reflections.',
    tags:['material','physics']
  },
  {
    id:'starter-stable-endpoint',
    label:'Stable endpoint',
    type:'action',
    defaultSection:'timing',
    template:'Stop introducing new events before the end. Let {{subject}} settle into a stable endpoint for at least {{endpoint_hold}} seconds so the frame can support edit, graphics or post-production.',
    tags:['timing','endpoint','edit']
  },
  {
    id:'starter-character-identity-lock',
    label:'Character identity lock',
    type:'continuity',
    defaultSection:'continuity',
    template:'Keep {{character}} face identity, age, proportions, hairstyle, wardrobe construction and defining features stable across all beats unless a transformation is explicitly requested.',
    tags:['character','identity','continuity']
  },
  {
    id:'starter-ui-legibility',
    label:'UI legibility hierarchy',
    type:'constraint',
    defaultSection:'constraints',
    template:'Preserve {{interface}} information hierarchy, component geometry and layout relationships. Keep primary state change dominant and reserve exact microcopy/brand typography for references or post-production.',
    tags:['ui','interface','graphics']
  }
]);

const VARIABLE_KEY = /^[a-z][a-z0-9_-]{0,63}$/;
const TEMPLATE_TOKEN = /\{\{\s*([a-z][a-z0-9_-]{0,63})\s*\}\}/gi;

export function normalizePromptStudioTools(project) {
  const value = project && typeof project === 'object' ? project : {};
  return {
    variables:normalizeVariables(value.variables || []),
    ingredients:normalizeIngredients(value.ingredients || []),
    timeline:normalizeTimelineExtension(value.timeline || null)
  };
}

export function normalizeVariables(items) {
  const map = new Map();
  for (const item of items || []) {
    const key = normalizeVariableKey(item?.key);
    if (!key) continue;
    map.set(key, {
      id:String(item?.id || `var-${key}`),
      key,
      value:String(item?.value ?? ''),
      description:String(item?.description || ''),
      updatedAt:String(item?.updatedAt || '')
    });
  }
  return [...map.values()].sort((a,b)=>a.key.localeCompare(b.key));
}

export function normalizeIngredients(items) {
  const ids = new Set();
  return (items || []).map((item,index) => {
    let id=String(item?.id || `ingredient-${index+1}`);
    if(ids.has(id))id=`${id}-${index+1}`;
    ids.add(id);
    return {
      id,
      label:String(item?.label || `Ingredient ${index+1}`),
      type:PROMPT_STUDIO_INGREDIENT_TYPES.includes(String(item?.type)) ? String(item.type) : 'other',
      defaultSection:String(item?.defaultSection || sectionForIngredientType(item?.type)),
      template:String(item?.template || ''),
      tags:uniqueStrings(item?.tags || []),
      createdAt:String(item?.createdAt || ''),
      updatedAt:String(item?.updatedAt || '')
    };
  });
}

export function normalizeVariableKey(value) {
  const key=String(value || '').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_-]/g,'');
  return VARIABLE_KEY.test(key) ? key : '';
}

export function setProjectVariable(project,key,value,description='') {
  const next=clone(project);
  const normalized=normalizeVariableKey(key);
  if(!normalized)throw new Error('Variable key must start with a-z and use only a-z, 0-9, _ or -.');
  const vars=normalizeVariables(next.variables || []);
  const existing=vars.find(item=>item.key===normalized);
  const now=new Date().toISOString();
  if(existing){existing.value=String(value??'');existing.description=String(description||existing.description||'');existing.updatedAt=now;}
  else vars.push({id:`var-${normalized}`,key:normalized,value:String(value??''),description:String(description||''),updatedAt:now});
  next.variables=normalizeVariables(vars);
  return next;
}

export function deleteProjectVariable(project,key) {
  const next=clone(project);
  const normalized=normalizeVariableKey(key);
  next.variables=normalizeVariables(next.variables || []).filter(item=>item.key!==normalized);
  return next;
}

export function resolvePromptStudioTemplate(template,variables=[]) {
  const map=new Map(normalizeVariables(variables).map(item=>[item.key,item.value]));
  const unresolved=[];
  const text=String(template||'').replace(new RegExp(TEMPLATE_TOKEN.source,'gi'),(full,key)=>{
    const normalized=normalizeVariableKey(key);
    const value=map.get(normalized);
    if(value==null||String(value).trim()===''){unresolved.push(normalized||key);return full;}
    return String(value);
  });
  return {text,unresolved:[...new Set(unresolved.filter(Boolean))],used:listTemplateVariables(template).filter(key=>map.has(key))};
}

export function listTemplateVariables(template) {
  const values=[];
  for(const match of String(template||'').matchAll(new RegExp(TEMPLATE_TOKEN.source,'gi'))){
    const key=normalizeVariableKey(match[1]);if(key)values.push(key);
  }
  return [...new Set(values)];
}

export function addProjectIngredient(project,input={}) {
  const next=clone(project);
  const now=new Date().toISOString();
  const item={
    id:String(input.id||`ingredient-${randomId()}`),
    label:String(input.label||'New ingredient'),
    type:PROMPT_STUDIO_INGREDIENT_TYPES.includes(String(input.type))?String(input.type):'other',
    defaultSection:String(input.defaultSection||sectionForIngredientType(input.type)),
    template:String(input.template||''),
    tags:uniqueStrings(input.tags||[]),
    createdAt:String(input.createdAt||now),
    updatedAt:now
  };
  next.ingredients=normalizeIngredients([...(next.ingredients||[]),item]);
  return next;
}

export function updateProjectIngredient(project,id,patch={}) {
  const next=clone(project);
  const items=normalizeIngredients(next.ingredients||[]);
  const item=items.find(entry=>entry.id===id);
  if(!item)throw new Error(`Unknown ingredient: ${id}`);
  if('label'in patch)item.label=String(patch.label||'');
  if('type'in patch)item.type=PROMPT_STUDIO_INGREDIENT_TYPES.includes(String(patch.type))?String(patch.type):item.type;
  if('defaultSection'in patch)item.defaultSection=String(patch.defaultSection||item.defaultSection);
  if('template'in patch)item.template=String(patch.template||'');
  if('tags'in patch)item.tags=uniqueStrings(patch.tags||[]);
  item.updatedAt=new Date().toISOString();
  next.ingredients=normalizeIngredients(items);
  return next;
}

export function deleteProjectIngredient(project,id) {
  const next=clone(project);
  next.ingredients=normalizeIngredients(next.ingredients||[]).filter(item=>item.id!==id);
  return next;
}

export function renderProjectIngredient(project,id) {
  const ingredient=normalizeIngredients(project.ingredients||[]).find(item=>item.id===id);
  if(!ingredient)throw new Error(`Unknown ingredient: ${id}`);
  const resolved=resolvePromptStudioTemplate(ingredient.template,project.variables||[]);
  return {...resolved,ingredient};
}

export function insertIngredientIntoSection(project,ingredientId,sectionId=null,options={}) {
  const next=clone(project);
  const rendered=renderProjectIngredient(next,ingredientId);
  if(rendered.unresolved.length && options.allowUnresolved!==true){
    throw new Error(`Ingredient has unresolved variables: ${rendered.unresolved.join(', ')}`);
  }
  const target=String(sectionId||rendered.ingredient.defaultSection||sectionForIngredientType(rendered.ingredient.type));
  const section=(next.sections||[]).find(item=>item.id===target);
  if(!section)throw new Error(`Unknown Prompt Studio section: ${target}`);
  const current=String(section.content||'').trim();
  const text=rendered.text.trim();
  const position=String(options.position||'append');
  if(position==='replace')section.content=text;
  else if(position==='prepend')section.content=[text,current].filter(Boolean).join('\n');
  else section.content=[current,text].filter(Boolean).join('\n');
  return {project:next,targetSection:target,renderedText:text,unresolved:rendered.unresolved};
}

export function resolveVariablesInSection(project,sectionId,options={}) {
  const next=clone(project);
  const section=(next.sections||[]).find(item=>item.id===sectionId);
  if(!section)throw new Error(`Unknown Prompt Studio section: ${sectionId}`);
  const resolved=resolvePromptStudioTemplate(section.content,next.variables||[]);
  if(resolved.unresolved.length && options.allowUnresolved!==true){
    throw new Error(`Section has unresolved variables: ${resolved.unresolved.join(', ')}`);
  }
  section.content=resolved.text;
  return {project:next,sectionId,resolved:resolved.used,unresolved:resolved.unresolved};
}

export function buildPromptStudioVariableReport(project) {
  const variables=normalizeVariables(project.variables||[]);
  const ingredients=normalizeIngredients(project.ingredients||[]);
  const unresolved=new Map();
  const used=new Set();
  const record=(scope,text)=>{
    const result=resolvePromptStudioTemplate(text,variables);
    result.used.forEach(key=>used.add(key));
    for(const key of result.unresolved){if(!unresolved.has(key))unresolved.set(key,[]);unresolved.get(key).push(scope);}
  };
  for(const section of project.sections||[])record(`section:${section.id}`,section.content||'');
  for(const ingredient of ingredients)record(`ingredient:${ingredient.id}`,ingredient.template);
  return {
    variables,
    used:[...used].sort(),
    unused:variables.map(item=>item.key).filter(key=>!used.has(key)),
    unresolved:[...unresolved.entries()].map(([key,scopes])=>({key,scopes:[...new Set(scopes)]})).sort((a,b)=>a.key.localeCompare(b.key))
  };
}

export function starterIngredientProjectCopy(starterId) {
  const starter=PROMPT_STUDIO_STARTER_INGREDIENTS.find(item=>item.id===starterId);
  if(!starter)throw new Error(`Unknown starter ingredient: ${starterId}`);
  return {...clone(starter),id:`ingredient-${randomId()}`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
}

export function sectionForIngredientType(type) {
  return ({subject:'subject',environment:'environment',composition:'composition',camera:'camera',action:'action',lighting:'lighting',material:'materials',style:'style',continuity:'continuity',constraint:'constraints',avoid:'avoid'})[String(type||'')]||'constraints';
}

function normalizeTimelineExtension(value){
  if(!value||typeof value!=='object')return{schemaVersion:1,beats:[],updatedAt:'',lastSyncedAt:'',lastSyncedHash:''};
  return{...clone(value),schemaVersion:1,beats:Array.isArray(value.beats)?clone(value.beats):[],updatedAt:String(value.updatedAt||''),lastSyncedAt:String(value.lastSyncedAt||''),lastSyncedHash:String(value.lastSyncedHash||'')};
}
function uniqueStrings(values){return[...new Set((Array.isArray(values)?values:[values]).flat(Infinity).map(value=>String(value??'').trim()).filter(Boolean))];}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,12)||Math.random().toString(36).slice(2,14);}catch{return Math.random().toString(36).slice(2,14);}}
