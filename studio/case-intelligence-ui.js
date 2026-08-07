import { INDUSTRY_DIGEST } from './digest-data.js';
import { COLLECTION_GROUPS, COLLECTIONS, CASE_INTELLIGENCE, CASE_INTELLIGENCE_STATS } from './case-intelligence-data.js';
import { buildTransferredProject, buildTransferredPrompt } from './pattern-builder.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr = (value='') => esc(value).replace(/`/g, '&#96;');

let activeCollection = new URLSearchParams(location.search).get('collection') || 'all';
let activeCaseId = null;
let builtProject = null;
let builtPrompt = '';

injectStyles();
injectCollectionBrowser();
injectPatternModal();
bindCollectionEvents();
bindDrawerTracking();
bindPatternEvents();
observeDigestGrid();
observeDrawer();
applyCollectionFilter();

function injectStyles() {
  if ($('link[data-case-intelligence]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './case-intelligence.css';
  link.dataset.caseIntelligence = 'true';
  document.head.appendChild(link);
}

function collectionCount(id) {
  return INDUSTRY_DIGEST.filter(item => CASE_INTELLIGENCE[item.id]?.collections?.includes(id)).length;
}

function injectCollectionBrowser() {
  const panel = $('[data-sidebar-view="digest"]');
  if (!panel || $('.collection-browser', panel)) return;
  const searchLabel = $('.sidebar-search', panel);
  const browser = document.createElement('div');
  browser.className = 'collection-browser';
  browser.innerHTML = `
    <div class="sidebar-section-title">Collections</div>
    <button class="collection-all ${activeCollection==='all'?'is-active':''}" data-collection="all"><span>All cases</span><span class="collection-count">${INDUSTRY_DIGEST.length}</span></button>
    ${COLLECTION_GROUPS.map(group => {
      const items = COLLECTIONS.filter(c => c.group === group.id);
      const groupCount = items.reduce((sum,c)=>sum+collectionCount(c.id),0);
      return `<details class="collection-group" open><summary><span>${esc(group.title)}</span><span class="collection-count">${groupCount}</span></summary><div class="collection-list">${items.map(c => {
        const count = collectionCount(c.id);
        return `<button class="collection-item ${activeCollection===c.id?'is-active':''} ${count===0?'collection-zero':''}" data-collection="${attr(c.id)}" title="${attr(c.description)}"><span>${esc(c.title)}</span><span class="collection-count">${count}</span></button>`;
      }).join('')}</div></details>`;
    }).join('')}
  `;
  panel.insertBefore(browser, searchLabel || panel.children[1]);

  const currentTitle = $('.page-header-copy p');
  if (currentTitle) currentTitle.dataset.originalCopy = currentTitle.textContent;
}

function bindCollectionEvents() {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-collection]');
    if (!button) return;
    activeCollection = button.dataset.collection;
    const params = new URLSearchParams(location.search);
    if (activeCollection === 'all') params.delete('collection'); else params.set('collection', activeCollection);
    history.replaceState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
    $$('.collection-item,.collection-all').forEach(el => el.classList.toggle('is-active', el.dataset.collection === activeCollection));
    applyCollectionFilter();
  });

  $('#resetDigest')?.addEventListener('click', () => {
    activeCollection = 'all';
    $$('.collection-item,.collection-all').forEach(el => el.classList.toggle('is-active', el.dataset.collection === 'all'));
    const params = new URLSearchParams(location.search); params.delete('collection');
    history.replaceState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
    requestAnimationFrame(applyCollectionFilter);
  });
}

function observeDigestGrid() {
  const grid = $('#digestGrid');
  if (!grid) return;
  new MutationObserver(() => requestAnimationFrame(applyCollectionFilter)).observe(grid, { childList: true });
}

