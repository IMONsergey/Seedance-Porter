#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const LIMIT = clamp(Number(args.limit || 750), 100, 1000);
const OUTPUT = resolve(args.output || 'studio/case-candidates.json');
const MIN_EXPECTED = clamp(Number(args.min || 500), 1, LIMIT);
const DETAIL_CONCURRENCY = clamp(Number(args.concurrency || 10), 2, 20);

const COLLECTION_RULES = {
  'website-hero': ['website hero','homepage','landing page','landing-page','web hero','website','hero loop'],
  'saas-ui': ['saas',' user interface',' ui ','interface','product ui','screen animation','software'],
  'app-launch': ['app launch','mobile app','application launch','product launch','launch film'],
  dashboard: ['dashboard','analytics','data visualization','data visualisation','metrics','control panel'],
  'case-study-motion': ['case study','case-study','showreel','portfolio','brand film','explainer','storytelling'],
  'brand-reveal': ['brand reveal','brand film','brand identity','branding','campaign reveal','identity reveal'],
  'rebranding-transition': ['rebrand','rebranding','old to new','before and after identity','identity transition'],
  'logo-motion': ['logo reveal','logo animation','logo motion','wordmark','brand symbol','logomark'],
  'kinetic-type': ['kinetic type','kinetic typography','typography animation','animated typography','type animation'],
  'interactive-web3d': ['web3d','interactive 3d','interactive website','portal interface','spatial web','3d website'],

  packshot: ['packshot','product shot','product hero','product commercial','product ad','product advertisement','bottle','package reveal'],
  beauty: ['beauty','skincare','skin care','serum','cosmetic','makeup','haircare','hair care','perfume','fragrance'],
  fmcg: ['fmcg','beverage','soda','drink ad','snack','consumer product','toothpaste','shampoo','packaged food'],
  food: ['food','cooking','restaurant','coffee','pizza','burger','fish','meal','dessert','ingredient'],
  automotive: ['automotive','car ','vehicle','racing','race car','motorcycle','suv','sedan','road film'],
  fashion: ['fashion','garment','clothing','streetwear','couture','runway','editorial model','sneaker','apparel'],
  sports: ['sport','tennis','football','basketball','athlete','running','fitness','workout','soccer','golf'],
  luxury: ['luxury','premium','jewelry','jewellery','watch','fragrance','high-end','quiet luxury','diamond'],
  electronics: ['electronics','smartphone','phone ','laptop','earbuds','headphones','device','gadget','camera product','tech product'],
  'real-estate': ['real estate','architecture','architectural','interior','property','apartment','house ','villa','hotel'],

  camera: ['camera','dolly','tracking shot','orbit','pan ','tilt ','crane','handheld','push-in','pull-back','zoom'],
  transitions: ['transition','whip pan','wipe','dissolve','smash cut','seamless cut','match transition'],
  morphs: ['morph','morphing','metamorph','transform into','transforms into','transformation'],
  macro: ['macro','extreme close-up','extreme close up','close-up detail','close up detail'],
  material: ['material','liquid','glass','metal','fabric','porcelain','resin','chrome','water','condensation','texture'],
  loop: ['seamless loop','loop-ready','loop ready','loops back','cyclic','return to start'],
  freeze: ['freeze frame','freeze-frame','time freezes','time freeze','frozen in time'],
  scale: ['miniature','tiny person','giant ','colossal','scale shift','micro world','miniature world'],
  'match-cut': ['match cut','match-cut','shape match','motion match'],
  'first-last-frame': ['first frame','last frame','first/last','start frame','end frame','endpoint','keyframe']
};

const HIGH_VALUE = [
  'product','commercial','advertising','brand','branding','website','saas','interface','app','logo','typography','packaging','fashion','beauty','automotive','architecture','case study','motion design','showreel','campaign','ecommerce','e-commerce','retail','luxury'
];
const MOTION_TERMS = ['camera','tracking','dolly','orbit','pan','tilt','push-in','pull-back','handheld','macro','match cut','transition','morph','freeze','loop','slow motion','overhead','close-up','wide shot'];
const STRUCTURE_TERMS = ['shot 1','shot 2','00:','0-','scene 1','scene 2','sequence','first shot','final shot','begin with','concludes with'];
const REFERENCE_TERMS = ['@image','image 1','reference image','reference video','storyboard','first frame','last frame','character lock','product reference'];
const RIGHTS_RISK = ['naruto','dragon ball','harry potter','marvel','disney','pixar','pokemon','one piece','luffy','batman','superman','star wars','coca-cola','coke','adidas','nike','real madrid','barcelona','celebrity','elon musk','kanye','kim kardashian'];

