const HASH=/^[a-f0-9]{64}$/;

export function normalizeRunnerStudioLink(value){
  if(value==null)return null;if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const projectId=String(value.projectId||'').trim(),projectUpdatedAt=normalizeDate(value.projectUpdatedAt),handoffHash=String(value.handoffHash||'').toLowerCase();
  if(!projectId||!projectUpdatedAt||!HASH.test(handoffHash))return null;
  return{projectId,projectUpdatedAt,handoffHash};
}

export function applyExportStudioLinkToJob(job,exportBundle){
  const link=normalizeRunnerStudioLink(exportBundle?.studioLink);return link?{...clone(job),studioLink:link}:{...clone(job),studioLink:null};
}

export function applyJobStudioLinkToResult(result,job){
  const link=normalizeRunnerStudioLink(job?.studioLink);return link?{...clone(result),studioLink:link}:{...clone(result),studioLink:null};
}

function normalizeDate(value){if(!value)return null;const date=new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString();}
function clone(value){return JSON.parse(JSON.stringify(value??{}));}