function applyCollectionFilter() {
  const cards = $$('#digestGrid [data-digest-id]');
  let visible = 0;
  cards.forEach(card => {
    const intel = CASE_INTELLIGENCE[card.dataset.digestId];
    const show = activeCollection === 'all' || intel?.collections?.includes(activeCollection);
    card.hidden = !show;
    if (show) visible += 1;
    enhanceCard(card, intel);
  });
  const count = $('#digestCount');
  if (count && activeCollection !== 'all') count.textContent = visible;
  const empty = $('#digestEmpty');
  if (empty && cards.length) empty.hidden = visible > 0;
  updateCollectionContext(visible);
}

function enhanceCard(card, intel) {
  if (!intel || card.dataset.intelligenceEnhanced) return;
  card.dataset.intelligenceEnhanced = 'true';
  const kicker = $('.card-kicker', card);
  if (kicker) {
    const status = document.createElement('span');
    status.className = 'case-review-pill';
    status.textContent = intel.reviewStatus === 'deep-reviewed' ? 'Deep reviewed' : 'Prompt anatomy';
    kicker.insertAdjacentElement('afterend', status);
  }
}

function updateCollectionContext(visible) {
  const title = $('.page-header h1');
  const copy = $('.page-header-copy p');
  if (!title || !copy) return;
  if (activeCollection === 'all') {
    title.textContent = 'Industry Digest';
    copy.textContent = copy.dataset.originalCopy || 'Source cases, original excerpts and Porter adaptations. Select a collection or open a case for shot-by-shot analysis.';
    return;
  }
  const collection = COLLECTIONS.find(c => c.id === activeCollection);
  if (!collection) return;
  title.textContent = collection.title;
  copy.textContent = `${collection.description} ${visible} reviewed cases in the current curated release.`;
}

function bindDrawerTracking() {
  document.addEventListener('click', event => {
    const card = event.target.closest('[data-digest-id]');
    const open = event.target.closest('[data-open-digest]');
    activeCaseId = open?.dataset.openDigest || card?.dataset.digestId || activeCaseId;
  }, true);
}

function observeDrawer() {
  const drawer = $('#drawerContent');
  if (!drawer) return;
  new MutationObserver(() => requestAnimationFrame(enhanceDigestDrawer)).observe(drawer, { childList: true, subtree: true });
}

function inferDrawerCase() {
  if (activeCaseId) {
    const item = INDUSTRY_DIGEST.find(x => x.id === activeCaseId);
    if (item) return item;
  }
  const source = $('.digest-drawer-hero', $('#drawerContent'))?.href;
  if (source) return INDUSTRY_DIGEST.find(x => source.startsWith(x.sourceUrl));
  const title = $('#drawerTitle')?.textContent;
  return INDUSTRY_DIGEST.find(x => x.title === title);
}

