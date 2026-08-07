#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const LIMIT = clamp(Number(args.limit || 750), 100, 1000);
const MIN_EXPECTED = clamp(Number(args.min || 500), 1, LIMIT);
const OUTPUT = resolve(args.output || 'studio/case-candidates.json');

const COLLECTION_RULES = {
  'website-hero': ['website hero','homepage','landing page','web hero','hero loop','landing-page'],
  'saas-ui': ['saas','user interface','product ui','software interface','dashboard ui','ui animation','glass ui','interface animation'],
  'app-launch': ['app launch','mobile app','product launch','launch film','application launch'],
  dashboard: ['dashboard','analytics','data visualization','metrics','control panel'],
  'case-study-motion': ['case study','case-study','portfolio','showreel','brand film','explainer','behind the scenes','bts'],
  'brand-reveal': ['brand reveal','brand identity','branding','identity reveal','brand film','commercial branding'],
  'rebranding-transition': ['rebrand','rebranding','old to new','identity transition'],
  'logo-motion': ['logo reveal','logo animation','logo motion','wordmark','brand symbol','logomark'],
  'kinetic-type': ['kinetic type','kinetic typography','typography animation','animated typography','type animation','motion graphics ad'],
  'interactive-web3d': ['web3d','interactive 3d','interactive website','spatial web','3d website','portal interface','glass ui'],
  packshot: ['packshot','product shot','product hero','product commercial','product ad','product advertisement','package reveal','ads & products'],
  beauty: ['beauty','skincare','skin care','serum','cosmetic','makeup','haircare','hair care','perfume','fragrance'],
  fmcg: ['fmcg','beverage','soda','drink ad','snack','consumer product','toothpaste','shampoo','packaged food'],
  food: ['food','cooking','restaurant','coffee','pizza','burger','fish','meal','dessert','ingredient'],
  automotive: ['automotive','vehicle','racing','race car','motorcycle','suv','sedan','car commercial','road film','vehicles & travel'],
  fashion: ['fashion','garment','clothing','streetwear','couture','runway','editorial model','sneaker','apparel'],
  sports: ['sport','tennis','football','basketball','athlete','running','fitness','workout','soccer','golf'],
  luxury: ['luxury','premium','jewelry','jewellery','watch','high-end','quiet luxury','diamond'],
  electronics: ['electronics','smartphone','laptop','earbuds','headphones','device','gadget','camera product','tech product'],
  'real-estate': ['real estate','architecture','architectural','interior','property','apartment','villa','hotel'],
  camera: ['camera','dolly','tracking shot','orbit','pan ','tilt ','crane','handheld','push-in','pull-back','zoom','multiple camera angles'],
  transitions: ['transition','whip pan','wipe','dissolve','smash cut','match transition','seamless cut'],
  morphs: ['morph','morphing','metamorph','transform into','transforms into','transformation'],
  macro: ['macro','extreme close-up','extreme close up','close-up detail','close up detail'],
  material: ['material','liquid','glass','metal','fabric','porcelain','resin','chrome','water','condensation','texture'],
  loop: ['seamless loop','loop-ready','loop ready','loops back','cyclic','return to start'],
  freeze: ['freeze frame','freeze-frame','time freezes','time freeze','frozen in time'],
  scale: ['miniature','tiny person','colossal','scale shift','micro world','miniature world'],
  'match-cut': ['match cut','match-cut','shape match','motion match'],
  'first-last-frame': ['first frame','last frame','first/last','start frame','end frame','endpoint','keyframe']
};

const HIGH_VALUE = ['product','commercial','advertising','brand','branding','website','saas','interface','app','logo','typography','packaging','fashion','beauty','automotive','architecture','case study','motion design','motion graphics','showreel','campaign','ecommerce','retail','luxury'];
const MOTION_TERMS = ['camera','tracking','dolly','orbit','pan','tilt','push-in','pull-back','handheld','macro','match cut','transition','morph','freeze','loop','slow motion','overhead','close-up','wide shot'];
const STRUCTURE_TERMS = ['shot 1','shot 2','00:','scene 1','scene 2','sequence','first shot','final shot','begin with','concludes with'];
const REFERENCE_TERMS = ['@image','image 1','reference image','reference video','storyboard','first frame','last frame','character lock','product reference'];
const IP_RISK = ['naruto','dragon ball','harry potter','marvel','disney','pixar','pokemon','one piece','luffy','batman','superman','star wars','mickey mouse','spongebob','spider-man','spiderman','elon musk','kanye west','taylor swift','kim kardashian'];

