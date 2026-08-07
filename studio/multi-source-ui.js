import { MULTI_SOURCE_CASES } from './multi-source-cases.js';
import { SOURCE_PLATFORMS, SOURCE_PLATFORM_MAP, SOURCE_FAMILIES } from './source-universe.js';
import { getLanguage, collectionLabel } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');
const byId = new Map(MULTI_SOURCE_CASES.map(item => [item.id, item]));
let platformFilter = 'all';
let refreshQueued = false;
let activeMultiCase = null;

function ru() { return getLanguage() === 'ru'; }
function loc(item, key) { return ru() && item[`${key}Ru`] ? item[`${key}Ru`] : item[key]; }
function ui(en, ruText) { return ru() ? ruText : en; }
function platform(item) { return SOURCE_PLATFORM_MAP[item.sourcePlatform] || { label:item.sourcePlatform, family:'Source' }; }
function kindLabel(kind) {
  const labels = {
    'prompt-case':['Prompt case','Prompt-кейс'],
    'workflow-case':['Workflow case','Разбор workflow'],
    'award-case':['Award case','Награждённый кейс'],
    'motion-reference':['Motion reference','Motion-референс'],
    'official-case':['Official case','Официальный кейс'],
    'official-example':['Official example','Официальный пример']
  };
  const pair = labels[kind] || [kind,kind];
  return ru() ? pair[1] : pair[0];
}

