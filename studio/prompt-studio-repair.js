import { buildDeterministicStudioPatch, lintPromptProject, validatePromptStudioPatch, applyPromptStudioPatch } from './prompt-studio-engine.js';
import { fitTimelineToProjectDuration, lintPromptStudioTimeline } from './prompt-studio-timeline.js';
import { buildStoryboardFromTimeline, lintPromptStudioStoryboard } from './prompt-studio-storyboard.js';

const SEVERITY_WEIGHT={error:300,warning:200,info:100};

export function collectPromptStudioRepairIssues(project){
  const prompt=lintPromptProject(project);const timeline=lintPromptStudioTimeline(project);const storyboard=lintPromptStudioStoryboard(project);
  const issues=[];
  for(const issue of prompt.issues||[])issues.push(normalizeIssue('prompt',issue));
  for(const issue of timeline.issues||[])issues.push(normalizeIssue('timeline',issue));
  for(const issue of storyboard.issues||[])issues.push(normalizeIssue('storyboard',issue));
  return issues.map(issue=>({...issue,strategy:repairStrategy(issue)})).sort((a,b)=>(SEVERITY_WEIGHT[b.severity]||0)-(SEVERITY_WEIGHT[a.severity]||0)||a.source.localeCompare(b.source)||a.issueId.localeCompare(b.issueId));
}

export function repairStrategy(issue){
  const key=`${issue.source}:${issue.issueId}`;
  const map={
    'prompt:camera-conflict':{kind:'patch',preset:'camera-cleanup',allowedSections:['camera'],label:'Resolve camera conflict'},
    'prompt:too-many-camera-moves':{kind:'patch',preset:'camera-cleanup',allowedSections:['camera'],label:'Reduce competing camera moves'},
    'prompt:continuity-lock-needed':{kind:'patch',preset:'continuity',allowedSections:['continuity'],label:'Strengthen continuity locks'},
    'prompt:constraints-thin':{kind:'patch',preset:'constraints',allowedSections:['constraints'],label:'Add failure boundaries'},
    'prompt:exact-graphics-without-reference':{kind:'manual',label:'Attach a graphics reference or move exact graphics to post-production'},
    'prompt:prompt-long':{kind:'patch',preset:'shorten',allowedSections:[],label:'Shorten prompt'},
    'prompt:generic-language':{kind:'patch',preset:'tighten',allowedSections:[],label:'Replace generic language'},
    'prompt:legacy-reference-token':{kind:'manual',label:'Map the legacy media token to an explicit @refNN reference'},
    'prompt:weak-reference-role':{kind:'manual',label:'Assign a precise reference job'},
    'prompt:reference-not-locked':{kind:'reference-lock',label:'Lock the referenced identity/geometry source'},
    'prompt:missing-objective':{kind:'ai-or-manual',allowedSections:['objective'],label:'Define observable objective'},
    'prompt:missing-action':{kind:'ai-or-manual',allowedSections:['action','timing'],label:'Define visible action'},
    'timeline:timeline-duration-mismatch':{kind:'timeline-fit',label:'Fit Timeline to project duration'},
    'timeline:beat-too-short':{kind:'timeline-fit',label:'Fit Timeline duration'},
    'timeline:beat-camera-overload':{kind:'manual',label:'Edit this beat camera rule'},
    'timeline:beat-reference-unresolved':{kind:'manual',label:'Repair beat reference token'},
    'timeline:beat-action-missing':{kind:'manual',label:'Describe visible beat action'},
    'storyboard:storyboard-beat-unmapped':{kind:'storyboard-rebuild',label:'Rebuild Storyboard from Timeline'},
    'storyboard:storyboard-orphan-beat':{kind:'storyboard-rebuild',label:'Reconcile Storyboard with Timeline'},
    'storyboard:storyboard-reference-unresolved':{kind:'manual',label:'Repair Storyboard reference token'}
  };
  return map[key]||{kind:'manual',label:'Review manually'};
}

