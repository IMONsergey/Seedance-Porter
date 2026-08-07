import { COLLECTIONS } from './case-intelligence-data.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const esc = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr = (value='') => esc(value).replace(/`/g,'&#96;');

let corpus = null;
let query = '';
let sourcePool = 'all';
let scoreMin = 0;
let page = 1;
const PAGE_SIZE = 36;

injectCss();
injectCorpusNav();
injectCorpusView();
injectCorpusSidebar();
bindCorpusNavigation();
loadCorpus();

function injectCss() {
  const link=document.createElement('link'); link.rel='stylesheet'; link.href='./case-corpus.css'; document.head.appendChild(link);
}

function injectCorpusNav() {
  const nav=$('.sidebar-nav'); if(!nav || $('[data-case-view="corpus"]',nav)) return;
  nav.insertAdjacentHTML('beforeend', `<button class="nav-tab" data-case-view="corpus"><span class="nav-icon">▦</span><span>Research Corpus</span><span class="corpus-nav-count" id="corpusNavCount">—</span></button>`);
}

function injectCorpusSidebar() {
  const footer=$('.sidebar-footer'); const sidebar=$('.sidebar'); if(!sidebar || $('[data-sidebar-view="corpus"]')) return;
  const section=document.createElement('section'); section.className='sidebar-filter-panel'; section.dataset.sidebarView='corpus';
  section.innerHTML=`<div class="sidebar-section-title">Filter corpus</div>
    <label class="sidebar-search"><span>Search</span><div class="sidebar-search-field"><span class="search-icon">⌕</span><input id="corpusSearch" type="search" placeholder="Product, logo, camera…" /></div></label>
    <label>Source pool<select id="corpusSource"><option value="all">All source pools</option></select></label>
    <label>Research score<select id="corpusScore"><option value="0">Any score</option><option value="70">70+</option><option value="80">80+</option><option value="90">90+</option></select></label>
    <div class="sidebar-subtitle">Collection coverage</div><div class="corpus-gap-table" id="corpusGaps"></div>`;
  sidebar.insertBefore(section, footer);
}

function injectCorpusView() {
  const main=$('.page'); if(!main || $('#corpusView')) return;
  const section=document.createElement('section'); section.id='corpusView'; section.className='library-view'; section.hidden=true;
  section.innerHTML=`<div class="view-header"><div class="page-header-copy"><div class="view-kicker">RESEARCH CANDIDATES · NOT YET CURATED</div><h1>Research Corpus</h1><p>Balanced source candidates selected for deep review. Candidate cards are discovery records, not endorsed patterns until prompt anatomy and full-video visual review are complete.</p></div></div>
    <div id="corpusBody" class="corpus-loading">Case corpus snapshot has not loaded yet.</div>`;
  main.appendChild(section);
}

function bindCorpusNavigation() {
  document.addEventListener('click', event => {
    const corpusTab=event.target.closest('[data-case-view="corpus"]');
    if(corpusTab){ event.preventDefault(); showCorpus(); return; }
    const regular=event.target.closest('.nav-tab[data-view]');
    if(regular) hideCorpus();
    const collection=event.target.closest('[data-collection]');
    if(collection && !$('#corpusView')?.hidden){ page=1; renderCorpus(); }
  });

  document.addEventListener('input', event => {
    if(event.target.id==='corpusSearch'){ query=event.target.value; page=1; renderCorpus(); }
  });
  document.addEventListener('change', event => {
    if(event.target.id==='corpusSource'){ sourcePool=event.target.value; page=1; renderCorpus(); }
    if(event.target.id==='corpusScore'){ scoreMin=Number(event.target.value); page=1; renderCorpus(); }
  });
}

function showCorpus() {
  $('#digestView').hidden=true; $('#promptView').hidden=true; $('#sourceView').hidden=true; $('#corpusView').hidden=false;
  $$('.nav-tab').forEach(tab=>tab.classList.remove('is-active')); $('[data-case-view="corpus"]')?.classList.add('is-active');
  document.querySelector('#sidebarState')?.click?.();
  renderCorpus();
}
function hideCorpus(){ if($('#corpusView')) $('#corpusView').hidden=true; }

async function loadCorpus() {
  try {
    const response=await fetch('./case-candidates.json',{cache:'no-store'});
    if(!response.ok) throw new Error(`${response.status}`);
    corpus=await response.json();
    $('#corpusNavCount').textContent=corpus.stats?.candidates ?? corpus.candidates?.length ?? 0;
    populateSourceFilter(); renderGaps();
    if(!$('#corpusView').hidden) renderCorpus();
  } catch(error) {
    corpus={ candidates:[], stats:{ candidates:0 }, error:String(error) };
    $('#corpusNavCount').textContent='0';
    renderGaps();
    if(!$('#corpusView').hidden) renderCorpus();
  }
}

