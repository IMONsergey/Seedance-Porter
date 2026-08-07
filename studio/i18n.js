const dictionaries = {
  en: {
    'language.en':'EN','language.ru':'RU','language.label':'Language',
    'nav.digest':'Industry Digest','nav.originals':'Porter Originals','nav.sources':'Sources',
    'action.random':'Random prompt','action.favorites':'Favorites',
    'sidebar.filterDigest':'Filter digest','sidebar.filterOriginals':'Filter originals','sidebar.filterSources':'Filter sources',
    'sidebar.search':'Search','sidebar.category':'Category','sidebar.creator':'Creator','sidebar.design':'Design relevance','sidebar.sort':'Sort','sidebar.mode':'Mode','sidebar.aspect':'Aspect','sidebar.sourceType':'Source type','sidebar.quickCategories':'Quick categories','sidebar.reset':'Reset filters','sidebar.collections':'Collections','sidebar.allCases':'All cases',
    'option.allCategories':'All categories','option.allCreators':'All creators','option.anyScore':'Any score','option.score5':'5 / 5','option.score4':'4+ / 5','option.curator':'Curator pick','option.newest':'Newest','option.design':'Design relevance','option.az':'A–Z','option.allModes':'All modes','option.allRatios':'All ratios','option.designFirst':'Design-first','option.sourceAuthority':'Source authority','option.category':'Category','option.allSourceTypes':'All source types',
    'footer.github':'GitHub repository','footer.audit':'Industry audit',
    'view.digest.kicker':'Source-first prompt intelligence','view.digest.title':'Industry Digest','view.digest.desc':'Real creator examples, source previews, shot-by-shot production analysis and independently rewritten Porter adaptations.','view.digest.noteTitle':'Case Intelligence.','view.digest.noteText':'Source + creator + prompt pattern + shot anatomy + reusable production logic.','view.digest.analysisStandard':'Analysis standard','view.digest.examples':'examples','view.digest.source':'source','view.digest.excerpt':'excerpt','view.digest.adaptation':'adaptation',
    'view.originals.kicker':'192 reusable prompt cards','view.originals.title':'Porter Originals','view.originals.desc':'48 production archetypes × 4 visual directions for design, product, web, branding, UGC and VFX.','view.originals.count':'originals','view.originals.research':'research','view.originals.bos':'BOS',
    'view.sources.kicker':'Global industry audit · 2026-08-07','view.sources.title':'Sources','view.sources.desc':'Official model guidance, public prompt corpora, commercial AI workflows, design cases and research ranked by authority and design relevance.','view.sources.fullAudit':'Full audit',
    'empty.noResults':'No results.','empty.changeFilters':'Change filters or Collections in the sidebar.',
    'card.sourcePreview':'Source preview','card.design':'design {score}/5','card.by':'by {author}','card.sourceLinked':'original source linked','card.copyPorter':'Copy Porter version','card.openCase':'Open case','card.porterPreview':'Porter concept preview','card.copyPrompt':'Copy prompt','card.remix':'Remix',
    'drawer.openSource':'Open creator source','drawer.industryDigest':'Industry Digest','drawer.designRelevance':'design relevance {score}/5','drawer.originalExcerpt':'Original prompt excerpt','drawer.creatorAuthored':'creator-authored','drawer.readOriginal':'Read full original at source','drawer.galleryEntry':'Open gallery entry','drawer.license':'License','drawer.porterAdaptation':'Porter Adaptation','drawer.independent':'independently rewritten','drawer.adaptationNote':'Use the pattern, replace the variables, then validate/build through Porter. The adaptation intentionally removes brittle timing and overloaded camera instructions where necessary.','drawer.copyPorter':'Copy Porter Adaptation','drawer.copyProject':'Copy Porter project JSON','drawer.copySource':'Copy source link','drawer.attribution':'Attribution chain','drawer.creatorPost':'Original creator post','drawer.promptEntry':'Prompt gallery entry','drawer.corpus':'Corpus','drawer.remixVariables':'Remix variables','drawer.resolvedPrompt':'Resolved prompt','drawer.copy':'Copy','drawer.copyResolved':'Copy resolved prompt','drawer.copyTemplate':'Copy template','drawer.referencePlan':'Reference plan','drawer.productionNote':'Production note','drawer.research':'Research provenance','drawer.mode':'Mode','drawer.duration':'Duration','drawer.ratio':'Ratio','drawer.difficulty':'Difficulty','drawer.fields':'{count} fields',
    'source.authority':'authority {score}/5','source.design':'design {score}/5','source.open':'Open source',
    'case.title':'Case Intelligence','case.whyWorks':'Why this video works','case.evidence':'Evidence {level}','case.signature':'Signature move','case.shotAnatomy':'Shot anatomy','case.productionBeats':'{count} production beats','case.purpose':'Purpose','case.whyShot':'Why this shot','case.continuity':'Continuity','case.promptMechanics':'Prompt mechanics','case.referenceStrategy':'Reference strategy','case.cameraLanguage':'Camera language','case.transitionLanguage':'Transition language','case.materialLogic':'Material logic','case.audioRole':'Audio role','case.transferable':'Transferable pattern','case.whatReuse':'What to reuse','case.post':'Post-production expectation','case.risks':'Failure risks','case.bosNotes':'BOS notes','case.adapter':'Pattern adapter','case.usePattern':'Use this pattern for my project','case.bosDraft':'BOS draft','case.adapterInfo':'Keep the production logic, replace the original subject matter. This tool creates a Porter project draft; run the real Porter validator before generation.','case.projectType':'Project type','case.brand':'Brand / project','case.subject':'Subject / product','case.objective':'Objective','case.references':'References','case.buildDraft':'Build Porter draft','case.copyProject':'Copy project JSON','case.validationRequired':'Run through Porter BOS-2026-07-17 validator before paid generation.',
    'media.play':'Play video','media.sourceVideo':'Source video','media.embeddedPost':'Embedded source post','media.unavailable':'This source does not expose an embeddable player.','media.openFallback':'Open source',
    'collection.group.digital-design':'Digital / Design','collection.group.commercial':'Commercial','collection.group.motion-language':'Motion language'
  },
  ru: {
    'language.en':'EN','language.ru':'RU','language.label':'Язык',
    'nav.digest':'Индустриальный дайджест','nav.originals':'Шаблоны Porter','nav.sources':'Источники',
    'action.random':'Случайный кейс','action.favorites':'Избранное',
    'sidebar.filterDigest':'Фильтры дайджеста','sidebar.filterOriginals':'Фильтры шаблонов','sidebar.filterSources':'Фильтры источников',
    'sidebar.search':'Поиск','sidebar.category':'Категория','sidebar.creator':'Автор','sidebar.design':'Дизайн-релевантность','sidebar.sort':'Сортировка','sidebar.mode':'Режим','sidebar.aspect':'Формат','sidebar.sourceType':'Тип источника','sidebar.quickCategories':'Быстрые категории','sidebar.reset':'Сбросить фильтры','sidebar.collections':'Коллекции','sidebar.allCases':'Все кейсы',
    'option.allCategories':'Все категории','option.allCreators':'Все авторы','option.anyScore':'Любая оценка','option.score5':'5 / 5','option.score4':'4+ / 5','option.curator':'Выбор куратора','option.newest':'Сначала новые','option.design':'По дизайн-релевантности','option.az':'А–Я / A–Z','option.allModes':'Все режимы','option.allRatios':'Все форматы','option.designFirst':'Сначала дизайн','option.sourceAuthority':'По авторитетности источника','option.category':'По категории','option.allSourceTypes':'Все типы источников',
    'footer.github':'Репозиторий GitHub','footer.audit':'Аудит индустрии',
    'view.digest.kicker':'Насмотренность с источниками','view.digest.title':'Индустриальный дайджест','view.digest.desc':'Реальные кейсы авторов, превью из источников, покадровый production-разбор и самостоятельные Porter-адаптации.','view.digest.noteTitle':'Case Intelligence.','view.digest.noteText':'Источник + автор + prompt-паттерн + анатомия кадров + переиспользуемая production-логика.','view.digest.analysisStandard':'Стандарт анализа','view.digest.examples':'кейсов','view.digest.source':'источник','view.digest.excerpt':'фрагмент','view.digest.adaptation':'адаптация',
    'view.originals.kicker':'192 переиспользуемых шаблона','view.originals.title':'Шаблоны Porter','view.originals.desc':'48 production-архетипов × 4 визуальных направления для дизайна, продукта, web, брендинга, UGC и VFX.','view.originals.count':'шаблонов','view.originals.research':'ресерч','view.originals.bos':'BOS',
    'view.sources.kicker':'Глобальный аудит индустрии · 2026-08-07','view.sources.title':'Источники','view.sources.desc':'Официальные методички моделей, публичные prompt-корпусы, коммерческие AI-workflow, дизайн-кейсы и исследования с оценкой авторитетности и пользы для дизайна.','view.sources.fullAudit':'Полный аудит',
    'empty.noResults':'Ничего не найдено.','empty.changeFilters':'Измени фильтры или коллекцию слева.',
    'card.sourcePreview':'Превью источника','card.design':'дизайн {score}/5','card.by':'автор: {author}','card.sourceLinked':'оригинальный источник','card.copyPorter':'Скопировать Porter-версию','card.openCase':'Открыть кейс','card.porterPreview':'Концепт-превью Porter','card.copyPrompt':'Скопировать промпт','card.remix':'Адаптировать',
    'drawer.openSource':'Открыть источник автора','drawer.industryDigest':'Индустриальный дайджест','drawer.designRelevance':'дизайн-релевантность {score}/5','drawer.originalExcerpt':'Фрагмент оригинального промпта','drawer.creatorAuthored':'текст автора','drawer.readOriginal':'Читать полный оригинал в источнике','drawer.galleryEntry':'Открыть страницу в галерее','drawer.license':'Лицензия','drawer.porterAdaptation':'Porter-адаптация','drawer.independent':'самостоятельно переработано','drawer.adaptationNote':'Сохрани production-паттерн, замени переменные и затем проверь проект через Porter. Адаптация убирает хрупкие тайминги и перегруженные инструкции камеры.','drawer.copyPorter':'Скопировать Porter-адаптацию','drawer.copyProject':'Скопировать Porter project JSON','drawer.copySource':'Скопировать ссылку','drawer.attribution':'Цепочка атрибуции','drawer.creatorPost':'Оригинальный пост автора','drawer.promptEntry':'Страница prompt-галереи','drawer.corpus':'Корпус','drawer.remixVariables':'Переменные для адаптации','drawer.resolvedPrompt':'Готовый промпт','drawer.copy':'Копировать','drawer.copyResolved':'Скопировать готовый промпт','drawer.copyTemplate':'Скопировать шаблон','drawer.referencePlan':'План референсов','drawer.productionNote':'Production-заметка','drawer.research':'Источники ресерча','drawer.mode':'Режим','drawer.duration':'Длительность','drawer.ratio':'Формат','drawer.difficulty':'Сложность','drawer.fields':'полей: {count}',
    'source.authority':'авторитетность {score}/5','source.design':'дизайн {score}/5','source.open':'Открыть источник',
    'case.title':'Case Intelligence','case.whyWorks':'Почему это видео работает','case.evidence':'Уровень доказательности {level}','case.signature':'Главная фишка','case.shotAnatomy':'Анатомия кадров','case.productionBeats':'production-битов: {count}','case.purpose':'Задача кадра','case.whyShot':'Почему этот кадр нужен','case.continuity':'Непрерывность','case.promptMechanics':'Механика промпта','case.referenceStrategy':'Стратегия референсов','case.cameraLanguage':'Язык камеры','case.transitionLanguage':'Язык переходов','case.materialLogic':'Логика материалов','case.audioRole':'Роль звука','case.transferable':'Переиспользуемый паттерн','case.whatReuse':'Что переносим в свой проект','case.post':'Что делать на посте','case.risks':'Риски и слабые места','case.bosNotes':'BOS-правила','case.adapter':'Адаптер паттерна','case.usePattern':'Использовать этот паттерн в моём проекте','case.bosDraft':'BOS draft','case.adapterInfo':'Сохрани production-логику и замени исходный сюжет. Инструмент создаёт Porter project draft; перед генерацией запусти настоящий Porter validator.','case.projectType':'Тип проекта','case.brand':'Бренд / проект','case.subject':'Продукт / объект','case.objective':'Задача','case.references':'Референсы','case.buildDraft':'Собрать Porter draft','case.copyProject':'Скопировать project JSON','case.validationRequired':'Перед платной генерацией прогнать через Porter BOS-2026-07-17 validator.',
    'media.play':'Смотреть видео','media.sourceVideo':'Видео из источника','media.embeddedPost':'Встроенный пост источника','media.unavailable':'Источник не разрешает встроенный плеер.','media.openFallback':'Открыть источник',
    'collection.group.digital-design':'Digital / Design','collection.group.commercial':'Commercial','collection.group.motion-language':'Язык движения'
  }
};