const SOURCE_CONFIG = [
  {
    id: 'seedance2prompt',
    label: 'Seedance2Prompt',
    license: 'Source-only editorial metadata; excerpt + link, no mirrored full prompt',
    discover: discoverSeedance2Prompt,
    priority: 5
  },
  {
    id: 'youmind',
    label: 'YouMind OpenLab',
    license: 'CC BY 4.0 repository; Porter still stores only a short excerpt in candidate corpus',
    discover: discoverYouMind,
    priority: 5
  },
  {
    id: 'lanshu',
    label: 'Lanshu Awesome AI Video Kit',
    license: 'Source-specific; candidate corpus stores excerpt + source link only',
    discover: discoverLanshu,
    priority: 4
  }
];

const raw = [];
const sourceStats = [];
for (const source of SOURCE_CONFIG) {
  try {
    const items = await source.discover();
    for (const item of items) raw.push(normalizeCandidate({ ...item, sourcePool: source.id, sourcePoolLabel: source.label, license: source.license, sourcePriority: source.priority }));
    sourceStats.push({ source: source.id, discovered: items.length, ok: true });
    console.error(`[case-corpus] ${source.id}: ${items.length} discovered`);
  } catch (error) {
    sourceStats.push({ source: source.id, discovered: 0, ok: false, error: String(error?.message || error) });
    console.error(`[case-corpus] ${source.id} failed: ${error?.message || error}`);
  }
}

const deduped = dedupe(raw).filter(item => item.title && item.sourceUrl);
const safe = deduped.filter(item => !item.riskFlags.includes('ip-or-brand-dependent'));
const selected = selectBalanced(safe, LIMIT);

if (selected.length < MIN_EXPECTED) {
  console.error(`[case-corpus] only ${selected.length} candidates selected; minimum requested is ${MIN_EXPECTED}`);
  process.exitCode = 2;
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  target: { min: MIN_EXPECTED, limit: LIMIT },
  policy: {
    status: 'research-candidate',
    note: 'Candidates are source discovery entries, not curated/deep-reviewed cases. Promotion requires prompt anatomy plus actual full-video visual review.',
    fullPromptStorage: 'disabled-by-default',
    excerptMaxWords: 25,
    ranking: 'balanced across requested Collections, then ranked by source traceability, design/commercial usefulness and motion specificity; engagement alone is not a quality signal.'
  },
  sourceStats,
  stats: corpusStats(selected),
  candidates: selected
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: OUTPUT, ...payload.stats, sourceStats }, null, 2));

