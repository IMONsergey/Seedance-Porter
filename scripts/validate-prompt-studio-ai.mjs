#!/usr/bin/env node
import { createPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { createPromptStudioAIController } from '../studio/prompt-studio-ai.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
let captured=null;
let capturedConstraint=null;

const originalLanguageModel=globalThis.LanguageModel;
const originalTranslator=globalThis.Translator;

globalThis.LanguageModel={
  async availability(){return 'available';},
  async create(options){
    assert(Array.isArray(options?.initialPrompts)&&options.initialPrompts[0]?.role==='system','LanguageModel session must receive the Prompt Studio system prompt.');
    return {
      async prompt(input,callOptions){
        captured=JSON.parse(input);
        capturedConstraint=callOptions?.responseConstraint||null;
        return JSON.stringify({summary:'Camera patch',changes:[{sectionId:'camera',content:'Use one calm locked push-in and hold the endpoint.',reason:'Resolve compound camera motion.'}],warnings:[]});
      },
      destroy(){},
      contextUsage:10,
      contextWindow:4096
    };
  }
};

globalThis.Translator={
  async availability(options){
    assert(options?.sourceLanguage==='ru'&&options?.targetLanguage==='en','Translator availability must request RU→EN.');
    return 'available';
  },
  async create(){
    return {async translate(value){assert(value==='сделай движение спокойнее','Translator must receive only the custom Russian instruction, not the English preset.');return 'make the movement calmer';},destroy(){}};
  }
};

const project=createPromptStudioProject({
  id:'ai-contract',
  title:'AI contract',
  sections:[
    {id:'objective',content:'Create a controlled product hero with one clearly readable motion hierarchy.'},
    {id:'camera',content:'orbit, zoom and push in around the product'},
    {id:'action',content:'The product stays rigid while one highlight travels across the surface and settles.'}
  ],
  customRules:['Never use more than one dominant camera move per beat.']
});

const controller=createPromptStudioAIController();
const result=await controller.stageEdit(project,{preset:'camera-cleanup',instruction:'сделай движение спокойнее'});
assert(result.ok,'Mock built-in AI edit must succeed.');
assert(result.backend==='built-in-ai','Available LanguageModel must be used as neural backend.');
assert(result.patch?.changes?.[0]?.sectionId==='camera','Structured patch must target the camera section.');
assert(captured?.preset==='camera-cleanup','AI request must preserve selected preset ID.');
assert(captured?.customInstruction==='make the movement calmer','AI request must preserve translated custom instruction separately.');
assert(captured?.instruction?.includes('Resolve camera contradictions'),'Effective instruction must include the production preset instruction.');
assert(captured?.instruction?.includes('Additional user instruction: make the movement calmer'),'Effective instruction must append translated user clarification instead of replacing the preset.');
assert(captured?.project?.customRules?.includes('Never use more than one dominant camera move per beat.'),'AI request must preserve project custom rules.');
assert(capturedConstraint?.properties?.changes?.items?.properties?.sectionId?.enum?.includes('camera'),'LanguageModel call must receive the strict Prompt Studio response schema.');
assert(result.effectiveInstruction===captured.instruction,'Controller should expose the effective instruction for debugging/audit.');
assert(result.translatedInstruction==='make the movement calmer','Controller should expose translated custom instruction when translation occurred.');

await controller.destroy();

// Deterministic fallback must still work when the local model is unavailable.
globalThis.LanguageModel={async availability(){return 'unavailable';}};
globalThis.Translator=undefined;
const fallbackController=createPromptStudioAIController();
const fallback=await fallbackController.stageEdit(project,{preset:'camera-cleanup',instruction:'сделай движение спокойнее'});
assert(fallback.ok&&fallback.backend==='rules-engine','Unavailable built-in AI must fall back to deterministic rules for supported presets.');
assert(fallback.warnings.some(item=>/exact custom instruction could not be interpreted/i.test(item)),'Rules fallback must disclose that exact custom wording was not interpreted.');
await fallbackController.destroy();

if(originalLanguageModel===undefined)delete globalThis.LanguageModel;else globalThis.LanguageModel=originalLanguageModel;
if(originalTranslator===undefined)delete globalThis.Translator;else globalThis.Translator=originalTranslator;

if(failures.length){console.error('Prompt Studio local AI contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,presetAndCustomMerged:true,ruTranslationScopedToCustomText:true,responseConstraint:true,customRulesPreserved:true,deterministicFallback:true,aiAutoApply:false},null,2));
