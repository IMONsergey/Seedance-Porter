#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildWorkspaceBundle, buildWorkspaceBundleArchive, parseWorkspaceBundlePayload, planWorkspaceBundleImport, validateWorkspaceBundle } from '../studio/workspace-bundle-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const candidate={id:'candidate-safe',title:'Safe candidate',author:'@creator',sourcePool:'pool-a',sourcePoolLabel:'Pool A',sourceUrl:'https://x.com/creator/status/1',archiveUrl:'https://example.com/archive',previewUrl:'https://example.com/preview.jpg',sourceVideoUrl:'https://video.twimg.com/example.mp4',collections:['camera','macro']};
const draft={candidateId:'candidate-safe',reviewStatus:'draft',promptAnatomy:{thesis:'working thesis'},visualReview:{observedShots:[]}};
const media={schemaVersion:1,kind:'seedance-porter-review-media-evidence',candidateId:'candidate-safe',playback:{duration:15,playedRanges:[[0,4],[5,12]],coveragePercent:73,lastTime:8},markers:[]};
const promotion={candidateId:'candidate-safe',status:'draft',title:'Editorial draft'};

const bundle=buildWorkspaceBundle({candidateId:'candidate-safe',candidate,components:{deepReviewDraft:draft,mediaEvidence:media,promotionDraft:promotion},exportedAt:'2026-08-07T18:00:00.000Z'});
const valid=validateWorkspaceBundle(bundle);
assert(valid.ok,`Normal unfinished bundle must validate: ${valid.errors.join('; ')}`);
assert(valid.components.length===3,'All three unfinished component types must be transportable.');
assert(bundle.source.autoApproval===false&&bundle.source.autoGitHubWrite===false,'Bundle metadata must explicitly prohibit auto approval/GitHub write.');
assert(!('excerpt' in bundle.candidate),'Candidate transport summary must not copy Research Corpus excerpts/prompts into the bundle metadata.');
assert(bundle.componentManifest.length===3&&bundle.componentManifest.every(item=>item.bytes>0),'Bundle must include component byte manifest.');

const attested=structuredClone(bundle);
attested.components.deepReviewDraft={candidateId:'candidate-safe',reviewStatus:'deep-reviewed',evidenceAttestation:{completeVideoWatched:true}};
const attestedValidation=validateWorkspaceBundle(attested);
assert(!attestedValidation.ok,'Final deep-reviewed/attested evidence must be rejected by workspace transport.');
assert(attestedValidation.errors.some(message=>/finalized evidence|attestation/i.test(message)),'Attested review rejection must explain the evidence boundary.');

const checked=structuredClone(bundle);
checked.components.deepReviewDraft={candidateId:'candidate-safe',reviewStatus:'draft',completeVideoWatched:true};
assert(!validateWorkspaceBundle(checked).ok,'Transport must reject completeVideoWatched=true even on a draft-shaped component.');

const curatedPromotion=structuredClone(bundle);
curatedPromotion.components.promotionDraft={candidateId:'candidate-safe',status:'curated',approved:true,published:true};
assert(!validateWorkspaceBundle(curatedPromotion).ok,'Curated/approved/published Promotion state must be rejected by workspace transport.');

const mismatch=structuredClone(bundle);
mismatch.components.mediaEvidence.candidateId='candidate-other';
assert(!validateWorkspaceBundle(mismatch).ok,'Cross-candidate component binding must be rejected.');

const invalidCoverage=structuredClone(bundle);
invalidCoverage.components.mediaEvidence.playback.coveragePercent=140;
assert(!validateWorkspaceBundle(invalidCoverage).ok,'Media playback coverage above 100 must be rejected.');

const fillPlan=planWorkspaceBundleImport(bundle,{deepReviewDraft:{candidateId:'candidate-safe',reviewStatus:'draft'}},'fill-missing');
assert(fillPlan.ok,'fill-missing import plan must validate.');
assert(fillPlan.skips.some(item=>item.component==='deepReviewDraft'),'fill-missing must skip an existing local Deep Review draft.');
assert(fillPlan.writes.some(item=>item.component==='mediaEvidence')&&fillPlan.writes.some(item=>item.component==='promotionDraft'),'fill-missing must restore only missing components.');

const replacePlan=planWorkspaceBundleImport(bundle,{deepReviewDraft:{candidateId:'candidate-safe',reviewStatus:'draft'}},'replace');
assert(replacePlan.writes.some(item=>item.component==='deepReviewDraft'&&item.replace===true),'replace mode must explicitly mark overwriting an existing component.');

