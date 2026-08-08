#!/usr/bin/env node
import { JSDOM } from 'jsdom';
import { createPromptStudioProject, refreshPromptStudioProject } from '../studio/prompt-studio-engine.js';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
const dom=new JSDOM(`<!doctype html><html><head></head><body><section id="promptStudioView"><section id="studioV5Dock"><button data-v5-tab="seedance">Seedance</button></section><section id="storyboard"><input data-story-field="frameIntent"></section></section></body></html>`,{url:'https://example.test/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.MutationObserver=dom.window.MutationObserver;globalThis.CustomEvent=dom.window.CustomEvent;globalThis.Event=dom.window.Event;globalThis.navigator=dom.window.navigator;
let fetchCalls=0;globalThis.fetch=async()=>{fetchCalls++;throw new Error('V7 browser import must not fetch.');};
let project=createPromptStudioProject({id:'v7-ui-project',title:'V7 UI',mode:'text-to-video',duration:6,sections:[{id:'objective',content:'Create one controlled generated continuation.'},{id:'action',content:'Perform one visible action and settle.'}]});
let replaceCalls=0;const replacementReasons=[];
window.porterPromptStudio={getProject:()=>JSON.parse(JSON.stringify(project)),replaceProject:(next,options={})=>{replaceCalls++;replacementReasons.push(options.reason||'');project=refreshPromptStudioProject(next,new Date(Date.parse(project.updatedAt)+1000).toISOString());window.dispatchEvent(new CustomEvent('porter-prompt-studio-project-replaced',{detail:{projectId:project.id}}));return JSON.parse(JSON.stringify(project));}};
await import(`../studio/prompt-studio-v7-workflow-guard.js?test=${Date.now()}`);
await import(`../studio/prompt-studio-v7-results-ui.js?test=${Date.now()}`);
await settle();

assert(Boolean(document.querySelector('#studioV7ResultsDock')),'V7 results dock must mount inside Prompt Studio.');
assert(!document.querySelector('#studioV7ResultsDock video')&&!document.querySelector('#studioV7ResultsDock img'),'V7 dock must not auto-load generated video/image media.');
assert(fetchCalls===0,'Mounting V7 must execute zero network calls.');

await importArtifact(makeResult({projectId:project.id,projectUpdatedAt:project.updatedAt}),'success.result.json');
assert(replaceCalls===0,'Import must stage locally without mutating the project.');
assert(document.querySelector('#studioV7ResultsDock')?.textContent.includes('LOCAL · NOT APPLIED'),'Valid result must enter explicit staged state.');
assert(document.querySelector('#studioV7ResultsDock')?.textContent.includes('exact-project'),'Fresh linked result must display exact-project lineage.');
assert(fetchCalls===0,'Staging a result must execute zero network calls.');

document.querySelector('[data-v7-action="save-stage"]')?.click();await settle();
assert(replaceCalls===1&&replacementReasons[0]==='save generation result record','Save record must use exactly one public revisioned project mutation.');
assert(Array.isArray(project.generationResults)&&project.generationResults.length===1,'Saved record must persist in extension-safe project history.');

await importArtifact(makeResult({projectId:project.id,projectUpdatedAt:project.updatedAt}),'blocked.result.json');
const seedanceTab=document.querySelector('[data-v5-tab="seedance"]');seedanceTab.disabled=true;
const beforeStoryboardBlock=replaceCalls;document.querySelector('[data-v7-action="save-stage"]')?.click();await settle();
assert(replaceCalls===beforeStoryboardBlock,'Foreign Storyboard staged state must block V7 Save before UI mutation handler runs.');
assert(document.querySelector('#studioV7ResultsDock .v7-message')?.textContent.includes('Storyboard'),'Storyboard block must be visible in V7 UI.');
seedanceTab.disabled=false;

const storyField=document.querySelector('[data-story-field]');storyField.disabled=true;
const beforeRepairBlock=replaceCalls;document.querySelector('[data-v7-action="attach-stage-video"]')?.click();await settle();
assert(replaceCalls===beforeRepairBlock,'Staged Repair must block V7 Attach.');
assert(document.querySelector('#studioV7ResultsDock .v7-message')?.textContent.includes('Repair'),'Repair block must be visible in V7 UI.');
storyField.disabled=false;

document.querySelector('[data-v7-action="attach-stage-video"]')?.click();await settle();
assert(replaceCalls===beforeRepairBlock+1,'Clean-state explicit video attach must create one public project revision.');
const generatedVideo=project.references.find(ref=>ref.uri==='https://cdn.example.com/v7-ui.mp4');
assert(generatedVideo?.mediaType==='video'&&generatedVideo?.role==='motion'&&/^@ref\d{2,}$/.test(generatedVideo?.token||''),'Explicit video attach must create a stable generated video reference.');
assert(project.generationOutputProvenance?.[generatedVideo.id]?.taskId==='cgt-v7-ui','Generated reference must carry task provenance in extension state.');

await importArtifact(makeResult({projectId:project.id,projectUpdatedAt:project.updatedAt,taskId:'cgt-v7-drift'}),'drift.result.json');
const externalChange=refreshPromptStudioProject(project,new Date(Date.parse(project.updatedAt)+5000).toISOString());project=externalChange;window.dispatchEvent(new CustomEvent('porter-prompt-studio-project-replaced',{detail:{projectId:project.id}}));await settle();
assert(document.querySelector('#studioV7ResultsDock')?.textContent.includes('Staged generation manifest was invalidated'),'Any project mutation after import must invalidate staged generation manifest.');
assert(!document.querySelector('[data-v7-action="save-stage"]'),'Invalidated stage must no longer expose Apply controls.');

const credential=makeResult({projectId:project.id,projectUpdatedAt:project.updatedAt,taskId:'cgt-v7-secret'});credential.debug={Authorization:'Bearer should-not-enter-studio'};const beforeCredential=replaceCalls;await importArtifact(credential,'unsafe.result.json');
assert(replaceCalls===beforeCredential,'Credential-bearing manifest must be rejected without project mutation.');
assert(document.querySelector('#studioV7ResultsDock .v7-message')?.textContent.includes('credential-like-field-present'),'Credential-bearing rejection must be visible.');
assert(fetchCalls===0,'V7 import/save/attach workflow must execute zero browser fetch calls.');
assert(!document.querySelector('#studioV7ResultsDock video')&&!document.querySelector('#studioV7ResultsDock img'),'V7 must never embed remote generated media automatically.');

dom.window.close();
if(failures.length){console.error('Prompt Studio v7 UI contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,stagedImport:true,noMutationOnImport:true,exactLineage:true,storyboardGuard:true,repairGuard:true,revisionedAttach:true,projectDriftInvalidation:true,credentialImportBlocked:true,browserFetchCalls:fetchCalls,autoMediaEmbed:false},null,2));

async function importArtifact(value,name){const input=document.querySelector('#studioV7ImportInput');const body=JSON.stringify(value);const file={name,size:Buffer.byteLength(body),text:async()=>body};Object.defineProperty(input,'files',{configurable:true,value:[file]});input.dispatchEvent(new Event('change',{bubbles:true}));await settle();}
function makeResult({projectId,projectUpdatedAt,taskId='cgt-v7-ui'}){return{kind:'seedance-porter-generation-result',schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',taskId,status:'succeeded',succeeded:true,terminal:true,exportHash:'b'.repeat(64),studioLink:{projectId,projectUpdatedAt,handoffHash:'c'.repeat(64)},output:{videoUrl:'https://cdn.example.com/v7-ui.mp4',lastFrameUrl:'https://cdn.example.com/v7-ui-last.png'},usage:{completionTokens:100,totalTokens:100},error:null,providerMeta:{model:'dreamina-seedance-2-0-260128',resolution:'1080p',ratio:'16:9',duration:6},createdAt:'2026-08-08T12:00:00.000Z',completedAt:'2026-08-08T12:00:30.000Z',recordedAt:'2026-08-08T12:00:31.000Z',policy:{secretPersisted:false,externalExecution:true}};}
async function settle(){await new Promise(resolve=>setTimeout(resolve,8));await Promise.resolve();}
