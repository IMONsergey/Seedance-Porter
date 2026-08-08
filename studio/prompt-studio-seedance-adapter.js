import { verifyPromptStudioGenerationHandoff } from './prompt-studio-generation-handoff.js';

export const SEEDANCE2_MODELARK_PROFILE=Object.freeze({
  id:'byteplus-seedance-2.0',
  model:'dreamina-seedance-2-0-260128',
  endpoint:'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks',
  retrieveEndpoint:'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{task_id}',
  verifiedAt:'2026-08-08',
  apiReferenceUpdatedAt:'2026-06-29',
  capabilities:{images:9,videos:3,audios:3,duration:{min:4,max:15,auto:-1},ratios:['16:9','4:3','1:1','3:4','9:16','21:9','adaptive'],resolutions:['480p','720p','1080p','4k'],generateAudio:true,returnLastFrame:true,watermark:true,priority:{min:0,max:9}},
  unsupported:['seed','camera_fixed','frames','draft','service_tier']
});

export async function buildSeedance2ModelArkExport(handoff,options={}){
  const verification=await verifyPromptStudioGenerationHandoff(handoff);const errors=[],warnings=[];
  if(!verification.ok)errors.push(...verification.errors.map(error=>`handoff:${error}`));
  if(handoff?.quality?.status==='blocked')errors.push(...(handoff.quality.blockers||[]).map(item=>`handoff-blocker:${item}`));
  const unsupported=SEEDANCE2_MODELARK_PROFILE.unsupported.filter(key=>key in options);for(const key of unsupported)errors.push(`unsupported-option:${key}`);
  const model=String(options.model||SEEDANCE2_MODELARK_PROFILE.model);if(model!==SEEDANCE2_MODELARK_PROFILE.model)warnings.push(`unverified-model-id:${model}`);
  const ratio=normalizeRatio(options.ratio??handoff?.project?.aspect);if(!ratio)errors.push(`unsupported-ratio:${options.ratio??handoff?.project?.aspect??''}`);
  const resolution=String(options.resolution||'720p').toLowerCase();if(!SEEDANCE2_MODELARK_PROFILE.capabilities.resolutions.includes(resolution))errors.push(`unsupported-resolution:${resolution}`);
  const duration=options.durationAuto===true?-1:Number(options.duration??handoff?.project?.duration);if(!(duration===-1||(Number.isInteger(duration)&&duration>=4&&duration<=15)))errors.push(`unsupported-duration:${duration}`);
  const generateAudio=options.generateAudio!==false;const watermark=options.watermark===true;const returnLastFrame=options.returnLastFrame===true;
  const priority=options.priority==null?null:Number(options.priority);if(priority!=null&&(!Number.isInteger(priority)||priority<0||priority>9))errors.push(`unsupported-priority:${options.priority}`);
  const expires=options.executionExpiresAfter==null?null:Number(options.executionExpiresAfter);if(expires!=null&&(!Number.isInteger(expires)||expires<3600||expires>259200))errors.push(`unsupported-execution-expires-after:${options.executionExpiresAfter}`);
  const safetyIdentifier=String(options.safetyIdentifier||'');if(safetyIdentifier&&(!isAscii(safetyIdentifier)||safetyIdentifier.length>64))errors.push('invalid-safety-identifier');
  const callbackUrl=String(options.callbackUrl||'');if(callbackUrl&&!/^https:\/\//i.test(callbackUrl))errors.push('invalid-callback-url');

  const references=(handoff?.references||[]).filter(ref=>String(ref.token||''));const imageRefs=references.filter(ref=>ref.mediaType==='image'),videoRefs=references.filter(ref=>ref.mediaType==='video'),unknownRefs=references.filter(ref=>!['image','video'].includes(ref.mediaType));
  if(imageRefs.length>9)errors.push(`too-many-images:${imageRefs.length}`);if(videoRefs.length>3)errors.push(`too-many-videos:${videoRefs.length}`);if(unknownRefs.length)errors.push(`unsupported-reference-media:${unknownRefs.map(ref=>ref.token).join(',')}`);
  for(const ref of references){if(ref.availability!=='url'||!/^https?:\/\//i.test(String(ref.uri||'')))errors.push(`non-portable-reference:${ref.token}`);}
  validateModeReferences(handoff?.project?.mode,imageRefs,videoRefs,errors);

  const tokenMap=new Map();imageRefs.forEach((ref,index)=>tokenMap.set(String(ref.token).toLowerCase(),`[Image ${index+1}]`));videoRefs.forEach((ref,index)=>tokenMap.set(String(ref.token).toLowerCase(),`[Video ${index+1}]`));
  const prompt=replaceStudioReferenceTokens(String(handoff?.compiledPrompt||''),tokenMap);if(/@ref\d{2,}/i.test(prompt))errors.push('unmapped-studio-reference-token');
  const content=[{type:'text',text:prompt}];
  for(const ref of imageRefs)content.push({type:'image_url',image_url:{url:String(ref.uri)},role:imageRole(ref,handoff?.project?.mode)});
  for(const ref of videoRefs)content.push({type:'video_url',video_url:{url:String(ref.uri)},role:'reference_video'});
  const payload={model,content,resolution,ratio:ratio||'adaptive',duration,generate_audio:generateAudio,watermark,return_last_frame:returnLastFrame};
  if(priority!=null)payload.priority=priority;if(expires!=null)payload.execution_expires_after=expires;if(safetyIdentifier)payload.safety_identifier=safetyIdentifier;if(callbackUrl)payload.callback_url=callbackUrl;
  const cleanErrors=[...new Set(errors)],cleanWarnings=[...new Set(warnings)];const ready=cleanErrors.length===0;
  return{kind:'seedance-porter-provider-export',schemaVersion:1,provider:'byteplus-modelark',adapter:'seedance-2.0',verifiedAgainst:{profile:SEEDANCE2_MODELARK_PROFILE.id,verifiedAt:SEEDANCE2_MODELARK_PROFILE.verifiedAt,apiReferenceUpdatedAt:SEEDANCE2_MODELARK_PROFILE.apiReferenceUpdatedAt},endpoint:SEEDANCE2_MODELARK_PROFILE.endpoint,retrieveEndpoint:SEEDANCE2_MODELARK_PROFILE.retrieveEndpoint,ready,errors:cleanErrors,warnings:cleanWarnings,payload:ready?payload:null,previewPayload:payload,referenceTokenMap:Object.fromEntries(tokenMap),policy:{autoSubmit:false,apiKeyEmbedded:false,networkRequest:false,requiresExternalExecution:true}};
}

export function seedance2ExportToCurl(exportBundle){if(!exportBundle?.previewPayload)throw new Error('Seedance export bundle is required.');return`curl ${SEEDANCE2_MODELARK_PROFILE.endpoint} \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer $ARK_API_KEY" \\\n  -d '${escapeSingleQuotes(JSON.stringify(exportBundle.previewPayload,null,2))}'`;}
export function seedance2ExportToNodeFetch(exportBundle){if(!exportBundle?.previewPayload)throw new Error('Seedance export bundle is required.');return`const response = await fetch(${JSON.stringify(SEEDANCE2_MODELARK_PROFILE.endpoint)}, {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${process.env.ARK_API_KEY}\` },\n  body: JSON.stringify(${JSON.stringify(exportBundle.previewPayload,null,2)})\n});\nconst task = await response.json();\nconsole.log(task.id);`;}
export function seedance2AdapterSummary(bundle){return{ready:Boolean(bundle?.ready),errors:[...(bundle?.errors||[])],warnings:[...(bundle?.warnings||[])],model:bundle?.previewPayload?.model||'',ratio:bundle?.previewPayload?.ratio||'',resolution:bundle?.previewPayload?.resolution||'',duration:bundle?.previewPayload?.duration??null,images:(bundle?.previewPayload?.content||[]).filter(item=>item.type==='image_url').length,videos:(bundle?.previewPayload?.content||[]).filter(item=>item.type==='video_url').length,generateAudio:bundle?.previewPayload?.generate_audio??null,networkRequest:false,apiKeyEmbedded:false};}

function validateModeReferences(mode,images,videos,errors){const raw=String(mode||'');if(raw==='image-to-video'&&!images.length)errors.push('image-to-video-requires-image');if(raw==='first-last-frame'){if(!images.some(ref=>ref.role==='first-frame'))errors.push('first-last-requires-first-frame');if(!images.some(ref=>ref.role==='last-frame'))errors.push('first-last-requires-last-frame');}if(raw==='multi-reference'&&images.length+videos.length<1)errors.push('multi-reference-requires-media');}
function imageRole(ref,mode){if(ref.role==='first-frame')return'first_frame';if(ref.role==='last-frame')return'last_frame';if(mode==='image-to-video'&&ref.role==='other')return'first_frame';return'reference_image';}
function replaceStudioReferenceTokens(prompt,map){return String(prompt||'').replace(/@ref\d{2,}/gi,token=>map.get(token.toLowerCase())||token);}
function normalizeRatio(value){const raw=String(value||'').trim().toLowerCase();return SEEDANCE2_MODELARK_PROFILE.capabilities.ratios.find(item=>item.toLowerCase()===raw)||'';}
function isAscii(value){return/^[\x20-\x7e]+$/.test(value);}
function escapeSingleQuotes(value){return String(value).replace(/'/g,`'"'"'`);}
