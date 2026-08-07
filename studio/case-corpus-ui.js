import { COLLECTION_GROUPS } from './case-intelligence-runtime.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr = (value='') => esc(value).replace(/`/g,'&#96;');
const COLLECTIONS = COLLECTION_GROUPS.flatMap(group => group.items.map(title => ({ group:group.title, title, id:slug(title) })));

let corpus = null;
let query = '';
let sourcePool = 'all';
let collection = 'all';
let scoreMin = 0;
let page = 1;
const PAGE_SIZE = 36;

injectCorpusNav();
injectCorpusView();
injectCorpusSidebar();
bindCorpusNavigation();
loadCorpus();

function injectCorpusNav() {
  const nav = $('.sidebar-nav');
  if (!nav || $('[data-case-view="corpus"]',nav)) return;
  nav.insertAdjacentHTML('beforeend', `<button class="nav-tab" data-case-view="corpus"><span class="nav-icon">▦</span><span>Research Corpus</span><span class="corpus-nav-count" id="corpusNavCount">—</span></button>`);
}

function injectCorpusSidebar() {
  const footer = $('.sidebar-footer');
  const sidebar = $('.sidebar');
  if (!sidebar || $('[data-sidebar-view="corpus"]')) return;
  const options = COLLECTION_GROUPS.map(group => `<optgroup label="${attr(group.title)}">${group.items.map(name => `<option value="${attr(slug(name))}">${esc(name)}</option>`).join('')}</optgroup>`).join('');
  const section = document.createElement('section');
  section.className = 'sidebar-filter-panel';
  section.dataset.sidebarView = 'corpus';
  section.innerHTML = `
    <div class="sidebar-section-title">Filter research corpus</div>
    <label class="sidebar-search"><span>Search</span><div class="sidebar-search-field"><span class="search-icon">⌕</span><input id="corpusSearch" type="search" placeholder="Product, logo, camera…" /></div></label>
    <label>Collection<select id="corpusCollection"><option value="all">All Collections</option>${options}</select></label>
    <label>Source pool<select id="corpusSource"><option value="all">All source pools</option></select></label>
    <label>Research score<select id="corpusScore"><option value="0">Any score</option><option value="70">70+</option><option value="80">80+</option><option value="90">90+</option></select></label>
    <div class="sidebar-subtitle">Coverage</div><div class="corpus-gap-table" id="corpusGaps"></div>`;
  sidebar.insertBefore(section,footer);
}

function injectCorpusView() {
  const main = $('.page');
  if (!main || $('#corpusView')) return;
  const section = document.createElement('section');
  section.id = 'corpusView';
  section.className = 'library-view';
  section.hidden = true;
  section.innerHTML = `
    <header class="view-header"><div><div class="view-kicker">Research candidates · not yet curated</div><h1>Research Corpus</h1><p>Balanced source cases selected for study. A candidate enters Industry Digest only after prompt anatomy, full-video visual review and transferable-pattern verification.</p></div></header>
    <div id="corpusBody" class="corpus-loading">Case corpus snapshot has not loaded yet.</div>`;
  main.appendChild(section);
}

function bindCorpusNavigation() {
  document.addEventListener('click', event => {
    const corpusTab = event.target.closest('[data-case-view="corpus"]');
    if (corpusTab) { event.preventDefault(); showCorpus(); return; }
    if (event.target.closest('.nav-tab[data-view]')) hideCorpus();
    const gap = event.target.closest('[data-corpus-collection]');
    if (gap) {
      collection = gap.dataset.corpusCollection;
      const select = $('#corpusCollection'); if (select) select.value = collection;
      page = 1; renderCorpus();
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'corpusSearch') { query = event.target.value; page = 1; renderCorpus(); }
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'corpusSource') { sourcePool = event.target.value; page = 1; renderCorpus(); }
    if (event.target.id === 'corpusCollection') { collection = event.target.value; page = 1; renderCorpus(); }
    if (event.target.id === 'corpusScore') { scoreMin = Number(event.target.value); page = 1; renderCorpus(); }
  });
}

function showCorpus() {
  for (const id of ['digestView','promptView','sourceView']) { const el=$(`#${id}`); if(el) el.hidden=true; }
  const view = $('#corpusView'); if (view) view.hidden=false;
  $$('.nav-tab').forEach(tab => tab.classList.remove('is-active'));
  $('[data-case-view="corpus"]')?.classList.add('is-active');
  const state = $('#sidebarState'); if (state) state.checked=false;
  renderCorpus();
}
function hideCorpus() { const view=$('#corpusView'); if(view) view.hidden=true; }

async function loadCorpus() {
  try {
    const response = await fetch('./case-candidates.json',{cache:'no-store'});
    if (!response.ok) throw new Error(`${response.status}`);
    corpus = await response.json();
    $('#corpusNavCount').textContent = corpus.stats?.candidates ?? corpus.candidates?.length ?? 0;
    populateSourceFilter();
  } catch (error) {
    corpus = { candidates:[], stats:{ candidates:0 }, error:String(error) };
    $('#corpusNavCount').textContent = '0';
  }
  renderGaps();
  if (!$('#corpusView')?.hidden) renderCorpus();
}

