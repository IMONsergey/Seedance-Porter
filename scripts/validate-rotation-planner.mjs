#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { buildCuratedRotationPlan } from '../studio/rotation-engine.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const current=[];
for(let index=0;index<96;index++){
  current.push({id:`camera-${index}`,title:`Camera ${index}`,author:`@creator-${index%12}`,sourcePlatform:index%2?'x':'github',collections:['Camera'],designScore:index===0?1:3,evidenceStatus:'unknown'});
}
current.push({id:'rare-saas',title:'Rare SaaS',author:'@saas',sourcePlatform:'behance',collections:['SaaS UI'],designScore:3,evidenceStatus:'unknown'});
current.push({id:'deep-camera',title:'Deep Camera',author:'@deep',sourcePlatform:'x',collections:['Camera'],designScore:2,evidenceStatus:'deep-reviewed'});
current.push({id:'beauty-existing-a',title:'Beauty Existing A',author:'@beauty-a',sourcePlatform:'x',collections:['Beauty','Packshot'],designScore:4,evidenceStatus:'prompt-reviewed'});
current.push({id:'beauty-existing-b',title:'Beauty Existing B',author:'@beauty-b',sourcePlatform:'github',collections:['Beauty'],designScore:4,evidenceStatus:'unknown'});
assert(current.length===100,'Synthetic curated fixture must contain exactly 100 cases.');

const coveragePlan={collections:[
  {id:'beauty',title:'Beauty',curated:2,targetCurated:5,priority:92,health:'critical'},
  {id:'packshot',title:'Packshot',curated:1,targetCurated:4,priority:84,health:'critical'},
  {id:'camera',title:'Camera',curated:97,targetCurated:12,priority:10,health:'stable'},
  {id:'saas-ui',title:'SaaS UI',curated:1,targetCurated:3,priority:80,health:'critical'}
]};

const incoming={
  schemaVersion:1,
  kind:'seedance-porter-curation-draft',
  candidateId:'incoming-beauty',
  reviewStatus:'deep-reviewed',
  readiness:{score:92,sourceTraceability:5},
  editorialGate:{sourceChecked:true,rightsChecked:true,adaptationIndependent:true,caseUseful:true},
  case:{
    id:'incoming-beauty',title:'Incoming Beauty Hero',author:'@new-beauty',sourcePlatform:'vimeo',collections:['Beauty','Packshot'],designScore:5,
    porterAdaptation:'Independent adaptation '.repeat(20)
  },
  source:{sourceUrl:'https://vimeo.com/123456789',platform:'vimeo'}
};

const plan=buildCuratedRotationPlan({currentCases:current,coveragePlan,incomingDraft:incoming,now:'2026-08-07T18:00:00.000Z'});
assert(plan.valid,`Valid exact-100 rotation fixture must pass: ${plan.errors.join('; ')}`);
assert(plan.invariant.curatedSize===100&&plan.invariant.autoSwap===false&&plan.invariant.autoPublish===false,'Rotation invariant must lock 100 and prohibit auto swap/publish.');
assert(plan.incomingStrategicGain.score>25,'Critical Beauty/Packshot deep-reviewed incoming case must have meaningful strategic gain.');
assert(plan.decision.status==='consider-swap'||plan.decision.status==='editorial-review',`Strong incoming case should reach swap/editorial consideration; got ${plan.decision.status}.`);
assert(plan.recommendedReplacement,'Strong incoming fixture must produce a replacement candidate.');
assert(plan.recommendedReplacement.removeCaseId!=='rare-saas','Planner must not prefer removing the only SaaS UI case when SaaS is critical.');
assert(plan.recommendedReplacement.removeCaseId!=='deep-camera','Planner must not prefer removing a deep-reviewed case when many low-cost redundant Camera cases exist.');
assert(plan.recommendedReplacement.removeCaseId.startsWith('camera-'),'Planner should prefer one of the redundant Camera cases in this fixture.');
assert(plan.recommendedReplacement.projectedCollections.some(item=>item.id==='beauty'&&item.delta===1),'Recommended swap must show +1 Beauty delta.');
assert(plan.recommendedReplacement.projectedCollections.some(item=>item.id==='packshot'&&item.delta===1),'Recommended swap must show +1 Packshot delta.');

