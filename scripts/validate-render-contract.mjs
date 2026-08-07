import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync('studio/library.html', 'utf8');
const dom = new JSDOM(html, {
  url: 'http://127.0.0.1:4173/library.html',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const { window } = dom;
const defineGlobal = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });

for (const name of [
  'window','document','Node','HTMLElement','Element','Event','CustomEvent','KeyboardEvent','MouseEvent',
  'MutationObserver','DOMParser','localStorage','sessionStorage','navigator'
]) {
  defineGlobal(name, window[name]);
}

defineGlobal('requestAnimationFrame', window.requestAnimationFrame.bind(window));
defineGlobal('cancelAnimationFrame', window.cancelAnimationFrame.bind(window));

const css = window.CSS || {};
if (!css.escape) css.escape = value => String(value).replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`);
defineGlobal('CSS', css);
if (!window.CSS) Object.defineProperty(window, 'CSS', { value: css, configurable: true });

if (!window.matchMedia) {
  window.matchMedia = () => ({ matches:false, media:'', onchange:null, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; } });
}
if (!window.ResizeObserver) window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
if (!window.IntersectionObserver) window.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
defineGlobal('ResizeObserver', window.ResizeObserver);
defineGlobal('IntersectionObserver', window.IntersectionObserver);

Object.defineProperty(window.navigator, 'clipboard', {
  value: { writeText: async () => {} },
  configurable: true
});

const importFresh = async path => import(`${pathToFileURL(path).href}?render-contract=${Date.now()}-${Math.random()}`);

await importFresh('studio/library.js');
await importFresh('studio/sidebar.js');
await importFresh('studio/case-ui.js');

const flushFrame = () => new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
for (let i = 0; i < 12; i += 1) await flushFrame();
await new Promise(resolve => setTimeout(resolve, 50));
for (let i = 0; i < 4; i += 1) await flushFrame();

const cards = [...document.querySelectorAll('#digestGrid .digest-card')];
const baseCards = [...document.querySelectorAll('#digestGrid [data-digest-id]')];
const multiCards = [...document.querySelectorAll('#digestGrid [data-source-batch="unified"]')];
const ids = cards.map(card => card.dataset.digestId || card.dataset.sourceCaseId).filter(Boolean);
const uniqueIds = new Set(ids);
const displayedCount = Number.parseInt(document.querySelector('#digestCount')?.textContent || '0', 10);

const summary = {
  ok: cards.length === 100 && baseCards.length === 24 && multiCards.length === 76 && uniqueIds.size === 100 && displayedCount === 100,
  renderedCards: cards.length,
  promptFirstCards: baseCards.length,
  multiSourceCards: multiCards.length,
  uniqueIds: uniqueIds.size,
  displayedCount,
  platformFilter: Boolean(document.querySelector('#digestPlatform')),
  coverageAudit: Boolean(document.querySelector('#coverageAudit'))
};

console.log(JSON.stringify(summary, null, 2));

if (!summary.ok) {
  console.error('render contract failed: the live digest must render exactly 100 unique cards and display count 100');
  dom.window.close();
  process.exit(1);
}

if (!summary.platformFilter) {
  console.error('render contract failed: platform filter was not mounted');
  dom.window.close();
  process.exit(1);
}

if (!summary.coverageAudit) {
  console.error('render contract failed: coverage audit was not mounted');
  dom.window.close();
  process.exit(1);
}

dom.window.close();