const collectionRu = {
  'Website Hero':'Hero сайта','SaaS UI':'SaaS UI','App Launch':'Запуск приложения','Dashboard':'Дашборд','Case Study Motion':'Motion для кейсов','Brand Reveal':'Раскрытие бренда','Rebranding Transition':'Переход ребрендинга','Logo Motion':'Анимация логотипа','Kinetic Type':'Кинетическая типографика','Interactive / Web3D':'Interactive / Web3D',
  'Packshot':'Packshot','Beauty':'Beauty','FMCG':'FMCG','Food':'Еда','Automotive':'Автомобили','Fashion':'Fashion','Sports':'Спорт','Luxury':'Luxury','Electronics':'Электроника','Real Estate':'Недвижимость',
  'Camera':'Камера','Transitions':'Переходы','Morphs':'Морфы','Macro':'Макро','Material':'Материал','Loop':'Луп','Freeze':'Фриз','Scale':'Масштаб','Match Cut':'Match Cut','First / Last Frame':'Первый / последний кадр'
};

let currentLanguage = localStorage.getItem('porterLanguage') || (navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en');
if (!dictionaries[currentLanguage]) currentLanguage = 'en';

export function getLanguage() { return currentLanguage; }
export function t(key, vars = {}) {
  const template = dictionaries[currentLanguage]?.[key] ?? dictionaries.en[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}
export function collectionLabel(name) { return currentLanguage === 'ru' ? (collectionRu[name] || name) : name; }
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)); });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('[data-language]').forEach(el => el.classList.toggle('is-active', el.dataset.language === currentLanguage));
  document.documentElement.lang = currentLanguage;
}
export function setLanguage(language) {
  if (!dictionaries[language] || language === currentLanguage) return;
  currentLanguage = language;
  localStorage.setItem('porterLanguage', language);
  applyTranslations();
  window.dispatchEvent(new CustomEvent('porter-language-change', { detail: { language } }));
}
export function initI18n() {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-language]');
    if (button) setLanguage(button.dataset.language);
  });
  applyTranslations();
}