function ensureStyles() {
  if ($('link[data-multi-source]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './multi-source.css';
  link.dataset.multiSource = 'true';
  document.head.appendChild(link);
}

function ensureFilterOptions() {
  const category = $('#digestCategory');
  const creator = $('#digestCreator');
  if (category) {
    const existing = new Set([...category.options].map(o => o.value));
    [...new Set(MULTI_SOURCE_CASES.map(item => item.category))].sort().forEach(value => {
      if (!existing.has(value)) category.insertAdjacentHTML('beforeend', `<option value="${attr(value)}">${esc(value)}</option>`);
    });
  }
  if (creator) {
    const existing = new Set([...creator.options].map(o => o.value));
    [...new Set(MULTI_SOURCE_CASES.map(item => item.author))].sort().forEach(value => {
      if (!existing.has(value)) creator.insertAdjacentHTML('beforeend', `<option value="${attr(value)}">${esc(value)}</option>`);
    });
  }
}

function injectPlatformFilter() {
  const creator = $('#digestCreator');
  const panel = creator?.closest('[data-sidebar-view="digest"]');
  if (!creator || !panel || $('#digestPlatform')) return;
  const label = document.createElement('label');
  label.className = 'multi-platform-filter';
  label.innerHTML = `<span>${ui('Platform','Платформа')}</span><select id="digestPlatform"><option value="all">${ui('All platforms','Все платформы')}</option><option value="x">X / YouMind</option></select>`;
  creator.closest('label').insertAdjacentElement('afterend', label);
  const select = $('#digestPlatform');
  const ids = [...new Set(MULTI_SOURCE_CASES.map(item => item.sourcePlatform))];
  SOURCE_PLATFORMS.filter(p => ids.includes(p.id)).sort((a,b)=>a.label.localeCompare(b.label)).forEach(p => {
    select.insertAdjacentHTML('beforeend', `<option value="${attr(p.id)}">${esc(p.label)}</option>`);
  });
  select.addEventListener('change', () => { platformFilter = select.value; scheduleRefresh(); });
}

function sourceSummary() {
  const sourceView = $('#sourceView');
  const grid = $('#sourceGrid');
  if (!sourceView || !grid || $('#sourceUniverseSummary')) return;
  const node = document.createElement('section');
  node.id = 'sourceUniverseSummary';
  node.className = 'source-universe-summary';
  const platformCount = SOURCE_PLATFORMS.length;
  const caseCount = MULTI_SOURCE_CASES.length;
  node.innerHTML = `<div class="source-universe-head"><div><h3>${ui('Source Universe','Вселенная источников')}</h3><p>${ui('X is one creator-signal channel. Discovery now spans awards, design/motion archives, production press, first-party showcases and studio case pages.','X — только один канал creator-signal. Поиск теперь охватывает награды, design/motion-архивы, production-прессу, официальные showcase и страницы агентств/студий.')}</p></div><div class="source-universe-count"><strong>${platformCount}</strong> ${ui('platforms','платформ')} · <strong>${caseCount}</strong> ${ui('new curated cases','новых кейсов')}</div></div><div class="source-family-row">${SOURCE_FAMILIES.map(f => `<span>${esc(f)}</span>`).join('')}</div>`;
  grid.parentElement.insertBefore(node, grid);
}

function posterHtml(item) {
  const p = platform(item);
  return `<div class="multi-source-poster"><span class="multi-source-poster-platform">${esc(p.label)}</span><strong>${esc(loc(item,'title'))}</strong><small>${esc(item.author)} · ${esc(kindLabel(item.sourceKind))}</small></div>`;
}

function caseMatches(item) {
  const query = ($('#digestSearch')?.value || '').trim().toLowerCase();
  const category = $('#digestCategory')?.value || 'all';
  const creator = $('#digestCreator')?.value || 'all';
  const use = $('#digestUse')?.value || 'all';
  const activeCollection = $('#caseCollections [data-collection].is-active')?.dataset.collection || 'all';
  if (platformFilter !== 'all' && item.sourcePlatform !== platformFilter) return false;
  if (category !== 'all' && item.category !== category) return false;
  if (creator !== 'all' && item.author !== creator) return false;
  if (use === '5' && item.designScore < 5) return false;
  if (use === '4' && item.designScore < 4) return false;
  if (activeCollection !== 'all' && !(item.collections || []).includes(activeCollection)) return false;
  if (!query) return true;
  const hay = [item.title,item.titleRu,item.author,item.category,item.subcategory,item.sourceExcerpt,item.sourceExcerptRu,item.why,item.whyRu,item.signature,item.signatureRu,item.transferable,item.transferableRu,(item.tags||[]).join(' '),(item.collections||[]).join(' ')].join(' ').toLowerCase();
  return hay.includes(query);
}

function sortCases(items) {
  const sort = $('#digestSort')?.value || 'featured';
  return [...items].sort((a,b) => {
    if (sort === 'latest') return String(b.published).localeCompare(String(a.published));
    if (sort === 'design') return b.designScore-a.designScore || Number(b.featured)-Number(a.featured);
    if (sort === 'title') return loc(a,'title').localeCompare(loc(b,'title'));
    return Number(b.featured)-Number(a.featured) || b.designScore-a.designScore || String(b.published).localeCompare(String(a.published));
  });
}

function cardHtml(item) {
  const p = platform(item);
  return `<article class="prompt-card digest-card multi-source-card" data-multi-source-id="${attr(item.id)}" tabindex="0">
    <div class="card-preview source-preview">${posterHtml(item)}<button class="media-play-button" type="button" data-multi-play="${attr(item.id)}"><span>▶</span><span>${ui('Play video','Смотреть видео')}</span></button></div>
    <div class="card-body">
      <div class="card-kicker"><span class="platform-badge">${esc(p.label)} · ${esc(kindLabel(item.sourceKind))}</span><span>${ui('design','дизайн')} ${item.designScore}/5</span></div>
      <h3>${esc(loc(item,'title'))}</h3>
      <div class="digest-author">${ui('by','автор:')} ${esc(item.author)} <span>· ${esc(item.published)}</span></div>
      <blockquote class="excerpt">${esc(loc(item,'why'))}</blockquote>
      <div class="card-tags">${(item.tags||[]).slice(0,4).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <div class="card-actions"><button type="button" data-multi-copy="${attr(item.id)}">${ui('Copy Porter version','Скопировать Porter-версию')}</button><button type="button" data-multi-open="${attr(item.id)}">${ui('Open case','Открыть кейс')}</button></div>
    </div>
  </article>`;
}

function basePlatformVisibility() {
  $$('#digestGrid [data-digest-id]').forEach(card => card.classList.toggle('source-platform-hidden', platformFilter !== 'all' && platformFilter !== 'x'));
}

function updateCount() {
  requestAnimationFrame(() => {
    const cards = $$('#digestGrid .digest-card');
    const visible = cards.filter(card => !card.hidden && !card.classList.contains('source-platform-hidden') && !card.classList.contains('multi-source-filtered')).length;
    const count = $('#digestCount');
    if (count) count.textContent = String(visible);
    const empty = $('#digestEmpty');
    if (empty) empty.hidden = visible > 0;
  });
}

function renderExtraCards() {
  const grid = $('#digestGrid');
  if (!grid) return;
  basePlatformVisibility();
  const desired = sortCases(MULTI_SOURCE_CASES.filter(caseMatches));
  const existing = $$('[data-multi-source-id]', grid);
  const existingIds = existing.map(el=>el.dataset.multiSourceId).join('|');
  const desiredIds = desired.map(item=>item.id).join('|');
  if (existingIds !== desiredIds) {
    existing.forEach(el=>el.remove());
    grid.insertAdjacentHTML('afterbegin', desired.map(cardHtml).join(''));
  } else {
    existing.forEach(el => {
      const item = byId.get(el.dataset.multiSourceId);
      const h3 = $('h3',el); if (h3) h3.textContent = loc(item,'title');
      const quote = $('.excerpt',el); if (quote) quote.textContent = loc(item,'why');
      const play = $('[data-multi-play] span:last-child',el); if (play) play.textContent = ui('Play video','Смотреть видео');
      const buttons = $$('.card-actions button',el); if(buttons[0]) buttons[0].textContent=ui('Copy Porter version','Скопировать Porter-версию'); if(buttons[1]) buttons[1].textContent=ui('Open case','Открыть кейс');
    });
  }
  updateCount();
}

function scheduleRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => { refreshQueued = false; ensureFilterOptions(); renderExtraCards(); sourceSummary(); });
}

