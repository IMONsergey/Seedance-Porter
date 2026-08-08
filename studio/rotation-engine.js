export const ROTATION_TARGET_SIZE = 100;

export function buildCuratedRotationPlan(input) {
  const currentCases = normalizeCurrentCases(input.currentCases || []);
  const coveragePlan = input.coveragePlan || null;
  const incoming = normalizeIncomingDraft(input.incomingDraft || {}, input.candidate || null);
  const errors = [];
  const warnings = [];

  if (currentCases.length !== ROTATION_TARGET_SIZE) errors.push(`Rotation analysis requires exactly ${ROTATION_TARGET_SIZE} current curated cases; received ${currentCases.length}.`);
  if (!incoming.candidateId) errors.push('Incoming curation draft has no candidateId.');
  if (!incoming.title) errors.push('Incoming curation draft has no title.');
  if (!incoming.collections.length) errors.push('Incoming curation draft has no Collections.');
  if (!incoming.sourceUrl) warnings.push('Incoming curation draft has no source URL; provenance benefit cannot be trusted.');
  if (currentCases.some(item => item.id === incoming.candidateId)) errors.push('Incoming candidate is already present in the curated runtime.');

  const collectionStats = buildCollectionStats(currentCases, coveragePlan);
  const platformCounts = countBy(currentCases, item => item.sourcePlatform || 'unknown');
  const creatorCounts = countBy(currentCases, item => item.author || 'unknown');
  const incomingGain = incomingStrategicGain(incoming, collectionStats, platformCounts, creatorCounts);

  const replacements = currentCases.map(item => {
    const removal = removalPenalty(item, collectionStats, platformCounts, creatorCounts);
    const redundancy = redundancyBonus(item, incoming, collectionStats, platformCounts, creatorCounts);
    const projectedCollections = projectedCollectionDeltas(item, incoming, collectionStats);
    const netStrategicValue = round(incomingGain.score + redundancy.score - removal.score, 1);
    return {
      removeCaseId:item.id,
      removeTitle:item.title,
      removeAuthor:item.author,
      removeSourcePlatform:item.sourcePlatform,
      removeCollections:item.collections,
      removeEvidenceStatus:item.evidenceStatus,
      removeDesignScore:item.designScore,
      removalPenalty:removal,
      redundancyBonus:redundancy,
      incomingGain:incomingGain.score,
      netStrategicValue,
      projectedCollections,
      warnings:rotationWarnings(item, incoming, projectedCollections, removal)
    };
  }).sort((a,b) => b.netStrategicValue - a.netStrategicValue || a.removalPenalty.score - b.removalPenalty.score || a.removeTitle.localeCompare(b.removeTitle));

  const best = replacements[0] || null;
  const confidence = analysisConfidence({ errors, warnings, incoming, coveragePlan, currentCases });
  const decision = decide({ errors, incomingGain, best, confidence });

  return {
    schemaVersion:1,
    kind:'seedance-porter-curated-rotation-plan',
    generatedAt:new Date(input.now || Date.now()).toISOString(),
    invariant:{ curatedSize:ROTATION_TARGET_SIZE, autoSwap:false, autoPublish:false },
    valid:errors.length===0,
    errors,
    warnings,
    confidence,
    incoming,
    incomingStrategicGain:incomingGain,
    currentSummary:{
      curatedCases:currentCases.length,
      sourcePlatforms:Object.fromEntries(platformCounts),
      creators:creatorCounts.size,
      collections:collectionStats.size
    },
    decision,
    recommendedReplacement:best,
    alternatives:replacements.slice(1,6),
    doNotAutoReplace: true,
    editorialBoundary:'This is a strategic rotation recommendation only. A human editor must approve the incoming curation draft and any exact-100 replacement. The planner never mutates curated data.'
  };
}

function normalizeCurrentCases(items) {
  const map = new Map();
  for (const raw of items) {
    if (!raw?.id) continue;
    const item = {
      id:String(raw.id),
      title:String(raw.title || raw.id),
      author:String(raw.author || ''),
      sourcePlatform:String(raw.sourcePlatform || inferPlatform(raw.sourceUrl) || ''),
      sourceUrl:String(raw.sourceUrl || ''),
      collections:uniqueStrings(raw.collections || raw.intelligence?.collections || []),
      designScore:numberOr(raw.designScore, 0),
      evidenceStatus:String(raw.evidenceStatus || raw.intelligence?.reviewStatus || raw.reviewStatus || 'unknown'),
      featured:Boolean(raw.featured)
    };
    map.set(item.id,item);
  }
  return [...map.values()];
}

