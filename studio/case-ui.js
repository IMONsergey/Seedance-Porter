import { CASE_INTELLIGENCE, COLLECTION_GROUPS, COLLECTION_COUNTS } from './case-intelligence-runtime.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const intelligenceById = new Map(CASE_INTELLIGENCE.map(item => [item.id, item]));
let activeCollection = 'all';

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

function parseReferenceLines(value) {
  return String(value || '').split(/\n+/).map(line => line.trim()).filter(Boolean);
}

function parseAnchors(value, subject) {
  const values = String(value || '').split(/[,;\n]+/).map(part => part.trim()).filter(Boolean).slice(0, 3);
  if (values.length >= 2) return values;
  return [`exact overall geometry / identity of ${subject}`, `stable material, color and proportion system of ${subject}`];
}

function buildPatternDraft(item, form) {
  const intelligence = item.intelligence;
  const projectType = form.elements.projectType.value.trim() || 'brand campaign';
  const brand = form.elements.brand.value.trim() || 'my brand';
  const subject = form.elements.subject.value.trim() || 'my product or interface';
  const objective = form.elements.objective.value.trim() || `adapt the production pattern for ${projectType}`;
  const exactLocks = form.elements.exactLocks.value.trim();
  const referenceRole = form.elements.referenceRole.value;
  const faceSource = form.elements.faceSource.value;
  const referenceLines = parseReferenceLines(form.elements.referenceUrls.value);
  const anchors = parseAnchors(exactLocks, subject);
  const firstShot = intelligence.shotBreakdown[0]?.action || 'Establish the subject and core visual rule.';
  const beats = intelligence.shotBreakdown.map((shot, index) => `Shot ${index + 1}: ${shot.action}`);
  const motionLanguage = intelligence.motionLanguage || intelligence.cameraLanguage;
  const prompt = [
    `Project: ${brand} — ${projectType}.`,
    `Objective: ${objective}.`,
    `Core subject: ${subject}.`,
    `Pattern logic: ${intelligence.transferablePattern}`,
    `Signature move: ${intelligence.signatureMove}`,
    intelligence.rhythm ? `Rhythm: ${intelligence.rhythm}` : '',
    ...beats,
    `Reference strategy: ${intelligence.referenceStrategy.join(' ')}`,
    `Camera / motion language: ${motionLanguage.join(' ')}`,
    `Continuity: preserve ${exactLocks || 'subject identity, product/interface geometry, material language and lighting direction'} across all shots.`,
    `Post-production: ${intelligence.postProductionExpectation}`,
    'Constraints: no unrequested text, no invented logos, no duplicate subject, no compound camera moves; do not reproduce the source case subject matter, trademarks, characters, location or wording.'
  ].filter(Boolean).join('\n');

  const references = referenceLines.map((url, index) => {
    const role = index === 0 ? referenceRole : 'environment';
    const reference = {
      id: `reference-${index + 1}`,
      kind: 'image',
      url,
      role,
      faceSource: role === 'identity' ? faceSource : 'none',
      note: index === 0 ? `Primary exact ${role} reference for the transferred pattern.` : 'Supporting environment reference; use only for this declared role.'
    };
    if (['identity','product','logo'].includes(role)) reference.anchors = anchors;
    return reference;
  });

  const mode = references.length > 1 ? 'reference-to-video' : references.length === 1 ? 'image-to-video' : 'text-to-video';
  return {
    project: `pattern-${item.id.replace(/^digest-/, '')}`,
    label: `${brand} / ${item.title}`,
    model: 'seedance-2.0',
    mode,
    duration: Math.min(15, Math.max(6, intelligence.shotBreakdown.length * 3)),
    resolution: '720p',
    aspectRatio: item.aspect || '16:9',
    generateAudio: /audio|sound|music|voice|dialogue|ambience/i.test(item.porterPrompt),
    outputPolicy: {
      generatedText: 'forbid',
      generatedLogo: referenceRole === 'logo' && references.length ? 'reference-only' : 'forbid',
      generatedWatermark: 'forbid'
    },
    brief: {
      objective,
      subject,
      action: firstShot,
      environment: `Adapt the environment to ${projectType} while preserving the source pattern's spatial / information logic.`,
      camera: motionLanguage.join(' '),
      style: `Independent adaptation of the production logic from “${item.title}”; do not copy original subject matter or distinctive wording.`,
      imageQuality: 'HD, stable geometry, coherent materials, natural motion, clean edges',
      constraints: [
        `preserve ${exactLocks || 'approved reference identity, geometry and material system'}`,
        'one dominant camera movement per shot',
        'no unrequested text or invented logos',
        'no source-specific characters, products, trademarks, locations or wording',
        'composite exact typography/UI/branding in post when required'
      ],
      beats
    },
    references,
    shots: [],
    library: {
      kind: 'case-intelligence-pattern-adaptation',
      sourceCaseId: item.id,
      sourceUrl: item.sourceUrl,
      sourceAuthor: item.author,
      collections: intelligence.collections,
      signatureMove: intelligence.signatureMove,
      reviewStatus: intelligence.reviewStatus || 'prompt-reviewed',
      evidenceLevel: intelligence.evidenceLevel,
      draftPrompt: prompt,
      validationRequired: 'Run through Porter BOS-2026-07-17 validator before paid generation.'
    }
  };
}

