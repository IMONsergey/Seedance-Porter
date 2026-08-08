export const REVIEW_QUALITY_KIND='seedance-porter-deep-review-quality-audit';

export function auditDeepReviewQuality(review,input={}){
  const r=review&&typeof review==='object'?review:{};
  const flags=[];const notes=[];
  const shots=Array.isArray(r.visualReview?.observedShots)?r.visualReview.observedShots:[];
  const why=stringList(r.visualReview?.whyItWorked);
  const whatFailed=stringList(r.visualReview?.whatDidNotWork);
  const transitions=stringList(r.visualReview?.observedTransitions);
  const motion=stringList(r.visualReview?.observedMotion);
  const artifacts=stringList(r.visualReview?.observedArtifacts);
  const continuity=stringList(r.visualReview?.observedContinuity);
  const causal=stringList(r.promptAnatomy?.causalMechanics);
  const risks=stringList(r.promptAnatomy?.failureRisks);
  const transferDo=stringList(r.transfer?.doTransfer);
  const transferDont=stringList(r.transfer?.doNotTransfer);

  const structure=scoreStructure(r,shots,why,transitions,motion,artifacts,continuity);
  const specificity=scoreSpecificity(r,shots,why,whatFailed,transitions,motion,artifacts,continuity);
  const separation=scorePromptObservationSeparation(r,shots,why,transitions,motion,artifacts,continuity);
  const reflection=scoreCriticalReflection(r,why,whatFailed,artifacts,continuity);
  const transfer=scoreTransfer(r,transferDo,transferDont);
  const integrity=scoreEvidenceIntegrity(r,input);
  const repetition=detectRepetition([why,whatFailed,transitions,motion,artifacts,continuity,shots.flatMap(shot=>[shot.observedFraming,shot.observedCamera,shot.observedAction,shot.attentionMechanic,shot.notes])].flat());
  const generic=genericLanguageRisk([r.promptAnatomy?.thesis,r.promptAnatomy?.signatureMove,r.visualReview?.verifiedSignatureMove,r.transfer?.transferablePattern,...why,...whatFailed,...shots.map(shot=>shot.observedAction)].flat());

  if(separation.similarity>=0.72)flags.push(flag('high','prompt-observation-parroting',`Observed evidence shares ${Math.round(separation.similarity*100)}% of its meaningful vocabulary with requested/prompt-derived language.`));
  else if(separation.similarity>=0.55)flags.push(flag('medium','prompt-observation-overlap',`Observed evidence has high prompt-language overlap (${Math.round(separation.similarity*100)}%). Check that observed fields were written from the video, not copied from the prompt.`));
  if(repetition.maxSimilarity>=0.9&&repetition.pair)flags.push(flag('medium','repeated-evidence-language',`Two evidence statements are near-duplicates (${Math.round(repetition.maxSimilarity*100)}% token similarity).`));
  if(generic.ratio>=0.35)flags.push(flag('medium','generic-review-language',`${Math.round(generic.ratio*100)}% of evaluated statements are dominated by generic visual-quality language.`));
  if(shots.length&&shots.every(shot=>shot.promptMatch==='strong'))flags.push(flag('low','all-shots-strong-match','Every observed shot is marked strong prompt match. Recheck whether any behavior was compressed, ignored or invented.'));
  if(!whatFailed.length)flags.push(flag('low','no-explicit-failures','No whatDidNotWork observation is recorded. This is allowed, but confirm the output truly had no meaningful compromise.'));
  if(artifacts.every(isNoneObservedStatement)&&!whatFailed.length)flags.push(flag('low','perfect-output-claim','Artifacts and failures both imply a perfect output. Recheck at full playback resolution.'));
  if(specificity.shortFields>=3)flags.push(flag('medium','thin-observational-fields',`${specificity.shortFields} required observational fields are unusually short.`));
  if(integrity.errors.length)for(const message of integrity.errors)flags.push(flag('critical','evidence-integrity',message));
  if(why.length>=2&&new Set(why.map(normalize)).size<why.length)flags.push(flag('medium','duplicate-why-it-worked','whyItWorked contains duplicate statements.'));
  if(transferDont.length===0)flags.push(flag('medium','missing-transfer-boundary','No doNotTransfer boundary is recorded.'));

  const raw=structure.score+specificity.score+separation.score+reflection.score+transfer.score+integrity.score;
  const penalties=flags.reduce((sum,item)=>sum+({critical:25,high:14,medium:7,low:2}[item.severity]||0),0);
  const score=clamp(Math.round(raw-penalties),0,100);
  const grade=score>=88?'A':score>=76?'B':score>=62?'C':score>=48?'D':'F';
  const critical=flags.some(item=>item.severity==='critical');
  const high=flags.some(item=>item.severity==='high');
  const gate=critical?'blocked':score>=76&&!high?'quality-pass':score>=58?'editorial-review':'rewrite-review';

  if(score>=88)notes.push('Review has strong observational specificity, evidence separation and transfer boundaries.');
  if(separation.similarity<0.35)notes.push('Observed evidence is linguistically distinct from prompt-derived analysis, which is a healthy signal.');
  if(whatFailed.length)notes.push('Review records negative/compromise evidence rather than only positive confirmation.');

  return{
    schemaVersion:1,kind:REVIEW_QUALITY_KIND,auditedAt:new Date(input.now||Date.now()).toISOString(),candidateId:String(r.candidateId||''),reviewStatus:String(r.reviewStatus||''),score,grade,gate,
    dimensions:{structure,specificity,separation,criticalReflection:reflection,transfer,evidenceIntegrity:integrity},
    diagnostics:{repetition,genericLanguage:generic,promptMatches:countPromptMatches(shots),observedShots:shots.length,whyItWorked:why.length,whatDidNotWork:whatFailed.length},
    flags:flags.sort((a,b)=>severityRank(b.severity)-severityRank(a.severity)),notes,
    boundary:'Quality Audit evaluates review-writing/evidence discipline. It never changes reviewStatus, never attests complete-video viewing, never clears risk flags, and never approves curation.'
  };
}

