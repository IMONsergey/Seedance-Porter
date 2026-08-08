#!/usr/bin/env node
import { createPromptStudioProject } from '../studio/prompt-studio-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
const clone=value=>JSON.parse(JSON.stringify(value));

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
  savePromptStudioProject,
  loadPromptStudioProject,
  duplicatePromptStudioProject,
  createPromptStudioRevision,
  listPromptStudioRevisions,
  restorePromptStudioRevision,
  exportPromptStudioProject,
  importPromptStudioProject
}=await import('../studio/prompt-studio-store.js');

const extensionState={
  variables:[
    {id:'var-product',key:'product',value:'Aster device',description:'Hero product',updatedAt:'2026-08-08T05:00:00.000Z'},
    {id:'var-hold',key:'endpoint_hold',value:'1.2',description:'Seconds',updatedAt:'2026-08-08T05:00:00.000Z'}
  ],
  ingredients:[
    {id:'ingredient-lock',label:'Product lock',type:'continuity',defaultSection:'continuity',template:'Keep {{product}} exact.',tags:['product'],createdAt:'2026-08-08T05:00:00.000Z',updatedAt:'2026-08-08T05:00:00.000Z'}
  ],
  timeline:{
    schemaVersion:1,
    beats:[
      {id:'beat-1',index:0,label:'Hero reveal',shotType:'packshot',duration:3,purpose:'Establish product',camera:'slow push in',action:'Reveal {{product}}.',referenceTokens:['@ref01'],notes:'',enabled:true},
      {id:'beat-2',index:1,label:'Endpoint',shotType:'packshot',duration:3,purpose:'Hold endpoint',camera:'locked',action:'Settle and hold.',referenceTokens:['@ref01'],notes:'Hold {{endpoint_hold}} seconds.',enabled:true}
    ],
    updatedAt:'2026-08-08T05:00:00.000Z',
    lastSyncedAt:'',
    lastSyncedHash:''
  }
};

const project=createPromptStudioProject({
  id:'studio-persistence-source',
  title:'v3 persistence fixture',
  duration:6,
  sections:[
    {id:'objective',content:'Create a precise product hero with reusable production controls.'},
    {id:'action',content:'Reveal {{product}} once and settle cleanly.'},
    {id:'timing',content:''}
  ],
  references:[{id:'ref-product',token:'@ref01',name:'Product',mediaType:'image',role:'geometry',locked:true,uri:'https://example.com/product.png'}],
  now:'2026-08-08T05:00:00.000Z'
});
Object.assign(project,clone(extensionState));

const saved=savePromptStudioProject(project,{revision:false,reason:'seed',now:'2026-08-08T05:00:01.000Z'});
const loaded=loadPromptStudioProject(saved.id);
assert(Boolean(loaded),'Saved project must load.');
assert(JSON.stringify(loaded.variables)===JSON.stringify(extensionState.variables),'save/load must preserve v3 variables exactly.');
assert(JSON.stringify(loaded.ingredients)===JSON.stringify(extensionState.ingredients),'save/load must preserve v3 ingredients exactly.');
assert(JSON.stringify(loaded.timeline)===JSON.stringify(extensionState.timeline),'save/load must preserve v3 timeline exactly.');

createPromptStudioRevision(loaded,'before v3 mutation');
const revision=listPromptStudioRevisions(loaded.id)[0];
assert(Boolean(revision?.id),'Manual revision must be created.');
const changed=clone(loaded);
changed.variables[0].value='Changed device';
changed.ingredients[0].template='Changed template';
changed.timeline.beats[0].duration=1.5;
savePromptStudioProject(changed,{revision:false,reason:'mutated',now:'2026-08-08T05:00:02.000Z'});
const restored=restorePromptStudioRevision(loaded.id,revision.id,'2026-08-08T05:00:03.000Z');
assert(restored.variables[0].value==='Aster device','Revision restore must restore v3 variable state.');
assert(restored.ingredients[0].template==='Keep {{product}} exact.','Revision restore must restore v3 Ingredient state.');
assert(restored.timeline.beats[0].duration===3,'Revision restore must restore v3 Timeline state.');

const duplicated=duplicatePromptStudioProject(restored.id,'2026-08-08T05:00:04.000Z');
assert(Boolean(duplicated)&&duplicated.id!==restored.id,'Duplicate must create a new project identity.');
assert(JSON.stringify(duplicated.variables)===JSON.stringify(restored.variables),'Duplicate must preserve v3 variables.');
assert(JSON.stringify(duplicated.ingredients)===JSON.stringify(restored.ingredients),'Duplicate must preserve v3 ingredients.');
assert(JSON.stringify(duplicated.timeline)===JSON.stringify(restored.timeline),'Duplicate must preserve v3 timeline.');

const exported=exportPromptStudioProject(restored);
const exportValue=JSON.parse(exported);
assert(JSON.stringify(exportValue.project.variables)===JSON.stringify(restored.variables),'JSON export must include v3 variables.');
assert(JSON.stringify(exportValue.project.ingredients)===JSON.stringify(restored.ingredients),'JSON export must include v3 ingredients.');
assert(JSON.stringify(exportValue.project.timeline)===JSON.stringify(restored.timeline),'JSON export must include v3 timeline.');
const imported=importPromptStudioProject(exported,'2026-08-08T05:00:05.000Z');
assert(imported.id!==restored.id,'JSON import must create a new project identity.');
assert(JSON.stringify(imported.variables)===JSON.stringify(restored.variables),'JSON import must preserve v3 variables.');
assert(JSON.stringify(imported.ingredients)===JSON.stringify(restored.ingredients),'JSON import must preserve v3 ingredients.');
assert(JSON.stringify(imported.timeline)===JSON.stringify(restored.timeline),'JSON import must preserve v3 timeline.');

const future=clone(restored);
future.storyboard={schemaVersion:1,cards:[{id:'future-card'}]};
future.variants=[{id:'future-variant'}];
const futureSaved=savePromptStudioProject(future,{revision:false,reason:'future extension',now:'2026-08-08T05:00:06.000Z'});
const futureDuplicate=duplicatePromptStudioProject(futureSaved.id,'2026-08-08T05:00:07.000Z');
const futureImported=importPromptStudioProject(exportPromptStudioProject(futureSaved),'2026-08-08T05:00:08.000Z');
assert(futureDuplicate.storyboard?.cards?.[0]?.id==='future-card'&&futureDuplicate.variants?.[0]?.id==='future-variant','Duplicate must preserve unknown future Prompt Studio extension fields.');
assert(futureImported.storyboard?.cards?.[0]?.id==='future-card'&&futureImported.variants?.[0]?.id==='future-variant','Import must preserve unknown future Prompt Studio extension fields.');

if(failures.length){console.error('Prompt Studio v3 persistence contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,saveLoad:true,revisionRestore:true,duplicate:true,exportImport:true,variables:true,ingredients:true,timeline:true,futureExtensions:true},null,2));
