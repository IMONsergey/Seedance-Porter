import { verifyFinalEvidencePackage, hashJson } from './evidence-package-engine.js';

export const PROMOTION_HANDOFF_KIND = 'seedance-porter-promotion-handoff';

export async function buildPromotionHandoffFromEvidence(input) {
  const pkg = input?.evidencePackage || input || {};
  const verification = await verifyFinalEvidencePackage(pkg);
  const errors = [...verification.errors];
  const warnings = [...verification.warnings];
  if (!verification.ok) {
    return {
      schemaVersion:1,
      kind:PROMOTION_HANDOFF_KIND,
      createdAt:new Date(input?.createdAt || Date.now()).toISOString(),
      candidateId:String(pkg.candidateId || ''),
      valid:false,
      status:'blocked-invalid-evidence-package',
      errors,
      warnings,
      promotionInputReady:false,
      autoApprove:false,
      autoCurate:false,
      autoPublish:false,
      boundary:'Invalid evidence packages cannot enter Promotion through this handoff.'
    };
  }

  const candidate = cloneJson(pkg.candidate || {});
  const deepReview = cloneJson(pkg.deepReview || {});
  const mediaEvidence = pkg.mediaEvidence ? cloneJson(pkg.mediaEvidence) : null;
  const riskFlags = uniqueStrings(candidate.riskFlags || []);
  const riskReviewRequired = riskFlags.length > 0;
  const sourceUrl = candidate.sourceUrl || deepReview.sourceVideoUrl || '';
  const sourceCompleteness = {
    candidateSource:Boolean(candidate.sourceUrl),
    archive:Boolean(candidate.archiveUrl),
    creator:Boolean(candidate.author),
    creatorUrl:Boolean(candidate.authorUrl),
    reviewedVideo:Boolean(deepReview.sourceVideoUrl)
  };
  const sourceFieldsComplete = Object.values(sourceCompleteness).filter(Boolean).length;

  if (!candidate.title) warnings.push('Candidate title is missing from the evidence package metadata.');
  if (!candidate.author) warnings.push('Candidate creator attribution is missing.');
  if (!candidate.sourceUrl) warnings.push('Candidate source URL is missing; Promotion must not invent provenance.');
  if (riskReviewRequired) warnings.push(`Research risk review required before curation: ${riskFlags.join(', ')}`);

  const status = riskReviewRequired ? 'risk-review-required' : 'ready-for-promotion-review';
  const promotionInputReady = !riskReviewRequired && Boolean(sourceUrl) && deepReview.reviewStatus === 'deep-reviewed';
  const handoffCore = {
    schemaVersion:1,
    kind:PROMOTION_HANDOFF_KIND,
    createdAt:new Date(input?.createdAt || Date.now()).toISOString(),
    candidateId:String(pkg.candidateId),
    valid:true,
    status,
    promotionInputReady,
    evidence:{
      packageHash:String(pkg.integrity?.packageHash || ''),
      verified:true,
      reviewStatus:'deep-reviewed',
      completeVideoWatched:true,
      reviewMethod:String(pkg.evidenceState?.reviewMethod || ''),
      reviewedAt:String(pkg.evidenceState?.reviewedAt || ''),
      attestedAt:String(pkg.evidenceState?.attestedAt || '')
    },
    candidate,
    promotionReviewInput:deepReview,
    mediaEvidenceSummary:mediaEvidence?{
      attached:true,
      coveragePercent:Number(mediaEvidence.playback?.coveragePercent || 0),
      markerCount:Array.isArray(mediaEvidence.markers)?mediaEvidence.markers.length:0,
      markerTypes:uniqueStrings((mediaEvidence.markers || []).map(item=>item.type)),
      sourceVideoUrl:String(mediaEvidence.sourceVideoUrl || '')
    }:{attached:false,coveragePercent:null,markerCount:0,markerTypes:[],sourceVideoUrl:''},
    provenance:{
      sourceUrl:String(candidate.sourceUrl || ''),
      archiveUrl:String(candidate.archiveUrl || ''),
      sourceVideoUrl:String(deepReview.sourceVideoUrl || candidate.sourceVideoUrl || ''),
      author:String(candidate.author || ''),
      authorUrl:String(candidate.authorUrl || ''),
      sourcePool:String(candidate.sourcePool || ''),
      sourcePoolLabel:String(candidate.sourcePoolLabel || ''),
      sourceCompleteness,
      sourceFieldsComplete
    },
    researchRisk:{flags:riskFlags,reviewRequired:riskReviewRequired,cleared:false},
    suggestedPromotionFiles:{
      reviewInput:`${safeName(pkg.candidateId)}.promotion-review.json`,
      context:`${safeName(pkg.candidateId)}.promotion-context.json`,
      inspector:`${safeName(pkg.candidateId)}.promotion-handoff.html`
    },
    autoApprove:false,
    autoCurate:false,
    autoPublish:false,
    autoGitHubWrite:false,
    boundary:'This handoff unwraps verified evidence for Promotion review only. It does not clear Research risk flags, approve rights/attribution, satisfy the Promotion editorial gate, create a Curation Draft, rotate the top-100, publish, or write to GitHub.'
  };

  return {
    ...handoffCore,
    errors,
    warnings,
    handoffHash:await hashJson(handoffCore)
  };
}

