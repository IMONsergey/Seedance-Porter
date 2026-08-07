import { SOURCE_PLATFORM_MAP } from './source-universe.js';
import { getLanguage } from './i18n.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const attr = (value = '') => esc(value).replace(/`/g, '&#96;');

export function mountCaseBatch(CASES, batchId) {
  const byId = new Map(CASES.map(item => [item.id,item]));
  const selector = `[data-source-batch="${batchId}"]`;
  let scheduled = false;

  const ru = () => getLanguage() === 'ru';
  const ui = (en, ruText) => ru() ? ruText : en;
  const loc = (item, key) => ru() && item[`${key}Ru`] ? item[`${key}Ru`] : item[key];
  const platform = item => SOURCE_PLATFORM_MAP[item.sourcePlatform] || { label:item.sourcePlatform };

  function ensureFilterOptions() {
    const platformSelect = $('#digestPlatform');
    if (platformSelect) {
      const existing = new Set([...platformSelect.options].map(option => option.value));
      [...new Set(CASES.map(item=>item.sourcePlatform))].forEach(id => {
        if (!existing.has(id)) platformSelect.insertAdjacentHTML('beforeend', `<option value="${attr(id)}">${esc(SOURCE_PLATFORM_MAP[id]?.label || id)}</option>`);
      });
    }
    const category = $('#digestCategory');
    if (category) {
      const existing = new Set([...category.options].map(option=>option.value));
      [...new Set(CASES.map(item=>item.category))].sort().forEach(value => {
        if (!existing.has(value)) category.insertAdjacentHTML('beforeend', `<option value="${attr(value)}">${esc(value)}</option>`);
      });
    }
    const creator = $('#digestCreator');
    if (creator) {
      const existing = new Set([...creator.options].map(option=>option.value));
      [...new Set(CASES.map(item=>item.author))].sort().forEach(value => {
        if (!existing.has(value)) creator.insertAdjacentHTML('beforeend', `<option value="${attr(value)}">${esc(value)}</option>`);
      });
    }
  }

  function matches(item) {
    const query = ($('#digestSearch')?.value || '').trim().toLowerCase();
    const category = $('#digestCategory')?.value || 'all';
    const creator = $('#digestCreator')?.value || 'all';
    const use = $('#digestUse')?.value || 'all';
    const selectedPlatform = $('#digestPlatform')?.value || 'all';
    const collection = $('#caseCollections [data-collection].is-active')?.dataset.collection || 'all';
    if (selectedPlatform !== 'all' && item.sourcePlatform !== selectedPlatform) return false;
    if (category !== 'all' && item.category !== category) return false;
    if (creator !== 'all' && item.author !== creator) return false;
    if (use === '5' && item.designScore < 5) return false;
    if (use === '4' && item.designScore < 4) return false;
    if (collection !== 'all' && !item.collections?.includes(collection)) return false;
    if (!query) return true;
    return [item.title,item.titleRu,item.author,item.category,item.subcategory,item.sourceExcerpt,item.sourceExcerptRu,item.why,item.whyRu,item.signature,item.signatureRu,item.transferable,item.transferableRu,(item.tags||[]).join(' '),(item.collections||[]).join(' ')].join(' ').toLowerCase().includes(query);
  }

  function sorted(items) {
    const mode = $('#digestSort')?.value || 'featured';
    return [...items].sort((a,b) => {
      if (mode === 'latest') return String(b.published).localeCompare(String(a.published));
      if (mode === 'design') return b.designScore-a.designScore || Number(b.featured)-Number(a.featured);
      if (mode === 'title') return loc(a,'title').localeCompare(loc(b,'title'));
      return Number(b.featured)-Number(a.featured) || b.designScore-a.designScore || String(b.published).localeCompare(String(a.published));
    });
  }

  function kindLabel(item) {
    if (item.sourceKind === 'award-case') return ui('Award case','Награждённый кейс');
    if (item.sourceKind === 'motion-reference') return ui('Motion reference','Motion-референс');
    if (item.sourceKind === 'official-case' || item.sourceKind === 'official-example') return ui('Official case','Официальный кейс');
    return ui('Workflow case','Разбор workflow');
  }

  function cardHtml(item) {
    const p = platform(item);
    return `<article class="prompt-card digest-card multi-source-card source-batch-card" data-source-batch="${attr(batchId)}" data-source-case-id="${attr(item.id)}" tabindex="0">
      <div class="card-preview source-preview">
        <div class="multi-source-poster"><span class="multi-source-poster-platform">${esc(p.label)}</span><strong>${esc(loc(item,'title'))}</strong><small>${esc(item.author)} · ${esc(kindLabel(item))}</small></div>
        <button class="media-play-button" type="button" data-source-open="${attr(item.id)}"><span>▶</span><span>${ui('Play video','Смотреть видео')}</span></button>
      </div>
      <div class="card-body">
        <div class="card-kicker"><span class="platform-badge">${esc(p.label)} · ${esc(kindLabel(item))}</span><span>${ui('design','дизайн')} ${item.designScore}/5</span></div>
        <h3>${esc(loc(item,'title'))}</h3>
        <div class="digest-author">${ui('by','автор:')} ${esc(item.author)} <span>· ${esc(item.published)}</span></div>
        <blockquote class="excerpt">${esc(loc(item,'why'))}</blockquote>
        <div class="card-tags">${(item.tags||[]).slice(0,4).map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>
        <div class="card-actions"><button type="button" data-source-copy="${attr(item.id)}">${ui('Copy Porter version','Скопировать Porter-версию')}</button><button type="button" data-source-open="${attr(item.id)}">${ui('Open case','Открыть кейс')}</button></div>
      </div>
    </article>`;
  }

  function updateCount() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const visible = $$('#digestGrid .digest-card').filter(card => !card.hidden && !card.classList.contains('source-platform-hidden') && !card.classList.contains('multi-source-filtered')).length;
      if ($('#digestCount')) $('#digestCount').textContent = String(visible);
      if ($('#digestEmpty')) $('#digestEmpty').hidden = visible > 0;
    }));
  }

  function render() {
    ensureFilterOptions();
    const grid = $('#digestGrid');
    if (!grid) return;
    const desired = sorted(CASES.filter(matches));
    const existing = $$(selector,grid);
    const have = existing.map(el=>el.dataset.sourceCaseId).join('|');
    const want = desired.map(item=>item.id).join('|');
    if (have !== want) {
      existing.forEach(el=>el.remove());
      grid.insertAdjacentHTML('afterbegin',desired.map(cardHtml).join(''));
    } else {
      existing.forEach(el => {
        const item = byId.get(el.dataset.sourceCaseId);
        if (!item) return;
        const title = $('h3',el); if(title) title.textContent = loc(item,'title');
        const why = $('.excerpt',el); if(why) why.textContent = loc(item,'why');
        const play = $('[data-source-open] span:last-child',el); if(play) play.textContent = ui('Play video','Смотреть видео');
        const actions = $$('.card-actions button',el); if(actions[0]) actions[0].textContent=ui('Copy Porter version','Скопировать Porter-версию'); if(actions[1]) actions[1].textContent=ui('Open case','Открыть кейс');
      });
    }
    updateCount();
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled=false; render(); });
  }

  function playerHtml(item) {
    const player = item.player || {};
    if (player.kind === 'vimeo') return `<div class="multi-drawer-media"><iframe src="https://player.vimeo.com/video/${attr(player.id)}?title=0&byline=0&portrait=0" title="${attr(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="eager"></iframe></div>`;
    if (player.kind === 'behance') return `<div class="multi-drawer-media is-behance"><iframe src="https://www.behance.net/embed/project/${attr(player.projectId)}?ilo0=1" title="${attr(item.title)}" allow="fullscreen" allowfullscreen loading="eager"></iframe></div>`;
    if (player.kind === 'youtube') return `<div class="multi-drawer-media"><iframe src="https://www.youtube.com/embed/${attr(player.id)}" title="${attr(item.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="eager"></iframe></div>`;
    if (player.kind === 'iframe') return `<div class="multi-drawer-media"><iframe src="${attr(player.url)}" title="${attr(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="eager"></iframe></div>`;
    return '';
  }

  function resolvedPrompt(item, root) {
    const values = {...item.variables};
    $$('[data-source-variable]',root).forEach(input => { values[input.dataset.sourceVariable] = input.value; });
    return item.porterPrompt.replace(/\{\{(\w+)\}\}/g,(_,key)=>values[key] ?? `{{${key}}}`);
  }

  function projectJson(item, prompt) {
    const hasImage = /\[Image\s+1\]/i.test(prompt);
    return {
      project:`source-${item.id}`,
      label:item.title,
      model:'seedance-2.0',
      mode:hasImage?'image-to-video':'text-to-video',
      duration:Math.min(15,Math.max(7,(item.shots?.length||3)*3)),
      resolution:'720p', aspectRatio:item.aspect||'16:9',
      outputPolicy:{generatedText:'forbid',generatedLogo:'forbid',generatedWatermark:'forbid'},
      brief:{objective:item.transferable,subject:Object.values(item.variables||{})[0]||item.title,action:item.shots?.[0]?.[1]||'Execute one clear visible action.',environment:'Adapt the production pattern to the new project while preserving continuity.',style:'Independent Porter adaptation of the case logic; do not copy original campaign subject matter.',imageQuality:'HD, stable geometry, coherent materials, natural motion and clean edges',constraints:['one dominant camera function per shot','preserve identity/product anchors','no unrequested text or logos','exact typography and brand geometry in post']},
      references:hasImage?[{id:'primary-reference',kind:'image',url:'<replace-with-reference-url>',role:'product',faceSource:'none',anchors:['exact overall geometry','stable material and color system'],note:'Replace with exact reference and adjust role if the primary anchor is identity or environment.'}]:[],
      shots:[],
      library:{kind:item.sourceKind,sourcePlatform:item.sourcePlatform,sourceUrl:item.sourceUrl,sourceAuthor:item.author,sourcePromptPublished:false,resolvedPrompt:prompt,validationRequired:'Run through Porter BOS-2026-07-17 validator before paid generation.'}
    };
  }

  function shotHtml(item) {
    return (item.shots||[]).map((shot,index)=>`<article class="multi-shot"><div class="multi-shot-index">${String(index+1).padStart(2,'0')}</div><div><h4>${esc(shot[0])}</h4><p>${esc(shot[1])}</p><p class="multi-shot-purpose"><strong>${ui('Why:','Почему:')}</strong> ${esc(shot[2])}</p></div></article>`).join('');
  }

  function drawerHtml(item) {
    const p = platform(item);
    const vars = Object.entries(item.variables||{});
    return `${playerHtml(item)}
      <div class="multi-drawer-sourcebar"><span>${esc(p.label)} · ${esc(kindLabel(item))}</span><a href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">${ui('Source case','Кейс-источник')} ↗</a></div>
      <div class="drawer-body" data-source-batch-body="${attr(batchId)}">
        <div class="drawer-meta">CASE INTELLIGENCE · ${esc(item.category)} / ${esc(item.subcategory)}</div>
        <h2 class="drawer-title" id="drawerTitle">${esc(loc(item,'title'))}</h2>
        <div class="creator-line"><span>${esc(item.author)}</span><span>${esc(item.published)}</span><span>${ui('design relevance','дизайн-релевантность')} ${item.designScore}/5</span></div>
        <p class="drawer-intro">${esc(loc(item,'why'))}</p>
        <div class="signature-move"><span>${ui('Signature move','Главная фишка')}</span><strong>${esc(loc(item,'signature'))}</strong></div>
        <div class="intelligence-pills collections-pills">${(item.collections||[]).map(value=>`<span>${esc(value)}</span>`).join('')}</div>
        <div class="section-title"><span>${ui('Source evidence','Что подтверждает источник')}</span><span>${ui('source-authored excerpt','фрагмент источника')}</span></div>
        <blockquote class="original-prompt-box">“${esc(loc(item,'sourceExcerpt'))}”</blockquote>
        <div class="drawer-note"><strong>${ui('Exact source prompt not published.','Точный промпт источником не опубликован.')}</strong> ${ui('The production analysis below is derived from the documented case; the Porter prompt is independently written.','Разбор ниже основан на опубликованном кейсе; Porter-промпт написан самостоятельно.')}</div>
        <div class="section-title"><span>${ui('Shot anatomy','Анатомия кадров')}</span><span>${item.shots.length} ${ui('beats','бита')}</span></div>
        <div class="multi-shot-list">${shotHtml(item)}</div>
        <div class="section-title"><span>${ui('Transferable pattern','Что переносим в свой проект')}</span></div>
        <div class="drawer-note">${esc(loc(item,'transferable'))}</div>
        <div class="section-title"><span>${ui('Remix variables','Переменные адаптации')}</span><span>${vars.length}</span></div>
        <div class="variable-grid">${vars.map(([key,value])=>`<label>${esc(key.replace(/([A-Z])/g,' $1'))}<input data-source-variable="${attr(key)}" value="${attr(value)}" /></label>`).join('')}</div>
        <div class="section-title"><span>Porter Adaptation</span><span>${ui('independently written','самостоятельно написано')}</span></div>
        <div class="prompt-box adaptation-box" data-source-resolved>${esc(item.porterPrompt)}</div>
        <div class="drawer-actions"><button class="button primary" type="button" data-source-copy-resolved>${ui('Copy Porter Adaptation','Скопировать Porter-адаптацию')}</button><button class="button" type="button" data-source-project>${ui('Copy Porter project JSON','Скопировать Porter project JSON')}</button><a class="button" href="${attr(item.sourceUrl)}" target="_blank" rel="noopener">${ui('Open source','Открыть источник')} ↗</a></div>
      </div>`;
  }

  function toast(message) {
    const el = $('#toast'); if(!el) return;
    el.textContent=message; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),1300);
  }

  async function copy(text, message) { await navigator.clipboard.writeText(text); toast(message); }

  function openCase(item) {
    const drawer=$('#drawer'); const content=$('#drawerContent');
    if(!drawer||!content) return;
    content.innerHTML=drawerHtml(item);
    drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    const body=$(`[data-source-batch-body="${batchId}"]`,content);
    const update=()=>{ const box=$('[data-source-resolved]',body); if(box) box.textContent=resolvedPrompt(item,body); };
    $$('[data-source-variable]',body).forEach(input=>input.addEventListener('input',update));
    $('[data-source-copy-resolved]',body)?.addEventListener('click',()=>copy(resolvedPrompt(item,body),ui('Porter Adaptation copied','Porter-адаптация скопирована')));
    $('[data-source-project]',body)?.addEventListener('click',()=>copy(JSON.stringify(projectJson(item,resolvedPrompt(item,body)),null,2),ui('Project JSON copied','Project JSON скопирован')));
  }

  function bind() {
    const grid=$('#digestGrid');
    grid?.addEventListener('click',event=>{
      const card = event.target.closest(selector);
      if (!card) return;
      const copyButton=event.target.closest('[data-source-copy]');
      if(copyButton){ event.stopPropagation(); const item=byId.get(copyButton.dataset.sourceCopy); if(item) copy(item.porterPrompt,ui('Porter Adaptation copied','Porter-адаптация скопирована')); return; }
      const openButton=event.target.closest('[data-source-open]');
      if(openButton){ event.stopPropagation(); const item=byId.get(openButton.dataset.sourceOpen); if(item) openCase(item); }
    });
    grid?.addEventListener('keydown',event=>{ if((event.key==='Enter'||event.key===' ')&&event.target.matches(selector)){ const item=byId.get(event.target.dataset.sourceCaseId); if(item) openCase(item); }});
    ['digestSearch','digestCategory','digestCreator','digestUse','digestSort','digestPlatform'].forEach(id=>{
      const element=$(`#${id}`); element?.addEventListener(id==='digestSearch'?'input':'change',scheduleRender);
    });
    $('#caseCollections')?.addEventListener('click',()=>requestAnimationFrame(scheduleRender));
    window.addEventListener('porter-language-change',scheduleRender);
    if(grid) new MutationObserver(scheduleRender).observe(grid,{childList:true});
    const sidebar=$('.sidebar'); if(sidebar) new MutationObserver(ensureFilterOptions).observe(sidebar,{childList:true,subtree:true});
  }

  ensureFilterOptions();
  bind();
  scheduleRender();
}
