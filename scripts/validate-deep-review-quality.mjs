#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { auditDeepReviewQuality } from '../studio/review-quality-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const base={
  candidateId:'candidate-quality',reviewStatus:'deep-reviewed',reviewedAt:'2026-08-07T18:05:00.000Z',sourceVideoUrl:'https://video.twimg.com/example.mp4',
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
      {n:1,observedFraming:'Macro three-quarter bottle crop with the cap near the upper-right frame edge.',observedCamera:'The camera advances slowly for roughly four seconds without visible lateral drift.',observedAction:'Condensation beads slide down the front glass while the bottle itself stays fixed on the stone.',promptMatch:'strong',attentionMechanic:'A bright vertical reflection moves across the left shoulder of the bottle and pulls attention toward the embossed edge.',notes:'Label region remains mostly stable; one tiny edge shimmer appears at the lower-right corner.'},
      {n:2,observedFraming:'Tighter crop on the lower bottle and wet stone foreground.',observedCamera:'Camera stops before the droplet lands and holds through the final settle.',observedAction:'One droplet hits the stone at frame-left, makes a short radial splash, then the surface becomes still.',promptMatch:'partial',attentionMechanic:'The sudden droplet motion interrupts the otherwise static frame, then the eye returns to the bottle silhouette.',notes:'Requested final label-facing angle is compressed; output holds the earlier three-quarter orientation instead.'}
    ],
    observedTransitions:['A hard cut at approximately 00:04.2 switches from the upper bottle crop to the lower stone detail.'],
    observedMotion:['Camera push is continuous in shot 1; shot 2 is locked while only the droplet and small splash move.'],
    observedArtifacts:['Minor one-frame shimmer appears on the bottle lower-right glass edge near the first shot endpoint.'],
    observedContinuity:['Bottle proportions, cap height and warm key-light direction remain consistent across both shots; label-facing angle does not reach the requested frontal state.'],
    verifiedSignatureMove:'Still product geometry contrasted with one moving highlight and a single droplet interruption before a locked endpoint.',
    whyItWorked:['The first shot gives enough hold time to inspect real glass/condensation detail before any new event enters the frame.','Stopping the camera before the droplet impact isolates the splash as the only fast motion and makes the final stillness feel deliberate.'],
    whatDidNotWork:['The second shot does not complete the requested frontal packshot angle, so exact label presentation would still need a separate approved source frame.']
  },
  transfer:{
    transferablePattern:'Hold one exact hero object stable, use a single slow inspection move, interrupt with one small material event, then settle completely before the endpoint.',
    doTransfer:['stable product geometry','one inspection camera move','single material event before endpoint'],
    doNotTransfer:['source bottle identity','source label artwork','exact stone/background styling'],
    bestFor:['beauty packshot','FMCG hero','website hero loop']
  }
};

const strong=auditDeepReviewQuality(base,{expectedCandidateId:'candidate-quality',now:'2026-08-07T18:06:00.000Z'});
assert(strong.score>=76,`Specific observational review should pass quality gate; score ${strong.score}.`);
assert(['A','B'].includes(strong.grade),`Strong review should grade A/B; got ${strong.grade}.`);
assert(strong.gate==='quality-pass',`Strong review should quality-pass; got ${strong.gate}.`);
assert(strong.dimensions.separation.similarity<0.55,`Strong observed evidence should remain distinct from prompt language; similarity ${strong.dimensions.separation.similarity}.`);
assert(strong.dimensions.specificity.concreteStatements>=5,'Strong fixture should contain multiple concrete visual observations.');
assert(strong.diagnostics.promptMatches.partial===1,'Strong fixture must preserve a real partial prompt-match observation.');

const parroting=structuredClone(base);
parroting.visualReview.observedShots=parroting.promptAnatomy.shotBreakdown.map((shot,index)=>({n:index+1,observedFraming:shot.requested,observedCamera:shot.requested,observedAction:shot.requested,promptMatch:'strong',attentionMechanic:shot.requested,notes:shot.requested}));
parroting.visualReview.observedTransitions=[parroting.promptAnatomy.causalMechanics[0]];
parroting.visualReview.observedMotion=[parroting.promptAnatomy.causalMechanics[1]];
parroting.visualReview.observedArtifacts=['No major artifacts observed.'];
parroting.visualReview.observedContinuity=[parroting.promptAnatomy.thesis];
parroting.visualReview.verifiedSignatureMove=parroting.promptAnatomy.signatureMove;
parroting.visualReview.whyItWorked=[...parroting.promptAnatomy.causalMechanics];
parroting.visualReview.whatDidNotWork=[];
const parrotingAudit=auditDeepReviewQuality(parroting,{expectedCandidateId:'candidate-quality',now:'2026-08-07T18:06:00.000Z'});
assert(parrotingAudit.dimensions.separation.similarity>strong.dimensions.separation.similarity,'Prompt-parrot fixture must increase prompt/observation similarity.');
assert(parrotingAudit.flags.some(item=>/prompt-observation/.test(item.code)),'Prompt-parrot fixture must trigger overlap/parroting flag.');
assert(parrotingAudit.score<strong.score,'Prompt-parrot fixture must score below specific observed evidence.');
assert(parrotingAudit.gate!=='quality-pass'||parrotingAudit.score<strong.score-10,'Prompt-parrot review must not be treated as equivalently strong evidence.');

