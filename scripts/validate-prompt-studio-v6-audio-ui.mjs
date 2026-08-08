#!/usr/bin/env node
import { JSDOM } from 'jsdom';
import { createPromptStudioProject, refreshPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { effectiveReferenceMediaType } from '../studio/prompt-studio-reference-media.js';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
const dom=new JSDOM(`<!doctype html><html><body><section id="promptStudioView"><article class="studio-reference-card" data-ref-id="ref-a"><div class="studio-ref-token"><strong>@ref01</strong></div><select data-ref-field="mediaType"><option value="image">image</option><option value="video">video</option><option value="unknown" selected>unknown</option></select><input type="file" data-ref-file accept="image/*,video/*"><div class="studio-ref-asset">Local: cue.mp3</div></article></section><section id="studioV5Dock"><div class="v5-provider-head"></div><div class="v5-capabilities"><span>≤9 images</span></div><footer class="studio-v5-footer"><span></span></footer></section></body></html>`,{url:'https://example.test/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.MutationObserver=dom.window.MutationObserver;globalThis.CustomEvent=dom.window.CustomEvent;globalThis.Event=dom.window.Event;

let project=createPromptStudioProject({id:'audio-ui',mode:'multi-reference',sections:[{id:'objective',content:'Use @ref01 as an audio timing cue.'},{id:'action',content:'Synchronize one visible state change with @ref01.'}],references:[{id:'ref-a',token:'@ref01',name:'Cue',mediaType:'unknown',role:'other',uri:'https://example.com/cue.mp3'}]});
window.porterPromptStudio={getProject:()=>JSON.parse(JSON.stringify(project)),replaceProject:(next)=>{project=refreshPromptStudioProject(next);window.dispatchEvent(new CustomEvent('porter-prompt-studio-project-replaced',{detail:{projectId:project.id}}));return project;}};
await import(`../studio/prompt-studio-v6-audio-ui.js?test=${Date.now()}`);await settle();

let select=document.querySelector('select[data-ref-field="mediaType"]');
assert(Boolean(select.querySelector('option[value="audio"]')),'V6 must decorate core media selector with audio option.');
assert(document.querySelector('input[data-ref-file]').accept.includes('audio/*'),'V6 must extend local file picker to audio files.');
assert(Boolean(document.querySelector('[data-v6-audio-capability]')),'V6 must surface official audio capability in Seedance panel.');

select.value='audio';select.dispatchEvent(new Event('change',{bubbles:true}));await settle();
assert(project.references[0].mediaType==='unknown','Audio selection must keep core reference media type schema-compatible.');
assert(project.referenceMediaOverrides?.['ref-a']==='audio','Audio selection must write extension-safe media override.');
assert(effectiveReferenceMediaType(project,'ref-a')==='audio','Audio selection must resolve to effective audio media type.');
assert(document.querySelector('select[data-ref-field="mediaType"]').value==='audio','Decorated media selector must remain on audio after project replacement.');
assert(document.querySelector('.studio-reference-card').dataset.effectiveMediaType==='audio','Audio card must expose effective media type state.');
assert(document.querySelector('[data-v6-audio-count]')?.textContent.includes('1 audio ref'),'Seedance panel must surface current audio reference count.');

select=document.querySelector('select[data-ref-field="mediaType"]');select.value='image';select.dispatchEvent(new Event('change',{bubbles:true}));await settle();
assert(project.references[0].mediaType==='image','Switching an audio override to image must update core media type.');
assert(!project.referenceMediaOverrides?.['ref-a'],'Switching away from audio must remove extension override.');
assert(effectiveReferenceMediaType(project,'ref-a')==='image','Effective media type must return to image.');
assert(!document.querySelector('[data-v6-audio-count]'),'Audio count badge must disappear when no audio references remain.');

dom.window.close();
if(failures.length){console.error('Prompt Studio v6 audio UI contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,audioOption:true,captureMutation:true,extensionSafe:true,filePicker:true,providerBadge:true,switchBack:true},null,2));

async function settle(){await new Promise(resolve=>setTimeout(resolve,5));await Promise.resolve();}
