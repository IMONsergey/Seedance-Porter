#!/usr/bin/env node

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const memory=new Map();
globalThis.localStorage={
  getItem:key=>memory.has(String(key))?memory.get(String(key)):null,
  setItem:(key,value)=>memory.set(String(key),String(value)),
  removeItem:key=>memory.delete(String(key)),
  clear:()=>memory.clear()
};
globalThis.window={dispatchEvent:()=>true};
globalThis.CustomEvent=class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}};

const {
  loadPromptStudioIngredientLibrary,
  savePromptStudioIngredientLibrary,
  upsertPromptStudioLibraryIngredient,
  deletePromptStudioLibraryIngredient,
  resetPromptStudioIngredientLibraryToStarters,
  ensurePromptStudioIngredientStarters,
  promptStudioIngredientLibraryStats
}=await import('../studio/prompt-studio-ingredient-library.js');

assert(loadPromptStudioIngredientLibrary().length===0,'Fresh shared Ingredient Library must start empty before seeding.');
const seeded=ensurePromptStudioIngredientStarters();
assert(seeded.length>=6,'Shared Ingredient Library must seed substantive starter recipes.');
assert(seeded.every(item=>item.id.startsWith('library-starter-')),'Seeded starter recipes must use stable library IDs.');

upsertPromptStudioLibraryIngredient({id:'library-custom',label:'Custom lock',type:'continuity',defaultSection:'continuity',template:'Keep geometry fixed.',tags:['custom']});
let loaded=loadPromptStudioIngredientLibrary();
assert(loaded.some(item=>item.id==='library-custom'&&item.template==='Keep geometry fixed.'),'Upsert must add a new shared Ingredient.');
const countAfterInsert=loaded.length;
upsertPromptStudioLibraryIngredient({id:'library-custom',label:'Custom lock v2',type:'continuity',defaultSection:'continuity',template:'Keep geometry fixed and lighting coherent.',tags:['custom','v2']});
loaded=loadPromptStudioIngredientLibrary();
assert(loaded.length===countAfterInsert,'Upsert with the same ID must update rather than duplicate a shared Ingredient.');
assert(loaded.find(item=>item.id==='library-custom')?.label==='Custom lock v2','Shared Ingredient update must replace the matching ID.');

deletePromptStudioLibraryIngredient('library-custom');
assert(!loadPromptStudioIngredientLibrary().some(item=>item.id==='library-custom'),'Delete must remove exactly the requested shared Ingredient.');

const many=Array.from({length:325},(_,index)=>({id:`library-${index}`,label:`Ingredient ${index}`,type:'other',defaultSection:'constraints',template:`Rule ${index}`,tags:[]}));
const capped=savePromptStudioIngredientLibrary(many);
assert(capped.length===300,'Shared Ingredient Library must hard-cap persisted entries at 300.');
assert(loadPromptStudioIngredientLibrary().length===300,'Reloaded shared Ingredient Library must preserve the 300-entry cap.');
const stats=promptStudioIngredientLibraryStats();
assert(stats.count===300,'Shared Ingredient Library stats must reflect persisted count.');
assert(stats.types.other===300,'Shared Ingredient Library stats must aggregate types.');

const reset=resetPromptStudioIngredientLibraryToStarters();
assert(reset.length>=6&&reset.length<300,'Reset must restore starter recipes rather than retain capped custom data.');
assert(ensurePromptStudioIngredientStarters().length===reset.length,'Starter ensure must be idempotent when the library is already populated.');

if(failures.length){console.error('Prompt Studio Shared Ingredient Library contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,starterRecipes:reset.length,upsert:true,delete:true,limit:300,stats:true,localOnly:true},null,2));
