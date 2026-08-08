export const CURATION_STAGING_KIND = 'seedance-porter-curation-staging-pack';

export function buildCurationStagingPack(input) {
  const draft = normalizeDraft(input.curationDraft || {});
  const rotation = input.rotationPlan || {};
  const current = Array.isArray(input.currentCases) ? input.currentCases : [];
  const locations = input.caseLocations instanceof Map ? input.caseLocations : new Map(Object.entries(input.caseLocations || {}));
  const errors=[];
  const warnings=[];

  if (current.length !== 100) errors.push(`Staging requires exactly 100 current curated cases; received ${current.length}.`);
  if (!draft.candidateId) errors.push('Curation Draft candidateId is required.');
  if (!draft.title) errors.push('Curation Draft title is required.');
  if (current.some(item => item.id === draft.candidateId)) errors.push('Incoming candidate is already present in current curated runtime.');
  if (rotation.kind !== 'seedance-porter-curated-rotation-plan') errors.push('Rotation Plan kind is invalid.');
  if (rotation.valid === false || rotation.decision?.status === 'blocked') errors.push('Rotation Plan is blocked/invalid.');
  if (rotation.incoming?.candidateId && rotation.incoming.candidateId !== draft.candidateId) errors.push('Rotation Plan incoming candidate does not match Curation Draft.');

  const removeCaseId = String(rotation.recommendedReplacement?.removeCaseId || rotation.decision?.removeCaseId || '').trim();
  const removeCase = current.find(item => item.id === removeCaseId) || null;
  if (!removeCaseId) warnings.push('Rotation Plan has no proposed removal. Staging preview can still be generated, but implementation is not ready.');
  if (removeCaseId && !removeCase) errors.push(`Proposed removal ${removeCaseId} does not exist in current curated runtime.`);
  const removeLocation = removeCaseId ? locations.get(removeCaseId) || null : null;
  if (removeCaseId && !removeLocation) errors.push(`Repository data location is unknown for proposed removal ${removeCaseId}.`);

  const rotationRecommended = rotation.decision?.status === 'consider-swap';
  const editorialReview = rotation.decision?.status === 'editorial-review';
  const implementationReady = errors.length===0 && rotationRecommended && Boolean(removeCase) && Boolean(removeLocation);
  if (editorialReview) warnings.push('Rotation Plan is editorial-review, not consider-swap. Human comparison is useful, but implementation is not marked ready.');
  if (rotation.decision?.status === 'hold') warnings.push('Rotation Plan says hold. Staging is preview-only and must not be implemented as a swap.');

  const beforeIds = current.map(item=>item.id);
  const projectedIds = removeCaseId ? beforeIds.filter(id=>id!==removeCaseId).concat(draft.candidateId) : beforeIds.slice();
  const uniqueProjected = new Set(projectedIds);
  if (removeCaseId && projectedIds.length!==100) errors.push(`Projected exact-100 set would contain ${projectedIds.length} cases.`);
  if (removeCaseId && uniqueProjected.size!==100) errors.push(`Projected exact-100 set would contain ${uniqueProjected.size} unique IDs.`);

  const incomingCollections = draft.collections;
  const removedCollections = uniqueStrings(removeCase?.collections || removeCase?.intelligence?.collections || []);
  const collectionDelta = calculateCollectionDelta(current, incomingCollections, removedCollections);

  const pack={
    schemaVersion:1,
    kind:CURATION_STAGING_KIND,
    generatedAt:new Date(input.now||Date.now()).toISOString(),
    valid:errors.length===0,
    implementationReady,
    approvalRequired:true,
    autoApply:false,
    autoPublish:false,
    errors,
    warnings,
    invariant:{before:current.length,after:removeCaseId?projectedIds.length:current.length,uniqueAfter:removeCaseId?uniqueProjected.size:new Set(beforeIds).size,target:100},
    incoming:draft,
    proposedRemoval:removeCase?{
      id:removeCase.id,
      title:String(removeCase.title||removeCase.id),
      author:String(removeCase.author||''),
      sourcePlatform:String(removeCase.sourcePlatform||''),
      sourceUrl:String(removeCase.sourceUrl||''),
      designScore:numberOr(removeCase.designScore,0),
      evidenceStatus:String(removeCase.evidenceStatus||removeCase.intelligence?.reviewStatus||removeCase.reviewStatus||'unknown'),
      collections:removedCollections,
      repositoryLocation:removeLocation
    }:null,
    rotation:{
      decision:rotation.decision||null,
      confidence:String(rotation.confidence||''),
      incomingStrategicGain:numberOr(rotation.incomingStrategicGain?.score,0),
      replacementNet:numberOr(rotation.recommendedReplacement?.netStrategicValue,0),
      removalPenalty:numberOr(rotation.recommendedReplacement?.removalPenalty?.score,0),
      redundancyBonus:numberOr(rotation.recommendedReplacement?.redundancyBonus?.score,0),
      projectedCollections:rotation.recommendedReplacement?.projectedCollections||[]
    },
    collectionDelta,
    implementationManifest:removeCase?{
      remove:{caseId:removeCase.id,file:removeLocation.file,dataFamily:removeLocation.dataFamily,indexHint:removeLocation.indexHint},
      add:{candidateId:draft.candidateId,targetDataFamily:chooseTargetDataFamily(draft),suggestedFile:suggestedIncomingFile(draft)},
      preconditions:[
        'Current curated runtime resolves to exactly 100 unique case IDs.',
        `Existing removal case ${removeCase.id} is still present in ${removeLocation.file}.`,
        `Incoming candidate ${draft.candidateId} is not already present in curated runtime.`,
        'Incoming Curation Draft, source attribution, rights/risk review and independent Porter adaptation are human-approved.',
        'Rotation recommendation has been reviewed by an editor; no Collection/source/creator warning is being ignored silently.'
      ],
      manualSteps:[
        `Remove exactly one curated record: ${removeCase.id} from ${removeLocation.file}.`,
        `Add exactly one curated record for ${draft.candidateId} to the chosen curated data file.`,
        'Add/update RU/EN localization and Case Intelligence metadata required by the curated runtime.',
        'Run all repository CI contracts, especially exact-100 rendered DOM validation.',
        'Review the live card/drawer/source media after deployment before considering the rotation complete.'
      ],
      postconditions:[
        'Unified curated runtime contains exactly 100 unique case IDs.',
        `Removed case ${removeCase.id} is absent from the runtime.`,
        `Incoming case ${draft.candidateId} is present exactly once.`,
        'No Research risk/evidence/editorial state was silently promoted by the implementation.',
        'All source attribution links and Porter adaptation remain independent and usable.'
      ]
    }:null,
    humanApproval:{required:true,approved:false,approvedBy:null,approvedAt:null},
    boundary:'This staging pack contains comparison and implementation instructions only. It never edits curated source files, never changes approval state, and never publishes a case.'
  };

  return pack;
}