function populateSourceFilter() {
  const select=$('#corpusSource'); if(!select || !corpus) return;
  const pools=[...new Set(corpus.candidates.map(item=>item.sourcePoolLabel||item.sourcePool).filter(Boolean))].sort();
  const ids=[...new Map(corpus.candidates.map(item=>[item.sourcePool,item.sourcePoolLabel||item.sourcePool])).entries()];
  select.innerHTML=`<option value="all">All source pools</option>${ids.map(([id,label])=>`<option value="${attr(id)}">${esc(label)}</option>`).join('')}`;
}

function currentCollection() { return new URLSearchParams(location.search).get('collection') || 'all'; }
function filtered() {
  if(!corpus) return [];
  const q=query.trim().toLowerCase(); const collection=currentCollection();
  return corpus.candidates.filter(item=>{
    if(sourcePool!=='all' && item.sourcePool!==sourcePool) return false;
    if(item.score<scoreMin) return false;
    if(collection!=='all' && !item.collections?.includes(collection)) return false;
    if(!q) return true;
    return `${item.title} ${item.author} ${item.excerpt} ${(item.collections||[]).join(' ')}`.toLowerCase().includes(q);
  });
}

function renderCorpus() {
  const body=$('#corpusBody'); if(!body) return;
  if(!corpus){ body.className='corpus-loading'; body.textContent='Loading research corpus…'; return; }
  if(corpus.error || !corpus.candidates.length){
    body.className='corpus-loading'; body.innerHTML=`<div><strong>Corpus refresh pending.</strong><br><span>Run the “Refresh Case Intelligence Corpus” GitHub Action or <code>npm run case:import</code>. Curated Digest remains available independently.</span></div>`; return;
  }
  const items=filtered(); const pages=Math.max(1,Math.ceil(items.length/PAGE_SIZE)); page=Math.min(page,pages); const slice=items.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  body.className='';
  body.innerHTML=`<div class="corpus-summary"><div class="corpus-stat"><strong>${corpus.stats.candidates}</strong><span>selected candidates</span></div><div class="corpus-stat"><strong>${corpus.stats.creators}</strong><span>creators / source authors</span></div><div class="corpus-stat"><strong>${corpus.stats.withOriginalCreatorSource}</strong><span>direct creator-source links</span></div><div class="corpus-stat"><strong>${corpus.stats.averageScore}</strong><span>average research score</span></div></div>
    <div class="corpus-notice"><strong>Candidate ≠ reviewed case.</strong> These entries are selected for study. They enter Industry Digest only after shot-by-shot prompt anatomy, actual full-video visual review, causal analysis and signature-move verification.</div>
    <div class="results-meta"><div><strong>${items.length}</strong> matching candidates</div><div>${esc(currentCollection()==='all'?'All Collections':COLLECTIONS.find(c=>c.id===currentCollection())?.title || currentCollection())}</div></div>
    <div class="corpus-grid">${slice.map(card).join('')}</div>
    <div class="corpus-pagination"><button id="corpusPrev" ${page<=1?'disabled':''}>←</button><span class="corpus-page-label">Page ${page} / ${pages}</span><button id="corpusNext" ${page>=pages?'disabled':''}>→</button></div>`;
  $('#corpusPrev')?.addEventListener('click',()=>{page=Math.max(1,page-1);renderCorpus();scrollMain();});
  $('#corpusNext')?.addEventListener('click',()=>{page=Math.min(pages,page+1);renderCorpus();scrollMain();});
}

function card(item) {
  const names=(item.collections||[]).slice(0,4).map(id=>COLLECTIONS.find(c=>c.id===id)?.title||id);
  const preview=item.previewUrl ? `<img loading="lazy" referrerpolicy="no-referrer" src="${attr(item.previewUrl)}" alt="Source preview" onerror="this.parentElement.innerHTML='<div class=&quot;corpus-placeholder&quot;>Source candidate</div><span class=&quot;corpus-score&quot;>${item.score}</span>'">` : `<div class="corpus-placeholder">Source candidate</div>`;
  return `<article class="corpus-card"><div class="corpus-preview">${preview}<span class="corpus-score">${item.score}</span></div><div class="corpus-body"><div class="corpus-meta">${esc(item.sourcePoolLabel||item.sourcePool)} · candidate</div><h3>${esc(item.title)}</h3><div class="corpus-author">${esc(item.author||'Unknown creator')}</div><div class="corpus-excerpt">${esc(item.excerpt||'Open source to inspect this candidate.')}</div><div class="corpus-collections">${names.map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="corpus-actions"><a href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">Open source ↗</a>${item.archiveUrl && item.archiveUrl!==item.sourceUrl ? `<a href="${attr(item.archiveUrl)}" target="_blank" rel="noopener">Archive ↗</a>`:''}</div></div></article>`;
}

function renderGaps() {
  const node=$('#corpusGaps'); if(!node) return;
  const counts=corpus?.stats?.collectionCounts || {};
  node.innerHTML=COLLECTIONS.map(c=>`<button class="corpus-gap-row" data-collection="${attr(c.id)}"><span>${esc(c.title)}</span><span>${counts[c.id]||0}</span></button>`).join('');
}
function scrollMain(){ $('#corpusView')?.scrollIntoView({behavior:'smooth',block:'start'}); }