function adapterHtml() {
  return `<section class="pattern-adapter" data-pattern-adapter>
    <div class="intelligence-section-head">
      <div><span>Pattern adapter</span><h3>Use this pattern for my project</h3></div>
      <span class="evidence-badge">BOS draft</span>
    </div>
    <p class="intelligence-copy">Keep shot function, camera logic and causal structure; replace the original subject matter. Reference URLs/local paths are written into the Porter project, but authoritative BOS validation still happens in local Porter Studio before generation.</p>
    <form class="pattern-form">
      <label>Project type<input name="projectType" placeholder="Website hero, SaaS launch, beauty campaign…" /></label>
      <label>Brand / project<input name="brand" placeholder="Your brand or project" /></label>
      <label>Subject / product<input name="subject" placeholder="What should the video be about?" /></label>
      <label>Objective<textarea name="objective" rows="2" placeholder="What should this video achieve?"></textarea></label>
      <label>What must stay exact?<textarea name="exactLocks" rows="2" placeholder="Geometry, face, product proportions, approved colors, logo shape…"></textarea></label>
      <label>Reference URLs / local paths<textarea name="referenceUrls" rows="3" placeholder="One image URL or local path per line. First line is the primary exact reference."></textarea></label>
      <div class="pattern-form-split">
        <label>Primary reference role<select name="referenceRole"><option value="product">Product</option><option value="environment">Environment / UI</option><option value="identity">Identity</option><option value="logo">Logo</option></select></label>
        <label>Face provenance<select name="faceSource"><option value="none">No real face</option><option value="synthetic">Synthetic person</option><option value="non-human">Non-human</option><option value="modelark-trusted-output">ModelArk trusted output</option><option value="preset-digital-character">Preset digital character</option><option value="authorized-real-person">Authorized real person</option></select></label>
      </div>
      <div class="pattern-actions"><button class="button primary" type="submit">Build Porter draft</button><button class="button" type="button" data-pattern-copy hidden>Copy project JSON</button></div>
    </form>
    <pre class="pattern-output" data-pattern-output hidden></pre>
  </section>`;
}

function intelligenceHtml(item) {
  const intel = item.intelligence;
  const deep = intel.reviewStatus === 'deep-reviewed';
  const evidenceTitle = deep ? 'Why this video works' : 'Why this prompt is structured this way';
  const evidenceLabel = deep ? 'Deep reviewed' : 'Prompt reviewed';
  return `<div class="case-intelligence-block" data-case-intelligence>
    <section class="intelligence-summary">
      <div class="intelligence-section-head">
        <div><span>Case Intelligence</span><h3>${evidenceTitle}</h3></div>
        <span class="evidence-badge ${deep ? 'deep-reviewed' : ''}" data-review-status>${evidenceLabel}</span>
      </div>
      <p class="intelligence-lead">${esc(intel.whyItWorks)}</p>
      ${!deep ? `<div class="evidence-note"><strong>Evidence boundary.</strong> <span>${esc(intel.evidence?.note || 'This analysis comes from the published prompt/source material and preview; full-video visual observation is still pending.')}</span></div>` : ''}
      <div class="signature-move"><span>Signature move</span><strong>${esc(intel.signatureMove)}</strong></div>
      ${intel.rhythm ? `<div class="signature-move rhythm-move"><span>Rhythm</span><strong>${esc(intel.rhythm)}</strong></div>` : ''}
      ${pillList(intel.collections, 'collections-pills')}
    </section>

    <section class="intelligence-section">
      <div class="intelligence-section-head"><div><span>Shot anatomy</span><h3>${intel.shotBreakdown.length} production beats</h3></div><span>${intel.productionScore}/5 production</span></div>
      <div class="shot-analysis-list">${intel.shotBreakdown.map(shotCard).join('')}</div>
    </section>

    <section class="intelligence-grid">
      <article><span>Causal mechanics</span>${(intel.causalMechanics || intel.promptMechanics).map(x => `<p>${esc(x)}</p>`).join('')}</article>
      <article><span>Reference strategy</span>${intel.referenceStrategy.map(x => `<p>${esc(x)}</p>`).join('')}</article>
      <article><span>Camera / motion language</span>${(intel.motionLanguage || intel.cameraLanguage).map(x => `<p>${esc(x)}</p>`).join('')}</article>
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

    ${adapterHtml()}
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
  const body = $('[data-digest-body]', drawerContent);
  if (!body) return;
  const attributionGrid = $('.attribution-grid', body);
  const marker = attributionGrid?.previousElementSibling || attributionGrid;
  const insertion = document.createElement('div');
  insertion.innerHTML = intelligenceHtml(item);
  const block = insertion.firstElementChild;
  if (marker && marker.parentElement === body) body.insertBefore(block, marker);
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
    const previous = copy.textContent;
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = previous || 'Copy project JSON'; }, 1200);
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