async function discoverSeedance2Prompt() {
  const origin = 'https://www.seedance2prompt.com';
  let urls = [];
  for (const sitemap of [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap-0.xml`]) {
    try {
      const text = await fetchText(sitemap, 20000);
      const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => decodeEntities(m[1].trim()));
      if (/sitemapindex/i.test(text)) {
        const nested = (await mapLimit(locs.slice(0, 12), 4, async url => {
          try { const xml = await fetchText(url, 15000); return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => decodeEntities(m[1].trim())); } catch { return []; }
        })).flat();
        urls.push(...nested);
      } else urls.push(...locs);
      if (urls.length) break;
    } catch {}
  }

  if (!urls.length) {
    const html = await fetchText(`${origin}/prompts`, 30000);
    urls = [...html.matchAll(/href=["']([^"']+)["']/gi)]
      .map(m => absolutize(origin, decodeEntities(m[1])))
      .filter(Boolean);
  }

  urls = [...new Set(urls)]
    .filter(url => /^https:\/\/www\.seedance2prompt\.com\/prompts\//i.test(url))
    .slice(0, Math.max(LIMIT * 2, 1200));

  const details = await mapLimit(urls, DETAIL_CONCURRENCY, async (url, index) => {
    try {
      const html = await fetchText(url, 16000);
      const title = cleanTitle(meta(html, 'og:title') || tagText(html, 'title') || slugTitle(url));
      const description = meta(html, 'description') || meta(html, 'og:description') || extractUsefulText(html);
      const previewUrl = meta(html, 'og:image') || '';
      const xUrl = firstMatch(html, /https:\/\/(?:x\.com|twitter\.com)\/[^"'<>\\\s]+\/status\/\d+/i);
      const author = extractAuthor(html) || 'Seedance2Prompt source';
      if (!title || title.length < 3) return null;
      return {
        externalId: `s2p-${shortHash(url)}`,
        title,
        author,
        sourceUrl: xUrl || url,
        archiveUrl: url,
        previewUrl,
        excerpt: excerpt(description || title, 25),
        textForAnalysis: `${title}\n${description}\n${stripHtml(html).slice(0, 5000)}`,
        model: 'Seedance',
        published: extractDate(html),
        traceability: xUrl ? 5 : 3,
        sourceIndex: index
      };
    } catch { return null; }
  });
  return details.filter(Boolean);
}

async function discoverYouMind() {
  const url = 'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/README.md';
  const text = await fetchText(url, 30000);
  const headings = [...text.matchAll(/^###\s+(?:No\.\s*\d+:\s*)?(.+)$/gm)];
  const out = [];
  for (let i = 0; i < headings.length; i++) {
    const title = headings[i][1].trim();
    const start = headings[i].index;
    const end = headings[i + 1]?.index ?? text.length;
    const block = text.slice(start, end);
    if (/Table of Contents|How to Contribute|Acknowledgements/i.test(title)) continue;
    const authorMatch = block.match(/(?:\*\*Author:\*\*|- \*\*Author:\*\*)\s*\[([^\]]+)\]\(([^)]+)\)/i);
    const sourceMatch = block.match(/(?:\*\*Source:\*\*|- \*\*Source:\*\*)\s*\[[^\]]+\]\(([^)]+)\)/i);
    const watchMatch = block.match(/https:\/\/youmind\.com\/[^)\s]+/i);
    const previewMatch = block.match(/<img\s+src=["']([^"']+)["']/i);
    const promptMatch = block.match(/####\s*📝\s*Prompt[\s\S]*?```(?:\w+)?\s*([\s\S]*?)```/i);
    const descMatch = block.match(/####\s*📖\s*Description\s*([\s\S]*?)(?:####|```)/i);
    const published = block.match(/(?:\*\*Published:\*\*|- \*\*Published:\*\*)\s*([^\n]+)/i)?.[1]?.trim() || '';
    const sourceUrl = sourceMatch?.[1] || watchMatch?.[0] || `https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts#${anchor(title)}`;
    const prompt = promptMatch?.[1]?.trim() || '';
    const description = descMatch?.[1]?.replace(/\s+/g, ' ').trim() || prompt;
    if (!title || (!prompt && !description)) continue;
    out.push({
      externalId: `ym-${shortHash(sourceUrl)}`,
      title,
      author: authorMatch?.[1] || 'Community creator',
      authorUrl: authorMatch?.[2] || '',
      sourceUrl,
      archiveUrl: watchMatch?.[0] || `https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts`,
      previewUrl: previewMatch?.[1] || '',
      excerpt: excerpt(description, 25),
      textForAnalysis: `${title}\n${description}\n${prompt.slice(0, 5000)}`,
      model: 'Seedance 2.0',
      published,
      traceability: sourceMatch ? 5 : 4
    });
  }
  return out;
}

