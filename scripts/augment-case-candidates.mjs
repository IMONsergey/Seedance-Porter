#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const INPUT = resolve(args.input || 'studio/case-candidates.json');
const OUTPUT = resolve(args.output || INPUT);
const LIMIT = clamp(Number(args.limit || 750), 100, 1000);

const corpus = JSON.parse(await readFile(INPUT, 'utf8'));
const existing = Array.isArray(corpus.candidates) ? corpus.candidates : [];
const discovered = [];
const sourceStats = [];

const SOURCE_DEFS = [
  {
    id: 'zerolu-awesome-seedance',
    label: 'ZeroLu Awesome Seedance',
    priority: 5,
    license: 'MIT repository; candidate corpus stores attribution + short excerpt only',
    discover: discoverZeroLu
  },
  {
    id: 'awesome-ai-video-ads',
    label: 'Awesome AI Video-Ad Prompts',
    priority: 5,
    license: 'CC BY 4.0 original prompt collection; candidate corpus stores attribution + short excerpt only',
    discover: discoverAdVideoPrompts
  },
  {
    id: 'marsoyang-seedance-prompts',
    label: 'Awesome Seedance Prompts CN',
    priority: 4,
    license: 'Source-attributed public repository; candidate corpus stores attribution + short excerpt only',
    discover: discoverMarsoyang
  }
];

for (const source of SOURCE_DEFS) {
  try {
    const items = await source.discover();
    for (const item of items) {
      discovered.push(normalizeCandidate({
        ...item,
        sourcePool: source.id,
        sourcePoolLabel: source.label,
        sourcePriority: source.priority,
        license: source.license
      }));
    }
    sourceStats.push({ source: source.id, discovered: items.length, ok: true });
    console.error(`[case-corpus:augment] ${source.id}: ${items.length} discovered`);
  } catch (error) {
    sourceStats.push({ source: source.id, discovered: 0, ok: false, error: String(error?.message || error) });
    console.error(`[case-corpus:augment] ${source.id} failed: ${error?.message || error}`);
  }
}

const safeDiscovered = discovered.filter(item => !item.riskFlags.includes('named-ip-or-celebrity'));
const combined = dedupe([...existing, ...safeDiscovered]);
const selected = selectBalanced(combined, LIMIT);
const mergedSourceStats = mergeSourceStats(corpus.sourceStats || [], sourceStats);
const previousIds = new Set(existing.map(item => item.id));
const added = selected.filter(item => !previousIds.has(item.id)).length;

const payload = {
  ...corpus,
  generatedAt: new Date().toISOString(),
  target: {
    min: Number(corpus.target?.min || 500),
    limit: LIMIT
  },
  policy: {
    ...(corpus.policy || {}),
    augmentation: 'Additional attributed public corpora are merged as research candidates only. Full prompts are not mirrored into the snapshot; source links and <=25-word excerpts are stored.'
  },
  sourceStats: mergedSourceStats,
  stats: corpusStats(selected),
  augmentation: {
    generatedAt: new Date().toISOString(),
    sources: SOURCE_DEFS.map(source => source.id),
    discovered: discovered.length,
    safeAfterRiskFilter: safeDiscovered.length,
    netNewSelected: added
  },
  candidates: selected
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: OUTPUT, augmentation: payload.augmentation, stats: payload.stats, sourceStats }, null, 2));