function normalizeIncomingDraft(draft, candidate) {
  const caseData = draft.case || draft.curatedCase || draft.draft || {};
  const source = draft.source || draft.provenance || {};
  const intelligence = draft.intelligence || draft.review || {};
  const editorial = draft.editorial || draft.editorialGate || {};
  const readiness = draft.readiness || {};
  const mergedCandidate = candidate || {};
  const candidateId = first(draft.candidateId, caseData.id, mergedCandidate.id);
  const title = first(caseData.title, draft.title, mergedCandidate.title);
  const sourceUrl = first(source.sourceUrl, source.url, draft.sourceUrl, caseData.sourceUrl, mergedCandidate.sourceUrl);
  const author = first(caseData.author, source.author, draft.author, mergedCandidate.author);
  const sourcePlatform = first(caseData.sourcePlatform, source.platform, draft.sourcePlatform, mergedCandidate.sourcePlatform, inferPlatform(sourceUrl));
  const collections = uniqueStrings(firstArray(caseData.collections, draft.collections, intelligence.collections, mergedCandidate.collections));
  const deepReviewed = [draft.reviewStatus, intelligence.reviewStatus, draft.evidence?.reviewStatus, draft.sourceReviewStatus].some(value => String(value || '').toLowerCase() === 'deep-reviewed') || draft.evidenceAttestation?.completeVideoWatched === true;
  const readinessScore = numberOr(readiness.score, numberOr(draft.readinessScore, 0));
  const designScore = numberOr(caseData.designScore, numberOr(draft.designScore, numberOr(mergedCandidate.designScore, 0)));
  const porterAdaptation = String(first(caseData.porterAdaptation, draft.porterAdaptation, draft.porterPrompt, '') || '');
  const editorialSignals = flattenBooleanSignals(editorial);
  const editorialComplete = editorialSignals.length ? editorialSignals.every(Boolean) : false;
  const sourceTraceability = numberOr(readiness.sourceTraceability, numberOr(draft.sourceTraceability, numberOr(mergedCandidate.metrics?.sourceTraceability, 0)));
  return {
    candidateId:String(candidateId || ''),
    title:String(title || ''),
    author:String(author || ''),
    sourcePlatform:String(sourcePlatform || ''),
    sourceUrl:String(sourceUrl || ''),
    collections,
    designScore,
    deepReviewed,
    readinessScore,
    sourceTraceability,
    porterAdaptationLength:porterAdaptation.trim().length,
    editorialComplete,
    editorialSignals:editorialSignals.length,
    curationKind:String(draft.kind || ''),
    rawStatus:String(first(draft.status,draft.curationStatus,caseData.status,'') || '')
  };
}

function buildCollectionStats(cases, plan) {
  const planMap = new Map((plan?.collections || []).map(item => [slug(item.id || item.title), item]));
  const names = new Set(cases.flatMap(item => item.collections.map(slug)).filter(Boolean));
  for (const id of planMap.keys()) names.add(id);
  const result = new Map();
  for (const id of names) {
    const curated = cases.filter(item => item.collections.some(name => slug(name) === id)).length;
    const p = planMap.get(id) || {};
    const target = numberOr(p.targetCurated, numberOr(p.target, curated));
    const priority = numberOr(p.priority, 0);
    const health = String(p.health || 'unknown');
    result.set(id,{ id, title:String(p.title || id), curated, target, priority, health });
  }
  return result;
}

