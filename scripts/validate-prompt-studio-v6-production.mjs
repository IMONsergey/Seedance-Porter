#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { CASE_INTELLIGENCE } from '../studio/case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from '../studio/multi-source-index.js';
import { PROMPTS } from '../studio/library-data.js';
import { workflowPublishesStudioAsset, workflowRunsValidator } from './pages-publish-policy.mjs';

const [sidebar,bootstrap,media,ui,preview,handoff,adapter,schema,pages,ci]=await Promise.all([
  readFile('studio/sidebar.js','utf8'),readFile('studio/prompt-studio-v6-bootstrap.js','utf8'),readFile('studio/prompt-studio-reference-media.js','utf8'),readFile('studio/prompt-studio-v6-audio-ui.js','utf8'),readFile('studio/prompt-studio-reference-preview.js','utf8'),readFile('studio/prompt-studio-generation-handoff.js','utf8'),readFile('studio/prompt-studio-seedance-adapter.js','utf8'),readFile('schemas/prompt-studio-seedance-export.schema.json','utf8'),readFile('.github/workflows/pages.yml','utf8'),readFile('.github/workflows/prompt-studio-v6-ci.yml','utf8')
]);
const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
const assets=['prompt-studio-reference-media.js','prompt-studio-v6-bootstrap.js','prompt-studio-v6-audio-ui.js','prompt-studio-v6.css'];
for(const asset of assets)assert(workflowPublishesStudioAsset(pages,asset),`Pages must publish ${asset}.`);
for(const validator of ['validate-prompt-studio-v6-audio.mjs','validate-prompt-studio-v6-audio-ui.mjs','validate-prompt-studio-v6-production.mjs'])assert(workflowRunsValidator(pages,validator),`Pages must run ${validator}.`);
assert(sidebar.includes("import './prompt-studio-v6-bootstrap.js';"),'Shell must mount v6.');
assert(sidebar.indexOf("import './prompt-studio-v5-bootstrap.js';")<sidebar.indexOf("import './prompt-studio-v6-bootstrap.js';"),'V6 must mount after v5.');
assert(sidebar.indexOf("import './prompt-studio-v6-bootstrap.js';")<sidebar.indexOf("import './command-palette-bootstrap.js';"),'V6 must mount before Cmd-K.');
assert(bootstrap.includes("link.href='./prompt-studio-v6.css'")&&bootstrap.includes("await import('./prompt-studio-v6-audio-ui.js')"),'V6 bootstrap must load CSS and audio UI layer.');
assert(media.includes("referenceMediaOverrides")&&media.includes("ref.mediaType='unknown'")&&media.includes("overrides[referenceId]='audio'"),'Audio must use extension-safe top-level override while preserving core reference schema.');
assert(media.includes("type.startsWith('audio/')")&&media.includes("/\\.(wav|mp3)"),'Audio media helper must infer official WAV/MP3 surface.');
assert(ui.includes("addEventListener('change'")&&ui.includes('},true);'),'Audio UI must intercept media changes in capture phase before core image/video handler.');
assert(ui.includes('window.porterPromptStudio?.replaceProject')&&!ui.includes('state.project'),'Audio UI must mutate only through public Prompt Studio API.');
assert(ui.includes("file.accept='image/*,video/*,audio/*,.wav,.mp3'")&&ui.includes("inferPromptStudioMediaTypeFromBlob(fileInput.files?.[0])==='audio'"),'Audio UI must support local WAV/MP3/audio input and intercept it safely.');
assert(preview.includes("document.createElement('audio')")&&preview.includes('effectiveReferenceMediaType'),'Reference preview must render effective audio via native audio controls.');
assert(handoff.includes('effectiveReferenceMediaType(project,ref)')&&handoff.includes('audioReferences:'),'Generation Handoff must carry effective audio media types and audio counts.');
assert(adapter.includes("audioRefs=references.filter(ref=>ref.mediaType==='audio')")&&adapter.includes('too-many-audios:')&&adapter.includes('audio-reference-requires-image-or-video'),'Seedance adapter must enforce 0–3 audio and the no-audio-only rule.');
assert(adapter.includes('`[Audio ${index+1}]`')&&adapter.includes("type:'audio_url'")&&adapter.includes("role:'reference_audio'"),'Seedance adapter must map Studio audio references to [Audio N] + audio_url/reference_audio.');
assert(adapter.includes('image-to-video-cannot-mix-reference-video-or-audio')&&adapter.includes('first-last-frame-cannot-mix-multimodal-references'),'Exact first-frame modes must remain mutually exclusive with multimodal video/audio references.');
assert(adapter.includes("apiReferenceUpdatedAt:'2026-08-07'"),'Seedance provider profile must record the current official API reference update date.');
assert(schema.includes('"maxItems":16')&&schema.includes('"audio_url"')&&schema.includes('"reference_audio"'),'Provider export schema must model text + 9 images + 3 videos + 3 audios.');
assert(ci.includes("node: [20,22,24]")&&ci.includes('validate-prompt-studio-v6-audio.mjs')&&ci.includes('validate-prompt-studio-v6-audio-ui.mjs')&&ci.includes('validate-prompt-studio-v6-production.mjs'),'V6 CI must run full audio contracts on Node 20/22/24.');
assert(ci.includes("'studio/prompt-studio-*.js'")&&ci.includes("'schemas/prompt-studio*.json'")&&ci.includes("'scripts/validate-prompt-studio*.mjs'"),'V6 CI must rerun on upstream Prompt Studio/schema/test changes.');
const curated=[...CASE_INTELLIGENCE,...MULTI_SOURCE_CASES];assert(curated.length===100&&new Set(curated.map(item=>item.id)).size===100,`V6 must preserve exact 100 curated cases; got ${curated.length}.`);assert(PROMPTS.length===192,`V6 must preserve 192 Porter Originals; got ${PROMPTS.length}.`);
if(failures.length){console.error('Prompt Studio v6 production contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,curatedCases:curated.length,porterOriginals:PROMPTS.length,extensionSafeAudio:true,publicApiOnly:true,nativeAudioPreview:true,providerAudioLimit:3,audioOnlyBlocked:true,exactFrameMixBlocked:true,schemaContentMax:16,nodeMatrix:[20,22,24]},null,2));
