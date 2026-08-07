import { INDUSTRY_DIGEST } from './digest-data.js';
import { CASE_INTELLIGENCE } from './case-intelligence.js';
import { applyTranslations, collectionLabel, getLanguage, initI18n, t } from './i18n.js';
import { getMediaEmbed, mediaEmbedHtml, mediaPlayButtonHtml } from './media-embed.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const digestById = new Map(INDUSTRY_DIGEST.map(item => [item.id, item]));
const intelligenceById = new Map(CASE_INTELLIGENCE.map(item => [item.id, item]));

function ensureExperienceStyles() {
  if ($('link[data-porter-experience]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './experience.css';
  link.dataset.porterExperience = 'true';
  document.head.appendChild(link);
}

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function setFirstTextNode(element, value) {
  if (!element) return;
  let node = [...element.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.nodeValue.trim());
  if (!node) {
    node = document.createTextNode('');
    element.insertBefore(node, element.firstChild);
  }
  const next = `${value}`;
  if (node.nodeValue.trim() !== next) node.nodeValue = `${next}`;
}

function setSelectLabel(selectSelector, key) {
  const select = $(selectSelector);
  const label = select?.closest('label');
  if (label) setFirstTextNode(label, t(key));
}

function setOption(selectSelector, value, key) {
  const option = $(`${selectSelector} option[value="${CSS.escape(value)}"]`);
  if (option) setText(option, t(key));
}

function injectLanguageSwitch() {
  const footer = $('.sidebar-footer');
  if (!footer || $('#languageSwitch')) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'languageSwitch';
  wrapper.className = 'language-switch';
  wrapper.innerHTML = `<span class="language-switch-label" data-i18n="language.label"></span><div class="language-segments"><button type="button" data-language="ru">RU</button><button type="button" data-language="en">EN</button></div>`;
  footer.insertBefore(wrapper, footer.firstChild);
  applyTranslations(wrapper);
}

function localizeStaticShell() {
  const nav = {
    digest: 'nav.digest',
    prompts: 'nav.originals',
    sources: 'nav.sources'
  };
  Object.entries(nav).forEach(([view, key]) => setText($(`.nav-tab[data-view="${view}"] span:last-child`), t(key)));
  setText($('#randomPrompt span:last-child'), t('action.random'));
  setText($('#favoritesOnly span:last-child'), t('action.favorites'));

  const panels = $$('[data-sidebar-view]');
  const panelKeys = ['sidebar.filterDigest','sidebar.filterOriginals','sidebar.filterSources'];
  panels.forEach((panel, index) => setText($('.sidebar-section-title', panel), t(panelKeys[index])));

  $$('.sidebar-search > span').forEach(el => setText(el, t('sidebar.search')));
  setSelectLabel('#digestCategory', 'sidebar.category');
  setSelectLabel('#digestCreator', 'sidebar.creator');
  setSelectLabel('#digestUse', 'sidebar.design');
  setSelectLabel('#digestSort', 'sidebar.sort');
  setSelectLabel('#categoryFilter', 'sidebar.category');
  setSelectLabel('#modeFilter', 'sidebar.mode');
  setSelectLabel('#aspectFilter', 'sidebar.aspect');
  setSelectLabel('#sortFilter', 'sidebar.sort');
  setSelectLabel('#sourceType', 'sidebar.sourceType');

  setOption('#digestCategory', 'all', 'option.allCategories');
  setOption('#digestCreator', 'all', 'option.allCreators');
  setOption('#digestUse', 'all', 'option.anyScore');
  setOption('#digestUse', '5', 'option.score5');
  setOption('#digestUse', '4', 'option.score4');
  setOption('#digestSort', 'featured', 'option.curator');
  setOption('#digestSort', 'latest', 'option.newest');
  setOption('#digestSort', 'design', 'option.design');
  setOption('#digestSort', 'title', 'option.az');
  setOption('#categoryFilter', 'all', 'option.allCategories');
  setOption('#modeFilter', 'all', 'option.allModes');
  setOption('#aspectFilter', 'all', 'option.allRatios');
  setOption('#sortFilter', 'featured', 'option.designFirst');
  setOption('#sortFilter', 'authority', 'option.sourceAuthority');
  setOption('#sortFilter', 'category', 'option.category');
  setOption('#sortFilter', 'title', 'option.az');
  setOption('#sourceType', 'all', 'option.allSourceTypes');

  $$('.sidebar-subtitle').forEach(el => {
    if (el.classList.contains('collection-heading')) setText(el, t('sidebar.collections'));
    else setText(el, t('sidebar.quickCategories'));
  });
  $$('.sidebar-reset').forEach(el => setText(el, t('sidebar.reset')));

  const footerLinks = $$('.sidebar-footer > a');
  if (footerLinks[0]) setFirstTextNode(footerLinks[0], `${t('footer.github')} `);
  if (footerLinks[1]) setFirstTextNode(footerLinks[1], `${t('footer.audit')} `);

  const digestHeader = $('#digestView .view-header');
  setText($('.view-kicker', digestHeader), t('view.digest.kicker'));
  setText($('h1', digestHeader), t('view.digest.title'));
  setText($('p', digestHeader), t('view.digest.desc'));
  setText($('#digestView .digest-note strong'), t('view.digest.noteTitle'));
  setText($('#digestView .digest-note span'), t('view.digest.noteText'));
  setFirstTextNode($('#digestView .digest-note a'), `${t('view.digest.analysisStandard')} `);

  const originalsHeader = $('#promptView .view-header');
  setText($('.view-kicker', originalsHeader), t('view.originals.kicker'));
  setText($('h1', originalsHeader), t('view.originals.title'));
  setText($('p', originalsHeader), t('view.originals.desc'));

  const sourcesHeader = $('#sourceView .view-header');
  setText($('.view-kicker', sourcesHeader), t('view.sources.kicker'));
  setText($('h1', sourcesHeader), t('view.sources.title'));
  setText($('p', sourcesHeader), t('view.sources.desc'));
  setFirstTextNode($('#sourceView .view-header > a'), `${t('view.sources.fullAudit')} `);

  const digestCount = $('#digestCount');
  if (digestCount?.nextSibling?.nodeType === Node.TEXT_NODE) digestCount.nextSibling.nodeValue = ` ${t('view.digest.examples')} `;
  const promptCount = $('#resultCount');
  if (promptCount?.nextSibling?.nodeType === Node.TEXT_NODE) promptCount.nextSibling.nodeValue = ` ${t('view.originals.count')} `;

  const digestLegend = $('#digestView .legend');
  if (digestLegend) digestLegend.innerHTML = `<span class="dot source"></span> ${t('view.digest.source')} <span class="dot original"></span> ${t('view.digest.excerpt')} <span class="dot bos"></span> ${t('view.digest.adaptation')}`;
  const originalsLegend = $('#promptView .legend');
  if (originalsLegend) originalsLegend.innerHTML = `<span class="dot original"></span> Porter original <span class="dot source"></span> ${t('view.originals.research')} <span class="dot bos"></span> ${t('view.originals.bos')}`;

  setText($('#digestEmpty strong'), t('empty.noResults'));
  setText($('#digestEmpty span'), t('empty.changeFilters'));
  setText($('#emptyState strong'), t('empty.noResults'));
  setText($('#emptyState span'), t('empty.changeFilters'));
}

function enhanceDigestCards() {
  $$('#digestGrid [data-digest-id]').forEach(card => {
    const item = digestById.get(card.dataset.digestId);
    if (!item) return;
    setText($('.source-preview-note', card), t('card.sourcePreview'));
    setText($('.card-kicker span:last-child', card), t('card.design', { score: item.designScore }));
    const author = $('.digest-author', card);
    if (author) author.innerHTML = `${t('card.by', { author: item.author })} <span>· ${t('card.sourceLinked')}</span>`;
    const copy = $('[data-copy-digest]', card);
    const open = $('[data-open-digest]', card);
    setText(copy, t('card.copyPorter'));
    setText(open, t('card.openCase'));
    const preview = $('.card-preview', card);
    if (preview && !$('[data-play-digest]', preview)) preview.insertAdjacentHTML('beforeend', mediaPlayButtonHtml(item));
  });

  $$('#promptGrid [data-id]').forEach(card => {
    setText($('.preview-note', card), t('card.porterPreview'));
    setText($('[data-copy]', card), t('card.copyPrompt'));
    setText($('[data-open]', card), t('card.remix'));
  });
}

function localizeSourceCards() {
  $$('#sourceGrid .source-card').forEach(card => {
    $$('.source-score span', card).forEach(span => {
      const text = span.textContent;
      const authority = text.match(/(?:authority|авторитетность)\s+(\d)\/5/i);
      const design = text.match(/(?:design|дизайн)\s+(\d)\/5/i);
      if (authority) setText(span, t('source.authority', { score: authority[1] }));
      if (design) setText(span, t('source.design', { score: design[1] }));
    });
    const link = $('a', card);
    if (link) setFirstTextNode(link, `${t('source.open')} `);
  });
}

function localizeCollections() {
  setText($('.collection-all span'), t('sidebar.allCases'));
  $$('.collection-items [data-collection]').forEach(button => setText($('span', button), collectionLabel(button.dataset.collection)));
  const groupKeys = ['collection.group.digital-design','collection.group.commercial','collection.group.motion-language'];
  $$('.collection-group summary').forEach((summary, index) => setText(summary, t(groupKeys[index])));
}

function identifyDigestItemInDrawer() {
  const title = $('#drawerTitle')?.textContent?.trim();
  if (!title) return null;
  return INDUSTRY_DIGEST.find(item => item.title === title) || null;
}

function enhanceDrawerMedia(force = false) {
  const item = identifyDigestItemInDrawer();
  if (!item) return;
  const content = $('#drawerContent');
  const existing = $('[data-source-media-enhanced]', content);
  if (existing && !force) return;
  if (existing && force) existing.remove();
  const oldHero = $('.digest-drawer-hero', content);
  if (oldHero) {
    const wrapper = document.createElement('div');
    wrapper.dataset.sourceMediaEnhanced = 'true';
    wrapper.className = 'drawer-source-media';
    wrapper.innerHTML = mediaEmbedHtml(item, { autoplay: false });
    oldHero.replaceWith(wrapper);
  } else if (!existing) {
    const body = $('[data-digest-body]', content);
    if (body) {
      const wrapper = document.createElement('div');
      wrapper.dataset.sourceMediaEnhanced = 'true';
      wrapper.className = 'drawer-source-media';
      wrapper.innerHTML = mediaEmbedHtml(item, { autoplay: false });
      body.parentElement.insertBefore(wrapper, body);
    }
  }
}

function localizeDigestDrawer() {
  const item = identifyDigestItemInDrawer();
  if (!item) return;
  const body = $('[data-digest-body]');
  if (!body) return;
  setText($('.drawer-meta', body), `${t('drawer.industryDigest')} · ${item.category} / ${item.subcategory}`);
  const creatorBits = $$('.creator-line span', body);
  if (creatorBits[1]) setText(creatorBits[1], t('drawer.designRelevance', { score: item.designScore }));
  const sections = $$('.section-title', body);
  const titles = [
    ['drawer.originalExcerpt','drawer.creatorAuthored'],
    ['drawer.porterAdaptation','drawer.independent'],
    ['drawer.attribution', null]
  ];
  sections.slice(0,3).forEach((section, index) => {
    const spans = $$('span', section);
    if (spans[0]) setText(spans[0], t(titles[index][0]));
    if (spans[1] && titles[index][1]) setText(spans[1], t(titles[index][1]));
  });
  const sourceActions = $$('.source-action-row .button', body);
  if (sourceActions[0]) setFirstTextNode(sourceActions[0], `${t('drawer.readOriginal')} `);
  if (sourceActions[1]) setFirstTextNode(sourceActions[1], `${t('drawer.galleryEntry')} `);
  if (sourceActions[2]) setFirstTextNode(sourceActions[2], `${t('drawer.license')} `);
  setText($('.adaptation-note', body), t('drawer.adaptationNote'));
  const actions = $$('.drawer-actions .button', body);
  if (actions[0]) setText(actions[0], t('drawer.copyPorter'));
  if (actions[1]) setText(actions[1], t('drawer.copyProject'));
  if (actions[2]) setText(actions[2], t('drawer.copySource'));
  const attrCards = $$('.attribution-grid .source-link strong', body);
  if (attrCards[0]) setText(attrCards[0], t('drawer.creatorPost'));
  if (attrCards[1]) setText(attrCards[1], t('drawer.promptEntry'));
  if (attrCards[2]) setText(attrCards[2], t('drawer.corpus'));
}

function localizePromptDrawer() {
  const body = $('[data-prompt-body]');
  if (!body) return;
  const infoLabels = ['drawer.mode','drawer.duration','drawer.ratio','drawer.difficulty'];
  $$('.info-box span', body).forEach((el,index) => setText(el, t(infoLabels[index])));
  const sections = $$('.section-title', body);
  const sectionKeys = ['drawer.remixVariables','drawer.resolvedPrompt','drawer.referencePlan','drawer.productionNote','drawer.research'];
  sections.forEach((section,index) => {
    const spans = $$('span', section);
    if (spans[0] && sectionKeys[index]) setText(spans[0], t(sectionKeys[index]));
  });
  const actions = $$('.drawer-actions .button', body);
  if (actions[0]) setText(actions[0], t('drawer.copyResolved'));
  if (actions[1]) setText(actions[1], t('drawer.copyTemplate'));
  if (actions[2]) setText(actions[2], t('drawer.copyProject'));
}

function localizeCaseIntelligence() {
  const block = $('[data-case-intelligence]');
  if (!block) return;
  const item = identifyDigestItemInDrawer();
  const intelligence = item ? intelligenceById.get(item.id)?.intelligence : null;
  const summary = $('.intelligence-summary', block);
  setText($('.intelligence-section-head > div > span', summary), t('case.title'));
  setText($('.intelligence-section-head h3', summary), t('case.whyWorks'));
  if (intelligence) setText($('.evidence-badge', summary), t('case.evidence', { level: intelligence.evidenceLevel }));
  setText($('.signature-move > span', summary), t('case.signature'));
  if (intelligence) $$('.collections-pills span', summary).forEach((el,index) => setText(el, collectionLabel(intelligence.collections[index])));

  const sections = $$('.intelligence-section', block);
  const shotSection = sections[0];
  if (shotSection && intelligence) {
    setText($('.intelligence-section-head > div > span', shotSection), t('case.shotAnatomy'));
    setText($('.intelligence-section-head h3', shotSection), t('case.productionBeats', { count: intelligence.shotBreakdown.length }));
  }
  $$('.shot-analysis-card dl', block).forEach(dl => {
    const dts = $$('dt', dl);
    if (dts[0]) setText(dts[0], t('case.purpose'));
    if (dts[1]) setText(dts[1], t('case.whyShot'));
    if (dts[2]) setText(dts[2], t('case.continuity'));
  });
  const gridHeads = ['case.promptMechanics','case.referenceStrategy','case.cameraLanguage','case.transitionLanguage','case.materialLogic','case.audioRole'];
  const primaryGrid = $('.intelligence-grid:not(.compact)', block);
  $$('.intelligence-grid:not(.compact) article > span', block).forEach((el,index) => setText(el, t(gridHeads[index])));
  const transfer = $('.transferable-section', block);
  setText($('.intelligence-section-head > div > span', transfer), t('case.transferable'));
  setText($('.intelligence-section-head h3', transfer), t('case.whatReuse'));
  setText($('.post-note > span', transfer), t('case.post'));
  const compact = $('.intelligence-grid.compact', block);
  const compactHeads = $$('article > span', compact);
  if (compactHeads[0]) setText(compactHeads[0], t('case.risks'));
  if (compactHeads[1]) setText(compactHeads[1], t('case.bosNotes'));

  const adapter = $('[data-pattern-adapter]', block);
  if (adapter) {
    setText($('.intelligence-section-head > div > span', adapter), t('case.adapter'));
    setText($('.intelligence-section-head h3', adapter), t('case.usePattern'));
    setText($('.evidence-badge', adapter), t('case.bosDraft'));
    setText($('.intelligence-copy', adapter), t('case.adapterInfo'));
    const labels = $$('form > label', adapter);
    const labelKeys = ['case.projectType','case.brand','case.subject','case.objective','case.references'];
    labels.forEach((label,index) => setFirstTextNode(label, t(labelKeys[index])));
    setText($('button[type="submit"]', adapter), t('case.buildDraft'));
    setText($('[data-pattern-copy]', adapter), t('case.copyProject'));
  }
}

function localizeAll() {
  localizeStaticShell();
  enhanceDigestCards();
  localizeSourceCards();
  localizeCollections();
  enhanceDrawerMedia();
  localizeDigestDrawer();
  localizePromptDrawer();
  localizeCaseIntelligence();
  applyTranslations();
}

let scheduled = false;
function scheduleLocalize() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    localizeAll();
  });
}

function bindExperienceEvents() {
  document.addEventListener('click', event => {
    const play = event.target.closest('[data-play-digest]');
    if (play) {
      event.preventDefault();
      event.stopPropagation();
      const card = play.closest('[data-digest-id]');
      card?.querySelector('[data-open-digest]')?.click();
    }
  }, true);
  window.addEventListener('porter-language-change', () => {
    localizeAll();
    enhanceDrawerMedia(true);
  });
}

ensureExperienceStyles();
injectLanguageSwitch();
initI18n();
bindExperienceEvents();
new MutationObserver(scheduleLocalize).observe(document.body, { childList: true, subtree: true });
scheduleLocalize();
