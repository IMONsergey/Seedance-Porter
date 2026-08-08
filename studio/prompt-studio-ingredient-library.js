import { PROMPT_STUDIO_STARTER_INGREDIENTS, normalizeIngredients } from './prompt-studio-ingredients.js';

const KEY='porterPromptStudio:ingredientLibrary:v1';
const LIMIT=300;

export function loadPromptStudioIngredientLibrary(){
  try{
    const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');
    return normalizeIngredients(Array.isArray(parsed)?parsed:[]).slice(0,LIMIT);
  }catch{return[];}
}

export function savePromptStudioIngredientLibrary(items){
  const normalized=normalizeIngredients(items||[]).slice(0,LIMIT);
  localStorage.setItem(KEY,JSON.stringify(normalized));
  dispatchChange({type:'library-save',count:normalized.length});
  return normalized;
}

export function upsertPromptStudioLibraryIngredient(ingredient){
  const items=loadPromptStudioIngredientLibrary();
  const normalized=normalizeIngredients([ingredient])[0];
  if(!normalized)throw new Error('Invalid ingredient.');

  // A project ingredient carries a stable createdAt. Re-saving that same source
  // updates its previous shared copy even when another recipe has the same label/ID.
  const sourceIndex=normalized.createdAt
    ? items.findIndex(item=>item.createdAt===normalized.createdAt&&item.label===normalized.label)
    : -1;
  if(sourceIndex>=0){
    const existing=items[sourceIndex];
    items[sourceIndex]={...normalized,id:existing.id,createdAt:existing.createdAt,updatedAt:new Date().toISOString()};
    return savePromptStudioIngredientLibrary(items);
  }

  const idIndex=items.findIndex(item=>item.id===normalized.id);
  if(idIndex>=0){
    // Same explicit library ID without source identity is an intentional upsert.
    // If both entries carry different source timestamps, protect the incumbent and
    // allocate a collision-safe ID instead of silently overwriting another recipe.
    const existing=items[idIndex];
    if(normalized.createdAt&&existing.createdAt&&normalized.createdAt!==existing.createdAt){
      const uniqueId=uniqueLibraryId(normalized.id,items);
      items.unshift({...normalized,id:uniqueId,updatedAt:new Date().toISOString()});
    }else{
      items[idIndex]={...normalized,id:existing.id,createdAt:existing.createdAt||normalized.createdAt,updatedAt:new Date().toISOString()};
    }
  }else{
    items.unshift({...normalized,id:normalized.id||`library-${randomId()}`,updatedAt:new Date().toISOString()});
  }
  return savePromptStudioIngredientLibrary(items);
}

export function deletePromptStudioLibraryIngredient(id){
  const items=loadPromptStudioIngredientLibrary().filter(item=>item.id!==id);
  savePromptStudioIngredientLibrary(items);
  dispatchChange({type:'library-delete',id});
  return items;
}

export function resetPromptStudioIngredientLibraryToStarters(){
  const now=new Date().toISOString();
  const items=PROMPT_STUDIO_STARTER_INGREDIENTS.map(item=>({...item,id:`library-${item.id}`,createdAt:now,updatedAt:now}));
  return savePromptStudioIngredientLibrary(items);
}

export function ensurePromptStudioIngredientStarters(){
  const current=loadPromptStudioIngredientLibrary();
  if(current.length)return current;
  return resetPromptStudioIngredientLibraryToStarters();
}

export function promptStudioIngredientLibraryStats(){
  const items=loadPromptStudioIngredientLibrary();
  return{
    count:items.length,
    types:Object.fromEntries([...new Set(items.map(item=>item.type))].map(type=>[type,items.filter(item=>item.type===type).length])),
    tags:[...new Set(items.flatMap(item=>item.tags||[]))].sort()
  };
}

function uniqueLibraryId(base,items){
  const root=String(base||'library').replace(/-+$/,'');
  const used=new Set(items.map(item=>item.id));
  let id=`${root}-${randomId()}`;
  while(used.has(id))id=`${root}-${randomId()}`;
  return id;
}
function dispatchChange(detail){
  try{window.dispatchEvent(new CustomEvent('porter-prompt-studio-ingredient-library-change',{detail}));}catch{}
}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,12)||Math.random().toString(36).slice(2,14);}catch{return Math.random().toString(36).slice(2,14);}}
