import { CASE_INTELLIGENCE, COLLECTION_GROUPS, COLLECTION_COUNTS } from './case-intelligence.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const intelligenceById = new Map(CASE_INTELLIGENCE.map(item => [item.id, item]));
let activeCollection = 'all';
let currentCase = null;

function injectCollections() {
  const panel = $('[data-sidebar-view="digest"]');
  const reset = $('#resetDigest', panel);
  if (!panel || !reset || $('#caseCollections')) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'caseCollections';
  wrapper.className = 'case-collections';
  wrapper.innerHTML = `
    <div class="sidebar-subtitle collection-heading">Collections</div>
    <button class="collection-all is-active" type="button" data-collection="all"><span>All cases</span><strong>${CASE_INTELLIGENCE.length}</strong></button>
    ${COLLECTION_GROUPS.map(group => `
      <details class="collection-group" open>
        <summary>${esc(group.title)}</summary>
        <div class="collection-items">
          ${group.items.map(name => `<button type="button" data-collection="${esc(name)}"><span>${esc(name)}</span><strong>${COLLECTION_COUNTS[name] || 0}</strong></button>`).join('')}
        </div>
      </details>`).join('')}
  `;
  panel.insertBefore(wrapper, reset);
  wrapper.addEventListener('click', event => {
    const button = event.target.closest('[data-collection]');
    if (!button) return;
    activeCollection = button.dataset.collection;
    $$('[data-collection]', wrapper).forEach(el => el.classList.toggle('is-active', el === button));
    applyCollectionFilter();
  });
}

function applyCollectionFilter() {
  const cards = $$('#digestGrid [data-digest-id]');
  let visible = 0;
  cards.forEach(card => {
    const item = intelligenceById.get(card.dataset.digestId);
    const show = activeCollection === 'all' || item?.intelligence.collections.includes(activeCollection);
    card.hidden = !show;
    if (show) visible += 1;
  });
  const count = $('#digestCount');
  if (count) count.textContent = String(visible);
  const empty = $('#digestEmpty');
  if (empty) empty.hidden = visible > 0;
}

function shotCard(shot) {
  return `<article class="shot-analysis-card">
    <div class="shot-analysis-index">${shot.index}</div>
    <div class="shot-analysis-content">
      <div class="shot-analysis-label">${esc(shot.label)}</div>
      <h4>${esc(shot.camera)}</h4>
      <p>${esc(shot.action)}</p>
      <dl>
        <div><dt>Purpose</dt><dd>${esc(shot.visualPurpose)}</dd></div>
        <div><dt>Why this shot</dt><dd>${esc(shot.whyThisShotExists)}</dd></div>
        <div><dt>Continuity</dt><dd>${esc(shot.continuity)}</dd></div>
      </dl>
    </div>
  </article>`;
}

function pillList(values, className = '') {
  return `<div class="intelligence-pills ${className}">${values.map(value => `<span>${esc(value)}</span>`).join('')}</div>`;
}