async function discoverZeroLu() {
  const rawUrl = 'https://raw.githubusercontent.com/ZeroLu/awesome-seedance/main/README.md';
  const repoUrl = 'https://github.com/ZeroLu/awesome-seedance';
  const text = await fetchText(rawUrl, 45000);
  const headings = [...text.matchAll(/^###\s+(?:(?:\d+\.)+\s*)?(.+)$/gm)];
  const items = [];

  for (let index = 0; index < headings.length; index += 1) {
    const title = cleanTitle(headings[index][1]);
    const block = text.slice(headings[index].index, headings[index + 1]?.index ?? text.length);
    const marker = block.search(/\*\*Prompt:\*\*/i);
    if (marker < 0) continue;
    const prompt = block.slice(marker).match(/```(?:text|markdown|\w+)?\s*([\s\S]*?)```/i)?.[1]?.trim() || '';
    if (!prompt || prompt.length < 40) continue;

    const xUrl = block.match(/https:\/\/(?:x\.com|twitter\.com)\/[^)\s]+\/status\/\d+[^)\s]*/i)?.[0] || '';
    const previewUrl = block.match(/https:\/\/github\.com\/user-attachments\/assets\/[a-z0-9-]+/i)?.[0] || '';
    const description = block.slice(0, marker).replace(/^###[^\n]*\n/, '').replace(/\*Source:[\s\S]*$/i, '').trim();
    const author = creatorFromX(xUrl) || block.match(/\*Source:\s*([^\n(]+)/i)?.[1]?.trim() || 'Attributed creator';
    const anchor = githubSlug(title);

    items.push({
      externalId: `zerolu-${shortHash(`${xUrl || repoUrl}|${title}`)}`,
      title,
      author,
      authorUrl: creatorProfileFromX(xUrl),
      sourceUrl: xUrl || `${repoUrl}/blob/main/README.md?case=${encodeURIComponent(anchor)}`,
      archiveUrl: `${repoUrl}#${anchor}`,
      previewUrl,
      excerpt: excerpt(description || prompt, 25),
      textForAnalysis: `${title}\n${description}\n${prompt}`,
      published: '',
      traceability: xUrl ? 5 : 3
    });
  }
  return items;
}

async function discoverAdVideoPrompts() {
  const rawUrl = 'https://raw.githubusercontent.com/LichAmnesia/awesome-ad-video-prompts/main/README.md';
  const repoUrl = 'https://github.com/LichAmnesia/awesome-ad-video-prompts';
  const text = await fetchText(rawUrl, 45000);
  const headings = [...text.matchAll(/^###\s+(.+)$/gm)];
  const items = [];

  for (let index = 0; index < headings.length; index += 1) {
    const title = cleanTitle(headings[index][1]);
    const block = text.slice(headings[index].index, headings[index + 1]?.index ?? text.length);
    const prompt = block.match(/```(?:text|markdown|\w+)?\s*([\s\S]*?)```/i)?.[1]?.trim() || '';
    if (!prompt || prompt.length < 60) continue;

    const generateUrl = block.match(/https:\/\/heydreaming\.com\/prompts\/[^)\s]+/i)?.[0] || '';
    const imagePath = block.match(/<img\s+src=["'](images\/[^"']+)["']/i)?.[1] || '';
    const metadata = strip(block.slice(0, Math.max(0, block.indexOf('```'))));
    const anchor = githubSlug(title);

    items.push({
      externalId: `aivad-${shortHash(title)}`,
      title,
      author: 'LichAmnesia / HeyDreaming',
      authorUrl: repoUrl,
      sourceUrl: generateUrl || `${repoUrl}/blob/main/README.md?case=${encodeURIComponent(anchor)}`,
      archiveUrl: `${repoUrl}#${anchor}`,
      previewUrl: imagePath ? `https://raw.githubusercontent.com/LichAmnesia/awesome-ad-video-prompts/main/${imagePath}` : '',
      excerpt: excerpt(prompt, 25),
      textForAnalysis: `${title}\n${metadata}\n${prompt}`,
      published: '',
      traceability: 5
    });
  }
  return items;
}

async function discoverMarsoyang() {
  const rawUrl = 'https://raw.githubusercontent.com/marsoyang1/awesome-seedance-prompts/main/README.md';
  const repoUrl = 'https://github.com/marsoyang1/awesome-seedance-prompts';
  const text = await fetchText(rawUrl, 45000);
  const headings = [...text.matchAll(/^###\s+🎬\s*视频\s*\d+\s*\|\s*(.+)$/gm)];
  const items = [];

  for (let index = 0; index < headings.length; index += 1) {
    const title = cleanTitle(headings[index][1]);
    const block = text.slice(headings[index].index, headings[index + 1]?.index ?? text.length);
    const fullMarker = block.search(/####\s*📋\s*完整提示词原文/i);
    const promptRegion = fullMarker >= 0 ? block.slice(fullMarker) : block;
    const prompt = promptRegion.match(/```(?:text|markdown|\w+)?\s*([\s\S]*?)```/i)?.[1]?.trim() || '';
    if (!prompt || prompt.length < 40) continue;

    const xUrl = block.match(/https:\/\/(?:x\.com|twitter\.com)\/[^)\s]+(?:\/status\/\d+|\/i\/status\/\d+)[^)\s]*/i)?.[0] || '';
    const previewPath = block.match(/!\[[^\]]*\]\((source\/[^)]+\.(?:gif|png|jpe?g|webp))\)/i)?.[1] || '';
    const summary = strip(block.slice(0, fullMarker >= 0 ? fullMarker : Math.min(block.length, 1600)));
    const anchor = githubSlug(`视频-${index + 1}-${title}`);

    items.push({
      externalId: `mars-${shortHash(`${xUrl || repoUrl}|${title}`)}`,
      title,
      author: creatorFromX(xUrl) || 'Attributed X creator',
      authorUrl: creatorProfileFromX(xUrl),
      sourceUrl: xUrl || `${repoUrl}/blob/main/README.md?case=${encodeURIComponent(anchor)}`,
      archiveUrl: `${repoUrl}#${anchor}`,
      previewUrl: previewPath ? `https://raw.githubusercontent.com/marsoyang1/awesome-seedance-prompts/main/${previewPath}` : '',
      excerpt: excerpt(summary || prompt, 25),
      textForAnalysis: `${title}\n${summary}\n${prompt}`,
      published: '',
      traceability: xUrl ? 5 : 3
    });
  }
  return items;
}

const COLLECTION_RULES = {
  'website-hero': ['website hero','homepage','landing page','web hero','hero loop','landing-page','网站','网页'],
  'saas-ui': ['saas','user interface','product ui','software interface','dashboard ui','ui animation','glass ui','interface animation','界面'],
  'app-launch': ['app launch','mobile app','product launch','launch film','application launch','应用发布'],
  dashboard: ['dashboard','analytics','data visualization','metrics','control panel','仪表盘','数据可视化'],
  'case-study-motion': ['case study','case-study','portfolio','showreel','brand film','explainer','behind the scenes','bts','案例'],
  'brand-reveal': ['brand reveal','brand identity','branding','identity reveal','brand film','commercial branding','品牌'],
  'rebranding-transition': ['rebrand','rebranding','old to new','identity transition','品牌重塑'],
  'logo-motion': ['logo reveal','logo animation','logo motion','wordmark','brand symbol','logomark','标志动画'],
  'kinetic-type': ['kinetic type','kinetic typography','typography animation','animated typography','type animation','motion graphics ad','动态字体'],
  'interactive-web3d': ['web3d','interactive 3d','interactive website','spatial web','3d website','portal interface','glass ui'],
  packshot: ['packshot','product shot','product hero','product commercial','product ad','product advertisement','package reveal','ads & products','产品广告','产品展示'],
  beauty: ['beauty','skincare','skin care','serum','cosmetic','makeup','haircare','hair care','perfume','fragrance','护肤','美妆','香水'],
  fmcg: ['fmcg','beverage','soda','drink ad','snack','consumer product','toothpaste','shampoo','packaged food','饮料','快消'],
  food: ['food','cooking','restaurant','coffee','pizza','burger','fish','meal','dessert','ingredient','食物','咖啡','餐厅'],
  automotive: ['automotive','vehicle','racing','race car','motorcycle','suv','sedan','car commercial','road film','vehicles & travel','赛车','汽车','摩托'],
  fashion: ['fashion','garment','clothing','streetwear','couture','runway','editorial model','sneaker','apparel','时尚','服装','球鞋'],
  sports: ['sport','tennis','football','basketball','athlete','running','fitness','workout','soccer','golf','运动','篮球','足球'],
  luxury: ['luxury','premium','jewelry','jewellery','watch','high-end','quiet luxury','diamond','奢华','珠宝','手表'],
  electronics: ['electronics','smartphone','laptop','earbuds','headphones','device','gadget','camera product','tech product','耳机','手机','电子'],
  'real-estate': ['real estate','architecture','architectural','interior','property','apartment','villa','hotel','建筑','室内','酒店'],
  camera: ['camera','dolly','tracking shot','orbit','pan ','tilt ','crane','handheld','push-in','pull-back','zoom','multiple camera angles','镜头','运镜','手持'],
  transitions: ['transition','whip pan','wipe','dissolve','smash cut','match transition','seamless cut','转场','切换'],
  morphs: ['morph','morphing','metamorph','transform into','transforms into','transformation','变形','变换'],
  macro: ['macro','extreme close-up','extreme close up','close-up detail','close up detail','微距','特写'],
  material: ['material','liquid','glass','metal','fabric','porcelain','resin','chrome','water','condensation','texture','材质','液体','玻璃','金属','水'],
  loop: ['seamless loop','loop-ready','loop ready','loops back','cyclic','return to start','循环'],
  freeze: ['freeze frame','freeze-frame','time freezes','time freeze','frozen in time','定格','冻结'],
  scale: ['miniature','tiny person','colossal','scale shift','micro world','miniature world','微缩','巨型','尺度'],
  'match-cut': ['match cut','match-cut','shape match','motion match','匹配剪辑'],
  'first-last-frame': ['first frame','last frame','first/last','start frame','end frame','endpoint','keyframe','首帧','尾帧','第一帧','最后一帧']
};

const HIGH_VALUE = ['product','commercial','advertising','brand','branding','website','saas','interface','app','logo','typography','packaging','fashion','beauty','automotive','architecture','case study','motion design','motion graphics','showreel','campaign','ecommerce','retail','luxury','产品','广告','品牌','设计','商业'];
const MOTION_TERMS = ['camera','tracking','dolly','orbit','pan','tilt','push-in','pull-back','handheld','macro','match cut','transition','morph','freeze','loop','slow motion','overhead','close-up','wide shot','镜头','运镜','推进','环绕','转场','慢动作','特写'];
const STRUCTURE_TERMS = ['shot 1','shot 2','00:','scene 1','scene 2','sequence','first shot','final shot','begin with','concludes with','镜头1','镜头2','场景1','场景2','分镜'];
const REFERENCE_TERMS = ['@image','image 1','reference image','reference video','storyboard','first frame','last frame','character lock','product reference','参考图','首帧','尾帧','角色一致性'];
const IP_RISK = ['naruto','dragon ball','harry potter','marvel','disney','pixar','pokemon','one piece','luffy','batman','superman','star wars','mickey mouse','spongebob','spider-man','spiderman','elon musk','kanye west','taylor swift','kim kardashian'];

function normalizeCandidate(item) {
  const text = normalize(item.textForAnalysis || `${item.title} ${item.excerpt}`);
  const collections = classify(text);
  const riskFlags = IP_RISK.some(term => text.includes(term)) ? ['named-ip-or-celebrity'] : [];
  const metrics = {
    sourceTraceability: Number(item.traceability || 2),
    designCommercial: hits(text, HIGH_VALUE),
    motionSpecificity: hits(text, MOTION_TERMS),
    shotStructure: hits(text, STRUCTURE_TERMS),
    referenceStrategy: hits(text, REFERENCE_TERMS)
  };
  const score = clamp(
    18
      + metrics.sourceTraceability * 5
      + Math.min(30, metrics.designCommercial * 5)
      + Math.min(24, metrics.motionSpecificity * 3)
      + Math.min(16, metrics.shotStructure * 4)
      + Math.min(10, metrics.referenceStrategy * 2)
      - riskFlags.length * 30,
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
    excerpt: excerpt(item.excerpt || item.title, 25),
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

function classify(text) {
  const result = [];
  for (const [id, terms] of Object.entries(COLLECTION_RULES)) {
    if (terms.some(term => text.includes(term))) result.push(id);
  }
  if (!result.length && /commercial|advert|product|广告|产品/.test(text)) result.push('packshot');
  if (!result.length && /shot|camera|cinematic|镜头|电影/.test(text)) result.push('camera');
  return [...new Set(result)].slice(0, 7);
}

function dedupe(items) {
  const byUrl = new Map();
  for (const item of items) {
    if (!item?.sourceUrl) continue;
    const key = canonicalUrl(item.sourceUrl);
    const previous = byUrl.get(key);
    if (!previous || candidateQuality(item) > candidateQuality(previous)) byUrl.set(key, item);
  }

  const byPrompt = new Map();
  for (const item of byUrl.values()) {
    const key = item.promptFingerprint || item.id;
    const previous = byPrompt.get(key);
    if (!previous || candidateQuality(item) > candidateQuality(previous)) byPrompt.set(key, item);
  }
  return [...byPrompt.values()];
}

function candidateQuality(item) {
  return Number(item.score || 0)
    + Number(item.metrics?.sourceTraceability || 0) * 2
    + (item.previewUrl ? 2 : 0)
    + (item.author && !/unknown/i.test(item.author) ? 1 : 0);
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
      selected.push(item);
      used.add(item.id);
      count += 1;
    }
  }
  for (const item of sorted) {
    if (selected.length >= limit) break;
    if (used.has(item.id)) continue;
    selected.push(item);
    used.add(item.id);
  }
  return selected.slice(0, limit).sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || String(a.title).localeCompare(String(b.title)));
}

function corpusStats(items) {
  const collectionCounts = Object.fromEntries(Object.keys(COLLECTION_RULES).map(id => [id, 0]));
  for (const item of items) {
    for (const id of item.collections || []) collectionCounts[id] = (collectionCounts[id] || 0) + 1;
  }
  return {
    candidates: items.length,
    creators: new Set(items.map(item => item.author).filter(Boolean)).size,
    sourcePools: new Set(items.map(item => item.sourcePool).filter(Boolean)).size,
    withOriginalCreatorSource: items.filter(item => /(?:x\.com|twitter\.com)\//.test(item.sourceUrl || '')).length,
    withPreview: items.filter(item => item.previewUrl).length,
    averageScore: Math.round(items.reduce((sum, item) => sum + Number(item.score || 0), 0) / Math.max(1, items.length)),
    collectionCounts
  };
}

function mergeSourceStats(base, extra) {
  const map = new Map();
  for (const item of [...base, ...extra]) map.set(item.source, item);
  return [...map.values()];
}

async function fetchText(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Seedance-Porter-Research/0.6 (+https://github.com/IMONsergey/Seedance-Porter)',
        accept: 'text/plain,text/markdown;q=0.9,*/*;q=0.8'
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function creatorFromX(value) {
  try {
    const parts = new URL(value).pathname.split('/').filter(Boolean);
    const handle = parts[0] === 'i' && parts[1] === 'status' ? '' : parts[0];
    return handle ? `@${handle}` : '';
  } catch {
    return '';
  }
}

function creatorProfileFromX(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const handle = parts[0] === 'i' && parts[1] === 'status' ? '' : parts[0];
    return handle ? `${url.origin}/${handle}` : '';
  } catch {
    return '';
  }
}

function excerpt(value, maxWords = 25) {
  return strip(value).split(/\s+/).filter(Boolean).slice(0, maxWords).join(' ');
}

function strip(value) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value) {
  return strip(value).toLowerCase();
}

function hits(text, terms) {
  return terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
}

function shortHash(value) {
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['s', 't'].includes(key)) url.searchParams.delete(key);
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return String(value || '');
  }
}

function githubSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanTitle(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function parseArgs(argv) {
  const output = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    output[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
  }
  return output;
}