export function renderCurationStagingHtml(pack){
  const e=escapeHtml;
  const incoming=pack.incoming||{};
  const removed=pack.proposedRemoval||{};
  const badge=pack.implementationReady?'READY FOR HUMAN IMPLEMENTATION':pack.valid?'PREVIEW / HUMAN REVIEW':'BLOCKED';
  const deltaRows=(pack.collectionDelta||[]).map(item=>`<tr><td>${e(item.collection)}</td><td>${item.before}</td><td>${item.after}</td><td class="delta ${item.delta>0?'plus':item.delta<0?'minus':''}">${item.delta>0?'+':''}${item.delta}</td></tr>`).join('');
  const warnings=(pack.warnings||[]).map(item=>`<li>${e(item)}</li>`).join('');
  const errors=(pack.errors||[]).map(item=>`<li>${e(item)}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seedance Porter — Curation Staging</title><style>${stagingCss()}</style></head><body><main><header><div><span>SEEDANCE PORTER · CURATION STAGING</span><h1>${e(incoming.title||incoming.candidateId||'Incoming case')}</h1><p>Exact-100 side-by-side editorial preview. This file cannot modify the curated library.</p></div><strong data-state="${e(pack.implementationReady?'ready':pack.valid?'review':'blocked')}">${e(badge)}</strong></header>${errors?`<section class="notice error"><h2>Errors</h2><ul>${errors}</ul></section>`:''}${warnings?`<section class="notice warn"><h2>Warnings</h2><ul>${warnings}</ul></section>`:''}<section class="compare"><article><span>INCOMING</span><h2>${e(incoming.title||'')}</h2><p>${e(incoming.author||'')}</p><dl><dt>Candidate</dt><dd>${e(incoming.candidateId||'')}</dd><dt>Source</dt><dd>${e(incoming.sourcePlatform||'')} ${e(incoming.sourceUrl||'')}</dd><dt>Evidence</dt><dd>${e(incoming.deepReviewed?'deep-reviewed':'not deep-reviewed')}</dd><dt>Design</dt><dd>${incoming.designScore||0}</dd><dt>Collections</dt><dd>${e((incoming.collections||[]).join(' · '))}</dd></dl></article><article><span>PROPOSED REMOVAL</span><h2>${e(removed.title||'No removal proposed')}</h2><p>${e(removed.author||'')}</p><dl><dt>Case ID</dt><dd>${e(removed.id||'—')}</dd><dt>Source</dt><dd>${e(removed.sourcePlatform||'')} ${e(removed.sourceUrl||'')}</dd><dt>Evidence</dt><dd>${e(removed.evidenceStatus||'—')}</dd><dt>Design</dt><dd>${removed.designScore||0}</dd><dt>Repo</dt><dd>${e(removed.repositoryLocation?.file||'—')}</dd><dt>Collections</dt><dd>${e((removed.collections||[]).join(' · '))}</dd></dl></article></section><section class="metrics"><article><span>Rotation decision</span><strong>${e(pack.rotation?.decision?.status||'—')}</strong></article><article><span>Confidence</span><strong>${e(pack.rotation?.confidence||'—')}</strong></article><article><span>Incoming gain</span><strong>${pack.rotation?.incomingStrategicGain||0}</strong></article><article><span>Net strategic value</span><strong>${pack.rotation?.replacementNet||0}</strong></article></section><section><h2>Projected Collection delta</h2><table><thead><tr><th>Collection</th><th>Before</th><th>After</th><th>Δ</th></tr></thead><tbody>${deltaRows}</tbody></table></section>${pack.implementationManifest?`<section><h2>Manual implementation manifest</h2><div class="manifest"><div><span>REMOVE</span><strong>${e(pack.implementationManifest.remove.caseId)}</strong><small>${e(pack.implementationManifest.remove.file)}</small></div><div><span>ADD</span><strong>${e(pack.implementationManifest.add.candidateId)}</strong><small>${e(pack.implementationManifest.add.suggestedFile)}</small></div></div><h3>Preconditions</h3><ol>${pack.implementationManifest.preconditions.map(item=>`<li>${e(item)}</li>`).join('')}</ol><h3>Manual steps</h3><ol>${pack.implementationManifest.manualSteps.map(item=>`<li>${e(item)}</li>`).join('')}</ol><h3>Postconditions</h3><ol>${pack.implementationManifest.postconditions.map(item=>`<li>${e(item)}</li>`).join('')}</ol></section>`:''}<footer><strong>HUMAN APPROVAL REQUIRED</strong><p>${e(pack.boundary)}</p></footer></main></body></html>`;
}

export function indexCuratedCaseLocations(fileSources){
  const map=new Map();
  for(const source of fileSources||[]){
    const text=String(source.content||'');
    const ids=[...text.matchAll(/\bid\s*:\s*['"]([^'"]+)['"]/g)].map(match=>match[1]);
    ids.forEach((id,index)=>{
      const record={file:String(source.file||''),dataFamily:String(source.dataFamily||inferFamily(source.file)),indexHint:index};
      if(!map.has(id))map.set(id,record);
      else{
        const previous=map.get(id);
        map.set(id,{...previous,duplicateLocations:[...(previous.duplicateLocations||[]),record]});
      }
    });
  }
  return map;
}

function normalizeDraft(raw){
  const caseData=raw.case||raw.curatedCase||raw.draft||{};
  const source=raw.source||raw.provenance||{};
  const candidateId=first(raw.candidateId,caseData.id);
  return {
    candidateId:String(candidateId||''),
    title:String(first(caseData.title,raw.title,candidateId)||''),
    author:String(first(caseData.author,source.author,raw.author)||''),
    sourcePlatform:String(first(caseData.sourcePlatform,source.platform,raw.sourcePlatform,inferPlatform(first(source.sourceUrl,source.url,caseData.sourceUrl,raw.sourceUrl)))||''),
    sourceUrl:String(first(source.sourceUrl,source.url,caseData.sourceUrl,raw.sourceUrl)||''),
    collections:uniqueStrings(firstArray(caseData.collections,raw.collections,raw.intelligence?.collections)),
    designScore:numberOr(first(caseData.designScore,raw.designScore),0),
    deepReviewed:String(first(raw.reviewStatus,raw.intelligence?.reviewStatus,raw.evidence?.reviewStatus)||'').toLowerCase()==='deep-reviewed'||raw.evidenceAttestation?.completeVideoWatched===true,
    porterAdaptation:String(first(caseData.porterAdaptation,raw.porterAdaptation,raw.porterPrompt)||''),
    readinessScore:numberOr(first(raw.readiness?.score,raw.readinessScore),0),
    rawKind:String(raw.kind||'')
  };
}

function calculateCollectionDelta(current,incoming,removed){
  const names=new Set([...current.flatMap(item=>uniqueStrings(item.collections||item.intelligence?.collections||[])),...incoming,...removed]);
  return [...names].map(name=>{
    const before=current.filter(item=>uniqueStrings(item.collections||item.intelligence?.collections||[]).includes(name)).length;
    const after=before-(removed.includes(name)?1:0)+(incoming.includes(name)?1:0);
    return {collection:name,before,after,delta:after-before};
  }).filter(item=>item.delta!==0).sort((a,b)=>b.delta-a.delta||a.collection.localeCompare(b.collection));
}
function chooseTargetDataFamily(draft){return draft.sourcePlatform&&draft.sourcePlatform!=='x'?'multi-source':'industry-digest';}
function suggestedIncomingFile(draft){return chooseTargetDataFamily(draft)==='multi-source'?'studio/multi-source-cases-next.js':'studio/digest-data.js';}
function inferFamily(file){return String(file||'').includes('multi-source')?'multi-source':'industry-digest';}
function inferPlatform(url){try{const host=new URL(url).hostname.toLowerCase();if(host.includes('x.com')||host.includes('twitter.com'))return'x';if(host.includes('youtube'))return'youtube';if(host.includes('vimeo'))return'vimeo';if(host.includes('github'))return'github';return host.replace(/^www\./,'');}catch{return'';}}
function first(...values){return values.find(value=>value!==undefined&&value!==null&&String(value).trim()!=='');}
function firstArray(...values){return values.find(value=>Array.isArray(value))||[];}
function uniqueStrings(values){return[...new Set((Array.isArray(values)?values:[]).map(value=>String(value||'').trim()).filter(Boolean))];}
function numberOr(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function stagingCss(){return`*{box-sizing:border-box}body{margin:0;background:#f4f4f4;color:#151515;font:14px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}main{width:min(1180px,calc(100% - 32px));margin:24px auto;background:#fff;border:1px solid #ddd;border-radius:14px;padding:22px}header{display:flex;justify-content:space-between;gap:24px;border-bottom:1px solid #e8e8e8;padding-bottom:18px}header span,article>span{font-size:10px;color:#888}h1{margin:3px 0 4px;font-size:28px}h2{margin:4px 0 10px;font-size:17px}h3{margin:18px 0 7px;font-size:13px}p{margin:0;color:#666}header>strong{align-self:flex-start;border-radius:999px;padding:7px 10px;background:#eee;font-size:10px}header>strong[data-state=ready]{background:#e8f7ed;color:#196c37}header>strong[data-state=blocked]{background:#fff0ef;color:#97342d}.compare{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.compare article{border:1px solid #e5e5e5;border-radius:10px;padding:14px}dl{display:grid;grid-template-columns:100px 1fr;gap:6px 10px;margin:14px 0 0}dt{color:#999;font-size:11px}dd{margin:0;word-break:break-word}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.metrics article{border:1px solid #e5e5e5;border-radius:9px;padding:10px}.metrics strong{display:block;font-size:18px}section{margin-top:18px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #eee;padding:7px;text-align:left}th{font-size:10px;color:#888}.delta.plus{color:#19733b}.delta.minus{color:#9d342c}.manifest{display:grid;grid-template-columns:1fr 1fr;gap:8px}.manifest>div{border:1px solid #e5e5e5;border-radius:9px;padding:10px}.manifest span,.manifest small{display:block;color:#888;font-size:10px}.manifest strong{display:block;margin:2px 0}.notice{border-radius:8px;padding:10px}.notice h2{font-size:11px}.notice.error{background:#fff4f3;color:#8c3029}.notice.warn{background:#fffbed;color:#735a00}footer{margin-top:22px;border-top:1px solid #e8e8e8;padding-top:14px}footer strong{font-size:11px}@media(max-width:720px){.compare,.metrics,.manifest{grid-template-columns:1fr}header{display:grid}}`;}
