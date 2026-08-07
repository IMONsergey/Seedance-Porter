import { PROMPTS, SOURCES, LIBRARY_STATS } from './library-data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = {
  query: '', category: 'all', mode: 'all', aspect: 'all', sort: 'featured', favoritesOnly: false,
  favorites: new Set(JSON.parse(localStorage.getItem('porterPromptFavorites') || '[]')),
  activePrompt: null,
  sourceQuery: '', sourceType: 'all'
};

const els = {
  promptView: $('#promptView'), sourceView: $('#sourceView'), grid: $('#promptGrid'), sourceGrid: $('#sourceGrid'),
  search: $('#search'), category: $('#categoryFilter'), mode: $('#modeFilter'), aspect: $('#aspectFilter'), sort: $('#sortFilter'),
  chips: $('#categoryChips'), count: $('#resultCount'), activeQuery: $('#activeQuery'), empty: $('#emptyState'),
  drawer: $('#drawer'), drawerContent: $('#drawerContent'), toast: $('#toast'), heroStats: $('#heroStats'),
  favoritesOnly: $('#favoritesOnly'), sourceSearch: $('#sourceSearch'), sourceType: $('#sourceType')
};

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return Math.abs(hash >>> 0);
}

const palettes = [
  ['#0d1216','#d8f0df','#4d7b66','#8b9cff'], ['#0b0b0f','#e5d4bc','#6f5c45','#789b8c'],
  ['#090b10','#a4ff80','#3c55ff','#ffb24a'], ['#0b0910','#b5a8ff','#ff7065','#8de7dd'],
  ['#0e1113','#f1f0e8','#73847a','#d8b985'], ['#090d12','#c3d5ff','#5669c9','#d673ff']
];

