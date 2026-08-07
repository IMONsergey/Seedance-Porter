#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { getSourceAdapter } from './source-adapter-registry.mjs';
import { mergeResearchRisk } from './research-risk-policy.mjs';

const args = parseArgs(process.argv.slice(2));
const INPUT = resolve(args.input || 'studio/case-candidates.json');
const OUTPUT = resolve(args.output || INPUT);
const LIMIT = clamp(Number(args.limit || 750), 100, 1000);

const corpus = JSON.parse(await readFile(INPUT, 'utf8'));
const existing = Array.isArray(corpus.candidates) ? corpus.candidates : [];
const sourceStats = [];
const incoming = [];

const adapters = [
  ['huyle-awesome-seedance', discoverHuyLe],
  ['astorie-seedance-source', discoverAstorie]
];

for (const [id, discover] of adapters) {
  const adapter = getSourceAdapter(id);
  try {
    const rawItems = await discover(adapter);
    const normalized = rawItems.map(item => normalizeCandidate(item, adapter));
    const safe = normalized.filter(item => !(item.riskFlags || []).length);
    incoming.push(...safe);
    sourceStats.push({
      source: id,
      discovered: rawItems.length,
      normalized: normalized.length,
      riskFlagged: normalized.length - safe.length,
      safeBeforeCrossSourceDedupe: safe.length,
      ok: true
    });
    console.error(`[case-corpus:expand] ${id}: ${rawItems.length} discovered, ${safe.length} safe`);
  } catch (error) {
    sourceStats.push({ source: id, discovered: 0, normalized: 0, riskFlagged: 0, safeBeforeCrossSourceDedupe: 0, ok: false, error: String(error?.message || error) });
    console.error(`[case-corpus:expand] ${id} failed: ${error?.message || error}`);
  }
}

const beforePolicy = dedupe([...existing, ...incoming]);
const policyChecked = beforePolicy.map(item => {
  const check = mergeResearchRisk(item.riskFlags || [], `${item.title || ''}\n${item.author || ''}\n${item.excerpt || ''}`);
  return {
    ...item,
    riskFlags: check.flags,
    ...(check.flags.length ? { riskEvidence: check.hits } : {})
  };
});
const safeCombined = policyChecked.filter(item => !(item.riskFlags || []).length);
const selected = selectBalanced(safeCombined, LIMIT);
const selectedIds = new Set(selected.map(item => item.id));

const expansionStats = sourceStats.map(stat => ({
  ...stat,
  selectedAfterGlobalDedupeAndBalance: selected.filter(item => item.sourcePool === stat.source).length
}));
const retroactivelyRemoved = beforePolicy.filter(item => !selectedIds.has(item.id) && (policyChecked.find(next => next.id === item.id)?.riskFlags || []).length).length;

const payload = {
  ...corpus,
  schemaVersion: Math.max(2, Number(corpus.schemaVersion || 1)),
  generatedAt: new Date().toISOString(),
  target: { min: Number(corpus.target?.min || 500), limit: LIMIT },
  policy: {
    ...(corpus.policy || {}),
    namedIpSafety: 'Final corpus stage re-checks title/author/excerpt against the shared Research Risk Policy before queue/planning. New adapters evaluate full prompt text before snapshotting.',
    expansionRights: 'HuyLe repository metadata is MIT; original third-party source attribution remains authoritative. Astorie has no separately verified LICENSE file, so only source metadata and <=25-word excerpts are retained.'
  },
  sourceStats: mergeSourceStats(corpus.sourceStats || [], expansionStats),
  stats: corpusStats(selected),
  expansion: {
    generatedAt: new Date().toISOString(),
    adapters: adapters.map(([id]) => id),
    discovered: expansionStats.reduce((sum, item) => sum + Number(item.discovered || 0), 0),
    safeBeforeCrossSourceDedupe: expansionStats.reduce((sum, item) => sum + Number(item.safeBeforeCrossSourceDedupe || 0), 0),
    selectedContribution: expansionStats.reduce((sum, item) => sum + Number(item.selectedAfterGlobalDedupeAndBalance || 0), 0),
    retroactiveRiskRemovals: retroactivelyRemoved
  },
  candidates: selected
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: OUTPUT, expansion: payload.expansion, stats: payload.stats, sourceStats: expansionStats }, null, 2));

