#!/usr/bin/env node
import { createPromptStudioProject, refreshPromptStudioProject } from '../studio/prompt-studio-engine.js';
import { buildPromptStudioGenerationHandoff } from '../studio/prompt-studio-generation-handoff.js';
import { buildSeedance2ModelArkExport, seedance2AdapterSummary } from '../studio/prompt-studio-seedance-adapter.js';
import { effectiveReferenceMediaType, inferPromptStudioMediaTypeFromBlob, listPromptStudioAudioReferences, promptStudioReferenceMediaCounts, setPromptStudioReferenceMediaType } from '../studio/prompt-studio-reference-media.js';

const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};

function baseProject(id='audio-v6'){
  return createPromptStudioProject({
    id,title:'Audio reference contract',mode:'multi-reference',duration:6,aspect:'16:9',
    sections:[
      {id:'objective',content:'Create a controlled product film using @ref01 for exact geometry and @ref02 for the timing and sound-design cue.'},
      {id:'subject',content:'@ref01 controls exact product geometry.'},
      {id:'camera',content:'Use one slow push-in.'},
      {id:'action',content:'The product remains rigid while one material highlight crosses the surface and settles in sync with @ref02.'},
      {id:'continuity',content:'Keep geometry, material and lighting direction identical.'},
      {id:'constraints',content:'One product only. No topology drift or invented text.'}
    ],
    references:[
      {id:'image-ref',token:'@ref01',name:'Product',mediaType:'image',role:'geometry',locked:true,uri:'https://example.com/product.png'},
      {id:'audio-ref',token:'@ref02',name:'Rhythm cue',mediaType:'unknown',role:'other',locked:false,uri:'https://example.com/rhythm.mp3',notes:'Use only the rhythm, timing and sound-design cue.'}
    ]
  });
}

let project=setPromptStudioReferenceMediaType(baseProject(),'audio-ref','audio');
assert(project.references.find(ref=>ref.id==='audio-ref').mediaType==='unknown','Audio extension must keep core mediaType schema-compatible.');
assert(project.referenceMediaOverrides?.['audio-ref']==='audio','Audio media type must live in extension-safe override map.');
assert(effectiveReferenceMediaType(project,'audio-ref')==='audio','Effective media type must resolve audio override.');
assert(listPromptStudioAudioReferences(project).length===1,'Audio reference listing must resolve overrides.');
assert(promptStudioReferenceMediaCounts(project).audio===1&&promptStudioReferenceMediaCounts(project).image===1,'Reference counts must include effective audio.');

project=refreshPromptStudioProject(project,'2026-08-08T10:00:00.000Z');
assert(effectiveReferenceMediaType(project,'audio-ref')==='audio','Core refresh must preserve future-safe reference media overrides.');

const handoff=await buildPromptStudioGenerationHandoff(project,{now:'2026-08-08T10:01:00.000Z'});
const handoffAudio=handoff.references.find(ref=>ref.token==='@ref02');
assert(handoffAudio?.mediaType==='audio','Generation Handoff must expose effective audio media type.');
const bundle=await buildSeedance2ModelArkExport(handoff,{resolution:'1080p'});
assert(bundle.ready,'Portable image + audio multi-reference project must produce a ready Seedance export.');
assert(bundle.previewPayload.content.some(item=>item.type==='audio_url'&&item.role==='reference_audio'&&item.audio_url.url.endsWith('/rhythm.mp3')),'Seedance export must emit audio_url + reference_audio.');
assert(bundle.previewPayload.content[0].text.includes('[Audio 1]')&&!bundle.previewPayload.content[0].text.includes('@ref02'),'Seedance prompt must map @ref audio token to provider-native [Audio N].');
assert(bundle.previewPayload.content.find(item=>item.type==='image_url')?.role==='reference_image','Multimodal image must use reference_image rather than exact first_frame role.');
assert(seedance2AdapterSummary(bundle).audios===1,'Provider summary must count audio references.');

const audioOnly=createPromptStudioProject({id:'audio-only',mode:'multi-reference',duration:6,sections:[{id:'objective',content:'Use @ref01 as an audio cue.'},{id:'action',content:'Synchronize one visible action with @ref01.'}],references:[{id:'a1',token:'@ref01',mediaType:'unknown',role:'other',uri:'https://example.com/a.mp3'}]});
const audioOnlyTyped=setPromptStudioReferenceMediaType(audioOnly,'a1','audio');
const audioOnlyExport=await buildSeedance2ModelArkExport(await buildPromptStudioGenerationHandoff(audioOnlyTyped));
assert(!audioOnlyExport.ready&&audioOnlyExport.errors.includes('audio-reference-requires-image-or-video'),'Official Seedance rule must block audio-only multimodal input.');