export async function verifyPromotionHandoff(value) {
  const errors=[];
  const warnings=[];
  const handoff=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  if(handoff.kind!==PROMOTION_HANDOFF_KIND)errors.push(`kind must equal ${PROMOTION_HANDOFF_KIND}`);
  if(!handoff.valid)errors.push('Handoff is marked invalid.');
  if(handoff.evidence?.verified!==true||handoff.evidence?.reviewStatus!=='deep-reviewed'||handoff.evidence?.completeVideoWatched!==true)errors.push('Handoff must preserve verified final evidence state.');
  if(handoff.promotionReviewInput?.candidateId!==handoff.candidateId)errors.push('Promotion review input candidateId mismatch.');
  if(handoff.candidate?.id&&handoff.candidate.id!==handoff.candidateId)errors.push('Candidate metadata ID mismatch.');
  if(handoff.autoApprove!==false||handoff.autoCurate!==false||handoff.autoPublish!==false||handoff.autoGitHubWrite!==false)errors.push('Handoff must explicitly prohibit approval/curation/publication/GitHub writes.');
  const flags=uniqueStrings(handoff.researchRisk?.flags||[]);
  if(flags.length&&handoff.promotionInputReady===true)errors.push('Handoff with unresolved Research risk flags cannot be promotionInputReady.');
  if(flags.length&&handoff.researchRisk?.cleared===true)errors.push('Handoff cannot clear Research risk flags.');
  if(!flags.length&&handoff.status==='risk-review-required')warnings.push('Handoff says risk-review-required but carries no Research risk flags.');
  const core=cloneJson(handoff);const claimed=core.handoffHash;delete core.handoffHash;delete core.errors;delete core.warnings;
  const expected=await hashJson(core);
  if(claimed!==expected)errors.push('Promotion handoff integrity hash mismatch.');
  return {ok:errors.length===0,errors,warnings,candidateId:handoff.candidateId||null,status:handoff.status||null,promotionInputReady:Boolean(handoff.promotionInputReady)};
}