const raw = [];
const sourceStats = [];
for (const source of [
  ['youmind','YouMind OpenLab',discoverYouMind,5,'CC BY 4.0 repository; candidate corpus stores only excerpt + attribution'],
  ['cyberbara','CyberBara Seedance Library',discoverCyberBara,4,'Source-only discovery pool; store short excerpt + creator/archive attribution, not a full mirrored prompt'],
  ['seedance2prompt','Seedance2Prompt',discoverSeedance2Prompt,4,'Source-only editorial metadata; no mirrored full prompt'],
  ['lanshu','Lanshu Awesome AI Video Kit',discoverLanshu,3,'Source-specific; candidate corpus stores excerpt + source link only']
]) {
  const [id,label,discover,priority,license] = source;
  try {
    const items = await discover();
    for (const item of items) raw.push(normalizeCandidate({ ...item, sourcePool:id, sourcePoolLabel:label, sourcePriority:priority, license }));
    sourceStats.push({ source:id, discovered:items.length, ok:true });
    console.error(`[case-corpus] ${id}: ${items.length} discovered`);
  } catch (error) {
    sourceStats.push({ source:id, discovered:0, ok:false, error:String(error?.message || error) });
    console.error(`[case-corpus] ${id} failed: ${error?.message || error}`);
  }
}

const unique = dedupe(raw).filter(item => item.title && item.sourceUrl);
const safe = unique.filter(item => !item.riskFlags.includes('named-ip-or-celebrity'));
const selected = selectBalanced(safe, LIMIT);

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  target: { min: MIN_EXPECTED, limit: LIMIT },
  policy: {
    status: 'research-candidate',
    note: 'Candidate entries are discovery records, not curated or deep-reviewed cases. Promotion requires prompt anatomy and actual full-video visual review.',
    fullPromptStorage: 'disabled-by-default',
    excerptMaxWords: 25,
    ranking: 'Balanced across requested Collections, then ranked by source traceability, design/commercial usefulness, motion specificity, shot structure and reference strategy. Engagement alone is not a quality signal.'
  },
  sourceStats,
  stats: corpusStats(selected),
  candidates: selected
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

if (selected.length < MIN_EXPECTED) {
  console.error(`[case-corpus] selected ${selected.length}; minimum required after dedupe/risk filtering is ${MIN_EXPECTED}`);
  process.exitCode = 2;
}
console.log(JSON.stringify({ output: OUTPUT, ...payload.stats, sourceStats }, null, 2));

async function discoverYouMind() {
  const repoUrl = 'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/README.md';
  const text = await fetchText(repoUrl, 45000);
  const headings = [...text.matchAll(/^###\s+(?:No\.\s*\d+:\s*)?(.+)$/gm)];
  const items = [];
  for (let i = 0; i < headings.length; i++) {
    const title = headings[i][1].trim();
    if (/Table of Contents|How to Contribute|Acknowledgements|Statistics/i.test(title)) continue;
    const block = text.slice(headings[i].index, headings[i + 1]?.index ?? text.length);
    const prompt = block.match(/####\s*📝\s*Prompt[\s\S]*?```(?:\w+)?\s*([\s\S]*?)```/i)?.[1]?.trim() || '';
    const description = block.match(/####\s*📖\s*Description\s*([\s\S]*?)(?:####|```)/i)?.[1]?.replace(/\s+/g,' ').trim() || '';
    if (!prompt && !description) continue;
    const author = block.match(/(?:\*\*Author:\*\*|- \*\*Author:\*\*)\s*\[([^\]]+)\]\(([^)]+)\)/i);
    const source = block.match(/(?:\*\*Source:\*\*|- \*\*Source:\*\*)\s*\[[^\]]+\]\(([^)]+)\)/i);
    const watch = block.match(/https:\/\/youmind\.com\/[^)\s]+/i)?.[0] || '';
    const preview = block.match(/<img\s+src=["']([^"']+)["']/i)?.[1] || '';
    const sourceUrl = source?.[1] || watch || `https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts`;
    items.push({
      externalId:`ym-${shortHash(sourceUrl + title)}`,
      title,
      author:author?.[1] || 'Community creator',
      authorUrl:author?.[2] || '',
      sourceUrl,
      archiveUrl:watch || 'https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts',
      previewUrl:preview,
      excerpt:excerpt(description || prompt,25),
      textForAnalysis:`${title}\n${description}\n${prompt.slice(0,5000)}`,
      published:block.match(/(?:\*\*Published:\*\*|- \*\*Published:\*\*)\s*([^\n]+)/i)?.[1]?.trim() || '',
      traceability:source ? 5 : 4
    });
  }
  return items;
}