function playerHtml(item) {
  const player = item.player || {};
  if (player.kind === 'vimeo') return `<div class="multi-drawer-media"><iframe src="https://player.vimeo.com/video/${attr(player.id)}?title=0&byline=0&portrait=0" title="${attr(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="eager"></iframe></div>`;
  if (player.kind === 'behance') return `<div class="multi-drawer-media is-behance"><iframe src="https://www.behance.net/embed/project/${attr(player.projectId)}?ilo0=1" title="${attr(item.title)}" allow="fullscreen" allowfullscreen loading="eager"></iframe></div>`;
  if (player.kind === 'youtube') return `<div class="multi-drawer-media"><iframe src="https://www.youtube.com/embed/${attr(player.id)}" title="${attr(item.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="eager"></iframe></div>`;
  if (player.kind === 'iframe') return `<div class="multi-drawer-media"><iframe src="${attr(player.url)}" title="${attr(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="eager"></iframe></div>`;
  return `<div class="multi-drawer-media"><div class="source-media-fallback"><div><strong>${ui('This publisher does not expose a supported in-page player.','У издателя нет поддерживаемого встроенного плеера.')}</strong><a href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">${ui('Open source','Открыть источник')} ↗</a></div></div></div>`;
}

function resolvePrompt(item, root) {
  const values = {...item.variables};
  $$('[data-multi-variable]',root).forEach(input => { values[input.dataset.multiVariable] = input.value; });
  return item.porterPrompt.replace(/\{\{(\w+)\}\}/g,(_,key)=>values[key] ?? `{{${key}}}`);
}

