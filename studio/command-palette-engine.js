export const COMMAND_PREFIXES = Object.freeze({
  '>': 'workspace',
  '#': 'collection',
  '@': 'creator'
});

export function buildCommandIndex(input) {
  const items = [];
  const push = item => items.push(normalizeItem(item));

  for (const workspace of input.workspaces || []) {
    push({ kind:'workspace', id:workspace.id, title:workspace.title, subtitle:workspace.subtitle || '', keywords:workspace.keywords || [], action:workspace.action || { type:'workspace', view:workspace.id } });
  }

  for (const group of input.collectionGroups || []) {
    for (const title of group.items || []) {
      push({ kind:'collection', id:`collection:${title}`, title, subtitle:group.title || '', keywords:[group.title || '', title], action:{ type:'collection', collection:title } });
    }
  }

  const creators = new Map();
  for (const item of input.curatedCases || []) {
    push({
      kind:'curated',
      id:item.id,
      title:item.title,
      subtitle:[item.author, item.sourcePlatform].filter(Boolean).join(' · '),
      keywords:[item.category,item.subcategory,...(item.collections || []),...(item.tags || []),item.author,item.sourcePlatform].filter(Boolean),
      action:{ type:'curated', id:item.id }
    });
    if (item.author) creators.set(normalize(item.author), item.author);
  }

  for (const prompt of input.originals || []) {
    push({
      kind:'original',
      id:prompt.id,
      title:prompt.title || prompt.baseTitle,
      subtitle:[prompt.category,prompt.subcategory,prompt.variation].filter(Boolean).join(' · '),
      keywords:[prompt.category,prompt.subcategory,prompt.use,prompt.mode,prompt.aspect,...(prompt.tags || [])].filter(Boolean),
      action:{ type:'original', id:prompt.id }
    });
  }

  for (const source of dedupeSources([...(input.sources || []), ...(input.sourceUniverse || [])])) {
    push({
      kind:'source',
      id:`source:${source.id || source.title || source.name}`,
      title:source.title || source.name || source.id,
      subtitle:[source.type,source.kind,source.platform].filter(Boolean).join(' · '),
      keywords:[source.type,source.kind,source.platform,source.description,source.note].filter(Boolean),
      action:{ type:'source', query:source.title || source.name || source.id, url:source.url || source.sourceUrl || '' }
    });
  }

  const queuedIds = new Set((input.reviewQueue || []).map(item => item.candidateId));
  for (const candidate of input.researchCandidates || []) {
    if ((candidate.riskFlags || []).length) continue;
    push({
      kind:'research',
      id:candidate.id,
      title:candidate.title,
      subtitle:[candidate.author,candidate.sourcePoolLabel || candidate.sourcePool].filter(Boolean).join(' · '),
      keywords:[candidate.author,candidate.sourcePoolLabel,candidate.sourcePool,...(candidate.collections || []),candidate.excerpt].filter(Boolean),
      metadata:{ queued:queuedIds.has(candidate.id), score:Number(candidate.score || 0), sourcePool:candidate.sourcePool || '' },
      action:queuedIds.has(candidate.id) ? { type:'review-candidate', candidateId:candidate.id } : { type:'research', candidateId:candidate.id, query:candidate.title }
    });
    if (candidate.author) creators.set(normalize(candidate.author), candidate.author);
  }

  for (const creator of [...creators.values()].sort((a,b)=>a.localeCompare(b))) {
    push({ kind:'creator', id:`creator:${creator}`, title:creator, subtitle:'Creator', keywords:[creator], action:{ type:'creator', creator } });
  }

  return dedupeIndex(items);
}

export function searchCommandIndex(index, rawQuery, options = {}) {
  const limit = Math.max(1, Math.min(100, Number(options.limit || 30)));
  const recent = Array.isArray(options.recent) ? options.recent : [];
  const parsed = parseCommandQuery(rawQuery);
  const q = parsed.query;
  const tokens = q.split(/\s+/).filter(Boolean);
  const recentRank = new Map(recent.map((key,index)=>[key, Math.max(1, 12 - index * 2)]));

  let pool = parsed.kind ? index.filter(item => item.kind === parsed.kind) : index;
  if (!q) {
    return [...pool]
      .map(item => ({ item, score: emptyScore(item) + (recentRank.get(item.key) || 0), reasons:['empty-query-default'] }))
      .sort(resultSort)
      .slice(0, limit);
  }

  const results = [];
  for (const item of pool) {
    const scored = scoreItem(item, q, tokens);
    if (scored.score <= 0) continue;
    scored.score += recentRank.get(item.key) || 0;
    results.push({ item, ...scored });
  }
  return results.sort(resultSort).slice(0, limit);
}