async function discoverCyberBara() {
  const origin = 'https://cyberbara.com';
  const items = [];
  let emptyPages = 0;
  for (let page = 1; page <= 24; page++) {
    const pageUrl = `${origin}/seedance-prompt-library${page === 1 ? '' : `?page=${page}`}`;
    let html;
    try { html = await fetchText(pageUrl, 20000); } catch { emptyPages += 1; if (emptyPages >= 2) break; continue; }
    const headings = [...html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)];
    let pageItems = 0;
    for (let i = 0; i < headings.length; i++) {
      const title = cleanTitle(strip(headings[i][1]));
      if (!title || /FAQ|How is this different|Where do the prompts|Can I use|Why do|How long|Should I|Are these|How often|Generate without/i.test(title)) continue;
      const block = html.slice(headings[i].index, headings[i + 1]?.index ?? Math.min(html.length, headings[i].index + 12000));
      const text = strip(block);
      if (text.length < 40) continue;
      const xUrl = block.match(/https:\/\/(?:x\.com|twitter\.com)\/[^"'<>\s]+(?:\/status\/\d+)?/i)?.[0] || '';
      const detailHrefs = [...block.matchAll(/href=["']([^"']+)["']/gi)].map(m => absolutize(origin, decodeEntities(m[1]))).filter(url => url && /cyberbara\.com\/.+seedance/i.test(url));
      const detailUrl = detailHrefs.find(url => !/[?&](?:page|category)=/i.test(url)) || pageUrl;
      const preview = block.match(/<img\b[^>]+src=["']([^"']+)["']/i)?.[1] || block.match(/<img\b[^>]+data-src=["']([^"']+)["']/i)?.[1] || '';
      const author = text.match(/\bby\s+(.{2,80}?)(?=\s+(?:Try it now|Open details|Generate now|Image:|$))/i)?.[1]?.trim() || 'CyberBara attributed creator';
      let body = text.replace(title,' ').replace(/\bby\s+.{2,80}?(?=\s+(?:Try it now|Open details|Generate now|Image:|$))/i,' ').replace(/Try it now|Open details|Generate now/gi,' ').replace(/\s+/g,' ').trim();
      if (body.length < 30) body = title;
      items.push({
        externalId:`cb-${shortHash(`${pageUrl}|${title}|${author}`)}`,
        title,
        author,
        sourceUrl:xUrl || detailUrl,
        archiveUrl:detailUrl || pageUrl,
        previewUrl:absolutize(origin, preview) || preview,
        excerpt:excerpt(body,25),
        textForAnalysis:`${title}\n${body.slice(0,5000)}`,
        published:'',
        traceability:xUrl ? 5 : detailUrl !== pageUrl ? 3 : 2
      });
      pageItems += 1;
    }
    if (pageItems === 0) emptyPages += 1; else emptyPages = 0;
    if (emptyPages >= 2) break;
  }
  return dedupeSourceItems(items);
}

async function discoverSeedance2Prompt() {
  const origin = 'https://www.seedance2prompt.com';
  let urls = [];
  for (const sitemap of [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]) {
    try {
      const xml = await fetchText(sitemap, 20000);
      let locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => decodeEntities(m[1]).trim());
      if (/sitemapindex/i.test(xml)) {
        const nested = [];
        for (const child of locs.slice(0,20)) {
          try {
            const childXml = await fetchText(child,15000);
            nested.push(...[...childXml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m=>decodeEntities(m[1]).trim()));
          } catch {}
        }
        locs = nested;
      }
      urls.push(...locs);
      if (urls.length) break;
    } catch {}
  }
  if (!urls.length) {
    const html = await fetchText(`${origin}/prompts`,25000);
    urls = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => absolutize(origin,decodeEntities(m[1]))).filter(Boolean);
  }
  urls = [...new Set(urls)].filter(url => /^https:\/\/www\.seedance2prompt\.com\/prompts\//i.test(url)).slice(0,3000);
  return urls.map(url => {
    const title = slugTitle(url);
    return {
      externalId:`s2p-${shortHash(url)}`,
      title,
      author:'Source creator — verify on case page',
      sourceUrl:url,
      archiveUrl:url,
      previewUrl:'',
      excerpt:excerpt(title,25),
      textForAnalysis:title,
      published:'',
      traceability:2
    };
  }).filter(x=>x.title);
}