function enhanceDigestDrawer() {
  const body = $('[data-digest-body]', $('#drawerContent'));
  if (!body || $('.case-intelligence', body)) return;
  const item = inferDrawerCase();
  if (!item) return;
  activeCaseId = item.id;
  const intel = CASE_INTELLIGENCE[item.id];
  if (!intel) return;

  const section = document.createElement('section');
  section.className = 'case-intelligence';
  section.innerHTML = `
    <div class="case-intelligence-head">
      <div><h3>Case anatomy</h3><p class="case-intelligence-lede">${esc(intel.thesis)}</p></div>
      <span class="case-review-pill ${intel.reviewStatus==='deep-reviewed'?'deep':''}">${intel.reviewStatus==='deep-reviewed'?'Deep reviewed':'Prompt anatomy · video review pending'}</span>
    </div>
    <div class="case-collections">${intel.collections.map(id => { const c=COLLECTIONS.find(x=>x.id===id); return c ? `<button class="case-collection-chip" data-jump-collection="${attr(id)}">${esc(c.title)}</button>` : ''; }).join('')}</div>
    <div class="case-section"><div class="case-section-title">Signature move</div><div class="case-signature">${esc(intel.signatureMove)}</div></div>
    <div class="case-section"><div class="case-section-title">Shot-by-shot</div><div class="shot-stack">${intel.shotBreakdown.map(shot => `<div class="shot-analysis"><div class="shot-number">${String(shot.n).padStart(2,'0')}</div><div class="shot-meta"><strong>${esc(shot.role)}</strong><span>${esc(shot.framing)} · ${esc(shot.camera)}</span></div><div class="shot-why"><strong>${esc(shot.action)}</strong><br>${esc(shot.why)}</div></div>`).join('')}</div></div>
    <div class="case-section"><div class="case-section-title">Why the result looks like this</div><ul class="causal-list">${intel.causalMechanics.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="case-section"><div class="case-section-title">Rhythm</div><div class="case-signature">${esc(intel.rhythm)}</div></div>
    <div class="case-section"><div class="case-section-title">Reference strategy</div><div class="case-signature">${esc(intel.referenceStrategy)}</div></div>
    <div class="case-section"><div class="case-section-title">Motion language</div><div class="motion-token-row">${intel.motionLanguage.map(x=>`<span class="motion-token">${esc(x)}</span>`).join('')}</div></div>
    <div class="case-section"><div class="case-section-title">Failure risks</div><ul class="risk-list">${intel.failureRisks.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="case-transfer-box"><strong>Use this pattern for my project</strong><p>${esc(intel.transferablePattern)}</p><button class="button primary" data-use-pattern="${attr(item.id)}">Use this pattern</button></div>
    ${intel.evidence.fullVideo !== 'reviewed' ? `<p class="pattern-status">Evidence status: the published prompt and source preview are analyzed. Full-video visual review is still pending, so this section does not claim unobserved frame details.</p>` : ''}
  `;
  body.appendChild(section);

  $$('[data-jump-collection]', section).forEach(button => button.addEventListener('click', () => {
    activeCollection = button.dataset.jumpCollection;
    $('#drawer')?.querySelector('[data-close]')?.click();
    $$('.collection-item,.collection-all').forEach(el => el.classList.toggle('is-active', el.dataset.collection === activeCollection));
    applyCollectionFilter();
  }));
}