function projectDraft(item, resolved) {
  const hasImage = /\[Image\s+1\]/i.test(resolved);
  return {
    project:`multi-source-${item.id}`,
    label:item.title,
    model:'seedance-2.0',
    mode:hasImage?'image-to-video':'text-to-video',
    duration:Math.min(15,Math.max(6,(item.shots?.length||2)*3)),
    resolution:'720p',aspectRatio:item.aspect||'16:9',
    outputPolicy:{generatedText:'forbid',generatedLogo:'forbid',generatedWatermark:'forbid'},
    brief:{objective:item.transferable,subject:Object.values(item.variables||{})[0]||item.title,action:item.shots?.[0]?.[1]||'Execute one dominant visible action per shot.',environment:'Adapt the source pattern to the new project while preserving spatial and material continuity.',style:'Independent Porter adaptation of the production logic; do not copy the original campaign subject matter.',imageQuality:'HD, stable geometry, coherent materials, clean edges and natural motion',constraints:['one dominant camera movement per shot','no unrequested text or logos','preserve product/identity anchors','composite exact brand and UI elements in post']},
    references:hasImage?[{id:'primary-reference',kind:'image',url:'<replace-with-reference-url>',role:'product',faceSource:'none',anchors:['exact overall geometry','stable material and color system'],note:'Replace with exact product/identity reference and adjust role when needed.'}]:[],
    shots:[],
    library:{kind:item.sourceKind,sourcePlatform:item.sourcePlatform,sourceUrl:item.sourceUrl,sourceAuthor:item.author,sourcePromptPublished:false,porterAdaptation:resolved,validationRequired:'Run through Porter BOS-2026-07-17 validator before paid generation.'}
  };
}

function shotHtml(item) {
  return (item.shots||[]).map((shot,index)=>`<article class="multi-shot"><div class="multi-shot-index">${String(index+1).padStart(2,'0')}</div><div><h4>${esc(shot[0])}</h4><p>${esc(shot[1])}</p><p class="multi-shot-purpose"><strong>${ui('Why:','Почему:')}</strong> ${esc(shot[2])}</p></div></article>`).join('');
}

function drawerHtml(item) {
  const p = platform(item);
  const vars = Object.entries(item.variables||{});
  return `${playerHtml(item)}<div class="multi-drawer-sourcebar"><span>${esc(p.label)} · ${esc(kindLabel(item.sourceKind))}</span><a href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">${ui('Source case','Кейс-источник')} ↗</a></div><div class="drawer-body" data-multi-source-body data-multi-id="${attr(item.id)}">
    <div class="drawer-meta">${esc(item.category)} / ${esc(item.subcategory)} · ${esc(p.label)}</div>
    <h2 class="drawer-title" id="drawerTitle">${esc(loc(item,'title'))}</h2>
    <div class="creator-line"><span>${esc(item.author)}</span><span>${esc(item.published)}</span><span>${ui('design relevance','дизайн-релевантность')} ${item.designScore}/5</span><span class="multi-case-type">${esc(kindLabel(item.sourceKind))}</span></div>
    <p class="drawer-intro">${esc(loc(item,'why'))}</p>
    <div class="badge-row">${(item.collections||[]).map(c=>`<span class="badge">${esc(collectionLabel(c))}</span>`).join('')}</div>

    <div class="section-title"><span>${ui('Source breakdown','Разбор источника')}</span><span>${esc(p.label)}</span></div>
    <blockquote class="original-prompt-box">${esc(loc(item,'sourceExcerpt'))}</blockquote>
    <div class="prompt-not-published"><strong>${ui('Exact prompt not published by source.','Точный промпт источником не опубликован.')}</strong> ${ui('Porter does not invent one. The prompt below is an independent adaptation of the documented production pattern.','Porter не выдумывает его. Промпт ниже — самостоятельная адаптация задокументированной production-логики.')}</div>
    <div class="multi-source-links"><a class="button" href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">${ui('Open primary source','Открыть основной источник')} ↗</a>${item.secondaryUrl?`<a class="button ghost" href="${attr(item.secondaryUrl)}" target="_blank" rel="noopener">${ui('Production source','Production-источник')} ↗</a>`:''}</div>

    <div class="section-title"><span>${ui('Why it works','Почему это работает')}</span><span>${ui('Production analysis','Production-разбор')}</span></div>
    <div class="multi-intel-grid"><article class="multi-intel-card"><span>${ui('Signature move','Главная фишка')}</span><p>${esc(loc(item,'signature'))}</p></article><article class="multi-intel-card"><span>${ui('Transferable pattern','Переиспользуемый паттерн')}</span><p>${esc(loc(item,'transferable'))}</p></article></div>

    <div class="section-title"><span>${ui('Shot anatomy','Анатомия кадров')}</span><span>${item.shots?.length||0} ${ui('beats','битов')}</span></div>
    <div class="multi-shot-list">${shotHtml(item)}</div>

    <div class="section-title"><span>Porter Adaptation</span><span>${ui('independently written','самостоятельная версия')}</span></div>
    <div class="multi-variable-grid">${vars.map(([key,value])=>`<label>${esc(key.replace(/([A-Z])/g,' $1'))}<input data-multi-variable="${attr(key)}" value="${attr(value)}" /></label>`).join('')}</div>
    <div class="prompt-box adaptation-box" data-multi-resolved>${esc(item.porterPrompt)}</div>
    <div class="drawer-actions"><button class="button primary" type="button" data-multi-copy-resolved>${ui('Copy Porter Adaptation','Скопировать Porter-адаптацию')}</button><button class="button" type="button" data-multi-copy-project>${ui('Copy Porter project JSON','Скопировать Porter project JSON')}</button></div>
  </div>`;
}