async function discoverHuyLe(adapter) {
  const rawUrl = 'https://raw.githubusercontent.com/HuyLe82US/awesome-seedance-prompts/main/README.md';
  const repoUrl = adapter.upstream;
  const text = await fetchText(rawUrl, 45000);
  const headings = [...text.matchAll(/^###\s+(?:(?:\d+\.)+\s*)?\[([^\]]+)\]\((prompts\/[^)]+)\)/gm)];
  const items = [];

  for (let index = 0; index < headings.length; index += 1) {
    const title = cleanTitle(headings[index][1]);
    const promptPath = headings[index][2];
    const block = text.slice(headings[index].index, headings[index + 1]?.index ?? text.length);
    const promptMarker = block.search(/\*\*Prompt:\*\*/i);
    if (promptMarker < 0) continue;
    const prompt = block.slice(promptMarker).match(/```(?:text|markdown|\w+)?\s*([\s\S]*?)```/i)?.[1]?.trim() || '';
    if (prompt.length < 40) continue;

    const sourceMatch = block.match(/\*\*Source:\*\*\s*\[([^\]]+)\]\((https:\/\/(?:x\.com|twitter\.com)\/[^)]+)\)[\s\S]*?\[Post\]\((https:\/\/(?:x\.com|twitter\.com)\/[^)]+\/status\/\d+[^)]*)\)/i);
    const directPost = sourceMatch?.[3] || block.match(/https:\/\/(?:x\.com|twitter\.com)\/[^)\s]+\/status\/\d+[^)\s]*/i)?.[0] || '';
    const author = sourceMatch?.[1]?.trim() || creatorFromX(directPost) || 'Attributed X creator';
    const authorUrl = sourceMatch?.[2] || creatorProfileFromX(directPost);
    const previewUrl = block.match(/https:\/\/github\.com\/user-attachments\/assets\/[a-z0-9-]+/i)?.[0] || '';
    const description = strip(block.slice(headings[index][0].length, promptMarker));

    items.push({
      externalId: `huyle-${shortHash(`${directPost || promptPath}|${title}`)}`,
      title,
      author,
      authorUrl,
      sourceUrl: directPost || `${repoUrl}/blob/main/${promptPath}`,
      archiveUrl: `${repoUrl}/blob/main/${promptPath}`,
      previewUrl,
      excerpt: excerpt(description || prompt, 25),
      textForAnalysis: `${title}\n${description}\n${prompt}`,
      published: block.match(/Created:\s*([^_\n]+)/i)?.[1]?.trim() || '',
      traceability: directPost ? 5 : 3
    });
  }
  return dedupeRaw(items);
}

async function discoverAstorie(adapter) {
  const rawUrl = 'https://raw.githubusercontent.com/astorie-ai/awesome-seedance-2-prompt/main/README.md';
  const repoUrl = adapter.upstream;
  const text = await fetchText(rawUrl, 45000);
  const headings = [...text.matchAll(/^##\s+(\d+)\.\s+(@[^\n-]+?)(?:\s*-\s*[^\n]+)?$/gm)];
  const items = [];

  for (let index = 0; index < headings.length; index += 1) {
    const ordinal = headings[index][1];
    const handle = cleanTitle(headings[index][2]);
    const block = text.slice(headings[index].index, headings[index + 1]?.index ?? text.length);
    const sourceUrl = block.match(/\*\*帖子链接：\*\*\s*(https:\/\/(?:x\.com|twitter\.com)\/[^\s]+)/i)?.[1]
      || block.match(/https:\/\/(?:x\.com|twitter\.com)\/[^)\s]+\/status\/\d+[^)\s]*/i)?.[0]
      || '';
    const videoUrl = block.match(/\*\*视频直链：\*\*\s*\[MP4\]\((https:\/\/video\.twimg\.com\/[^)]+)\)/i)?.[1] || '';
    const previewPath = block.match(/<img\b[^>]*src=["']\.\/(assets\/examples\/[^"']+)["']/i)?.[1] || '';
    const promptMarker = block.search(/\*\*完整提示词/i);
    const promptRegion = promptMarker >= 0 ? block.slice(promptMarker) : block;
    const prompt = promptRegion.match(/```(?:text|markdown|\w+)?\s*([\s\S]*?)```/i)?.[1]?.trim() || '';
    if (prompt.length < 40 || !sourceUrl) continue;
    const authorMatch = block.match(/\*\*Credit：\*\*\s*(?:[^\[]*?)\[([^\]]+)\]\((https:\/\/(?:x\.com|twitter\.com)\/[^)]+)\)/i);
    const author = authorMatch?.[1]?.trim() || handle;
    const authorUrl = authorMatch?.[2] || creatorProfileFromX(sourceUrl);
    const usefulTitle = promptDerivedTitle(prompt, handle);

    items.push({
      externalId: `astorie-${ordinal}-${shortHash(sourceUrl)}`,
      title: usefulTitle,
      author,
      authorUrl,
      sourceUrl,
      archiveUrl: `${repoUrl}#${githubSlug(`${ordinal}-${handle}`)}`,
      previewUrl: previewPath ? `https://raw.githubusercontent.com/astorie-ai/awesome-seedance-2-prompt/main/${previewPath}` : '',
      sourceVideoUrl: videoUrl,
      excerpt: excerpt(prompt, 25),
      textForAnalysis: `${usefulTitle}\n${prompt}`,
      published: '',
      traceability: videoUrl ? 5 : 4
    });
  }
  return dedupeRaw(items);
}