const rareSaasCandidate=plan.alternatives.find(item=>item.removeCaseId==='rare-saas')||null;
const allCandidates=[plan.recommendedReplacement,...plan.alternatives];
assert(!allCandidates.slice(0,3).some(item=>item?.removeCaseId==='rare-saas'),'Rare critical SaaS case should not be a top replacement candidate.');

const deepEntry=[plan.recommendedReplacement,...plan.alternatives].find(item=>item?.removeCaseId==='deep-camera');
if(deepEntry)assert(deepEntry.removalPenalty.reasons.includes('evidence-maturity'),'Deep-reviewed removal must carry explicit evidence-maturity penalty.');

const invalidSize=buildCuratedRotationPlan({currentCases:current.slice(0,99),coveragePlan,incomingDraft:incoming,now:'2026-08-07T18:00:00.000Z'});
assert(!invalidSize.valid&&invalidSize.decision.status==='blocked','Rotation must block when current curated runtime is not exactly 100.');

const duplicateIncoming=buildCuratedRotationPlan({currentCases:current,coveragePlan,incomingDraft:{...incoming,candidateId:'rare-saas',case:{...incoming.case,id:'rare-saas'}},now:'2026-08-07T18:00:00.000Z'});
assert(!duplicateIncoming.valid,'Incoming candidate already present in curated runtime must be rejected.');

const weakIncoming=buildCuratedRotationPlan({currentCases:current,coveragePlan,incomingDraft:{candidateId:'weak',case:{id:'weak',title:'Weak',collections:['Camera'],designScore:0,porterAdaptation:''},source:{sourceUrl:'https://x.com/a/status/2'}},now:'2026-08-07T18:00:00.000Z'});
assert(['hold','editorial-review'].includes(weakIncoming.decision.status),'Weak redundant incoming case must not produce confident consider-swap.');
assert(weakIncoming.decision.recommendedSwap===false,'Weak case must never recommend a swap.');

const [runtime,multiSource,ui,bootstrap]=await Promise.all([
  import(pathToFileURL(resolve('studio/case-intelligence-runtime.js')).href),
  import(pathToFileURL(resolve('studio/multi-source-index.js')).href),
  readFile('studio/rotation-ui.js','utf8'),
  readFile('studio/rotation-bootstrap.js','utf8')
]);
const live=new Set([...runtime.CASE_INTELLIGENCE.map(item=>item.id),...multiSource.MULTI_SOURCE_CASES.map(item=>item.id)]);
assert(live.size===100,`Rotation Planner must evaluate the same exact-100 curated runtime; got ${live.size}.`);
assert(ui.includes('./coverage-plan.json')&&ui.includes('./case-candidates.json'),'Rotation UI must use current coverage/candidate context when available.');
assert(ui.includes('data-rotation-open-case'),'Rotation UI must allow inspection of a recommended existing curated case.');
assert(!ui.includes('data-rotation-replace')&&!ui.includes('Replace case'),'Rotation UI must not expose an automatic replacement action.');
assert(!ui.includes('INDUSTRY_DIGEST.push')&&!ui.includes('MULTI_SOURCE_CASES.push'),'Rotation UI must never mutate curated arrays.');
assert(!/digestGrid\.innerHTML\s*=/.test(ui)&&!/digestGrid\.append/.test(ui),'Rotation UI may open an existing card but must never rewrite/append curated DOM.');
assert(bootstrap.includes("link.href = './rotation.css'"),'Rotation bootstrap must load CSS.');
assert(bootstrap.includes("await import('./rotation-ui.js')"),'Rotation bootstrap must mount UI.');

if(failures.length){console.error('Curated Rotation Planner contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,liveCuratedCases:live.size,decision:plan.decision.status,recommendedReplacement:plan.recommendedReplacement?.removeCaseId,incomingGain:plan.incomingStrategicGain.score,autoSwap:false,autoPublish:false},null,2));