async function discoverLanshu() {
  const url = 'https://raw.githubusercontent.com/cclank/lanshu-awesome-ai-video-kit/main/prompts/seedance/README.md';
  const text = await fetchText(url,25000);
  const headings = [...text.matchAll(/###\s+(sd-\d+)\s*·\s*([^\n`]+)/g)];
  const items = [];
  for (let i=0;i<headings.length;i++) {
    const id=headings[i][1]; const title=headings[i][2].trim();
    const block=text.slice(headings[i].index,headings[i+1]?.index ?? text.length);
    const prompt=block.match(/```\s*([\s\S]*?)```/)?.[1]?.trim() || '';
    if(!prompt) continue;
    const source=block.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/)?.[1] || `https://github.com/cclank/lanshu-awesome-ai-video-kit/tree/main/prompts/seedance#${id}`;
    items.push({ externalId:`lanshu-${id}`, title, author:'Lanshu curated source', sourceUrl:source, archiveUrl:`https://github.com/cclank/lanshu-awesome-ai-video-kit/tree/main/prompts/seedance#${id}`, previewUrl:'', excerpt:excerpt(prompt,25), textForAnalysis:`${title}\n${prompt}`, published:'', traceability:source.includes('github.com/cclank')?2:3 });
  }
  return items;
}

function normalizeCandidate(item) {
  const text = normalize(item.textForAnalysis || `${item.title} ${item.excerpt}`);
  const collections = classify(text);
  const riskFlags = IP_RISK.some(term => text.includes(term)) ? ['named-ip-or-celebrity'] : [];
  const metrics = {
    sourceTraceability:Number(item.traceability || 2),
    designCommercial:hits(text,HIGH_VALUE),
    motionSpecificity:hits(text,MOTION_TERMS),
    shotStructure:hits(text,STRUCTURE_TERMS),
    referenceStrategy:hits(text,REFERENCE_TERMS)
  };
  const score = clamp(18 + metrics.sourceTraceability*5 + Math.min(30,metrics.designCommercial*5) + Math.min(24,metrics.motionSpecificity*3) + Math.min(16,metrics.shotStructure*4) + Math.min(10,metrics.referenceStrategy*2) - riskFlags.length*30,0,100);
  const sourceUrl=canonicalUrl(item.sourceUrl || item.archiveUrl);
  return {
    id:`candidate-${shortHash(`${sourceUrl}|${item.title}`)}`,
    externalId:item.externalId || '',
    title:cleanTitle(item.title),
    author:item.author || 'Unknown creator',
    authorUrl:item.authorUrl || '',
    sourceUrl,
    archiveUrl:item.archiveUrl || sourceUrl,
    previewUrl:item.previewUrl || '',
    excerpt:excerpt(item.excerpt || item.title,25),
    published:item.published || '',
    sourcePool:item.sourcePool,
    sourcePoolLabel:item.sourcePoolLabel,
    sourcePriority:item.sourcePriority,
    license:item.license,
    collections,
    score,
    metrics,
    riskFlags,
    reviewStatus:'candidate',
    promptFingerprint:shortHash(normalize(item.textForAnalysis || item.excerpt || item.title)),
    discoveredAt:new Date().toISOString()
  };
}

function classify(text) {
  const result=[];
  for (const [id,terms] of Object.entries(COLLECTION_RULES)) if(terms.some(term=>text.includes(term))) result.push(id);
  if(!result.length && /commercial|advert|product/.test(text)) result.push('packshot');
  if(!result.length && /shot|camera|cinematic/.test(text)) result.push('camera');
  return [...new Set(result)].slice(0,7);
}

function dedupe(items) {
  const byUrl=new Map();
  for(const item of items){ if(!item?.sourceUrl) continue; const key=canonicalUrl(item.sourceUrl); const prev=byUrl.get(key); if(!prev || item.score>prev.score) byUrl.set(key,item); }
  const byPrompt=new Map();
  for(const item of byUrl.values()){ const key=item.promptFingerprint || item.id; const prev=byPrompt.get(key); if(!prev || item.score>prev.score) byPrompt.set(key,item); }
  return [...byPrompt.values()];
}

function dedupeSourceItems(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${normalize(item.title)}|${canonicalUrl(item.sourceUrl || item.archiveUrl)}`;
    if (!map.has(key)) map.set(key,item);
  }
  return [...map.values()];
}

function selectBalanced(items,limit) {
  const sorted=[...items].sort((a,b)=>b.score-a.score || b.sourcePriority-a.sourcePriority || a.title.localeCompare(b.title));
  const selected=[]; const used=new Set();
  const minimum=Math.max(4,Math.min(12,Math.floor(limit/60)));
  for(const collection of Object.keys(COLLECTION_RULES)){
    let n=0;
    for(const item of sorted){ if(n>=minimum) break; if(used.has(item.id)||!item.collections.includes(collection)) continue; selected.push(item); used.add(item.id); n++; }
  }
  for(const item of sorted){ if(selected.length>=limit) break; if(used.has(item.id)) continue; selected.push(item); used.add(item.id); }
  return selected.slice(0,limit).sort((a,b)=>b.score-a.score || a.title.localeCompare(b.title));
}

function corpusStats(items) {
  const collectionCounts=Object.fromEntries(Object.keys(COLLECTION_RULES).map(id=>[id,0]));
  for(const item of items) for(const id of item.collections) collectionCounts[id]=(collectionCounts[id]||0)+1;
  return {
    candidates:items.length,
    creators:new Set(items.map(x=>x.author).filter(Boolean)).size,
    sourcePools:new Set(items.map(x=>x.sourcePool)).size,
    withOriginalCreatorSource:items.filter(x=>/(?:x\.com|twitter\.com)\//.test(x.sourceUrl)).length,
    withPreview:items.filter(x=>x.previewUrl).length,
    averageScore:Math.round(items.reduce((sum,x)=>sum+x.score,0)/Math.max(1,items.length)),
    collectionCounts
  };
}

async function fetchText(url,timeoutMs=20000){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{'user-agent':'Seedance-Porter-Research/0.5 (+https://github.com/IMONsergey/Seedance-Porter)','accept':'text/html,application/xml,text/plain;q=0.9,*/*;q=0.8'}});
    if(!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}
function excerpt(value,max=25){ return strip(value).split(/\s+/).filter(Boolean).slice(0,max).join(' '); }
function strip(value){ return decodeEntities(String(value||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim(); }
function normalize(value){ return strip(value).toLowerCase(); }
function hits(text,terms){ return terms.reduce((sum,term)=>sum+(text.includes(term)?1:0),0); }
function shortHash(value){ return createHash('sha256').update(String(value)).digest('hex').slice(0,16); }
function canonicalUrl(value){ try{ const url=new URL(value); url.hash=''; for(const key of [...url.searchParams.keys()]) if(/^utm_/i.test(key)) url.searchParams.delete(key); return url.toString().replace(/\/$/,''); } catch { return String(value||''); } }
function absolutize(origin,href){ try{return new URL(href,origin).toString();}catch{return '';} }
function slugTitle(url){ try{return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop()||'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}catch{return '';} }
function cleanTitle(value){ return decodeEntities(String(value||'')).replace(/\s*[|–—-]\s*Seedance2Prompt.*$/i,'').replace(/\s+/g,' ').trim(); }
function decodeEntities(value){ return String(value||'').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))); }
function clamp(n,min,max){ return Math.max(min,Math.min(max,Number.isFinite(n)?n:min)); }
function parseArgs(argv){ const out={}; for(let i=0;i<argv.length;i++){ const arg=argv[i]; if(arg.startsWith('--')){ const key=arg.slice(2); out[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true; } } return out; }
