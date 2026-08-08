#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { buildFinalEvidencePackage, hashJson } from '../studio/evidence-package-engine.js';
import { buildPromotionHandoffFromEvidence, verifyPromotionHandoff, renderPromotionHandoffHtml, PROMOTION_QUALITY_MINIMUM } from '../studio/promotion-handoff-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const review={
  candidateId:'candidate-handoff',reviewStatus:'deep-reviewed',reviewedAt:'2026-08-07T18:05:00.000Z',sourceVideoUrl:'https://video.twimg.com/example.mp4',
  evidenceAttestation:{completeVideoWatched:true,attestedAt:'2026-08-07T18:04:00.000Z',method:'manual-complete-video-review'},
  promptAnatomy:{
    thesis:'The prompt requests a restrained product reveal where the bottle remains fixed while one camera move establishes material quality.',
    signatureMove:'Locked bottle geometry with one slow push into a stable hero endpoint.',
    shotBreakdown:[{n:1,requested:'Static bottle on stone, slow push in.'},{n:2,requested:'Droplet enters and final packshot settles.'}],
    causalMechanics:['A locked product anchor should reduce geometry drift.','One camera push should keep attention on condensation and label area.'],
    referenceStrategy:'Product image controls exact bottle geometry and color only.',
    motionLanguage:['slow push-in','single droplet event'],
    failureRisks:['label geometry drift','liquid smearing']
  },
  visualReview:{
    observedShots:[
      {n:1,observedFraming:'Macro three-quarter bottle crop with the cap near the upper-right frame edge.',observedCamera:'The camera advances slowly for roughly four seconds without visible lateral drift.',observedAction:'Condensation beads slide down the front glass while the bottle itself stays fixed on the stone.',promptMatch:'strong',attentionMechanic:'A bright vertical reflection moves across the left shoulder and pulls attention toward the embossed edge.',notes:'Label region remains mostly stable; one tiny edge shimmer appears at the lower-right corner.'},
      {n:2,observedFraming:'Tighter crop on the lower bottle and wet stone foreground.',observedCamera:'Camera stops before the droplet lands and holds through the final settle.',observedAction:'One droplet hits the stone at frame-left, makes a short radial splash, then the surface becomes still.',promptMatch:'partial',attentionMechanic:'The sudden droplet motion interrupts the static frame, then the eye returns to the bottle silhouette.',notes:'Requested final label-facing angle is compressed; output holds the earlier three-quarter orientation instead.'}
    ],
    observedTransitions:['A hard cut at approximately 00:04.2 switches from the upper bottle crop to the lower stone detail.'],
    observedMotion:['Camera push is continuous in shot 1; shot 2 is locked while only the droplet and small splash move.'],
    observedArtifacts:['Minor one-frame shimmer appears on the bottle lower-right glass edge near the first shot endpoint.'],
    observedContinuity:['Bottle proportions, cap height and warm key-light direction remain consistent across both shots; label-facing angle does not reach the requested frontal state.'],
    verifiedSignatureMove:'Still product geometry contrasted with one moving highlight and a single droplet interruption before a locked endpoint.',
    whyItWorked:['The first shot gives enough hold time to inspect real glass and condensation detail before any new event enters the frame.','Stopping the camera before the droplet impact isolates the splash as the only fast motion and makes the final stillness feel deliberate.'],
    whatDidNotWork:['The second shot does not complete the requested frontal packshot angle, so exact label presentation would still need a separate approved source frame.']
  },
  transfer:{
    transferablePattern:'Hold one exact hero object stable, use a single slow inspection move, interrupt with one small material event, then settle completely before the endpoint.',
    doTransfer:['stable product geometry','one inspection camera move','single material event before endpoint'],
    doNotTransfer:['source bottle identity','source label artwork','exact stone/background styling'],
    bestFor:['beauty packshot','FMCG hero','website hero loop']
  }
};
const candidate={id:'candidate-handoff',title:'Handoff Candidate',author:'@creator',authorUrl:'https://x.com/creator',sourcePool:'pool-a',sourcePoolLabel:'Pool A',sourceUrl:'https://x.com/creator/status/123',archiveUrl:'https://example.com/archive',previewUrl:'https://example.com/preview.jpg',sourceVideoUrl:'https://video.twimg.com/example.mp4',collections:['beauty','packshot'],riskFlags:[],score:90,metrics:{sourceTraceability:5}};

