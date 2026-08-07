import { INDUSTRY_DIGEST } from './digest-data.js';
import { CASE_INTELLIGENCE } from './case-intelligence-runtime.js';
import { getLanguage } from './i18n.js';
import { getCaseLocale, translateAnalysisPhrase } from './case-locales.js';

const digestById = new Map(INDUSTRY_DIGEST.map(item => [item.id, item]));
const intelligenceById = new Map(CASE_INTELLIGENCE.map(item => [item.id, item]));
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const categoryRu = {
  'Narrative / Performance':'Нарратив / Перформанс','Fashion / Editorial':'Fashion / Editorial','Editorial / Lifestyle':'Editorial / Lifestyle','Motion / Camera':'Motion / Камера','Product / Beauty':'Продукт / Beauty','Food / Commercial':'Еда / Реклама','UGC / Marketing':'UGC / Маркетинг','VFX / Transitions':'VFX / Переходы','Product / Packshot':'Продукт / Packshot','3D / Materials':'3D / Материалы','Case Study / Portfolio':'Кейсы / Портфолио','Brand / Logo Motion':'Бренд / Logo Motion'
};
const subcategoryRu = {
  'Micro acting':'Микро-игра','Material transformation':'Трансформация материала','Craft process':'Craft-процесс','High-speed choreography':'Скоростная хореография','Scale play':'Игра с масштабом','Luxury sequence':'Luxury-последовательность','Process storytelling':'Процесс как история','Haircare':'Уход за волосами','Continuous morph':'Непрерывный морф','Prompt minimalism':'Минимализм промпта','Youth culture':'Youth culture','Beauty unboxing':'Beauty-unboxing','Durable goods':'Durable goods','Feature demo':'Демонстрация функции','Macro liquid':'Жидкость / макро','Retail launch':'Retail launch','Water metaphor':'Метафора воды','Branded character':'Бренд-персонаж','Food / travel':'Еда / travel','Behind the scenes':'Behind the scenes','Character metamorphosis':'Метаморфоза персонажа','Narrative ad':'Нарративная реклама','Period film grammar':'Грамматика period-film','Sports campaign':'Спортивная кампания'
};

function localizedCategory(value, language) { return language === 'ru' ? (categoryRu[value] || value) : value; }
function localizedSubcategory(value, language) { return language === 'ru' ? (subcategoryRu[value] || value) : value; }
function setText(el, value) { if (el && el.textContent !== value) el.textContent = value; }

function localizeCards(language) {
  $$('#digestGrid [data-digest-id]').forEach(card => {
    const item = digestById.get(card.dataset.digestId);
    if (!item) return;
    const locale = getCaseLocale(item.id, language);
    setText($('h3', card), locale?.title || item.title);
    const kicker = $$('.card-kicker span', card);
    if (kicker[0]) setText(kicker[0], `${localizedCategory(item.category, language)} · ${localizedSubcategory(item.subcategory, language)}`);
  });
}

function currentDrawerItem() {
  const root = $('#drawerContent');
  if (!root) return null;
  const stored = root.dataset.digestCaseId;
  if (stored) return digestById.get(stored) || null;
  const currentTitle = $('#drawerTitle', root)?.textContent?.trim();
  const item = INDUSTRY_DIGEST.find(entry => entry.title === currentTitle)
    || INDUSTRY_DIGEST.find(entry => getCaseLocale(entry.id, 'ru')?.title === currentTitle);
  if (item) root.dataset.digestCaseId = item.id;
  return item || null;
}

function localizeDrawer(language) {
  const item = currentDrawerItem();
  if (!item) return;
  const locale = getCaseLocale(item.id, language);
  const root = $('#drawerContent');
  const body = $('[data-digest-body]', root);
  if (!body) return;
  setText($('#drawerTitle', body), locale?.title || item.title);
  setText($('.drawer-intro', body), locale?.why || item.why);
  const meta = $('.drawer-meta', body);
  if (meta) setText(meta, `${language === 'ru' ? 'ИНДУСТРИАЛЬНЫЙ ДАЙДЖЕСТ' : 'INDUSTRY DIGEST'} · ${localizedCategory(item.category, language)} / ${localizedSubcategory(item.subcategory, language)}`);
  const author = $('.creator-line a', body);
  if (author) setText(author, `${item.author} ↗`);
}

function localizeCaseBlock(language) {
  const item = currentDrawerItem();
  const block = $('[data-case-intelligence]');
  if (!item || !block) return;
  const normalized = intelligenceById.get(item.id)?.intelligence;
  if (!normalized) return;
  const locale = getCaseLocale(item.id, language);

  setText($('.intelligence-summary .intelligence-lead', block), locale?.why || normalized.whyItWorks);
  setText($('.signature-move strong', block), locale?.signature || normalized.signatureMove);

  const shotSection = $('.intelligence-section', block);
  if (shotSection) {
    const countTitle = $('.intelligence-section-head h3', shotSection);
    if (countTitle) setText(countTitle, language === 'ru' ? `Production-битов: ${normalized.shotBreakdown.length}` : `${normalized.shotBreakdown.length} production beats`);
  }

  const shotCards = $$('.shot-analysis-card', block);
  shotCards.forEach((card, index) => {
    const shot = normalized.shotBreakdown[index];
    if (!shot) return;
    setText($('.shot-analysis-label', card), translateAnalysisPhrase(shot.label, language));
    const dd = $$('dd', card);
    if (dd[0]) setText(dd[0], translateAnalysisPhrase(shot.visualPurpose, language));
    if (dd[1]) setText(dd[1], translateAnalysisPhrase(shot.whyThisShotExists, language));
    if (dd[2]) setText(dd[2], translateAnalysisPhrase(shot.continuity, language));
  });

  const primaryArticles = $$('.intelligence-grid:not(.compact) article', block);
  const fields = [normalized.promptMechanics, normalized.referenceStrategy, normalized.cameraLanguage, normalized.transitionLanguage, normalized.materialLanguage, [normalized.audioRole]];
  primaryArticles.forEach((article, index) => {
    const values = fields[index] || [];
    $$('p', article).forEach((p, pIndex) => setText(p, translateAnalysisPhrase(values[pIndex] || p.textContent, language)));
  });

  const transfer = $('.transferable-section', block);
  if (transfer) {
    setText($('.intelligence-lead', transfer), locale?.transferable || normalized.transferablePattern);
    setText($('.post-note p', transfer), translateAnalysisPhrase(normalized.postProductionExpectation, language));
  }

  const compactArticles = $$('.intelligence-grid.compact article', block);
  if (compactArticles[0]) {
    $$('p', compactArticles[0]).forEach((p,index) => setText(p, `• ${translateAnalysisPhrase(normalized.failureRisks[index] || p.textContent.replace(/^•\s*/,''), language)}`));
  }
  if (compactArticles[1]) {
    $$('p', compactArticles[1]).forEach((p,index) => setText(p, `• ${translateAnalysisPhrase(normalized.bosNotes[index] || p.textContent.replace(/^•\s*/,''), language)}`));
  }
}

let pending = false;
function applyCaseLanguage() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    const language = getLanguage();
    localizeCards(language);
    localizeDrawer(language);
    localizeCaseBlock(language);
  });
}

window.addEventListener('porter-language-change', applyCaseLanguage);
new MutationObserver(applyCaseLanguage).observe(document.body, { childList: true, subtree: true });
applyCaseLanguage();