function openCase(item) {
  activeMultiCase = item;
  const drawer = $('#drawer'); const content = $('#drawerContent');
  if (!drawer || !content) return;
  content.innerHTML = drawerHtml(item);
  drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  const body = $('[data-multi-source-body]',content);
  const update = () => { const out=$('[data-multi-resolved]',body); if(out) out.textContent=resolvePrompt(item,body); };
  $$('[data-multi-variable]',body).forEach(input=>input.addEventListener('input',update));
  $('[data-multi-copy-resolved]',body)?.addEventListener('click',async()=>navigator.clipboard.writeText(resolvePrompt(item,body)));
  $('[data-multi-copy-project]',body)?.addEventListener('click',async()=>navigator.clipboard.writeText(JSON.stringify(projectDraft(item,resolvePrompt(item,body)),null,2)));
}

function bind() {
  for (const selector of ['#digestSearch','#digestCategory','#digestCreator','#digestUse','#digestSort']) {
    const el=$(selector); if(el){el.addEventListener('input',scheduleRefresh);el.addEventListener('change',scheduleRefresh);}
  }
  document.addEventListener('click',event=>{
    const card=event.target.closest('[data-multi-source-id]');
    const play=event.target.closest('[data-multi-play]'); const open=event.target.closest('[data-multi-open]'); const copy=event.target.closest('[data-multi-copy]');
    const id=play?.dataset.multiPlay||open?.dataset.multiOpen||copy?.dataset.multiCopy||card?.dataset.multiSourceId;
    if(!id) { if(event.target.closest('[data-collection]')) setTimeout(scheduleRefresh,0); return; }
    const item=byId.get(id); if(!item) return;
    if(copy){event.stopPropagation();navigator.clipboard.writeText(item.porterPrompt);return;}
    if(event.target.closest('.card-actions')&&!open&&!copy)return;
    event.preventDefault();event.stopPropagation();openCase(item);
  },true);
  document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-multi-source-id]')){event.preventDefault();openCase(byId.get(event.target.dataset.multiSourceId));}});
  window.addEventListener('porter-language-change',()=>{injectPlatformFilter();sourceSummary();renderExtraCards();if(activeMultiCase&&$('#drawer')?.classList.contains('is-open'))openCase(activeMultiCase);});
  const grid=$('#digestGrid'); if(grid)new MutationObserver(scheduleRefresh).observe(grid,{childList:true});
}

ensureStyles();
ensureFilterOptions();
injectPlatformFilter();
sourceSummary();
bind();
scheduleRefresh();