export function renderPromotionHandoffHtml(handoff){
  const e=escapeHtml;
  const risk=handoff.researchRisk||{};
  const evidence=handoff.evidence||{};
  const provenance=handoff.provenance||{};
  const media=handoff.mediaEvidenceSummary||{};
  const status=handoff.promotionInputReady?'READY FOR PROMOTION REVIEW':handoff.valid?'HUMAN REVIEW REQUIRED':'BLOCKED';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seedance Porter — Promotion Handoff</title><style>${htmlCss()}</style></head><body><main><header><div><span>SEEDANCE PORTER · FINAL EVIDENCE HANDOFF</span><h1>${e(handoff.candidate?.title||handoff.candidateId)}</h1><p>Verified Deep Review evidence prepared for Promotion without clearing editorial or risk gates.</p></div><strong data-ready="${handoff.promotionInputReady?'true':'false'}">${e(status)}</strong></header>${(handoff.errors||[]).length?`<section class="notice error"><h2>Errors</h2>${handoff.errors.map(item=>`<p>• ${e(item)}</p>`).join('')}</section>`:''}${(handoff.warnings||[]).length?`<section class="notice warn"><h2>Warnings</h2>${handoff.warnings.map(item=>`<p>• ${e(item)}</p>`).join('')}</section>`:''}<section class="grid"><article><span>Evidence</span><strong>${e(evidence.reviewStatus||'')}</strong><dl><dt>Package</dt><dd>${e(evidence.packageHash||'')}</dd><dt>Method</dt><dd>${e(evidence.reviewMethod||'')}</dd><dt>Reviewed</dt><dd>${e(evidence.reviewedAt||'')}</dd><dt>Attested</dt><dd>${e(evidence.attestedAt||'')}</dd></dl></article><article><span>Research risk</span><strong>${risk.reviewRequired?'REVIEW REQUIRED':'No current risk flags'}</strong><dl><dt>Flags</dt><dd>${e((risk.flags||[]).join(' · ')||'none')}</dd><dt>Cleared</dt><dd>${e(String(risk.cleared))}</dd><dt>Promotion ready</dt><dd>${e(String(handoff.promotionInputReady))}</dd></dl></article><article><span>Provenance</span><strong>${e(provenance.author||'Unknown creator')}</strong><dl><dt>Source</dt><dd>${e(provenance.sourceUrl||'')}</dd><dt>Archive</dt><dd>${e(provenance.archiveUrl||'')}</dd><dt>Video</dt><dd>${e(provenance.sourceVideoUrl||'')}</dd><dt>Pool</dt><dd>${e(provenance.sourcePoolLabel||provenance.sourcePool||'')}</dd></dl></article><article><span>Companion timeline</span><strong>${media.attached?'attached':'not attached'}</strong><dl><dt>Coverage</dt><dd>${media.coveragePercent==null?'—':`${media.coveragePercent}%`}</dd><dt>Markers</dt><dd>${media.markerCount||0}</dd><dt>Types</dt><dd>${e((media.markerTypes||[]).join(' · '))}</dd></dl></article></section><section><h2>Suggested Promotion artifacts</h2><div class="files"><span>${e(handoff.suggestedPromotionFiles?.reviewInput||'')}</span><span>${e(handoff.suggestedPromotionFiles?.context||'')}</span><span>${e(handoff.suggestedPromotionFiles?.inspector||'')}</span></div></section><footer><strong>EDITORIAL GATE STILL REQUIRED</strong><p>${e(handoff.boundary||'')}</p><small>Handoff hash: ${e(handoff.handoffHash||'')}</small></footer></main></body></html>`;
}

function htmlCss(){return`*{box-sizing:border-box}body{margin:0;background:#f4f4f4;color:#161616;font:14px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}main{width:min(1100px,calc(100% - 32px));margin:24px auto;border:1px solid #ddd;border-radius:14px;background:#fff;padding:22px}header{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #eee;padding-bottom:16px}header span,article>span{font-size:10px;color:#888}h1{margin:3px 0;font-size:27px}p{margin:0;color:#666}header>strong{align-self:flex-start;border-radius:999px;background:#fff1ef;color:#933;padding:7px 10px;font-size:10px}header>strong[data-ready=true]{background:#eaf8ef;color:#176c36}.grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:18px}.grid article{border:1px solid #e6e6e6;border-radius:10px;padding:12px}.grid strong{display:block;margin:3px 0 9px}dl{display:grid;grid-template-columns:80px 1fr;gap:5px 9px;margin:0}dt{color:#999;font-size:10px}dd{margin:0;word-break:break-word;font-size:11px}.notice{margin-top:10px;border-radius:8px;padding:9px}.notice h2{margin:0 0 4px;font-size:11px}.notice p{font-size:10px}.notice.error{background:#fff2f1;color:#8f3028}.notice.warn{background:#fffbed;color:#735900}section{margin-top:18px}section h2{font-size:13px}.files{display:grid;gap:5px}.files span{border:1px solid #eee;border-radius:7px;padding:7px;font-family:ui-monospace,monospace;font-size:10px}footer{margin-top:20px;border-top:1px solid #eee;padding-top:13px}footer strong{font-size:11px}footer small{display:block;margin-top:6px;color:#999;word-break:break-all}@media(max-width:720px){header,.grid{display:grid;grid-template-columns:1fr}}`;}
function uniqueStrings(values){return[...new Set((Array.isArray(values)?values:[]).map(value=>String(value||'').trim()).filter(Boolean))];}
function safeName(value){return String(value||'handoff').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'');}
function cloneJson(value){return JSON.parse(JSON.stringify(value));}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
