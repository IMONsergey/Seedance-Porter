#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { buildFinalEvidencePackage, verifyFinalEvidencePackage, validateFinalEvidenceInputs, stableStringify, hashJson } from '../studio/evidence-package-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const candidate={
  id:'candidate-evidence',title:'Evidence Candidate',author:'@creator',authorUrl:'https://x.com/creator',sourcePool:'pool-a',sourcePoolLabel:'Pool A',
  sourceUrl:'https://x.com/creator/status/123',archiveUrl:'https://example.com/archive',previewUrl:'https://example.com/preview.jpg',sourceVideoUrl:'https://video.twimg.com/example.mp4',
  collections:['camera','macro'],riskFlags:[],score:88,metrics:{sourceTraceability:5}
};
const deepReview={
  candidateId:'candidate-evidence',reviewStatus:'deep-reviewed',reviewedAt:'2026-08-07T18:00:00.000Z',sourceVideoUrl:'https://video.twimg.com/example.mp4',
  evidenceAttestation:{completeVideoWatched:true,attestedAt:'2026-08-07T17:59:00.000Z',method:'manual-complete-video-review'},
  promptAnatomy:{
    thesis:'The prompt isolates one visible causal mechanism and gives each beat a clear production function.',
    signatureMove:'Macro setup resolves into one controlled camera payoff.',
    shotBreakdown:[{n:1,label:'setup'}],
    causalMechanics:['One instruction establishes the stable subject state.','The next instruction changes one visible motion variable only.'],
    referenceStrategy:'Use the source image only for identity and geometry while motion instructions remain independent.',
    motionLanguage:['macro push','locked settle'],
    failureRisks:['geometry drift','overloaded camera motion']
  },
  visualReview:{
    observedShots:[{n:1,observedFraming:'macro close-up',observedCamera:'slow push',observedAction:'subject advances once and settles',promptMatch:'strong',attentionMechanic:'single moving highlight guides focus',notes:'stable geometry'}],
    observedTransitions:['No transition; continuous source shot observed.'],
    observedMotion:['Slow camera push with one subject motion event.'],
    observedArtifacts:['No major artifacts observed in the complete source video.'],
    observedContinuity:['Subject geometry and lighting direction remain stable.'],
    verifiedSignatureMove:'Macro setup resolves into one controlled camera payoff.',
    whyItWorked:['Only one dominant visual change happens at a time.','The endpoint is stable enough to function as a reusable campaign frame.'],
    whatDidNotWork:['Minor edge shimmer near the final settle.']
  },
  transfer:{
    transferablePattern:'Use a stable macro setup, introduce one causal motion event, then settle into a clean product or interface endpoint.',
    doTransfer:['one causal motion event','stable endpoint'],
    doNotTransfer:['source product identity','source creator wording'],
    bestFor:['packshot','website hero']
  }
};
const media={
  schemaVersion:1,kind:'seedance-porter-review-media-evidence',candidateId:'candidate-evidence',sourceVideoUrl:'https://video.twimg.com/example.mp4',
  playback:{duration:15,playedRanges:[[0,15]],coveragePercent:100,lastTime:15,updatedAt:'2026-08-07T17:58:00.000Z'},
  markers:[{id:'m1',type:'artifact',timeSeconds:13.2,timecode:'00:13.2',note:'minor edge shimmer',createdAt:'2026-08-07T17:58:30.000Z'}],
  exportedAt:'2026-08-07T17:58:40.000Z',evidenceBoundary:'Playback coverage and markers are reviewer aids only. They do not constitute complete-video attestation or deep-reviewed status.'
};

const preflight=validateFinalEvidenceInputs({candidate,deepReview,mediaEvidence:media});
assert(preflight.ok,`Valid final evidence inputs must pass: ${preflight.errors.join('; ')}`);
const pkg=await buildFinalEvidencePackage({candidate,deepReview,mediaEvidence:media,createdAt:'2026-08-07T18:01:00.000Z'});
assert(pkg.kind==='seedance-porter-final-evidence-package','Package kind must be stable.');
assert(pkg.evidenceState.reviewStatus==='deep-reviewed'&&pkg.evidenceState.completeVideoWatched===true,'Package must preserve manual final evidence state.');
assert(pkg.source.autoCurate===false&&pkg.source.autoPublish===false&&pkg.source.autoGitHubWrite===false,'Package must explicitly prohibit automatic curation/publication/GitHub writes.');
for(const hash of [pkg.integrity.components.candidate,pkg.integrity.components.deepReview,pkg.integrity.components.mediaEvidence,pkg.integrity.packageHash])assert(/^[a-f0-9]{64}$/.test(hash),'Every integrity hash must be SHA-256 hex.');

const verified=await verifyFinalEvidencePackage(pkg);
assert(verified.ok,`Fresh package must verify: ${verified.errors.join('; ')}`);