async function discoverLanshu() {
  const url = 'https://raw.githubusercontent.com/cclank/lanshu-awesome-ai-video-kit/main/prompts/seedance/README.md';
  const text = await fetchText(url, 20000);
  const headings = [...text.matchAll(/###\s+(sd-\d+)\s*·\s*([^\n`]+)/g)];
  const out = [];
  for (let i = 0; i < headings.length; i++) {
    const id = headings[i][1];
    const title = headings[i][2].trim();
    const start = headings[i].index;
    const end = headings[i + 1]?.index ?? text.length;
    const block = text.slice(start, end);
    const sourceMatch = block.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/);
    const prompt = block.match(/```\s*([\s\S]*?)```/)?.[1]?.trim() || '';
    if (!prompt) continue;
    out.push({
      externalId: `lanshu-${id}`,
      title,
      author: 'Lanshu curated source',
      sourceUrl: sourceMatch?.[1] || `https://github.com/cclank/lanshu-awesome-ai-video-kit/tree/main/prompts/seedance#${id}`,
      archiveUrl: `https://github.com/cclank/lanshu-awesome-ai-video-kit/tree/main/prompts/seedance#${id}`,
      previewUrl: '',
      excerpt: excerpt(prompt, 25),
      textForAnalysis: `${title}\n${prompt}`,
      model: 'Seedance 2.0',
      published: '',
      traceability: sourceMatch ? 3 : 2
    });
  }
  return out;
}

function normalizeCandidate(item) {
  const analysisText = normalize(item.textForAnalysis || `${item.title} ${item.excerpt}`);
  const collections = classify(analysisText);
  const riskFlags = RIGHTS_RISK.some(term => analysisText.includes(term)) ? ['ip-or-brand-dependent'] : [];
  const metrics = {
    designCommercial: hits(analysisText, HIGH_VALUE),
    motionSpecificity: hits(analysisText, MOTION_TERMS),
    structure: hits(analysisText, STRUCTURE_TERMS),
    referenceStrategy: hits(analysisText, REFERENCE_TERMS),
    sourceTraceability: Number(item.traceability || 2)
  };
  const score = Math.max(0, Math.min(100,
    18 + Math.min(30, metrics.designCommercial * 5) + Math.min(24, metrics.motionSpecificity * 3) + Math.min(14, metrics.structure * 4) + Math.min(8, metrics.referenceStrategy * 2) + metrics.sourceTraceability * 3 - riskFlags.length * 35
  ));
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
    excerpt: excerpt(item.excerpt || item.title, 25),
    model: item.model || 'AI video',
    published: item.published || '',
    sourcePool: item.sourcePool,
    sourcePoolLabel: item.sourcePoolLabel,
    sourcePriority: item.sourcePriority,
    license: item.license,
    collections,
    score,
    metrics,
    riskFlags,
    reviewStatus: 'candidate',
    promptFingerprint: shortHash(normalize(item.textForAnalysis || item.excerpt || item.title)),
    discoveredAt: new Date().toISOString()
  };
}

function selectBalanced(items, limit) {
  const sorted = [...items].sort((a,b) => b.score - a.score || b.sourcePriority - a.sourcePriority || a.title.localeCompare(b.title));
  const selected = [];
  const used = new Set();
  const minPerCollection = Math.max(5, Math.min(14, Math.floor(limit / 50)));
  for (const collection of Object.keys(COLLECTION_RULES)) {
    let taken = 0;
    for (const item of sorted) {
      if (taken >= minPerCollection) break;
      if (used.has(item.id) || !item.collections.includes(collection)) continue;
      selected.push(item); used.add(item.id); taken += 1;
    }
  }
  for (const item of sorted) {
    if (selected.length >= limit) break;
    if (used.has(item.id)) continue;
    selected.push(item); used.add(item.id);
  }
  return selected.slice(0, limit).sort((a,b) => b.score - a.score || a.title.localeCompare(b.title));
}

function classify(text) {
  const matches = [];
  for (const [id, terms] of Object.entries(COLLECTION_RULES)) if (terms.some(term => text.includes(term))) matches.push(id);
  if (!matches.length && /commercial|advert|product/.test(text)) matches.push('packshot');
  if (!matches.length && /shot|camera|cinematic/.test(text)) matches.push('camera');
  return [...new Set(matches)].slice(0, 7);
}

function dedupe(items) {
  const best = new Map();
  for (const item of items) {
    if (!item?.sourceUrl) continue;
    const key = canonicalUrl(item.sourceUrl) || normalize(item.title);
    const existing = best.get(key);
    if (!existing || item.score > existing.score) best.set(key, item);
  }
  const byPrompt = new Map();
  for (const item of best.values()) {
    const key = item.promptFingerprint || item.id;
    const existing = byPrompt.get(key);
    if (!existing || item.score > existing.score) byPrompt.set(key, item);
  }
  return [...byPrompt.values()];
}