const second=buildWorkspaceBundle({candidateId:'candidate-two',candidate:{id:'candidate-two',title:'Two'},components:{deepReviewDraft:{candidateId:'candidate-two',reviewStatus:'draft'}},exportedAt:'2026-08-07T18:01:00.000Z'});
const archive=buildWorkspaceBundleArchive([bundle,second],{exportedAt:'2026-08-07T18:02:00.000Z'});
assert(archive.kind==='seedance-porter-workspace-bundle-archive'&&archive.summary.candidates===2,'Archive must preserve candidate count.');
const parsedArchive=parseWorkspaceBundlePayload(JSON.stringify(archive));
assert(parsedArchive.validation.ok&&parsedArchive.bundles.length===2,'Valid archive payload must parse into individual bundles.');

const duplicateArchive=structuredClone(archive);
duplicateArchive.bundles.push(structuredClone(bundle));
const parsedDuplicate=parseWorkspaceBundlePayload(duplicateArchive);
assert(!parsedDuplicate.validation.ok,'Archive with duplicate candidate IDs must be rejected.');

const unknown=parseWorkspaceBundlePayload({kind:'something-else'});
assert(!unknown.validation.ok,'Unknown transport kind must be rejected.');

const [runtime,multiSource,ui,bootstrap,sidebar,schema]=await Promise.all([
  import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href),
  import(pathToFileURL(resolve('studio/multi-source-index.js')).href),
  readFile('studio/workspace-bundle-ui.js','utf8'),
  readFile('studio/workspace-bundle-bootstrap.js','utf8'),
  readFile('studio/sidebar.js','utf8'),
  readFile('schemas/workspace-bundle.schema.json','utf8')
]);
const curated=new Set([...runtime.CASE_INTELLIGENCE.map(item=>item.id),...multiSource.MULTI_SOURCE_CASES.map(item=>item.id)]);
assert(curated.size===100,`Workspace transport must coexist with the exact-100 curated runtime; got ${curated.size}.`);
for(const prefix of ['porterDeepReviewDraft:','porterDeepReviewMediaEvidence:','porterPromotionEditorial:'])assert(ui.includes(prefix),`Bundle UI must support ${prefix}`);
assert(ui.includes('fill-missing')&&ui.includes('replace'),'Bundle UI must expose fill-missing and explicit replace modes.');
assert(ui.includes('Nothing is written until Import is clicked.')||ui.includes('Ничего не записывается до нажатия Import.'),'UI must disclose explicit-import boundary.');
assert(ui.includes('buildWorkspaceBundleArchive'),'UI must support full local WIP archive export.');
assert(!ui.includes('INDUSTRY_DIGEST.push')&&!ui.includes('MULTI_SOURCE_CASES.push'),'Bundle UI must never mutate curated runtime arrays.');
assert(!ui.includes("reviewStatus='deep-reviewed'")&&!ui.includes("reviewStatus: 'deep-reviewed'"),'Bundle UI must never create deep-reviewed state.');
assert(!ui.includes('completeVideoWatched=true'),'Bundle UI must never create complete-video attestation.');
assert(bootstrap.includes("link.href = './workspace-bundle.css'"),'Bundle bootstrap must load CSS.');
assert(bootstrap.includes("await import('./workspace-bundle-ui.js')"),'Bundle bootstrap must mount UI.');
assert(bootstrap.includes('porter-local-work-change'),'Bundle bootstrap must synchronize Operations after same-tab imports.');
const commandIndex=sidebar.indexOf("import './command-palette-bootstrap.js';");
const bundleIndex=sidebar.indexOf("import './workspace-bundle-bootstrap.js';");
assert(bundleIndex>commandIndex&&commandIndex>=0,'Workspace bundles must mount after Command Palette/Operations shell setup.');
assert(schema.includes('seedance-porter-workspace-bundle'),'Bundle schema must lock transport kind.');
assert(schema.includes('"autoApproval": { "const": false }'),'Bundle schema must prohibit auto approval.');
assert(schema.includes('"autoGitHubWrite": { "const": false }'),'Bundle schema must prohibit hidden GitHub writes.');

if(failures.length){console.error('Workspace Bundle contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,curatedCases:curated.size,components:['deepReviewDraft','mediaEvidence','promotionDraft'],archive:true,fillMissing:true,replaceExplicit:true,autoAttestation:false,autoApproval:false,autoGitHubWrite:false},null,2));