function esc(value = '') { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function attr(value = '') { return esc(value).replace(/`/g, '&#96;'); }

function conceptPreview(prompt, wide = false) {
  const h = hashString(prompt.id);
  const [bg, fg, accent, pop] = palettes[h % palettes.length];
  const isUI = /UI|Web|Case Study|SaaS/.test(prompt.category);
  const isType = /Kinetic/.test(prompt.category);
  const isProduct = /Product|Packaging/.test(prompt.category);
  const isVfx = /VFX/.test(prompt.category);
  const isData = /Data/.test(prompt.category);
  const w = 720, ht = wide ? 360 : 450;
  const noise = (h % 14) + 5;
  const shapes = [];
  if (isUI) {
    shapes.push(`<rect x="${70 + h%45}" y="74" width="430" height="${wide?210:250}" rx="24" fill="${fg}" fill-opacity=".08" stroke="${fg}" stroke-opacity=".32"/>`);
    shapes.push(`<rect x="${115 + h%38}" y="115" width="330" height="42" rx="10" fill="${accent}" fill-opacity=".78"/>`);
    shapes.push(`<rect x="${115 + h%38}" y="174" width="210" height="${wide?72:100}" rx="14" fill="${pop}" fill-opacity=".38"/>`);
    shapes.push(`<circle cx="520" cy="${wide?190:240}" r="${48+h%42}" fill="none" stroke="${fg}" stroke-opacity=".46" stroke-width="2"/>`);
  } else if (isType) {
    shapes.push(`<text x="52" y="${wide?210:250}" font-size="${115+h%35}" font-family="Arial,Helvetica,sans-serif" font-weight="800" fill="${fg}" letter-spacing="-9">Aa</text>`);
    shapes.push(`<path d="M360 84 C520 68, 470 ${wide?270:340}, 650 ${wide?270:350}" fill="none" stroke="${accent}" stroke-width="4"/>`);
  } else if (isProduct) {
    shapes.push(`<ellipse cx="360" cy="${wide?295:365}" rx="190" ry="34" fill="#000" opacity=".42"/>`);
    shapes.push(`<rect x="285" y="80" width="150" height="${wide?205:260}" rx="${35+h%40}" fill="url(#g)" stroke="${fg}" stroke-opacity=".28"/>`);
    shapes.push(`<path d="M300 110 Q360 60 420 115" fill="none" stroke="${pop}" stroke-opacity=".65" stroke-width="5"/>`);
  } else if (isData) {
    for(let i=0;i<12;i++) { const x=60+(i%4)*150, y=70+Math.floor(i/4)*95; shapes.push(`<circle cx="${x}" cy="${y}" r="${12+(h+i)%18}" fill="${i%3===0?pop:accent}" fill-opacity="${.25+(i%4)*.11}"/>`); if(i%4<3) shapes.push(`<path d="M${x+18} ${y} L${x+125} ${y+((i%2)*24-12)}" stroke="${fg}" stroke-opacity=".18"/>`); }
  } else if (isVfx) {
    shapes.push(`<path d="M-80 ${ht*.75} C150 ${ht*.15}, 270 ${ht*.9}, 800 ${ht*.18}" fill="none" stroke="url(#g)" stroke-width="${80+h%80}" stroke-linecap="round"/>`);
    shapes.push(`<rect x="230" y="${wide?95:130}" width="260" height="160" rx="30" fill="${fg}" fill-opacity=".06" stroke="${fg}" stroke-opacity=".22"/>`);
  } else {
    shapes.push(`<circle cx="270" cy="${wide?180:230}" r="${120+h%55}" fill="url(#g)" opacity=".9"/>`);
    shapes.push(`<rect x="390" y="${wide?100:145}" width="210" height="${wide?180:225}" rx="44" fill="${fg}" fill-opacity=".07" stroke="${fg}" stroke-opacity=".28" transform="rotate(${(h%19)-9} 495 220)"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${ht}" viewBox="0 0 ${w} ${ht}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="${pop}"/></linearGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".${noise}" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .055"/></feComponentTransfer></filter></defs>
    <rect width="100%" height="100%" fill="${bg}"/><circle cx="${560-h%80}" cy="${40+h%120}" r="230" fill="${accent}" opacity=".09"/>${shapes.join('')}
    <rect width="100%" height="100%" filter="url(#n)" opacity=".55"/>
    <text x="38" y="${ht-42}" fill="${fg}" fill-opacity=".84" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700">${esc(prompt.category.toUpperCase())}</text>
    <text x="38" y="${ht-19}" fill="${fg}" fill-opacity=".42" font-family="Arial,Helvetica,sans-serif" font-size="11">PORTER CONCEPT PREVIEW · ${esc(prompt.variation.toUpperCase())}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function sourceById(id) { return SOURCES.find(source => source.id === id); }
function saveFavorites() { localStorage.setItem('porterPromptFavorites', JSON.stringify([...state.favorites])); }
function toast(message) { els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => els.toast.classList.remove('show'), 1700); }
async function copyText(text, label='Copied') { await navigator.clipboard.writeText(text); toast(label); }

function populateFilters() {
  const categories = [...new Set(PROMPTS.map(p => p.category))].sort();
  const modes = [...new Set(PROMPTS.map(p => p.mode))].sort();
  const aspects = [...new Set(PROMPTS.map(p => p.aspect))].sort();
  for (const value of categories) els.category.insertAdjacentHTML('beforeend', `<option value="${attr(value)}">${esc(value)}</option>`);
  for (const value of modes) els.mode.insertAdjacentHTML('beforeend', `<option value="${attr(value)}">${esc(value)}</option>`);
  for (const value of aspects) els.aspect.insertAdjacentHTML('beforeend', `<option value="${attr(value)}">${esc(value)}</option>`);
  els.chips.innerHTML = `<button class="chip is-active" data-category="all">All</button>${categories.map(c => `<button class="chip" data-category="${attr(c)}">${esc(c)}</button>`).join('')}`;
  const types = [...new Set(SOURCES.map(s => s.type))].sort();
  for (const value of types) els.sourceType.insertAdjacentHTML('beforeend', `<option value="${attr(value)}">${esc(value)}</option>`);
}

function renderHeroStats() {
  const cards = [
    [LIBRARY_STATS.promptCount, 'remixable prompt cards'], [LIBRARY_STATS.archetypeCount, 'production archetypes'],
    [LIBRARY_STATS.categories, 'design-first lanes'], [LIBRARY_STATS.sourceCount, 'audited sources']
  ];
  els.heroStats.innerHTML = cards.map(([value,label]) => `<div class="stat-card"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('');
}

function filteredPrompts() {
  const q = state.query.trim().toLowerCase();
  let result = PROMPTS.filter(prompt => {
    if (state.category !== 'all' && prompt.category !== state.category) return false;
    if (state.mode !== 'all' && prompt.mode !== state.mode) return false;
    if (state.aspect !== 'all' && prompt.aspect !== state.aspect) return false;
    if (state.favoritesOnly && !state.favorites.has(prompt.id)) return false;
    if (!q) return true;
    const haystack = [prompt.title,prompt.category,prompt.subcategory,prompt.use,prompt.prompt,prompt.tags.join(' '),prompt.sourceTitles.join(' ')].join(' ').toLowerCase();
    return haystack.includes(q);
  });
  if (state.sort === 'featured') result.sort((a,b) => Number(b.featured)-Number(a.featured) || Number(b.rank)-Number(a.rank) || a.title.localeCompare(b.title));
  if (state.sort === 'authority') result.sort((a,b) => Number(b.rank)-Number(a.rank) || a.title.localeCompare(b.title));
  if (state.sort === 'category') result.sort((a,b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  if (state.sort === 'title') result.sort((a,b) => a.title.localeCompare(b.title));
  return result;
}

function promptCard(prompt) {
  const fav = state.favorites.has(prompt.id);
  return `<article class="prompt-card" data-id="${attr(prompt.id)}" tabindex="0">
    <div class="card-preview"><img loading="lazy" src="${conceptPreview(prompt)}" alt="Concept preview for ${attr(prompt.title)}"/><span class="preview-note">concept preview</span><button class="favorite ${fav?'is-active':''}" data-favorite="${attr(prompt.id)}" aria-label="Favorite">${fav?'★':'☆'}</button></div>
    <div class="card-body">
      <div class="card-kicker"><span>${esc(prompt.category)} · ${esc(prompt.subcategory)}</span><span>${esc(prompt.mode)}</span></div>
      <h3>${esc(prompt.title)}</h3><div class="card-use">${esc(prompt.use)}</div>
      <div class="card-tags">${prompt.tags.slice(0,4).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="card-actions"><button data-copy="${attr(prompt.id)}">Copy prompt</button><button data-open="${attr(prompt.id)}">Remix</button></div>
    </div>
  </article>`;
}

function renderPrompts() {
  const items = filteredPrompts();
  els.grid.innerHTML = items.map(promptCard).join('');
  els.count.textContent = items.length;
  els.activeQuery.textContent = state.query ? `for “${state.query}”` : state.favoritesOnly ? '· favorites only' : '';
  els.empty.hidden = items.length > 0;
}

function renderSources() {
  const q = state.sourceQuery.trim().toLowerCase();
  const sources = SOURCES.filter(source => {
    if (state.sourceType !== 'all' && source.type !== state.sourceType) return false;
    if (!q) return true;
    return `${source.title} ${source.type} ${source.note}`.toLowerCase().includes(q);
  }).sort((a,b) => (b.authority+b.design)-(a.authority+a.design));
  els.sourceGrid.innerHTML = sources.map(source => `<article class="source-card">
    <div class="source-type">${esc(source.type)}</div><h3>${esc(source.title)}</h3><p>${esc(source.note)}</p>
    <div class="source-score"><span>authority ${source.authority}/5</span><span>design ${source.design}/5</span></div>
    <a href="${attr(source.url)}" target="_blank" rel="noopener">Open source ↗</a>
  </article>`).join('');
}

function resolvedFromInputs(prompt, container) {
  const values = { ...prompt.values };
  $$('[data-variable]', container).forEach(input => { values[input.dataset.variable] = input.value; });
  return prompt.template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`);
}

function buildPorterProject(prompt, resolvedPrompt) {
  const referenceObjects = prompt.refs.map((role, index) => {
    const kind = role === 'audio' ? 'audio' : role === 'motion' || role === 'camera' ? 'video' : 'image';
    const base = { id: `${role}-${index+1}`, kind, url: `<replace-with-${kind}-url>`, role };
    if (kind !== 'audio') base.faceSource = role === 'identity' ? 'synthetic' : 'none';
    if (['identity','product','logo'].includes(role)) {
      base.anchors = ['stable identifying feature 1','stable identifying feature 2'];
      base.note = `Exact ${role} source; replace anchors with two or three stable visual identifiers.`;
    } else base.note = `Use this asset only for ${role}.`;
    return base;
  });
  return {
    project: `library-${prompt.archetype}`,
    label: prompt.id,
    model: 'seedance-2.0',
    mode: prompt.mode,
    duration: prompt.duration,
    resolution: '720p',
    aspectRatio: prompt.aspect,
    generateAudio: prompt.refs.includes('audio') || /sound|audio|voice/i.test(resolvedPrompt),
    outputPolicy: { generatedText: 'forbid', generatedLogo: prompt.refs.includes('logo') ? 'reference-only' : 'forbid', generatedWatermark: 'forbid' },
    brief: {
      objective: prompt.use,
      subject: prompt.values.subject || prompt.baseTitle,
      action: prompt.values.motion || 'Execute the described controlled motion once and settle.',
      environment: `Use the visual environment described by the resolved library prompt. Palette: ${prompt.values.palette}.`,
      camera: prompt.values.camera || 'locked camera',
      lighting: prompt.values.light,
      colorTone: prompt.values.palette,
      style: `${prompt.values.atmosphere}; ${prompt.variation}`,
      imageQuality: 'HD, rich details, stable geometry, coherent materials, natural motion and clean edges',
      constraints: ['preserve source geometry and visual hierarchy','avoid unrequested text and duplicated objects'],
      beats: []
    },
    references: referenceObjects,
    shots: [],
    library: { promptId: prompt.id, origin: prompt.origin, sources: prompt.sourceIds.map(id => sourceById(id)?.url).filter(Boolean), resolvedPrompt }
  };
}

function drawerHtml(prompt) {
  const sources = prompt.sourceIds.map(sourceById).filter(Boolean);
  return `<div class="drawer-hero"><img src="${conceptPreview(prompt,true)}" alt="Concept preview for ${attr(prompt.title)}"></div>
    <div class="drawer-body" data-prompt-body>
      <div class="drawer-meta">${esc(prompt.category)} / ${esc(prompt.subcategory)} · ${esc(prompt.variation)}</div>
      <h2 class="drawer-title" id="drawerTitle">${esc(prompt.baseTitle)}</h2>
      <p class="drawer-intro">${esc(prompt.use)}. ${esc(prompt.why)}</p>
      <div class="badge-row"><span class="badge origin">${esc(prompt.origin)}</span><span class="badge bos">${esc(prompt.bos)}</span><span class="badge">concept preview — not generated output</span></div>
      <div class="info-grid"><div class="info-box"><span>Mode</span><strong>${esc(prompt.mode)}</strong></div><div class="info-box"><span>Duration</span><strong>${prompt.duration}s</strong></div><div class="info-box"><span>Ratio</span><strong>${esc(prompt.aspect)}</strong></div><div class="info-box"><span>Difficulty</span><strong>${esc(prompt.difficulty)}</strong></div></div>

      <div class="section-title"><span>Remix variables</span><span>${prompt.variables.length} fields</span></div>
      <div class="variable-grid">${prompt.variables.map(v => `<label>${esc(v.label)}<input data-variable="${attr(v.key)}" value="${attr(v.value)}" /></label>`).join('')}</div>

      <div class="section-title"><span>Resolved prompt</span><button class="button small" data-copy-resolved>Copy</button></div>
      <div class="prompt-box" data-resolved>${esc(prompt.prompt)}</div>
      <div class="drawer-actions"><button class="button primary" data-copy-resolved>Copy resolved prompt</button><button class="button" data-copy-template>Copy template</button><button class="button" data-copy-project>Copy Porter project JSON</button></div>

      <div class="section-title"><span>Reference plan</span></div>
      <div class="drawer-note">${prompt.refs.length ? prompt.refs.map((r,i)=>`[${i+1}] ${r}`).join(' · ') : 'No required reference asset — text-to-video concept.'}</div>
      <div class="section-title"><span>Production note</span></div><div class="drawer-note">${esc(prompt.post)}</div>

      <div class="section-title"><span>Research provenance</span><span>${sources.length} sources</span></div>
      <div class="source-links">${sources.map(source => `<a class="source-link" href="${attr(source.url)}" target="_blank" rel="noopener"><strong>${esc(source.title)}</strong><span>${esc(source.type)} ↗</span></a>`).join('')}</div>
    </div>`;
}

function openDrawer(prompt) {
  state.activePrompt = prompt;
  els.drawerContent.innerHTML = drawerHtml(prompt);
  els.drawer.classList.add('is-open'); els.drawer.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  const body = $('[data-prompt-body]', els.drawerContent);
  const update = () => { $('[data-resolved]', body).textContent = resolvedFromInputs(prompt, body); };
  $$('[data-variable]', body).forEach(input => input.addEventListener('input', update));
  $$('[data-copy-resolved]', body).forEach(button => button.addEventListener('click', () => copyText(resolvedFromInputs(prompt, body), 'Prompt copied')));
  $('[data-copy-template]', body).addEventListener('click', () => copyText(prompt.template, 'Template copied'));
  $('[data-copy-project]', body).addEventListener('click', () => copyText(JSON.stringify(buildPorterProject(prompt, resolvedFromInputs(prompt, body)), null, 2), 'Porter project JSON copied'));
}
function closeDrawer() { els.drawer.classList.remove('is-open'); els.drawer.setAttribute('aria-hidden','true'); document.body.style.overflow=''; state.activePrompt=null; }

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
  saveFavorites(); renderPrompts();
}

function setCategory(value) {
  state.category = value; els.category.value = value;
  $$('.chip').forEach(chip => chip.classList.toggle('is-active', chip.dataset.category === value));
  renderPrompts();
}

function bindEvents() {
  els.search.addEventListener('input', e => { state.query=e.target.value; renderPrompts(); });
  els.category.addEventListener('change', e => setCategory(e.target.value));
  els.mode.addEventListener('change', e => { state.mode=e.target.value; renderPrompts(); });
  els.aspect.addEventListener('change', e => { state.aspect=e.target.value; renderPrompts(); });
  els.sort.addEventListener('change', e => { state.sort=e.target.value; renderPrompts(); });
  els.chips.addEventListener('click', e => { const chip=e.target.closest('[data-category]'); if(chip) setCategory(chip.dataset.category); });
  els.grid.addEventListener('click', e => {
    const favorite=e.target.closest('[data-favorite]'); if(favorite){ e.stopPropagation(); toggleFavorite(favorite.dataset.favorite); return; }
    const copy=e.target.closest('[data-copy]'); if(copy){ e.stopPropagation(); const p=PROMPTS.find(x=>x.id===copy.dataset.copy); copyText(p.prompt,'Prompt copied'); return; }
    const open=e.target.closest('[data-open]'); const card=e.target.closest('[data-id]'); const id=open?.dataset.open || card?.dataset.id; if(id){ const p=PROMPTS.find(x=>x.id===id); if(p) openDrawer(p); }
  });
  els.grid.addEventListener('keydown', e => { if((e.key==='Enter'||e.key===' ') && e.target.matches('[data-id]')) openDrawer(PROMPTS.find(p=>p.id===e.target.dataset.id)); });
  $$('[data-close]', els.drawer).forEach(el => el.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeDrawer(); if(e.key==='/' && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); els.search.focus(); } });
  $('#randomPrompt').addEventListener('click', () => openDrawer(PROMPTS[Math.floor(Math.random()*PROMPTS.length)]));
  els.favoritesOnly.addEventListener('click', () => { state.favoritesOnly=!state.favoritesOnly; els.favoritesOnly.classList.toggle('primary',state.favoritesOnly); renderPrompts(); });
  $('#resetFilters').addEventListener('click', () => { state.query=''; state.mode='all'; state.aspect='all'; state.favoritesOnly=false; els.search.value=''; els.mode.value='all'; els.aspect.value='all'; els.favoritesOnly.classList.remove('primary'); setCategory('all'); });
  $$('.nav-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.nav-tab').forEach(t=>t.classList.toggle('is-active',t===tab)); const sources=tab.dataset.view==='sources'; els.promptView.hidden=sources; els.sourceView.hidden=!sources; if(sources) renderSources();
  }));
  els.sourceSearch.addEventListener('input', e => { state.sourceQuery=e.target.value; renderSources(); });
  els.sourceType.addEventListener('change', e => { state.sourceType=e.target.value; renderSources(); });
}

populateFilters(); renderHeroStats(); bindEvents(); renderPrompts(); renderSources();