const pkg=await buildFinalEvidencePackage({candidate,deepReview:review,createdAt:'2026-08-07T18:06:00.000Z'});
const handoff=await buildPromotionHandoffFromEvidence({evidencePackage:pkg,createdAt:'2026-08-07T18:07:00.000Z'});
assert(handoff.valid,'Verified final evidence must produce a valid Promotion handoff.');
assert(handoff.status==='ready-for-promotion-review',`Strong review should be ready for Promotion, got ${handoff.status}.`);
assert(handoff.promotionInputReady===true,'Strong verified package should expose Promotion review input.');
assert(handoff.reviewQuality?.gate==='quality-pass',`Strong review must quality-pass, got ${handoff.reviewQuality?.gate}.`);
assert(handoff.reviewQuality?.score>=PROMOTION_QUALITY_MINIMUM,`Strong review quality must be >=${PROMOTION_QUALITY_MINIMUM}, got ${handoff.reviewQuality?.score}.`);
assert(handoff.reviewQuality?.promotionReady===true,'Strong quality audit must be Promotion-ready.');
assert(/^[a-f0-9]{64}$/.test(handoff.reviewQuality?.auditHash||''),'Quality audit must be integrity-bound with SHA-256.');
assert(handoff.evidence.packageHash===pkg.integrity.packageHash,'Handoff must bind exact Final Evidence package hash.');
assert(handoff.researchRisk.flags.length===0&&handoff.researchRisk.cleared===false,'Safe fixture should carry no risk flags and must never mark risk as cleared.');
assert(handoff.autoApprove===false&&handoff.autoCurate===false&&handoff.autoPublish===false&&handoff.autoGitHubWrite===false,'Promotion handoff must prohibit approval/curation/publication/GitHub writes.');
const verified=await verifyPromotionHandoff(handoff);
assert(verified.ok,`Fresh Promotion handoff must verify: ${verified.errors.join('; ')}`);

const weakReview=structuredClone(review);
weakReview.visualReview.observedShots=[{n:1,observedFraming:'cinematic',observedCamera:'smooth',observedAction:'looks good',promptMatch:'strong',attentionMechanic:'dynamic',notes:'high quality'}];
weakReview.visualReview.observedTransitions=['smooth transition'];
weakReview.visualReview.observedMotion=['dynamic motion'];
weakReview.visualReview.observedArtifacts=['No major artifacts observed.'];
weakReview.visualReview.observedContinuity=['good continuity'];
weakReview.visualReview.verifiedSignatureMove='cinematic smooth premium result';
weakReview.visualReview.whyItWorked=['looks good and premium','works well and feels cinematic'];
weakReview.visualReview.whatDidNotWork=[];
weakReview.transfer.transferablePattern='Use a cinematic premium visual with smooth dynamic movement for a polished result.';
const weakPkg=await buildFinalEvidencePackage({candidate,deepReview:weakReview,createdAt:'2026-08-07T18:06:00.000Z'});
const weak=await buildPromotionHandoffFromEvidence({evidencePackage:weakPkg,createdAt:'2026-08-07T18:07:00.000Z'});
assert(weak.valid,'Formally valid but weak evidence remains a valid evidence handoff container.');
assert(['quality-review-required','blocked-review-quality'].includes(weak.status),`Weak review must require quality work, got ${weak.status}.`);
assert(weak.promotionInputReady===false,'Weak/generic review must never be Promotion-input-ready.');
assert(weak.reviewQuality?.gate!=='quality-pass'||weak.reviewQuality?.score<PROMOTION_QUALITY_MINIMUM,'Weak review must fail the Promotion quality threshold.');

const riskyPkg=await buildFinalEvidencePackage({candidate:{...candidate,riskFlags:['named-ip-or-celebrity']},deepReview:review,createdAt:'2026-08-07T18:06:00.000Z'});
const risky=await buildPromotionHandoffFromEvidence({evidencePackage:riskyPkg,createdAt:'2026-08-07T18:07:00.000Z'});
assert(risky.valid,'Risky evidence can still be valid evidence.');
assert(risky.status==='risk-review-required','Strong-quality evidence with Research risk flags must require risk review.');
assert(risky.promotionInputReady===false,'Risky handoff must not be marked Promotion-input-ready.');
assert(risky.reviewQuality?.promotionReady===true,'Risk-only fixture should still preserve the fact that review quality passed.');