function populateSourceFilter() {
  const select = $('#corpusSource');
  if (!select || !corpus) return;
  const pools = [...new Map(corpus.candidates.map(item => [item.sourcePool,item.sourcePoolLabel || item.sourcePool])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  select.innerHTML = `<option value="all">All source pools</option>${pools.map(([id,label])=>`<option value="${attr(id)}">${esc(label)}</option>`).join('')}`;
}

function filtered() {
  if (!corpus) return [];
  const q = query.trim().toLowerCase();
  return corpus.candidates.filter(item => {
    if (sourcePool !== 'all' && item.sourcePool !== sourcePool) return false;
    if (collection !== 'all' && !item.collections?.includes(collection)) return false;
    if (item.score < scoreMin) return false;
    if (!q) return true;
    return `${item.title} ${item.author} ${item.excerpt} ${(item.collections||[]).join(' ')}`.toLowerCase().includes(q);
  });
}

function renderCorpus() {
  const body = $('#corpusBody');
  if (!body) return;
  if (!corpus) { body.className='corpus-loading'; body.textContent='Loading research corpus…'; return; }
  if (corpus.error || !corpus.candidates.length) {
    body.className='corpus-loading';
    body.innerHTML='<div><strong>Corpus refresh pending.</strong><br>Run the “Refresh Case Intelligence Corpus” GitHub Action or <code>npm run case:import</code>. The curated Digest remains independent.</div>';
    return;
  }
  const items = filtered();
  const pages = Math.max(1,Math.ceil(items.length/PAGE_SIZE));
  page = Math.min(page,pages);
  const slice = items.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  body.className='';
  body.innerHTML = `
    <div class="corpus-summary"><div class="corpus-stat"><strong>${corpus.stats.candidates}</strong><span>selected candidates</span></div><div class="corpus-stat"><strong>${corpus.stats.creators}</strong><span>creator/source labels</span></div><div class="corpus-stat"><strong>${corpus.stats.withOriginalCreatorSource}</strong><span>direct creator-source links</span></div><div class="corpus-stat"><strong>${corpus.stats.averageScore}</strong><span>average research score</span></div></div>
    <div class="corpus-notice"><strong>Candidate ≠ reviewed case.</strong> These entries are selected for study. Promotion requires shot-by-shot prompt anatomy, actual complete-video review, causal analysis, artifact/continuity notes and signature-move verification.</div>
    <div class="results-meta"><div><strong>${items.length}</strong> matching candidates</div><div>${esc(collection==='all'?'All Collections':COLLECTIONS.find(c=>c.id===collection)?.title || collection)}</div></div>
    <div class="corpus-grid">${slice.map(corpusCard).join('')}</div>
    <div class="corpus-pagination"><button id="corpusPrev" ${page<=1?'disabled':''}>←</button><span class="corpus-page-label">Page ${page} / ${pages}</span><button id="corpusNext" ${page>=pages?'disabled':''}>→</button></div>`;
  $('#corpusPrev')?.addEventListener('click',()=>{page=Math.max(1,page-1);renderCorpus();scrollMain();});
  $('#corpusNext')?.addEventListener('click',()=>{page=Math.min(pages,page+1);renderCorpus();scrollMain();});
  $$('.corpus-preview img',body).forEach(img => img.addEventListener('error',()=>{ const preview=img.closest('.corpus-preview'); if(preview){ img.remove(); if(!$('.corpus-placeholder',preview)) preview.insertAdjacentHTML('afterbegin','<div class="corpus-placeholder">Source candidate</div>'); } },{once:true}));
}

function corpusCard(item) {
  const names = (item.collections||[]).slice(0,4).map(id=>COLLECTIONS.find(c=>c.id===id)?.title || id);
  const preview = item.previewUrl ? `<img loading="lazy" referrerpolicy="no-referrer" src="${attr(item.previewUrl)}" alt="Source preview for ${attr(item.title)}">` : '<div class="corpus-placeholder">Source candidate</div>';
  return `<article class="corpus-card"><div class="corpus-preview">${preview}<span class="corpus-score">${item.score}</span></div><div class="corpus-body"><div class="corpus-meta">${esc(item.sourcePoolLabel || item.sourcePool)} · candidate</div><h3>${esc(item.title)}</h3><div class="corpus-author">${esc(item.author || 'Unknown creator')}</div><div class="corpus-excerpt">${esc(item.excerpt || 'Open source to inspect this candidate.')}</div><div class="corpus-collections">${names.map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="corpus-actions"><a href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">Open source ↗</a>${item.archiveUrl && item.archiveUrl!==item.sourceUrl ? `<a href="${attr(item.archiveUrl)}" target="_blank" rel="noopener">Archive ↗</a>`:''}</div></div></article>`;
}

function renderGaps() {
  const node = $('#corpusGaps'); if(!node) return;
  const counts = corpus?.stats?.collectionCounts || {};
  node.innerHTML = COLLECTIONS.map(c=>`<button class="corpus-gap-row" type="button" data-corpus-collection="${attr(c.id)}"><span>${esc(c.title)}</span><span>${counts[c.id] || 0}</span></button>`).join('');
}
function scrollMain(){ $('#corpusView')?.scrollIntoView({behavior:'smooth',block:'start'}); }
function slug(value){ return String(value||'').toLowerCase().replace(/\//g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
