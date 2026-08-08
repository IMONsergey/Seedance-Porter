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
  const index=items.findIndex(item=>item.id===normalized.id);
  if(index>=0)items[index]={...normalized,updatedAt:new Date().toISOString()};
  else items.unshift({...normalized,id:normalized.id||`library-${randomId()}`,updatedAt:new Date().toISOString()});
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

function dispatchChange(detail){
  try{window.dispatchEvent(new CustomEvent('porter-prompt-studio-ingredient-library-change',{detail}));}catch{}
}
function randomId(){try{return globalThis.crypto?.randomUUID?.().slice(0,12)||Math.random().toString(36).slice(2,14);}catch{return Math.random().toString(36).slice(2,14);}}