let tooMany=baseProject('too-many-audio');
tooMany.references=tooMany.references.slice(0,1);
for(let index=1;index<=4;index++)tooMany.references.push({id:`a${index}`,token:`@ref${String(index+1).padStart(2,'0')}`,name:`Audio ${index}`,mediaType:'unknown',role:'other',locked:false,uri:`https://example.com/${index}.mp3`});
for(let index=1;index<=4;index++)tooMany=setPromptStudioReferenceMediaType(tooMany,`a${index}`,'audio');
tooMany.sections.find(section=>section.id==='objective').content='Use @ref01 for product geometry and @ref02 @ref03 @ref04 @ref05 as reference audio cues.';
tooMany.sections.find(section=>section.id==='action').content='Synchronize the visible product action with @ref02 while preserving @ref01 geometry.';
const tooManyExport=await buildSeedance2ModelArkExport(await buildPromptStudioGenerationHandoff(refreshPromptStudioProject(tooMany)));
assert(!tooManyExport.ready&&tooManyExport.errors.includes('too-many-audios:4'),'Seedance adapter must enforce the official maximum of three audio references.');

let imageMode=baseProject('image-audio-mix');imageMode.mode='image-to-video';
const imageModeExport=await buildSeedance2ModelArkExport(await buildPromptStudioGenerationHandoff(refreshPromptStudioProject(imageMode)));
assert(!imageModeExport.ready&&imageModeExport.errors.includes('image-to-video-cannot-mix-reference-video-or-audio'),'Exact first-frame image-to-video mode must not mix audio references.');

let firstLast=createPromptStudioProject({id:'first-last-audio',mode:'first-last-frame',duration:6,sections:[{id:'objective',content:'Transition from @ref01 to @ref02 while using @ref03 only as a timing cue.'},{id:'action',content:'Execute one coherent transition and settle on @ref02.'}],references:[{id:'first',token:'@ref01',mediaType:'image',role:'first-frame',locked:true,uri:'https://example.com/first.png'},{id:'last',token:'@ref02',mediaType:'image',role:'last-frame',locked:true,uri:'https://example.com/last.png'},{id:'audio',token:'@ref03',mediaType:'unknown',role:'other',uri:'https://example.com/cue.wav'}]});firstLast=setPromptStudioReferenceMediaType(firstLast,'audio','audio');
const firstLastExport=await buildSeedance2ModelArkExport(await buildPromptStudioGenerationHandoff(firstLast));
assert(!firstLastExport.ready&&firstLastExport.errors.includes('first-last-frame-cannot-mix-multimodal-references'),'Exact first/last frame mode must not mix audio/video reference media.');

let localAudio=baseProject('local-audio');localAudio.references.find(ref=>ref.id==='audio-ref').uri='';localAudio.references.find(ref=>ref.id==='audio-ref').localAssetKey='local-audio-asset';localAudio=setPromptStudioReferenceMediaType(localAudio,'audio-ref','audio');
const localExport=await buildSeedance2ModelArkExport(await buildPromptStudioGenerationHandoff(localAudio));
assert(!localExport.ready&&localExport.errors.includes('non-portable-reference:@ref02'),'Browser-local audio must remain non-portable for provider execution export.');

const switched=setPromptStudioReferenceMediaType(project,'audio-ref','video');
assert(effectiveReferenceMediaType(switched,'audio-ref')==='video'&&!switched.referenceMediaOverrides?.['audio-ref'],'Switching away from audio must remove the extension override.');
assert(inferPromptStudioMediaTypeFromBlob(new Blob(['x'],{type:'audio/wav'}))==='audio','Audio MIME must infer audio media type.');
assert(inferPromptStudioMediaTypeFromBlob({type:'',name:'beat.MP3'})==='audio','MP3 extension must infer audio media type when MIME is absent.');

if(failures.length){console.error('Prompt Studio v6 audio contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,effectiveAudio:true,extensionSafe:true,handoffAudio:true,providerAudio:true,audioOnlyBlocked:true,audioLimit:3,firstFrameMixBlocked:true,localAudioPortable:false},null,2));