function injectPatternModal() {
  if ($('#patternModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="pattern-modal" id="patternModal" aria-hidden="true">
      <div class="pattern-modal-backdrop" data-pattern-close></div>
      <div class="pattern-modal-panel" role="dialog" aria-modal="true" aria-labelledby="patternModalTitle">
        <header class="pattern-modal-header"><div><h2 id="patternModalTitle">Use this pattern</h2><p id="patternModalSource">Transfer shot logic, not source subject matter.</p></div><button class="pattern-close" type="button" data-pattern-close aria-label="Close">×</button></header>
        <div class="pattern-modal-body">
          <form class="pattern-form" id="patternForm">
            <div class="pattern-form-grid">
              <label>Project / brand<input name="projectName" placeholder="e.g. IMON Real Estate launch" /></label>
              <label>What are we showing?<textarea name="subject" placeholder="Product, site, app, service, space or person — be concrete"></textarea></label>
              <label>Objective<textarea name="objective" placeholder="What should the viewer understand or feel after this clip?"></textarea></label>
              <label>Environment<textarea name="environment" placeholder="Where does the action happen? Keep it controlled."></textarea></label>
              <label>Visual style<textarea name="style" placeholder="Brand tone, materials, lighting and finish"></textarea></label>
              <label>What must stay exact?<textarea name="exact" placeholder="Geometry, logo, colors, face, packaging, layout — separate with commas"></textarea></label>
              <label>Reference URLs<textarea name="references" placeholder="One image URL per line. Leave empty for text-to-video."></textarea></label>
              <div class="pattern-two"><label>Primary ref role<select name="referenceRole"><option value="product">Product</option><option value="identity">Identity</option><option value="logo">Logo</option><option value="environment">Environment</option></select></label><label>Face provenance<select name="faceSource"><option value="none">No human face</option><option value="synthetic">Synthetic person</option><option value="non-human">Non-human</option><option value="modelark-trusted-output">ModelArk trusted output</option><option value="preset-digital-character">Preset digital character</option><option value="authorized-real-person">Authorized real person</option></select></label></div>
              <div class="pattern-two"><label>Aspect<select name="aspect"><option>16:9</option><option>9:16</option><option>1:1</option><option>4:3</option><option>3:4</option><option>21:9</option></select></label><label>Duration<input name="duration" type="number" min="4" max="15" value="9" /></label></div>
              <label><span><input name="audio" type="checkbox" /> Generate audio</span></label>
            </div>
            <div class="pattern-actions"><button class="button primary" type="submit">Build transferred project</button><button class="button" type="button" data-copy-pattern-prompt>Copy prompt</button><button class="button" type="button" data-copy-pattern-json>Copy project JSON</button></div>
          </form>
          <div class="pattern-output"><div class="pattern-output-head"><strong>Porter project</strong><span class="case-review-pill">BOS-ready draft</span></div><pre id="patternOutput">Fill the project brief, then build the transferred pattern.</pre><div class="pattern-status" id="patternStatus">On GitHub Pages this creates a structured Porter project locally in your browser. Run it through the local Porter Studio for authoritative BOS validation before paid generation.</div></div>
        </div>
      </div>
    </div>`);
}

function bindPatternEvents() {
  document.addEventListener('click', event => {
    const use = event.target.closest('[data-use-pattern]');
    if (use) openPatternModal(use.dataset.usePattern);
    if (event.target.closest('[data-pattern-close]')) closePatternModal();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('#patternModal')?.classList.contains('is-open')) closePatternModal(); });
  $('#patternForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const item = INDUSTRY_DIGEST.find(x => x.id === activeCaseId);
    const intel = CASE_INTELLIGENCE[activeCaseId];
    if (!item || !intel) return;
    const input = Object.fromEntries(new FormData(event.currentTarget).entries());
    input.audio = Boolean(event.currentTarget.elements.audio.checked);
    builtPrompt = buildTransferredPrompt(item, intel, input);
    builtProject = buildTransferredProject(item, intel, input);
    $('#patternOutput').textContent = JSON.stringify(builtProject, null, 2);
    $('#patternStatus').textContent = location.hostname === '127.0.0.1' || location.hostname === 'localhost'
      ? 'Project built. Copy JSON into Porter Studio and run Validate Official before generation.'
      : 'Project built locally in your browser. Open the local Porter Studio to run the authoritative BOS compliance gate before generation.';
  });
  $('[data-copy-pattern-prompt]')?.addEventListener('click', () => copy(builtPrompt || 'Build the project first.', 'Transferred prompt copied'));
  $('[data-copy-pattern-json]')?.addEventListener('click', () => copy(builtProject ? JSON.stringify(builtProject,null,2) : 'Build the project first.', 'Porter project copied'));
}

function openPatternModal(id) {
  const item = INDUSTRY_DIGEST.find(x => x.id === id); if (!item) return;
  activeCaseId = id; builtProject = null; builtPrompt = '';
  $('#patternModalTitle').textContent = `Use “${item.title}” pattern`;
  $('#patternModalSource').textContent = `Source: ${item.author}. Transfer the structure and shot functions, not the source subject matter.`;
  $('#patternOutput').textContent = 'Fill the project brief, then build the transferred pattern.';
  const modal = $('#patternModal'); modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closePatternModal() { const modal=$('#patternModal'); if(!modal)return; modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
async function copy(text, label) { try { await navigator.clipboard.writeText(text); const toast=$('#toast'); if(toast){toast.textContent=label; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1600);} } catch {} }

console.info('Seedance Porter Case Intelligence', CASE_INTELLIGENCE_STATS);
