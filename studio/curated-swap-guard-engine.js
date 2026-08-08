export const CURATED_SWAP_BASELINE_KIND = 'seedance-porter-curated-swap-baseline';
export const CURATED_SWAP_VERIFICATION_KIND = 'seedance-porter-curated-swap-verification';

export async function buildCuratedSwapBaseline(input) {
  const staging = input.stagingPack || {};
  const beforeCases = normalizeCases(input.beforeCases || []);
  const errors=[];
  if (staging.kind !== 'seedance-porter-curation-staging-pack') errors.push('Staging pack kind is invalid.');
  if (!staging.valid) errors.push('Staging pack must be valid.');
  if (!staging.implementationReady) errors.push('Staging pack must be implementationReady=true.');
  if (staging.autoApply !== false || staging.autoPublish !== false) errors.push('Staging pack must explicitly prohibit autoApply/autoPublish.');
  if (beforeCases.length !== 100 || new Set(beforeCases.map(item=>item.id)).size !== 100) errors.push('Before runtime must contain exactly 100 unique curated cases.');

  const removeId=String(staging.proposedRemoval?.id || staging.implementationManifest?.remove?.caseId || '').trim();
  const addId=String(staging.incoming?.candidateId || staging.implementationManifest?.add?.candidateId || '').trim();
  if (!removeId || !addId) errors.push('Staging pack must bind both remove and add IDs.');
  if (!beforeCases.some(item=>item.id===removeId)) errors.push(`Remove ID ${removeId} is not present in before runtime.`);
  if (beforeCases.some(item=>item.id===addId)) errors.push(`Add ID ${addId} is already present in before runtime.`);

  const beforeIds=beforeCases.map(item=>item.id).sort();
  const expectedAfterIds=beforeIds.filter(id=>id!==removeId).concat(addId).sort();
  const protectedIds=beforeIds.filter(id=>id!==removeId);
  const beforeCollections=collectionCounts(beforeCases);
  const expectedAfterCollections=new Map(beforeCollections);
  for(const name of uniqueStrings(staging.proposedRemoval?.collections||[])) expectedAfterCollections.set(name,Math.max(0,(expectedAfterCollections.get(name)||0)-1));
  for(const name of uniqueStrings(staging.incoming?.collections||[])) expectedAfterCollections.set(name,(expectedAfterCollections.get(name)||0)+1);

  const core={
    schemaVersion:1,
    kind:CURATED_SWAP_BASELINE_KIND,
    createdAt:new Date(input.now||Date.now()).toISOString(),
    valid:errors.length===0,
    errors,
    invariant:{target:100,before:beforeIds.length,expectedAfter:expectedAfterIds.length,autoApply:false,autoPublish:false},
    staging:{candidateId:addId,removeCaseId:removeId,stagingKind:staging.kind,stagingGeneratedAt:staging.generatedAt||null},
    before:{caseIds:beforeIds,caseSetHash:await hashStrings(beforeIds),collectionCounts:Object.fromEntries([...beforeCollections].sort())},
    expectedAfter:{caseIds:expectedAfterIds,caseSetHash:await hashStrings(expectedAfterIds),protectedCaseIds:protectedIds,collectionCounts:Object.fromEntries([...expectedAfterCollections].sort())},
    expectedRepository:{removeFile:staging.proposedRemoval?.repositoryLocation?.file||staging.implementationManifest?.remove?.file||null,suggestedAddFile:staging.implementationManifest?.add?.suggestedFile||null},
    boundary:'This baseline authorizes nothing. It records the exact expected one-out/one-in identity transition so a later human patch can be verified without allowing unrelated curated changes.'
  };
  return {...core,baselineHash:await hashJson(core)};
}

