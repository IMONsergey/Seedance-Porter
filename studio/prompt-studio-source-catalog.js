import { CASE_INTELLIGENCE } from './case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from './multi-source-index.js';
import { PROMPTS } from './library-data.js';

let researchCandidates = [];
let researchError = '';

export async function loadPromptStudioResearchCatalog() {
  try {
    const response = await fetch('./case-candidates.json', { cache:'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    researchCandidates = Array.isArray(payload.candidates) ? payload.candidates : [];
    researchError = '';
  } catch (error) {
    researchCandidates = [];
    researchError = String(error?.message || error);
  }
  return { candidates:researchCandidates, error:researchError };
}

export function promptStudioSourceCatalog() {
  const curated = [...CASE_INTELLIGENCE, ...MULTI_SOURCE_CASES].map(item => ({
    key:`curated:${item.id}`,
    kind:'curated',
    id:item.id,
    title:item.title || item.id,
    subtitle:[item.author,item.category,item.subcategory].filter(Boolean).join(' · '),
    searchText:searchText([item.title,item.titleRu,item.author,item.category,item.subcategory,...(item.tags||[]),...(item.intelligence?.collections||item.collections||[])]),
    score:Number(item.designScore || 0),
    sourcePlatform:item.sourcePlatform || 'x',
    sourceUrl:item.sourceUrl || '',
    item
  }));
  const originals = PROMPTS.map(item => ({
    key:`original:${item.id}`,
    kind:'original',
    id:item.id,
    title:item.title || item.id,
    subtitle:[item.category,item.subcategory,item.mode,item.aspect].filter(Boolean).join(' · '),
    searchText:searchText([item.title,item.baseTitle,item.category,item.subcategory,item.use,item.mode,item.aspect,...(item.tags||[])]),
    score:Number(item.rank || 0),
    sourcePlatform:'porter',
    sourceUrl:'',
    item
  }));
  const research = researchCandidates.map(item => ({
    key:`research:${item.id}`,
    kind:'research',
    id:item.id,
    title:item.title || item.id,
    subtitle:[item.author,item.sourcePoolLabel||item.sourcePool,`score ${Number(item.score||0)}`].filter(Boolean).join(' · '),
    searchText:searchText([item.title,item.author,item.sourcePoolLabel,item.sourcePool,item.excerpt,...(item.collections||[])]),
    score:Number(item.score || 0),
    sourcePlatform:item.sourcePool || 'research',
    sourceUrl:item.sourceUrl || '',
    riskFlags:Array.isArray(item.riskFlags)?item.riskFlags:[],
    item
  }));
  return { curated, originals, research, all:[...curated,...originals,...research], researchError };
}

export function searchPromptStudioSources(query = '', kind = 'all', limit = 36) {
  const catalog = promptStudioSourceCatalog();
  const pool = kind === 'curated' ? catalog.curated : kind === 'original' ? catalog.originals : kind === 'research' ? catalog.research : catalog.all;
  const q = normalize(query);
  return pool
    .map(entry => ({ entry, score:sourceScore(entry,q) }))
    .filter(result => !q || result.score > 0)
    .sort((a,b)=>b.score-a.score || kindRank(a.entry.kind)-kindRank(b.entry.kind) || a.entry.title.localeCompare(b.entry.title))
    .slice(0, Math.max(1, Math.min(100, Number(limit || 36))))
    .map(result => result.entry);
}

export function getPromptStudioSource(kind, id) {
  const catalog = promptStudioSourceCatalog();
  const list = kind === 'curated' ? catalog.curated : kind === 'original' ? catalog.originals : kind === 'research' ? catalog.research : [];
  return list.find(entry => entry.id === id) || null;
}

export function promptStudioSourceStats() {
  const catalog = promptStudioSourceCatalog();
  return {
    curated:catalog.curated.length,
    originals:catalog.originals.length,
    research:catalog.research.length,
    safeResearch:catalog.research.filter(item=>!item.riskFlags?.length).length,
    riskyResearch:catalog.research.filter(item=>item.riskFlags?.length).length,
    researchError:catalog.researchError
  };
}

function sourceScore(entry,q) {
  if (!q) return kindRank(entry.kind) + Math.min(10,Number(entry.score||0));
  const title=normalize(entry.title);
  const haystack=entry.searchText;
  let score=0;
  if(title===q)score+=120;
  else if(title.startsWith(q))score+=90;
  else if(title.includes(q))score+=70;
  if(haystack.includes(q))score+=35;
  const tokens=q.split(/\s+/).filter(Boolean);
  const matched=tokens.filter(token=>haystack.includes(token)).length;
  if(tokens.length&&matched===tokens.length)score+=30;
  else score+=matched*5;
  score+=kindRank(entry.kind);
  return score;
}
function kindRank(kind){return {curated:25,original:20,research:15}[kind]||0;}
function searchText(values){return normalize((values||[]).flat(Infinity).filter(Boolean).join(' '));}
function normalize(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();}