function buildPatternDraft(item, form) {
  const intelligence = item.intelligence;
  const projectType = form.elements.projectType.value.trim() || 'brand campaign';
  const brand = form.elements.brand.value.trim() || 'my brand';
  const subject = form.elements.subject.value.trim() || 'my product or interface';
  const objective = form.elements.objective.value.trim() || `adapt the production pattern for ${projectType}`;
  const referenceNotes = form.elements.references.value.trim();
  const firstShot = intelligence.shotBreakdown[0]?.action || 'Establish the subject and core visual rule.';
  const beats = intelligence.shotBreakdown.map((shot, index) => `Shot ${index + 1}: ${shot.action}`);
  const prompt = [
    `Project: ${brand} — ${projectType}.`,
    `Objective: ${objective}.`,
    `Core subject: ${subject}.`,
    `Pattern logic: ${intelligence.transferablePattern}`,
    `Signature move: ${intelligence.signatureMove}`,
    ...beats,
    `Reference strategy: ${intelligence.referenceStrategy.join(' ')}`,
    `Camera: ${intelligence.cameraLanguage.join(' ')}`,
    `Continuity: preserve subject identity, product/interface geometry, material language and lighting direction across all shots.`,
    `Post-production: ${intelligence.postProductionExpectation}`,
    `Constraints: no unrequested text, no invented logos, no duplicate subject, no compound camera moves.`,
    referenceNotes ? `Reference notes supplied by user: ${referenceNotes}` : ''
  ].filter(Boolean).join('\n');

  return {
    project: `pattern-${item.id.replace(/^digest-/, '')}`,
    label: `${brand} / ${item.title}`,
    model: 'seedance-2.0',
    mode: referenceNotes ? 'reference-to-video' : 'text-to-video',
    duration: Math.min(15, Math.max(6, intelligence.shotBreakdown.length * 3)),
    resolution: '720p',
    aspectRatio: item.aspect || '16:9',
    generateAudio: /audio|sound|music|voice|dialogue|ambience/i.test(item.porterPrompt),
    outputPolicy: { generatedText: 'forbid', generatedLogo: 'forbid', generatedWatermark: 'forbid' },
    brief: {
      objective,
      subject,
      action: firstShot,
      environment: `Adapt the environment to ${projectType} while preserving the source pattern's spatial logic.`,
      camera: intelligence.cameraLanguage.join(' '),
      style: `Independent adaptation of the production logic from “${item.title}”; do not copy original subject matter or distinctive wording.`,
      imageQuality: 'HD, stable geometry, coherent materials, natural motion, clean edges',
      constraints: ['preserve reference identity and geometry','one dominant camera movement per shot','no unrequested text or logos','composite exact typography/UI/branding in post when required'],
      beats
    },
    references: referenceNotes ? [{ id: 'primary-reference', kind: 'image', url: '<replace-with-reference-url>', role: /ui|website|app|dashboard/i.test(projectType) ? 'environment' : 'product', faceSource: 'none', note: referenceNotes }] : [],
    shots: [],
    library: {
      kind: 'case-intelligence-pattern-adaptation',
      sourceCaseId: item.id,
      sourceUrl: item.sourceUrl,
      sourceAuthor: item.author,
      collections: intelligence.collections,
      signatureMove: intelligence.signatureMove,
      evidenceLevel: intelligence.evidenceLevel,
      draftPrompt: prompt,
      validationRequired: 'Run through Porter BOS-2026-07-17 validator before paid generation.'
    }
  };
}

function adapterHtml(item) {
  return `<section class="pattern-adapter" data-pattern-adapter>
    <div class="intelligence-section-head">
      <div><span>Pattern adapter</span><h3>Use this pattern for my project</h3></div>
      <span class="evidence-badge">BOS draft</span>
    </div>
    <p class="intelligence-copy">Keep the production logic, replace the original subject matter. This static Pages tool creates a Porter project draft; run the real Porter validator before generation.</p>
    <form class="pattern-form">
      <label>Project type<input name="projectType" placeholder="Website hero, SaaS launch, beauty campaign…" /></label>
      <label>Brand / project<input name="brand" placeholder="Your brand or project" /></label>
      <label>Subject / product<input name="subject" placeholder="What should the video be about?" /></label>
      <label>Objective<textarea name="objective" rows="2" placeholder="What should this video achieve?"></textarea></label>
      <label>References<textarea name="references" rows="2" placeholder="Describe the images/video/audio you will use and what each one should control."></textarea></label>
      <div class="pattern-actions"><button class="button primary" type="submit">Build Porter draft</button><button class="button" type="button" data-pattern-copy hidden>Copy project JSON</button></div>
    </form>
    <pre class="pattern-output" data-pattern-output hidden></pre>
  </section>`;
}