export function buildPromptStudioRepairProposal(project,repair,options={}){
  const issue=normalizeRepairInput(repair);const strategy=repairStrategy(issue);const now=options.now||Date.now();
  if(strategy.kind==='patch'){
    const patch=buildDeterministicStudioPatch(project,strategy.preset);const scoped=scopePatch(issue,strategy,patch);const validation=validatePromptStudioPatch(project,scoped);
    return{kind:'patch',issue,strategy,ok:validation.ok,patch:validation.patch,errors:validation.errors||[],backend:'rules-engine',summary:validation.patch?.summary||strategy.label};
  }
  if(strategy.kind==='reference-lock'){
    const token=String(issue.message||'').match(/@ref\d{2,}/i)?.[0]?.toLowerCase()||'';
    if(!token)return{kind:'manual',issue,strategy:{kind:'manual',label:'Choose the reference to lock'},ok:false,summary:'Reference lock needs an explicit token.',reason:'No @refNN token could be resolved from this lint issue.'};
    const next=JSON.parse(JSON.stringify(project));const ref=(next.references||[]).find(item=>String(item.token||'').toLowerCase()===token);
    if(!ref)return{kind:'manual',issue,strategy:{kind:'manual',label:'Choose the reference to lock'},ok:false,summary:'Reference lock needs an explicit reference.',reason:`${token} does not resolve to an attached reference.`};
    ref.locked=true;return{kind:'project-update',issue,strategy,ok:true,project:next,changed:[`reference:${token}:locked`],summary:strategy.label};
  }
  if(strategy.kind==='timeline-fit'){
    const next=fitTimelineToProjectDuration(project);return{kind:'project-update',issue,strategy,ok:true,project:next,changed:['timeline'],summary:strategy.label};
  }
  if(strategy.kind==='storyboard-rebuild'){
    const next=buildStoryboardFromTimeline(project,{now});return{kind:'project-update',issue,strategy,ok:true,project:next,changed:['storyboard'],summary:strategy.label};
  }
  return{kind:strategy.kind,issue,strategy,ok:false,project:null,patch:null,summary:strategy.label,instruction:buildRepairAIInstruction(issue,strategy),reason:'This repair needs explicit user judgment or a scoped AI proposal.'};
}

export function buildRepairAIInstruction(repair,strategyInput=null){
  const issue=normalizeRepairInput(repair),strategy=strategyInput||repairStrategy(issue);const allowed=(strategy.allowedSections||[]).length?` You may change only these sections: ${strategy.allowedSections.join(', ')}.`:'';
  return `Fix exactly this Prompt Studio issue and do not broaden scope: ${issue.message}.${allowed} Preserve references, custom rules, provenance and unrelated sections. Return a staged structured patch only.`;
}

export function validateRepairPatchScope(repair,patch){
  const issue=normalizeRepairInput(repair),strategy=repairStrategy(issue),allowed=new Set(strategy.allowedSections||[]);const changes=patch?.changes||[];
  if(!allowed.size)return{ok:true,errors:[]};const invalid=changes.filter(change=>!allowed.has(change.sectionId)).map(change=>change.sectionId);return{ok:invalid.length===0,errors:invalid.length?[`Repair patch escaped allowed section scope: ${[...new Set(invalid)].join(', ')}`]:[]};
}

export function applyPromptStudioRepairProposal(project,proposal,options={}){
  if(!proposal?.ok)throw new Error('Repair proposal is not safely applicable.');
  if(proposal.kind==='patch')return applyPromptStudioPatch(project,proposal.patch,{now:options.now||Date.now(),backend:options.backend||proposal.backend||'repair-center'});
  if(proposal.kind==='project-update')return JSON.parse(JSON.stringify(proposal.project));
  throw new Error(`Unsupported repair proposal kind: ${proposal.kind}`);
}

function scopePatch(issue,strategy,patch){
  const allowed=new Set(strategy.allowedSections||[]);if(!allowed.size)return patch;
  return{...patch,changes:(patch.changes||[]).filter(change=>allowed.has(change.sectionId)),warnings:[...(patch.warnings||[])]};
}
function normalizeIssue(source,issue){return{key:`${source}:${issue.id}:${issue.sectionId||issue.beatId||issue.cardId||''}`,source,issueId:String(issue.id||''),severity:String(issue.severity||'info'),message:String(issue.message||issue.id||''),sectionId:issue.sectionId||null,beatId:issue.beatId||null,cardId:issue.cardId||null};}
function normalizeRepairInput(value){if(value?.source&&value?.issueId)return value;return normalizeIssue(String(value?.source||'prompt'),{id:value?.id||value?.issueId,severity:value?.severity,message:value?.message,sectionId:value?.sectionId,beatId:value?.beatId,cardId:value?.cardId});}