function incomingStrategicGain(incoming, collectionStats, platformCounts, creatorCounts) {
  const reasons=[];
  let score=0;
  const collectionReasons=[];
  for (const raw of incoming.collections) {
    const id=slug(raw);
    const stat=collectionStats.get(id) || { curated:0,target:1,priority:50,health:'unknown',title:raw };
    const deficit=Math.max(0,numberOr(stat.target,0)-numberOr(stat.curated,0));
    const value=Math.min(18, deficit*5 + numberOr(stat.priority,0)*0.13 + (stat.health==='critical'?6:stat.health==='high'?3:0));
    score+=value;
    collectionReasons.push({ id,title:stat.title,curated:stat.curated,target:stat.target,priority:stat.priority,gain:round(value,1) });
  }
  if (collectionReasons.length) reasons.push('collection-coverage');

  const platformCount=platformCounts.get(incoming.sourcePlatform || 'unknown') || 0;
  const platformGain=incoming.sourcePlatform ? (platformCount===0?12:platformCount<=2?8:platformCount<=5?4:0) : 0;
  if (platformGain) reasons.push('source-platform-diversity');
  score+=platformGain;

  const creatorCount=creatorCounts.get(incoming.author || 'unknown') || 0;
  const creatorGain=incoming.author ? (creatorCount===0?8:creatorCount===1?4:0) : 0;
  if (creatorGain) reasons.push('creator-diversity');
  score+=creatorGain;

  const evidenceGain=incoming.deepReviewed?14:0;
  if (evidenceGain) reasons.push('deep-reviewed-evidence');
  score+=evidenceGain;

  const readinessGain=Math.min(12,Math.max(0,incoming.readinessScore)*0.12);
  if (readinessGain) reasons.push('curation-readiness');
  score+=readinessGain;

  const traceGain=Math.min(8,Math.max(0,incoming.sourceTraceability)*1.6);
  if (traceGain) reasons.push('source-traceability');
  score+=traceGain;

  const designGain=Math.min(8,Math.max(0,incoming.designScore)*1.6);
  if (designGain) reasons.push('design-score');
  score+=designGain;

  const adaptationGain=incoming.porterAdaptationLength>=160?8:incoming.porterAdaptationLength>=80?4:0;
  if (adaptationGain) reasons.push('independent-adaptation-depth');
  score+=adaptationGain;

  const editorialGain=incoming.editorialComplete?8:0;
  if (editorialGain) reasons.push('editorial-gate-complete');
  score+=editorialGain;

  return { score:round(score,1), reasons, collectionReasons, platformCount, creatorCount, deepReviewed:incoming.deepReviewed, editorialComplete:incoming.editorialComplete };
}

function removalPenalty(item, collectionStats, platformCounts, creatorCounts) {
  const reasons=[];
  let score=0;
  const collectionPenalty=[];
  for (const raw of item.collections) {
    const id=slug(raw);
    const stat=collectionStats.get(id) || {curated:1,target:0,priority:0,health:'unknown',title:raw};
    const after=Math.max(0,stat.curated-1);
    const belowTarget=Math.max(0,numberOr(stat.target,0)-after);
    const rarity=stat.curated<=1?15:stat.curated<=2?9:stat.curated<=4?4:0;
    const penalty=Math.min(22,rarity+belowTarget*5+numberOr(stat.priority,0)*0.06+(stat.health==='critical'?4:0));
    score+=penalty;
    collectionPenalty.push({id,title:stat.title,before:stat.curated,after,target:stat.target,penalty:round(penalty,1)});
  }
  if (collectionPenalty.some(item=>item.penalty>0)) reasons.push('collection-loss');

  const platformCount=platformCounts.get(item.sourcePlatform || 'unknown') || 0;
  const platformPenalty=item.sourcePlatform?(platformCount<=1?10:platformCount===2?5:0):0;
  if(platformPenalty)reasons.push('source-platform-diversity-loss');
  score+=platformPenalty;

  const creatorCount=creatorCounts.get(item.author || 'unknown') || 0;
  const creatorPenalty=item.author?(creatorCount<=1?7:creatorCount===2?3:0):0;
  if(creatorPenalty)reasons.push('creator-diversity-loss');
  score+=creatorPenalty;

  const evidencePenalty=item.evidenceStatus==='deep-reviewed'?16:item.evidenceStatus==='prompt-reviewed'?6:0;
  if(evidencePenalty)reasons.push('evidence-maturity');
  score+=evidencePenalty;

  const designPenalty=Math.min(10,Math.max(0,item.designScore)*2);
  if(designPenalty)reasons.push('design-quality');
  score+=designPenalty;

  const featuredPenalty=item.featured?6:0;
  if(featuredPenalty)reasons.push('featured-curation');
  score+=featuredPenalty;
  return {score:round(score,1),reasons,collectionPenalty,platformCount,creatorCount,evidenceStatus:item.evidenceStatus};
}

function redundancyBonus(item,incoming,collectionStats,platformCounts,creatorCounts){
  let score=0;const reasons=[];
  const overlap=item.collections.filter(name=>incoming.collections.some(value=>slug(value)===slug(name)));
  if(overlap.length){const bonus=Math.min(16,overlap.length*5);score+=bonus;reasons.push('collection-overlap');}
  if(item.sourcePlatform&&incoming.sourcePlatform&&item.sourcePlatform===incoming.sourcePlatform&&(platformCounts.get(item.sourcePlatform)||0)>=4){score+=5;reasons.push('source-platform-redundancy');}
  if(item.author&&incoming.author&&item.author===incoming.author&&(creatorCounts.get(item.author)||0)>=2){score+=4;reasons.push('creator-redundancy');}
  if(item.designScore&&incoming.designScore&&incoming.designScore>item.designScore){const bonus=Math.min(8,(incoming.designScore-item.designScore)*2);score+=bonus;reasons.push('design-upgrade');}
  const coveredStrongly=item.collections.filter(name=>{const stat=collectionStats.get(slug(name));return stat&&stat.curated>=Math.max(5,numberOr(stat.target,0)+2);});
  if(coveredStrongly.length){score+=Math.min(8,coveredStrongly.length*2);reasons.push('overcovered-removal');}
  return {score:round(score,1),reasons,overlap,overcovered:coveredStrongly};
}

