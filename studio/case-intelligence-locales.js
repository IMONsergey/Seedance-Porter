import { t } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function setLabel(control, key) {
  const label = control?.closest('label');
  if (!label) return;
  let node = [...label.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.nodeValue.trim());
  if (!node) {
    node = document.createTextNode('');
    label.insertBefore(node, label.firstChild);
  }
  node.nodeValue = `${t(key)}`;
}

function setPlaceholder(selector, key, root) {
  const element = $(selector, root);
  if (element) element.placeholder = t(key);
}

function localizeAdvancedCaseIntelligence() {
  const block = $('[data-case-intelligence]');
  if (!block) return;

  const status = $('[data-review-status]', block);
  const deep = status?.classList.contains('deep-reviewed');
  const summary = $('.intelligence-summary', block);
  setText($('.intelligence-section-head h3', summary), t(deep ? 'case.whyWorks' : 'case.whyPrompt'));
  setText(status, t(deep ? 'case.deepReviewed' : 'case.promptReviewed'));

  const evidence = $('.evidence-note', summary);
  if (evidence) {
    setText($('strong', evidence), t('case.evidenceBoundary'));
    setText($('span', evidence), t('case.evidenceBoundaryText'));
  }

  const signature = $('.signature-move:not(.rhythm-move)', summary);
  setText($(':scope > span', signature), t('case.signature'));
  const rhythm = $('.rhythm-move', summary);
  if (rhythm) setText($(':scope > span', rhythm), t('case.rhythm'));

  const primaryGrid = $('.intelligence-grid:not(.compact)', block);
  const gridHeads = $$('article > span', primaryGrid);
  if (gridHeads[0]) setText(gridHeads[0], t('case.causalMechanics'));
  if (gridHeads[1]) setText(gridHeads[1], t('case.referenceStrategy'));
  if (gridHeads[2]) setText(gridHeads[2], t('case.motionLanguage'));
  if (gridHeads[3]) setText(gridHeads[3], t('case.transitionLanguage'));
  if (gridHeads[4]) setText(gridHeads[4], t('case.materialLogic'));
  if (gridHeads[5]) setText(gridHeads[5], t('case.audioRole'));

  const adapter = $('[data-pattern-adapter]', block);
  if (!adapter) return;
  setText($('.intelligence-copy', adapter), t('case.adapterInfo'));

  const form = $('.pattern-form', adapter);
  const labelKeys = {
    projectType: 'case.projectType',
    brand: 'case.brand',
    subject: 'case.subject',
    objective: 'case.objective',
    exactLocks: 'case.exactLocks',
    referenceUrls: 'case.referenceUrls',
    referenceRole: 'case.referenceRole',
    faceSource: 'case.faceSource'
  };
  Object.entries(labelKeys).forEach(([name, key]) => setLabel(form?.elements?.[name], key));

  setPlaceholder('[name="projectType"]', 'case.projectTypePh', form);
  setPlaceholder('[name="brand"]', 'case.brandPh', form);
  setPlaceholder('[name="subject"]', 'case.subjectPh', form);
  setPlaceholder('[name="objective"]', 'case.objectivePh', form);
  setPlaceholder('[name="exactLocks"]', 'case.exactLocksPh', form);
  setPlaceholder('[name="referenceUrls"]', 'case.referenceUrlsPh', form);

  const role = form?.elements?.referenceRole;
  if (role) {
    const keys = {
      product: 'case.role.product',
      environment: 'case.role.environment',
      identity: 'case.role.identity',
      logo: 'case.role.logo'
    };
    [...role.options].forEach(option => setText(option, t(keys[option.value] || option.value)));
  }

  const face = form?.elements?.faceSource;
  if (face) {
    const keys = {
      none: 'case.face.none',
      synthetic: 'case.face.synthetic',
      'non-human': 'case.face.nonHuman',
      'modelark-trusted-output': 'case.face.modelark',
      'preset-digital-character': 'case.face.preset',
      'authorized-real-person': 'case.face.authorized'
    };
    [...face.options].forEach(option => setText(option, t(keys[option.value] || option.value)));
  }

  setText($('button[type="submit"]', adapter), t('case.buildDraft'));
  const copy = $('[data-pattern-copy]', adapter);
  if (copy && !copy.hidden) setText(copy, t('case.copyProject'));
}

let scheduled = false;
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    localizeAdvancedCaseIntelligence();
  });
}

window.addEventListener('porter-language-change', schedule);
const drawer = $('#drawerContent');
if (drawer) new MutationObserver(schedule).observe(drawer, { childList: true, subtree: true });
schedule();