function scoreStructure(r,shots,why,transitions,motion,artifacts,continuity){
  let score=0;const checks=[];
  const add=(ok,points,label)=>{if(ok)score+=points;checks.push({label,ok,points:ok?points:0,max:points});};
  add(r.reviewStatus==='deep-reviewed',2,'deep-reviewed status');
  add(Boolean(r.evidenceAttestation?.completeVideoWatched),2,'complete-video attestation');
  add(shots.length>0,4,'observed shots');
  add(why.length>=2,3,'whyItWorked depth');
  add(transitions.length>0,2,'transition observation');
  add(motion.length>0,2,'motion observation');
  add(artifacts.length>0,2,'artifact observation');
  add(continuity.length>0,2,'continuity observation');
  add(String(r.visualReview?.verifiedSignatureMove||'').trim().length>=10,1,'verified signature move');
  return{score,max:20,checks};
}

function scoreSpecificity(r,shots,why,whatFailed,transitions,motion,artifacts,continuity){
  const statements=[...shots.flatMap(shot=>[shot.observedFraming,shot.observedCamera,shot.observedAction,shot.attentionMechanic,shot.notes]),...why,...whatFailed,...transitions,...motion,...artifacts,...continuity].filter(Boolean);
  const lengths=statements.map(tokenCount);
  const avg=lengths.length?lengths.reduce((a,b)=>a+b,0)/lengths.length:0;
  const detailed=lengths.filter(value=>value>=6).length;
  const shortFields=lengths.filter(value=>value>0&&value<3).length;
  const concrete=statements.filter(hasConcreteObservation).length;
  let score=0;
  score+=Math.min(8,avg*0.8);
  score+=statements.length?8*(detailed/statements.length):0;
  score+=statements.length?7*(concrete/statements.length):0;
  score+=String(r.visualReview?.verifiedSignatureMove||'').split(/\s+/).length>=5?2:0;
  score=clamp(Math.round(score),0,25);
  return{score,max:25,statements:statements.length,averageTokens:round(avg,1),detailedStatements:detailed,concreteStatements:concrete,shortFields};
}

function scorePromptObservationSeparation(r,shots,why,transitions,motion,artifacts,continuity){
  const promptText=[r.promptAnatomy?.thesis,r.promptAnatomy?.signatureMove,JSON.stringify(r.promptAnatomy?.shotBreakdown||[]),...(r.promptAnatomy?.causalMechanics||[]),r.promptAnatomy?.referenceStrategy,...(r.promptAnatomy?.motionLanguage||[])].filter(Boolean).join(' ');
  const observedText=[...shots.flatMap(shot=>[shot.observedFraming,shot.observedCamera,shot.observedAction,shot.attentionMechanic,shot.notes]),...why,...transitions,...motion,...artifacts,...continuity,r.visualReview?.verifiedSignatureMove].filter(Boolean).join(' ');
  const similarity=jaccard(contentTokens(promptText),contentTokens(observedText));
  const score=similarity<=0.30?20:similarity<=0.42?17:similarity<=0.55?13:similarity<=0.72?8:2;
  return{score,max:20,similarity:round(similarity,3),promptVocabulary:contentTokens(promptText).size,observedVocabulary:contentTokens(observedText).size};
}

function scoreCriticalReflection(r,why,whatFailed,artifacts,continuity){
  let score=0;
  score+=why.length>=2?4:why.length?2:0;
  score+=whatFailed.length?4:1;
  score+=artifacts.some(item=>!isNoneObservedStatement(item))?3:1;
  score+=continuity.some(item=>/fail|break|drift|stable|consistent|change|preserv/i.test(item))?2:0;
  const matches=countPromptMatches(r.visualReview?.observedShots||[]);
  score+=matches.partial+matches.weak+matches.invented>0?2:0;
  return{score:clamp(score,0,15),max:15,negativeEvidence:whatFailed.length,artifactFindings:artifacts.filter(item=>!isNoneObservedStatement(item)).length,promptMismatchShots:matches.partial+matches.weak+matches.invented};
}