function projectedCollectionDeltas(remove,incoming,collectionStats){
  const ids=new Set([...remove.collections.map(slug),...incoming.collections.map(slug)]);
  return [...ids].filter(Boolean).map(id=>{
    const stat=collectionStats.get(id)||{title:id,curated:0,target:0,priority:0};
    const removed=remove.collections.some(name=>slug(name)===id)?1:0;
    const added=incoming.collections.some(name=>slug(name)===id)?1:0;
    const after=Math.max(0,stat.curated-removed+added);
    return {id,title:stat.title,before:stat.curated,after,delta:added-removed,target:stat.target,priority:stat.priority,belowTargetAfter:after<numberOr(stat.target,0)};
  });
}

function rotationWarnings(item,incoming,deltas,removal){
  const warnings=[];
  if(removal.evidenceStatus==='deep-reviewed')warnings.push('replacement-removes-deep-reviewed-case');
  if(deltas.some(item=>item.belowTargetAfter))warnings.push('replacement-creates-collection-deficit');
  if(item.sourcePlatform&&incoming.sourcePlatform!==item.sourcePlatform&&removal.platformCount<=1)warnings.push('replacement-removes-only-source-platform-representation');
  if(item.author&&incoming.author!==item.author&&removal.creatorCount<=1)warnings.push('replacement-removes-only-creator-representation');
  return warnings;
}

function decide({errors,incomingGain,best,confidence}){
  if(errors.length)return{status:'blocked',reason:'invalid-input',recommendedSwap:false};
  if(confidence==='low')return{status:'hold',reason:'insufficient-comparison-data',recommendedSwap:false};
  if(!best)return{status:'hold',reason:'no-current-case-candidates',recommendedSwap:false};
  if(incomingGain.score<25)return{status:'hold',reason:'incoming-strategic-gain-too-low',recommendedSwap:false};
  if(best.netStrategicValue>=22&&!best.warnings.includes('replacement-creates-collection-deficit'))return{status:'consider-swap',reason:'positive-strategic-upgrade',recommendedSwap:true,removeCaseId:best.removeCaseId};
  if(best.netStrategicValue>=10)return{status:'editorial-review',reason:'marginal-strategic-upgrade',recommendedSwap:false,removeCaseId:best.removeCaseId};
  return{status:'hold',reason:'replacement-cost-exceeds-gain',recommendedSwap:false};
}

function analysisConfidence({errors,warnings,incoming,coveragePlan,currentCases}){
  if(errors.length)return'none';
  let score=0;
  if(currentCases.length===100)score+=3;
  if(coveragePlan?.collections?.length)score+=3;
  if(incoming.sourceUrl)score+=1;
  if(incoming.collections.length)score+=1;
  if(incoming.deepReviewed)score+=2;
  if(incoming.editorialComplete)score+=1;
  if(incoming.porterAdaptationLength>=80)score+=1;
  if(warnings.length)score-=1;
  return score>=9?'high':score>=6?'medium':'low';
}

function countBy(items,keyFn){const map=new Map();for(const item of items){const key=String(keyFn(item)||'unknown');map.set(key,(map.get(key)||0)+1);}return map;}
function inferPlatform(url){try{const host=new URL(url).hostname.toLowerCase();if(host.includes('x.com')||host.includes('twitter.com'))return'x';if(host.includes('youtube'))return'youtube';if(host.includes('vimeo'))return'vimeo';if(host.includes('github'))return'github';return host.replace(/^www\./,'');}catch{return'';}}
function first(...values){return values.find(value=>value!==undefined&&value!==null&&String(value).trim()!=='');}
function firstArray(...values){return values.find(value=>Array.isArray(value))||[];}
function uniqueStrings(values){return[...new Set((Array.isArray(values)?values:[]).map(value=>String(value||'').trim()).filter(Boolean))];}
function flattenBooleanSignals(value){if(!value||typeof value!=='object'||Array.isArray(value))return[];return Object.values(value).flatMap(item=>typeof item==='boolean'?[item]:item&&typeof item==='object'&&!Array.isArray(item)?flattenBooleanSignals(item):[]);}
function numberOr(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function slug(value){return String(value||'').toLowerCase().replace(/\//g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function round(value,digits=0){const factor=10**digits;return Math.round(value*factor)/factor;}