function normalizeCandidate(item, adapter) {
  const analysisText = normalize(item.textForAnalysis || `${item.title} ${item.excerpt}`);
  const risk = mergeResearchRisk([], analysisText);
  const collections = classify(analysisText);
  const metrics = {
    sourceTraceability: Number(item.traceability || 2),
    designCommercial: hits(analysisText, HIGH_VALUE),
    motionSpecificity: hits(analysisText, MOTION_TERMS),
    shotStructure: hits(analysisText, STRUCTURE_TERMS),
    referenceStrategy: hits(analysisText, REFERENCE_TERMS)
  };
  const score = clamp(
    18
      + metrics.sourceTraceability * 5
      + Math.min(30, metrics.designCommercial * 5)
      + Math.min(24, metrics.motionSpecificity * 3)
      + Math.min(16, metrics.shotStructure * 4)
      + Math.min(10, metrics.referenceStrategy * 2)
      - risk.flags.length * 30,
    0,
    100
  );
  const sourceUrl = canonicalUrl(item.sourceUrl || item.archiveUrl);
  return {
    id: `candidate-${shortHash(`${sourceUrl}|${item.title}`)}`,
    externalId: item.externalId || '',
    title: cleanTitle(item.title),
    author: item.author || 'Unknown creator',
    authorUrl: item.authorUrl || '',
    sourceUrl,
    archiveUrl: item.archiveUrl || sourceUrl,
    previewUrl: item.previewUrl || '',
    sourceVideoUrl: item.sourceVideoUrl || '',
    excerpt: excerpt(item.excerpt || item.title, 25),
    published: item.published || '',
    sourcePool: adapter.id,
    sourcePoolLabel: adapter.label,
    sourcePriority: adapter.priority,
    license: adapter.rights,
    collections,
    score,
    metrics,
    riskFlags: risk.flags,
    ...(risk.flags.length ? { riskEvidence: risk.hits } : {}),
    reviewStatus: 'candidate',
    promptFingerprint: shortHash(normalize(item.textForAnalysis || item.excerpt || item.title)),
    discoveredAt: new Date().toISOString()
  };
}