function scoreTransfer(r,doTransfer,doNotTransfer){
  const pattern=String(r.transfer?.transferablePattern||'');
  let score=0;
  score+=tokenCount(pattern)>=12?4:tokenCount(pattern)>=7?2:0;
  score+=doTransfer.length>=2?3:doTransfer.length?2:0;
  score+=doNotTransfer.length>=2?3:doNotTransfer.length?2:0;
  return{score:clamp(score,0,10),max:10,patternTokens:tokenCount(pattern),doTransfer:doTransfer.length,doNotTransfer:doNotTransfer.length};
}

function scoreEvidenceIntegrity(r,input){
  const errors=[];let score=10;
  if(r.reviewStatus!=='deep-reviewed'){errors.push('Quality audit requires a final deep-reviewed record.');score-=4;}
  if(r.evidenceAttestation?.completeVideoWatched!==true){errors.push('completeVideoWatched attestation is missing.');score-=4;}
  if(r.evidenceAttestation?.method!=='manual-complete-video-review'){errors.push('Attestation method must be manual-complete-video-review.');score-=3;}
  if(!isDate(r.reviewedAt)||!isDate(r.evidenceAttestation?.attestedAt)){errors.push('Review/attestation timestamps are invalid.');score-=2;}
  if(isDate(r.reviewedAt)&&isDate(r.evidenceAttestation?.attestedAt)&&new Date(r.reviewedAt)<new Date(r.evidenceAttestation.attestedAt)){errors.push('reviewedAt occurs before attestedAt.');score-=2;}
  if(!isHttpUrl(r.sourceVideoUrl)){errors.push('sourceVideoUrl is missing or invalid.');score-=3;}
  if(input.expectedCandidateId&&r.candidateId!==input.expectedCandidateId){errors.push('candidateId does not match expected candidate.');score-=4;}
  return{score:clamp(score,0,10),max:10,errors};
}

function detectRepetition(statements){
  const values=stringList(statements).filter(item=>tokenCount(item)>=4);let maxSimilarity=0;let pair=null;
  for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++){const similarity=jaccard(contentTokens(values[i]),contentTokens(values[j]));if(similarity>maxSimilarity){maxSimilarity=similarity;pair=[values[i],values[j]];}}
  return{maxSimilarity:round(maxSimilarity,3),pair};
}
function genericLanguageRisk(statements){const values=stringList(statements).filter(Boolean);const generic=/\b(cinematic|dynamic|beautiful|stunning|high quality|high-quality|realistic|smooth|nice|great|looks good|works well|premium|professional|amazing|epic|engaging)\b/i;const hits=values.filter(item=>generic.test(item)&&tokenCount(item)<=10).length;return{statements:values.length,genericStatements:hits,ratio:values.length?round(hits/values.length,3):0};}
function hasConcreteObservation(value){return /\b(left|right|top|bottom|foreground|background|frame|camera|lens|push|pull|pan|tilt|orbit|track|hand|face|product|object|light|shadow|reflection|edge|motion|moves|stops|settles|cut|transition|focus|blur|texture|surface|color|geometry|seconds?|\d+s|\d+:\d+)\b/i.test(String(value||''));}
function isNoneObservedStatement(value){return /\b(no |none|not observed|no major|without visible|did not observe)\b/i.test(String(value||''));}
function countPromptMatches(shots){const out={strong:0,partial:0,weak:0,invented:0,unknown:0};for(const shot of shots||[]){const key=String(shot.promptMatch||'unknown');if(key in out)out[key]++;else out.unknown++;}return out;}
function contentTokens(value){const stop=new Set(['the','and','for','with','that','this','from','into','while','then','one','only','same','over','under','a','an','of','to','in','on','is','are','be','as','it','its']);return new Set(normalize(value).split(/\s+/).filter(token=>token.length>=3&&!stop.has(token)));}
function jaccard(a,b){if(!a.size&&!b.size)return 0;let intersection=0;for(const value of a)if(b.has(value))intersection++;return intersection/(a.size+b.size-intersection||1);}
function flag(severity,code,message){return{severity,code,message};}
function severityRank(value){return{critical:4,high:3,medium:2,low:1}[value]||0;}
function stringList(value){return(Array.isArray(value)?value:[value]).flat(Infinity).map(item=>String(item??'').trim()).filter(Boolean);}
function tokenCount(value){return normalize(value).split(/\s+/).filter(Boolean).length;}
function normalize(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function isDate(value){return Boolean(value)&&!Number.isNaN(new Date(value).getTime());}
function isHttpUrl(value){try{return['http:','https:'].includes(new URL(String(value||'')).protocol);}catch{return false;}}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function round(value,digits=0){const factor=10**digits;return Math.round(value*factor)/factor;}