const tampered=structuredClone(pkg);
tampered.deepReview.visualReview.observedShots[0].observedAction+=' changed';
const tamperedResult=await verifyFinalEvidencePackage(tampered);
assert(!tamperedResult.ok,'Tampering with Deep Review after packaging must invalidate integrity.');
assert(tamperedResult.errors.some(message=>/Deep Review integrity hash mismatch|Package integrity hash mismatch/.test(message)),'Tamper failure must identify an integrity mismatch.');

const wrongMedia=structuredClone(media);wrongMedia.candidateId='candidate-other';
assert(!validateFinalEvidenceInputs({candidate,deepReview,mediaEvidence:wrongMedia}).ok,'Media evidence candidate binding mismatch must be rejected.');

const noAttestation=structuredClone(deepReview);noAttestation.evidenceAttestation.completeVideoWatched=false;
assert(!validateFinalEvidenceInputs({candidate,deepReview:noAttestation,mediaEvidence:media}).ok,'Final package must reject review without complete-video attestation.');

const promptReviewed=structuredClone(deepReview);promptReviewed.reviewStatus='prompt-reviewed';
assert(!validateFinalEvidenceInputs({candidate,deepReview:promptReviewed,mediaEvidence:media}).ok,'Prompt-reviewed evidence cannot be packaged as final evidence.');

const noMedia=await buildFinalEvidencePackage({candidate,deepReview,mediaEvidence:null,createdAt:'2026-08-07T18:01:00.000Z'});
const noMediaVerification=await verifyFinalEvidencePackage(noMedia);
assert(noMediaVerification.ok,'Companion media timeline must remain optional.');
assert(noMediaVerification.warnings.some(message=>/No Review Player companion/.test(message)),'Missing optional media evidence must produce an explicit warning.');

const riskyCandidate={...candidate,riskFlags:['named-ip-or-celebrity']};
const risky=await buildFinalEvidencePackage({candidate:riskyCandidate,deepReview,mediaEvidence:media,createdAt:'2026-08-07T18:01:00.000Z'});
const riskyVerification=await verifyFinalEvidencePackage(risky);
assert(riskyVerification.ok,'Research risk flags do not invalidate evidence integrity by themselves.');
assert(riskyVerification.warnings.some(message=>/risk flags/.test(message)),'Risk flags must survive into verification warnings.');
assert(risky.candidate.riskFlags.includes('named-ip-or-celebrity'),'Package must preserve candidate risk flags.');

const wrongCandidate={...candidate,id:'candidate-other'};
assert(!validateFinalEvidenceInputs({candidate:wrongCandidate,deepReview,mediaEvidence:media}).ok,'Candidate metadata binding mismatch must be rejected.');

const sortedA=stableStringify({b:1,a:{d:2,c:3}});
const sortedB=stableStringify({a:{c:3,d:2},b:1});
assert(sortedA===sortedB,'Stable JSON canonicalization must ignore object key insertion order.');
assert(await hashJson({b:1,a:2})===await hashJson({a:2,b:1}),'SHA-256 hash must use stable canonical JSON ordering.');

const [engine,schema,builder,verifier]=await Promise.all([
  readFile('studio/evidence-package-engine.js','utf8'),
  readFile('schemas/final-evidence-package.schema.json','utf8'),
  readFile('scripts/build-final-evidence-package.mjs','utf8'),
  readFile('scripts/verify-final-evidence-package.mjs','utf8')
]);
assert(schema.includes('seedance-porter-final-evidence-package'),'Schema must lock final package kind.');
assert(schema.includes('"autoCurate": { "const": false }')&&schema.includes('"autoPublish": { "const": false }')&&schema.includes('"autoGitHubWrite": { "const": false }'),'Schema must prohibit automatic approval/publication/writes.');
assert(schema.includes('./case-review.schema.json')&&schema.includes('./review-media-evidence.schema.json'),'Schema must compose authoritative Deep Review and optional media-evidence schemas.');
assert(engine.includes("globalThis.crypto.subtle.digest('SHA-256'"),'Engine must use SHA-256 for integrity.');
assert(builder.includes('buildFinalEvidencePackage'),'Builder CLI must use the shared engine.');
assert(verifier.includes('verifyFinalEvidencePackage'),'Verifier CLI must use the shared engine.');
assert(!engine.includes('INDUSTRY_DIGEST.push')&&!engine.includes('MULTI_SOURCE_CASES.push'),'Evidence package engine must not mutate curated datasets.');

if(failures.length){console.error('Final Evidence Package contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,candidateId:pkg.candidateId,packageHash:pkg.integrity.packageHash,mediaOptional:true,tamperDetection:true,riskFlagsPreserved:true,autoCurate:false,autoPublish:false,autoGitHubWrite:false},null,2));
