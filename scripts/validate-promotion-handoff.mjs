#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { buildFinalEvidencePackage } from '../studio/evidence-package-engine.js';
import { buildPromotionHandoffFromEvidence, verifyPromotionHandoff, renderPromotionHandoffHtml } from '../studio/promotion-handoff-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
const review={
  candidateId:'candidate-handoff',reviewStatus:'deep-reviewed',reviewedAt:'2026-08-07T18:00:00.000Z',sourceVideoUrl:'https://video.twimg.com/example.mp4',
  evidenceAttestation:{completeVideoWatched:true,attestedAt:'2026-08-07T17:59:00.000Z',method:'manual-complete-video-review'},
  promptAnatomy:{thesis:'The source prompt separates setup and payoff into observable production functions for reliable review.',signatureMove:'Stable setup becomes one clean payoff.',shotBreakdown:[{n:1}],causalMechanics:['The setup locks the subject state.','The payoff changes one visible motion variable.'],referenceStrategy:'Use source reference for identity only.',motionLanguage:['static','slow push'],failureRisks:['geometry drift','overmoving camera']},
  visualReview:{observedShots:[{n:1,observedFraming:'close-up',observedCamera:'slow push',observedAction:'subject settles',promptMatch:'strong',attentionMechanic:'single highlight'}],observedTransitions:['No transition observed.'],observedMotion:['One slow push.'],observedArtifacts:['No major artifact observed.'],observedContinuity:['Identity remained stable.'],verifiedSignatureMove:'Stable setup becomes one clean payoff.',whyItWorked:['One motion variable stayed legible.','The endpoint remained stable and reusable.'],whatDidNotWork:[]},
  transfer:{transferablePattern:'Use one stable setup, one causal motion event and one controlled endpoint in a new subject context.',doTransfer:['causal motion structure'],doNotTransfer:['source product identity']}
};
const candidate={id:'candidate-handoff',title:'Handoff Candidate',author:'@creator',authorUrl:'https://x.com/creator',sourcePool:'pool-a',sourcePoolLabel:'Pool A',sourceUrl:'https://x.com/creator/status/123',archiveUrl:'https://example.com/archive',previewUrl:'https://example.com/preview.jpg',sourceVideoUrl:'https://video.twimg.com/example.mp4',collections:['camera'],riskFlags:[],score:90,metrics:{sourceTraceability:5}};
const pkg=await buildFinalEvidencePackage({candidate,deepReview:review,createdAt:'2026-08-07T18:01:00.000Z'});
const handoff=await buildPromotionHandoffFromEvidence({evidencePackage:pkg,createdAt:'2026-08-07T18:02:00.000Z'});
assert(handoff.valid,'Verified final evidence must produce a valid Promotion handoff.');
assert(handoff.status==='ready-for-promotion-review','Safe package should be ready for Promotion review.');
assert(handoff.promotionInputReady===true,'Safe verified package should expose Promotion review input.');
assert(handoff.promotionReviewInput.reviewStatus==='deep-reviewed','Promotion review input must preserve Deep Review status, not invent a new one.');
assert(handoff.evidence.packageHash===pkg.integrity.packageHash,'Handoff must bind exact Final Evidence package hash.');
assert(handoff.researchRisk.flags.length===0&&handoff.researchRisk.cleared===false,'Safe fixture should carry no risk flags and must never mark risk as cleared.');
assert(handoff.autoApprove===false&&handoff.autoCurate===false&&handoff.autoPublish===false&&handoff.autoGitHubWrite===false,'Promotion handoff must prohibit approval/curation/publication/GitHub writes.');
assert(/^[a-f0-9]{64}$/.test(handoff.handoffHash),'Promotion handoff must have integrity hash.');
const verified=await verifyPromotionHandoff(handoff);
assert(verified.ok,`Fresh Promotion handoff must verify: ${verified.errors.join('; ')}`);

const riskyPkg=await buildFinalEvidencePackage({candidate:{...candidate,riskFlags:['named-ip-or-celebrity']},deepReview:review,createdAt:'2026-08-07T18:01:00.000Z'});
const risky=await buildPromotionHandoffFromEvidence({evidencePackage:riskyPkg,createdAt:'2026-08-07T18:02:00.000Z'});
assert(risky.valid,'Risky evidence can still be valid evidence.');
assert(risky.status==='risk-review-required','Research risk flags must change handoff status to risk-review-required.');
assert(risky.promotionInputReady===false,'Risky handoff must not be marked Promotion-input-ready.');
assert(risky.researchRisk.flags.includes('named-ip-or-celebrity')&&risky.researchRisk.cleared===false,'Risk flags must remain preserved and uncleared.');

const tampered=structuredClone(handoff);tampered.provenance.author='changed';
const tamperedResult=await verifyPromotionHandoff(tampered);
assert(!tamperedResult.ok,'Tampering with Promotion handoff must invalidate handoff hash.');

const invalidPkg=structuredClone(pkg);invalidPkg.deepReview.reviewStatus='prompt-reviewed';
const invalid=await buildPromotionHandoffFromEvidence({evidencePackage:invalidPkg});
assert(!invalid.valid&&invalid.status==='blocked-invalid-evidence-package','Invalid Final Evidence package must be blocked before Promotion handoff.');
assert(invalid.promotionInputReady===false,'Invalid evidence can never be Promotion-input-ready.');

const html=renderPromotionHandoffHtml(handoff);
assert(html.includes('EDITORIAL GATE STILL REQUIRED'),'Inspector must visibly retain editorial gate.');
assert(html.includes('READY FOR PROMOTION REVIEW'),'Inspector must show safe handoff state.');
assert(!html.includes('<script'),'Promotion handoff inspector must be inert/static.');

const [engine,cli]=await Promise.all([readFile('studio/promotion-handoff-engine.js','utf8'),readFile('scripts/build-promotion-handoff.mjs','utf8')]);
assert(engine.includes('verifyFinalEvidencePackage'),'Handoff engine must verify Final Evidence package before unwrapping.');
assert(engine.includes('risk-review-required'),'Handoff engine must preserve Research risk review state.');
assert(engine.includes('autoApprove:false')&&engine.includes('autoCurate:false')&&engine.includes('autoPublish:false')&&engine.includes('autoGitHubWrite:false'),'Handoff engine must prohibit all automatic approval/publication/write actions.');
assert(!engine.includes('INDUSTRY_DIGEST.push')&&!engine.includes('MULTI_SOURCE_CASES.push'),'Handoff engine must never mutate curated data.');
assert(cli.includes('.promotion-review.json')&&cli.includes('.promotion-context.json')&&cli.includes('.promotion-handoff.html'),'CLI must produce review, context and inspector artifacts.');

if(failures.length){console.error('Promotion Handoff contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,status:handoff.status,promotionInputReady:handoff.promotionInputReady,riskyStatus:risky.status,riskyReady:risky.promotionInputReady,handoffHash:handoff.handoffHash,autoApprove:false,autoCurate:false,autoPublish:false,autoGitHubWrite:false},null,2));