const COLLECTION_RULES = {
  'website-hero': ['website hero','homepage','landing page','hero loop','web hero'],
  'saas-ui': ['saas','dashboard ui','software interface','product ui'],
  'app-launch': ['app launch','mobile app','application launch','product launch'],
  dashboard: ['dashboard','analytics','data visualization','control panel'],
  'case-study-motion': ['case study','showreel','portfolio','behind the scenes','brand film'],
  'brand-reveal': ['brand reveal','brand identity','branding','identity reveal','brand film'],
  'rebranding-transition': ['rebrand','rebranding','identity transition','old to new'],
  'logo-motion': ['logo reveal','logo animation','logo motion','wordmark','logomark'],
  'kinetic-type': ['kinetic type','kinetic typography','typography animation','motion graphics'],
  'interactive-web3d': ['web3d','interactive 3d','interactive website','spatial web','3d website'],
  packshot: ['packshot','product shot','product hero','product commercial','product ad','e-commerce','ecommerce','product display'],
  beauty: ['beauty','skincare','serum','cosmetic','makeup','haircare','perfume','fragrance'],
  fmcg: ['fmcg','beverage','soda','snack','consumer product','packaged food'],
  food: ['food','cooking','restaurant','coffee','pizza','burger','meal','dessert','ingredient','dining'],
  automotive: ['automotive','vehicle','racing','race car','motorcycle','suv','sedan','car commercial'],
  fashion: ['fashion','garment','clothing','streetwear','couture','runway','sneaker','apparel'],
  sports: ['sport','tennis','football','basketball','athlete','running','fitness','soccer','golf'],
  luxury: ['luxury','premium','jewelry','jewellery','watch','high-end','diamond'],
  electronics: ['electronics','smartphone','laptop','earbuds','headphones','device','gadget','tech product'],
  'real-estate': ['real estate','architecture','architectural','interior','property','apartment','villa','hotel'],
  camera: ['camera','dolly','tracking','orbit','pan ','tilt ','crane','handheld','push-in','pull-back','zoom','pov'],
  transitions: ['transition','whip pan','wipe','dissolve','smash cut','seamless cut'],
  morphs: ['morph','morphing','transform into','transformation','metamorph'],
  macro: ['macro','extreme close-up','extreme close up','close-up detail'],
  material: ['material','liquid','glass','metal','fabric','chrome','water','condensation','texture','snow','ice'],
  loop: ['seamless loop','loop-ready','loops back','return to start'],
  freeze: ['freeze frame','freeze-frame','time freezes','frozen in time','scene freezes'],
  scale: ['miniature','tiny person','colossal','giant','scale shift','micro world'],
  'match-cut': ['match cut','match-cut','shape match','motion match'],
  'first-last-frame': ['first frame','last frame','first/last','start frame','end frame','keyframe']
};
const HIGH_VALUE = ['product','commercial','advertising','brand','website','saas','interface','app','logo','typography','packaging','fashion','beauty','automotive','architecture','case study','campaign','ecommerce','luxury'];
const MOTION_TERMS = ['camera','tracking','dolly','orbit','pan','tilt','push-in','pull-back','handheld','macro','match cut','transition','morph','freeze','loop','slow motion','overhead','close-up','wide shot','pov'];
const STRUCTURE_TERMS = ['shot 1','shot 2','shot 3','00:','0:00','scene 1','scene 2','timeline','sequence','first shot','final shot'];
const REFERENCE_TERMS = ['@image','image 1','reference image','reference video','first frame','last frame','character lock','product reference','starting frame'];

function classify(text) {
  const result = [];
  for (const [id, terms] of Object.entries(COLLECTION_RULES)) if (terms.some(term => text.includes(term))) result.push(id);
  if (!result.length && /commercial|advert|product|brand/.test(text)) result.push('packshot');
  if (!result.length && /shot|camera|cinematic|lens/.test(text)) result.push('camera');
  return [...new Set(result)].slice(0, 7);
}

function selectBalanced(items, limit) {
  const sorted = [...items].sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(b.sourcePriority || 0) - Number(a.sourcePriority || 0) || String(a.title).localeCompare(String(b.title)));
  const selected = [];
  const used = new Set();
  const minimum = Math.max(4, Math.min(12, Math.floor(limit / 60)));
  for (const collection of Object.keys(COLLECTION_RULES)) {
    let count = 0;
    for (const item of sorted) {
      if (count >= minimum) break;
      if (used.has(item.id) || !item.collections?.includes(collection)) continue;
      selected.push(item); used.add(item.id); count += 1;
    }
  }
  for (const item of sorted) {
    if (selected.length >= limit) break;
    if (used.has(item.id)) continue;
    selected.push(item); used.add(item.id);
  }
  return selected.slice(0, limit).sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || String(a.title).localeCompare(String(b.title)));
}

function dedupe(items) {
  const byUrl = new Map();
  for (const item of items) {
    if (!item?.sourceUrl) continue;
    const key = canonicalUrl(item.sourceUrl);
    const previous = byUrl.get(key);
    if (!previous || quality(item) > quality(previous)) byUrl.set(key, item);
  }
  const byPrompt = new Map();
  for (const item of byUrl.values()) {
    const key = item.promptFingerprint || item.id;
    const previous = byPrompt.get(key);
    if (!previous || quality(item) > quality(previous)) byPrompt.set(key, item);
  }
  return [...byPrompt.values()];
}