const generic=structuredClone(base);
generic.visualReview.observedShots=[{n:1,observedFraming:'cinematic',observedCamera:'smooth',observedAction:'looks good',promptMatch:'strong',attentionMechanic:'dynamic',notes:'high quality'}];
generic.visualReview.observedTransitions=['smooth'];generic.visualReview.observedMotion=['dynamic'];generic.visualReview.observedArtifacts=['none'];generic.visualReview.observedContinuity=['good'];generic.visualReview.verifiedSignatureMove='cinematic smooth result';generic.visualReview.whyItWorked=['looks good','works well'];generic.visualReview.whatDidNotWork=[];generic.transfer.transferablePattern='cinematic dynamic premium visual';generic.transfer.doTransfer=['style'];generic.transfer.doNotTransfer=[];
const genericAudit=auditDeepReviewQuality(generic,{expectedCandidateId:'candidate-quality'});
assert(genericAudit.flags.some(item=>item.code==='generic-review-language'),'Generic fixture must trigger generic language flag.');
assert(genericAudit.flags.some(item=>item.code==='thin-observational-fields'),'Generic fixture must trigger thin observation flag.');
assert(genericAudit.gate==='rewrite-review'||genericAudit.gate==='editorial-review','Generic fixture must not quality-pass.');

const broken=structuredClone(base);broken.evidenceAttestation.completeVideoWatched=false;broken.evidenceAttestation.method='thumbnail-review';broken.reviewStatus='prompt-reviewed';broken.sourceVideoUrl='';
const brokenAudit=auditDeepReviewQuality(broken,{expectedCandidateId:'different-candidate'});
assert(brokenAudit.gate==='blocked','Broken evidence integrity must block quality audit.');
assert(brokenAudit.flags.some(item=>item.severity==='critical'&&item.code==='evidence-integrity'),'Broken evidence must emit critical integrity flags.');

const allStrong=structuredClone(base);allStrong.visualReview.observedShots.forEach(shot=>shot.promptMatch='strong');allStrong.visualReview.whatDidNotWork=[];allStrong.visualReview.observedArtifacts=['No major artifacts observed in the complete source video.'];
const allStrongAudit=auditDeepReviewQuality(allStrong);
assert(allStrongAudit.flags.some(item=>item.code==='all-shots-strong-match'),'All-strong fixture must trigger confirmation-bias check.');
assert(allStrongAudit.flags.some(item=>item.code==='perfect-output-claim'),'Perfect-output fixture must trigger explicit recheck warning.');

const reversedTime=structuredClone(base);reversedTime.reviewedAt='2026-08-07T18:00:00.000Z';reversedTime.evidenceAttestation.attestedAt='2026-08-07T18:10:00.000Z';
const reversedAudit=auditDeepReviewQuality(reversedTime);
assert(reversedAudit.gate==='blocked','reviewedAt before attestedAt must be treated as evidence integrity failure.');

const [engine,cli]=await Promise.all([readFile('studio/review-quality-engine.js','utf8'),readFile('scripts/audit-deep-review-quality.mjs','utf8')]);
assert(engine.includes('prompt-observation-parroting')&&engine.includes('prompt-observation-overlap'),'Auditor must explicitly detect prompt/observation copying risk.');
assert(engine.includes('generic-review-language')&&engine.includes('thin-observational-fields'),'Auditor must detect generic/thin evidence writing.');
assert(engine.includes('all-shots-strong-match')&&engine.includes('perfect-output-claim'),'Auditor must challenge suspiciously perfect reviews.');
assert(!engine.includes("reviewStatus = 'deep-reviewed'")&&!engine.includes('completeVideoWatched = true'),'Auditor must never mutate review evidence state.');
assert(cli.includes('auditDeepReviewQuality'),'CLI must use shared quality engine.');

if(failures.length){console.error('Deep Review Quality Auditor contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,strong:{score:strong.score,grade:strong.grade,gate:strong.gate},parroting:{score:parrotingAudit.score,similarity:parrotingAudit.dimensions.separation.similarity,gate:parrotingAudit.gate},generic:{score:genericAudit.score,gate:genericAudit.gate},broken:{score:brokenAudit.score,gate:brokenAudit.gate},mutatesEvidence:false},null,2));
