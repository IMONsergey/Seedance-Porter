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
assert(loaded.length===countAfterInsert,'Upsert with the same ID and no source identity must update rather than duplicate.');
assert(loaded.find(item=>item.id==='library-custom')?.label==='Custom lock v2','Shared Ingredient update must replace the matching ID.');

deletePromptStudioLibraryIngredient('library-custom');
assert(!loadPromptStudioIngredientLibrary().some(item=>item.id==='library-custom'),'Delete must remove exactly the requested shared Ingredient.');

const sourceA={id:'library-same-label',label:'Same label',type:'continuity',defaultSection:'continuity',template:'Rule A',tags:['a'],createdAt:'2026-08-08T05:00:00.000Z'};
const sourceB={id:'library-same-label',label:'Same label',type:'continuity',defaultSection:'continuity',template:'Rule B',tags:['b'],createdAt:'2026-08-08T05:01:00.000Z'};
upsertPromptStudioLibraryIngredient(sourceA);
upsertPromptStudioLibraryIngredient(sourceB);
loaded=loadPromptStudioIngredientLibrary();
let sameLabel=loaded.filter(item=>item.label==='Same label');
assert(sameLabel.length===2,'Different source Ingredients with the same shared ID/label must coexist instead of silently overwriting.');
assert(new Set(sameLabel.map(item=>item.id)).size===2,'Collision-safe shared Ingredients must receive distinct library IDs.');
assert(sameLabel.some(item=>item.createdAt===sourceA.createdAt)&&sameLabel.some(item=>item.createdAt===sourceB.createdAt),'Collision-safe copies must preserve source identity timestamps.');
const beforeSourceBResave=loaded.length;
upsertPromptStudioLibraryIngredient({...sourceB,template:'Rule B updated'});
loaded=loadPromptStudioIngredientLibrary();
sameLabel=loaded.filter(item=>item.label==='Same label');
assert(loaded.length===beforeSourceBResave,'Re-saving the same source Ingredient must update its prior shared copy, not create another collision copy.');
assert(sameLabel.find(item=>item.createdAt===sourceB.createdAt)?.template==='Rule B updated','Source-aware re-save must update the correct collision-safe shared Ingredient.');

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
console.log(JSON.stringify({ok:true,starterRecipes:reset.length,upsert:true,collisionSafe:true,sourceAwareResave:true,delete:true,limit:300,stats:true,localOnly:true},null,2));