function dedupeRaw(items) {
  return [...new Map(items.map(item => [`${canonicalUrl(item.sourceUrl || item.archiveUrl)}|${normalize(item.title)}`, item])).values()];
}

function quality(item) {
  return Number(item.score || 0) + Number(item.metrics?.sourceTraceability || 0) * 2 + (item.previewUrl ? 2 : 0) + (item.author && !/unknown/i.test(item.author) ? 1 : 0);
}

function corpusStats(items) {
  const collectionCounts = Object.fromEntries(Object.keys(COLLECTION_RULES).map(id => [id, 0]));
  for (const item of items) for (const id of item.collections || []) collectionCounts[id] = (collectionCounts[id] || 0) + 1;
  return {
    candidates: items.length,
    creators: new Set(items.map(item => item.author).filter(Boolean)).size,
    sourcePools: new Set(items.map(item => item.sourcePool).filter(Boolean)).size,
    withOriginalCreatorSource: items.filter(item => /(?:x\.com|twitter\.com)\//.test(item.sourceUrl || '')).length,
    withPreview: items.filter(item => item.previewUrl).length,
    withDirectSourceVideo: items.filter(item => item.sourceVideoUrl).length,
    averageScore: Math.round(items.reduce((sum, item) => sum + Number(item.score || 0), 0) / Math.max(1, items.length)),
    collectionCounts
  };
}

function mergeSourceStats(base, extra) {
  const map = new Map();
  for (const item of [...base, ...extra]) map.set(item.source, item);
  return [...map.values()];
}

function promptDerivedTitle(prompt, handle) {
  const lines = String(prompt || '').split(/\n+/).map(line => line.trim()).filter(Boolean);
  const line = lines.find(value => value.length >= 25 && !/^(copy|prompt|format|style|duration|subjects?|environment|mood|color logic|timeline)\b[:\s]/i.test(value)) || lines.find(value => value.length >= 25) || handle;
  const words = strip(line).split(/\s+/).slice(0, 12).join(' ');
  return cleanTitle(`${handle} — ${words}`);
}

async function fetchText(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'Seedance-Porter-Research/0.7 (+https://github.com/IMONsergey/Seedance-Porter)', accept: 'text/plain,text/markdown;q=0.9,*/*;q=0.8' } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}

function creatorFromX(value) {
  try { const parts = new URL(value).pathname.split('/').filter(Boolean); return parts[0] && parts[0] !== 'i' ? `@${parts[0]}` : ''; } catch { return ''; }
}
function creatorProfileFromX(value) {
  try { const url = new URL(value); const parts = url.pathname.split('/').filter(Boolean); return parts[0] && parts[0] !== 'i' ? `${url.origin}/${parts[0]}` : ''; } catch { return ''; }
}
function excerpt(value, maxWords = 25) { return strip(value).split(/\s+/).filter(Boolean).slice(0, maxWords).join(' '); }
function strip(value) { return String(value || '').replace(/<[^>]+>/g, ' ').replace(/!\[[^\]]*\]\([^)]+\)/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`>#|]/g, ' ').replace(/\s+/g, ' ').trim(); }
function normalize(value) { return strip(value).normalize('NFKC').toLowerCase(); }
function hits(text, terms) { return terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0); }
function shortHash(value) { return createHash('sha256').update(String(value)).digest('hex').slice(0, 16); }
function canonicalUrl(value) { try { const url = new URL(value); url.hash = ''; for (const key of [...url.searchParams.keys()]) if (/^utm_/i.test(key) || ['s','t'].includes(key)) url.searchParams.delete(key); return url.toString().replace(/\/$/, ''); } catch { return String(value || ''); } }
function githubSlug(value) { return String(value || '').trim().toLowerCase().replace(/[\p{P}\p{S}]+/gu, ' ').replace(/\s+/g, '-').replace(/^-+|-+$/g, ''); }
function cleanTitle(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); }
function parseArgs(argv) { const output = {}; for (let index = 0; index < argv.length; index += 1) { const arg = argv[index]; if (!arg.startsWith('--')) continue; const key = arg.slice(2); output[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true; } return output; }