function corpusStats(items) {
  const collectionCounts = {};
  for (const id of Object.keys(COLLECTION_RULES)) collectionCounts[id] = 0;
  for (const item of items) for (const id of item.collections) collectionCounts[id] = (collectionCounts[id] || 0) + 1;
  return {
    candidates: items.length,
    creators: new Set(items.map(x => x.author).filter(Boolean)).size,
    sourcePools: new Set(items.map(x => x.sourcePool)).size,
    withOriginalCreatorSource: items.filter(x => /(?:x\.com|twitter\.com)\//.test(x.sourceUrl)).length,
    withPreview: items.filter(x => x.previewUrl).length,
    averageScore: Math.round(items.reduce((s,x)=>s+x.score,0) / Math.max(1,items.length)),
    collectionCounts
  };
}

async function fetchText(url, timeoutMs=15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'Seedance-Porter-Research/0.5 (+https://github.com/IMONsergey/Seedance-Porter)', accept: 'text/html,application/xml,text/plain;q=0.9,*/*;q=0.8' } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}

async function mapLimit(items, concurrency, fn) {
  const results = new Array(items.length); let cursor = 0;
  async function worker() { while (true) { const index = cursor++; if (index >= items.length) return; results[index] = await fn(items[index], index); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, worker));
  return results;
}

function meta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
  ];
  for (const p of patterns) { const m=html.match(p); if(m) return decodeEntities(m[1]).trim(); }
  return '';
}
function tagText(html, tag) { return decodeEntities(html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,'i'))?.[1]?.replace(/<[^>]+>/g,' ') || '').replace(/\s+/g,' ').trim(); }
function extractUsefulText(html) {
  const text = stripHtml(html);
  const idx = text.toLowerCase().indexOf('quick answer');
  return (idx >= 0 ? text.slice(idx, idx + 900) : text.slice(0, 900)).trim();
}
function stripHtml(html) { return decodeEntities(String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim(); }
function extractAuthor(html) {
  const text = stripHtml(html);
  return text.match(/(?:Created by|Author|by)\s*[:·]?\s*([^|•\n]{2,70})/i)?.[1]?.trim().replace(/\s{2,}.*/,'') || '';
}
function extractDate(html) { return meta(html,'article:published_time') || meta(html,'date') || stripHtml(html).match(/(?:Published|Public)\s*[:·]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+202\d|202\d-\d{2}-\d{2})/i)?.[1] || ''; }
function firstMatch(text, regex) { return decodeEntities(text.match(regex)?.[0] || '').replace(/&amp;/g,'&'); }
function slugTitle(url) { try { return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '').replace(/[-_]+/g,' '); } catch { return ''; } }
function cleanTitle(value) { return decodeEntities(String(value || '')).replace(/\s*[|–—-]\s*Seedance2Prompt.*$/i,'').replace(/\s*[|–—-]\s*CyberBara.*$/i,'').replace(/\s+/g,' ').trim(); }
function normalize(value) { return decodeEntities(String(value || '')).toLowerCase().replace(/\s+/g,' ').trim(); }
function hits(text, terms) { return terms.reduce((n,t)=>n+(text.includes(t)?1:0),0); }
function excerpt(value, max=25) { return stripHtml(String(value || '')).split(/\s+/).filter(Boolean).slice(0,max).join(' '); }
function canonicalUrl(value) { try { const url=new URL(value); url.hash=''; for(const key of [...url.searchParams.keys()]) if(/^utm_/i.test(key)) url.searchParams.delete(key); return url.toString().replace(/\/$/,''); } catch { return String(value || ''); } }
function absolutize(origin, href) { try { return new URL(href, origin).toString(); } catch { return ''; } }
function anchor(value) { return normalize(value).replace(/[^\p{L}\p{N}\s-]/gu,'').replace(/\s+/g,'-'); }
function shortHash(value) { return createHash('sha256').update(String(value)).digest('hex').slice(0,16); }
function decodeEntities(value) { return String(value || '').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#x2F;/gi,'/').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))); }
function clamp(n,min,max) { return Math.max(min, Math.min(max, Number.isFinite(n)?n:min)); }
function parseArgs(argv) { const out={}; for(let i=0;i<argv.length;i++){ const a=argv[i]; if(a.startsWith('--')){ const k=a.slice(2); const v=argv[i+1] && !argv[i+1].startsWith('--') ? argv[++i] : true; out[k]=v; } } return out; }