const riskyWeakPkg=await buildFinalEvidencePackage({candidate:{...candidate,riskFlags:['named-ip-or-celebrity']},deepReview:weakReview,createdAt:'2026-08-07T18:06:00.000Z'});
const riskyWeak=await buildPromotionHandoffFromEvidence({evidencePackage:riskyWeakPkg,createdAt:'2026-08-07T18:07:00.000Z'});
assert(['quality-and-risk-review-required','blocked-review-quality'].includes(riskyWeak.status),'Weak + risky evidence must preserve both quality/risk pressure.');
assert(riskyWeak.promotionInputReady===false,'Weak + risky evidence can never enter Promotion automatically.');

const qualityTampered=structuredClone(handoff);
qualityTampered.reviewQuality.score=99;
const qualityCore=structuredClone(qualityTampered);delete qualityCore.handoffHash;delete qualityCore.errors;delete qualityCore.warnings;
qualityTampered.handoffHash=await hashJson(qualityCore);
const qualityTamperedResult=await verifyPromotionHandoff(qualityTampered);
assert(!qualityTamperedResult.ok,'Re-hashing a falsified quality score must still fail recomputed quality verification.');
assert(qualityTamperedResult.errors.some(message=>/quality audit/.test(message)),'Quality tamper failure must identify the audit mismatch.');

const provenanceTampered=structuredClone(handoff);provenanceTampered.provenance.author='changed';
const provenanceTamperedResult=await verifyPromotionHandoff(provenanceTampered);
assert(!provenanceTamperedResult.ok,'Tampering with Promotion handoff provenance must invalidate handoff hash.');

const invalidPkg=structuredClone(pkg);invalidPkg.deepReview.reviewStatus='prompt-reviewed';
const invalid=await buildPromotionHandoffFromEvidence({evidencePackage:invalidPkg});
assert(!invalid.valid&&invalid.status==='blocked-invalid-evidence-package','Invalid Final Evidence package must be blocked before quality/Promotion handoff.');
assert(invalid.promotionInputReady===false,'Invalid evidence can never be Promotion-input-ready.');

const html=renderPromotionHandoffHtml(handoff);
assert(html.includes('Review quality'),'Inspector must expose the Deep Review quality gate.');
assert(html.includes('QUALITY + EDITORIAL + RISK GATES STILL APPLY'),'Inspector must visibly retain all downstream gates.');
assert(html.includes('READY FOR PROMOTION REVIEW'),'Inspector must show safe handoff state.');
assert(!html.includes('<script'),'Promotion handoff inspector must be inert/static.');

const [engine,cli]=await Promise.all([readFile('studio/promotion-handoff-engine.js','utf8'),readFile('scripts/build-promotion-handoff.mjs','utf8')]);
assert(engine.includes('auditDeepReviewQuality'),'Handoff engine must run the shared Deep Review Quality Auditor.');
assert(engine.includes('PROMOTION_QUALITY_MINIMUM = 76'),'Promotion quality minimum must be explicit and testable.');
assert(engine.includes('quality-review-required')&&engine.includes('quality-and-risk-review-required'),'Handoff engine must expose explicit quality-blocked states.');
assert(engine.includes('verifyFinalEvidencePackage'),'Handoff engine must verify Final Evidence package before unwrapping.');
assert(engine.includes('autoApprove:false')&&engine.includes('autoCurate:false')&&engine.includes('autoPublish:false')&&engine.includes('autoGitHubWrite:false'),'Handoff engine must prohibit all automatic approval/publication/write actions.');
assert(!engine.includes('INDUSTRY_DIGEST.push')&&!engine.includes('MULTI_SOURCE_CASES.push'),'Handoff engine must never mutate curated data.');
assert(cli.includes('.promotion-review.json')&&cli.includes('.promotion-context.json')&&cli.includes('.promotion-handoff.html'),'CLI must produce review, context and inspector paths.');
assert(cli.includes('if(handoff.promotionInputReady===true&&handoff.promotionReviewInput)'),'CLI must not emit a Promotion review JSON until quality and risk gates pass.');
assert(cli.includes('quality:handoff.reviewQuality'),'CLI status output must expose review quality.');

if(failures.length){console.error('Promotion Handoff + Quality Gate contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,strong:{status:handoff.status,score:handoff.reviewQuality.score,grade:handoff.reviewQuality.grade},weak:{status:weak.status,score:weak.reviewQuality.score,gate:weak.reviewQuality.gate},risky:{status:risky.status},riskyWeak:{status:riskyWeak.status},qualityTamperDetected:true,reviewArtifactGated:true,autoApprove:false,autoCurate:false,autoPublish:false,autoGitHubWrite:false},null,2));