function intelligenceHtml(item) {
  const intel = item.intelligence;
  return `<div class="case-intelligence-block" data-case-intelligence>
    <section class="intelligence-summary">
      <div class="intelligence-section-head">
        <div><span>Case Intelligence</span><h3>Why this video works</h3></div>
        <span class="evidence-badge">Evidence ${esc(intel.evidenceLevel)}</span>
      </div>
      <p class="intelligence-lead">${esc(intel.whyItWorks)}</p>
      <div class="signature-move"><span>Signature move</span><strong>${esc(intel.signatureMove)}</strong></div>
      ${pillList(intel.collections, 'collections-pills')}
    </section>

    <section class="intelligence-section">
      <div class="intelligence-section-head"><div><span>Shot anatomy</span><h3>${intel.shotBreakdown.length} production beats</h3></div><span>${intel.productionScore}/5 production</span></div>
      <div class="shot-analysis-list">${intel.shotBreakdown.map(shotCard).join('')}</div>
    </section>

    <section class="intelligence-grid">
      <article><span>Prompt mechanics</span>${intel.promptMechanics.map(x => `<p>${esc(x)}</p>`).join('')}</article>
      <article><span>Reference strategy</span>${intel.referenceStrategy.map(x => `<p>${esc(x)}</p>`).join('')}</article>
      <article><span>Camera language</span>${intel.cameraLanguage.map(x => `<p>${esc(x)}</p>`).join('')}</article>
      <article><span>Transition language</span>${intel.transitionLanguage.map(x => `<p>${esc(x)}</p>`).join('')}</article>
      <article><span>Material logic</span>${intel.materialLanguage.map(x => `<p>${esc(x)}</p>`).join('')}</article>
      <article><span>Audio role</span><p>${esc(intel.audioRole)}</p></article>
    </section>

    <section class="intelligence-section transferable-section">
      <div class="intelligence-section-head"><div><span>Transferable pattern</span><h3>What to reuse</h3></div></div>
      <p class="intelligence-lead">${esc(intel.transferablePattern)}</p>
      <div class="post-note"><span>Post-production expectation</span><p>${esc(intel.postProductionExpectation)}</p></div>
    </section>

    <section class="intelligence-grid compact">
      <article class="risk-card"><span>Failure risks</span>${intel.failureRisks.map(x => `<p>• ${esc(x)}</p>`).join('')}</article>
      <article><span>BOS notes</span>${intel.bosNotes.map(x => `<p>• ${esc(x)}</p>`).join('')}</article>
    </section>

    ${adapterHtml(item)}
  </div>`;
}

function identifyOpenCase() {
  const title = $('#drawerTitle')?.textContent?.trim();
  if (!title) return null;
  return CASE_INTELLIGENCE.find(item => item.title === title) || null;
}

function enhanceDrawer() {
  const drawerContent = $('#drawerContent');
  if (!drawerContent || $('[data-case-intelligence]', drawerContent)) return;
  const item = identifyOpenCase();
  if (!item) return;
  currentCase = item;
  const body = $('[data-digest-body]', drawerContent);
  if (!body) return;
  const attribution = $('.attribution-grid', body)?.parentElement;
  const insertion = document.createElement('div');
  insertion.innerHTML = intelligenceHtml(item);
  const block = insertion.firstElementChild;
  if (attribution) body.insertBefore(block, attribution);
  else body.appendChild(block);

  const form = $('.pattern-form', block);
  const output = $('[data-pattern-output]', block);
  const copy = $('[data-pattern-copy]', block);
  let latest = null;
  form?.addEventListener('submit', event => {
    event.preventDefault();
    latest = buildPatternDraft(item, form);
    output.textContent = JSON.stringify(latest, null, 2);
    output.hidden = false;
    copy.hidden = false;
    output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  copy?.addEventListener('click', async () => {
    if (!latest) return;
    await navigator.clipboard.writeText(JSON.stringify(latest, null, 2));
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = 'Copy project JSON'; }, 1200);
  });
}

function initObservers() {
  const grid = $('#digestGrid');
  if (grid) new MutationObserver(applyCollectionFilter).observe(grid, { childList: true });
  const drawer = $('#drawerContent');
  if (drawer) new MutationObserver(enhanceDrawer).observe(drawer, { childList: true, subtree: false });
}

injectCollections();
applyCollectionFilter();
initObservers();