export function parseCommandQuery(rawQuery) {
  const raw = String(rawQuery || '').trim();
  const prefix = raw[0];
  const kind = COMMAND_PREFIXES[prefix] || null;
  return { raw, prefix:kind ? prefix : null, kind, query:normalize(kind ? raw.slice(1) : raw) };
}

function scoreItem(item, q, tokens) {
  let score = 0;
  const reasons = [];
  const title = item.normalizedTitle;
  const subtitle = item.normalizedSubtitle;
  const keywords = item.normalizedKeywords;
  const haystack = item.searchText;

  if (title === q) { score += 120; reasons.push('exact-title'); }
  else if (title.startsWith(q)) { score += 92; reasons.push('title-prefix'); }
  else if (title.includes(q)) { score += 74; reasons.push('title-contains'); }

  if (subtitle === q) { score += 66; reasons.push('exact-subtitle'); }
  else if (subtitle.includes(q)) { score += 42; reasons.push('subtitle'); }

  if (keywords.some(value => value === q)) { score += 60; reasons.push('exact-keyword'); }
  else if (keywords.some(value => value.includes(q))) { score += 36; reasons.push('keyword'); }

  const matchedTokens = tokens.filter(token => haystack.includes(token));
  if (tokens.length && matchedTokens.length === tokens.length) { score += 32 + Math.min(18, tokens.length * 3); reasons.push('all-tokens'); }
  else if (matchedTokens.length) { score += Math.min(20, matchedTokens.length * 5); reasons.push('partial-tokens'); }

  const compactQ = compact(q);
  if (compactQ.length >= 4 && compact(title).includes(compactQ)) { score += 18; reasons.push('compact-title'); }

  score += kindBoost(item.kind);
  if (item.kind === 'research') {
    score += Math.min(8, Math.round(Number(item.metadata?.score || 0) / 15));
    if (item.metadata?.queued) { score += 5; reasons.push('queued-research'); }
  }
  return { score, reasons };
}

function emptyScore(item) {
  const order = { workspace:100, curated:70, collection:64, original:50, research:45, source:35, creator:30 };
  return order[item.kind] || 10;
}

function kindBoost(kind) {
  return { workspace:12, curated:10, collection:8, research:6, original:5, source:3, creator:2 }[kind] || 0;
}

function resultSort(a,b) {
  return b.score - a.score || kindBoost(b.item.kind) - kindBoost(a.item.kind) || a.item.title.localeCompare(b.item.title);
}

function normalizeItem(item) {
  const keywords = (item.keywords || []).map(value => String(value || '')).filter(Boolean);
  const normalizedTitle = normalize(item.title);
  const normalizedSubtitle = normalize(item.subtitle);
  const normalizedKeywords = keywords.map(normalize);
  return {
    ...item,
    key:`${item.kind}:${item.id}`,
    title:String(item.title || item.id || ''),
    subtitle:String(item.subtitle || ''),
    keywords,
    normalizedTitle,
    normalizedSubtitle,
    normalizedKeywords,
    searchText:[normalizedTitle,normalizedSubtitle,...normalizedKeywords].filter(Boolean).join(' ')
  };
}

function dedupeIndex(items) {
  const map = new Map();
  for (const item of items) {
    const previous = map.get(item.key);
    if (!previous || item.searchText.length > previous.searchText.length) map.set(item.key,item);
  }
  return [...map.values()];
}

function dedupeSources(items) {
  const map = new Map();
  for (const item of items) {
    const key = normalize(item?.url || item?.sourceUrl || item?.title || item?.name || item?.id);
    if (!key) continue;
    const previous = map.get(key);
    if (!previous || JSON.stringify(item).length > JSON.stringify(previous).length) map.set(key,item);
  }
  return [...map.values()];
}

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[–—]/g,'-').replace(/[^\p{L}\p{N}@#.+:/_-]+/gu,' ').replace(/\s+/g,' ').trim();
}
function compact(value) { return normalize(value).replace(/[^\p{L}\p{N}]+/gu,''); }