export async function verifyCuratedSwapImplementation(input) {
  const baseline=input.baseline||{};
  const afterCases=normalizeCases(input.afterCases||[]);
  const locations=input.afterLocations instanceof Map?input.afterLocations:new Map(Object.entries(input.afterLocations||{}));
  const errors=[];
  const warnings=[];

  if (baseline.kind!==CURATED_SWAP_BASELINE_KIND) errors.push('Swap baseline kind is invalid.');
  if (!baseline.valid) errors.push('Swap baseline is not valid.');
  const claimed=baseline.baselineHash;
  const core=cloneJson(baseline);delete core.baselineHash;
  const expectedBaselineHash=await hashJson(core);
  if (claimed!==expectedBaselineHash) errors.push('Swap baseline integrity hash mismatch.');

  const ids=afterCases.map(item=>item.id).sort();
  const unique=new Set(ids);
  if (ids.length!==100 || unique.size!==100) errors.push(`After runtime must contain exactly 100 unique cases; received ${ids.length}/${unique.size}.`);
  const expected=[...(baseline.expectedAfter?.caseIds||[])].sort();
  const expectedHash=await hashStrings(expected);
  const afterHash=await hashStrings(ids);
  if (expectedHash!==baseline.expectedAfter?.caseSetHash) errors.push('Baseline expectedAfter case-set hash is internally inconsistent.');
  if (afterHash!==baseline.expectedAfter?.caseSetHash) errors.push('After curated ID set does not match the staged one-out/one-in expectation.');

  const removeId=baseline.staging?.removeCaseId;
  const addId=baseline.staging?.candidateId;
  if (ids.includes(removeId)) errors.push(`Removed case ${removeId} is still present after implementation.`);
  if (ids.filter(id=>id===addId).length!==1) errors.push(`Incoming case ${addId} must be present exactly once after implementation.`);
  const missingProtected=(baseline.expectedAfter?.protectedCaseIds||[]).filter(id=>!unique.has(id));
  if (missingProtected.length) errors.push(`Protected incumbent IDs changed unexpectedly: ${missingProtected.slice(0,12).join(', ')}`);
  const unexpected=ids.filter(id=>!expected.includes(id));
  if (unexpected.length) errors.push(`Unexpected curated IDs after swap: ${unexpected.slice(0,12).join(', ')}`);

  const actualCollections=collectionCounts(afterCases);
  const expectedCollections=new Map(Object.entries(baseline.expectedAfter?.collectionCounts||{}).map(([key,value])=>[key,Number(value)]));
  const collectionMismatches=[];
  for(const name of new Set([...actualCollections.keys(),...expectedCollections.keys()])){
    const actual=actualCollections.get(name)||0;
    const exp=expectedCollections.get(name)||0;
    if(actual!==exp)collectionMismatches.push({collection:name,expected:exp,actual});
  }
  if(collectionMismatches.length) errors.push(`Collection counts differ from staging expectation: ${collectionMismatches.slice(0,8).map(item=>`${item.collection} ${item.expected}→${item.actual}`).join(', ')}`);

  if (locations.size) {
    if (locations.has(removeId)) errors.push(`Removed case ${removeId} still resolves to curated data file ${locations.get(removeId)?.file||'unknown'}.`);
    if (!locations.has(addId)) errors.push(`Incoming case ${addId} cannot be located in curated data files after implementation.`);
    const incomingLocation=locations.get(addId);
    if ((incomingLocation?.duplicateLocations||[]).length) errors.push(`Incoming case ${addId} appears in multiple curated data files.`);
  } else warnings.push('After repository location index was not supplied; source-file presence could not be verified.');

  const verificationCore={
    schemaVersion:1,
    kind:CURATED_SWAP_VERIFICATION_KIND,
    verifiedAt:new Date(input.now||Date.now()).toISOString(),
    valid:errors.length===0,
    errors,
    warnings,
    baselineHash:claimed||null,
    staging:{removeCaseId:removeId,candidateId:addId},
    after:{caseIds:ids,caseSetHash:afterHash,curatedCases:ids.length,uniqueCases:unique.size,collectionCounts:Object.fromEntries([...actualCollections].sort())},
    expected:{caseSetHash:baseline.expectedAfter?.caseSetHash||null,collectionCounts:baseline.expectedAfter?.collectionCounts||{}},
    collectionMismatches,
    autoApprove:false,
    autoPublish:false,
    boundary:'A valid swap verification proves only that the curated runtime changed exactly as staged. It does not approve editorial content, rights, evidence quality, or deployment.'
  };
  return {...verificationCore,verificationHash:await hashJson(verificationCore)};
}

function normalizeCases(items){const map=new Map();for(const raw of items||[]){if(!raw?.id)continue;map.set(String(raw.id),{id:String(raw.id),collections:uniqueStrings(raw.collections||raw.intelligence?.collections||[])});}return[...map.values()];}
function collectionCounts(cases){const map=new Map();for(const item of cases)for(const name of uniqueStrings(item.collections))map.set(name,(map.get(name)||0)+1);return map;}
function uniqueStrings(values){return[...new Set((Array.isArray(values)?values:[]).map(value=>String(value||'').trim()).filter(Boolean))];}
async function hashStrings(values){return hashJson([...(values||[])].sort());}
async function hashJson(value){const bytes=new TextEncoder().encode(stableStringify(value));const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function stableStringify(value){return JSON.stringify(sortValue(value));}
function sortValue(value){if(Array.isArray(value))return value.map(sortValue);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sortValue(value[key])]));return value;}
function cloneJson(value){return JSON.parse(JSON.stringify(value));}
