import { CASE_INTELLIGENCE, COLLECTION_GROUPS } from './case-intelligence-runtime.js';
import { MULTI_SOURCE_CASES } from './multi-source-index.js';
import { SOURCE_PLATFORMS, SOURCE_PLATFORM_MAP } from './source-universe.js';
import { getLanguage, collectionLabel } from './i18n.js';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ru=()=>getLanguage()==='ru';
const ui=(en,rus)=>ru()?rus:en;
const TOTAL_TARGET=100;

function ensureStyle(){
  if($('link[data-coverage-audit]')) return;
  const link=document.createElement('link'); link.rel='stylesheet'; link.href='./coverage-audit.css'; link.dataset.coverageAudit='true'; document.head.appendChild(link);
}

function combinedCases(){
  return [
    ...CASE_INTELLIGENCE.map(item=>({id:item.id,sourcePlatform:'x',sourceKind:'prompt-case',collections:item.intelligence.collections,title:item.title})),
    ...MULTI_SOURCE_CASES
  ];
}

function countsBy(values){
  const map=new Map();
  values.forEach(v=>map.set(v,(map.get(v)||0)+1));
  return [...map.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])));
}

function collectionRows(cases){
  return COLLECTION_GROUPS.map(group=>({
    ...group,
    rows:group.items.map(name=>({name,count:cases.filter(item=>item.collections?.includes(name)).length}))
  }));
}

function level(count){ if(count===0)return'empty'; if(count<3)return'critical'; if(count<5)return'thin'; if(count<8)return'growing'; return'strong'; }
function levelLabel(value){ const labels={empty:['Empty','Пусто'],critical:['Critical gap','Критический пробел'],thin:['Thin','Мало'],growing:['Growing','Растёт'],strong:['Strong','Сильное покрытие']}; return ru()?labels[value][1]:labels[value][0]; }

function bar(value,max){ const width=Math.max(2,Math.min(100,Math.round((value/Math.max(1,max))*100))); return `<span class="coverage-bar"><i style="width:${width}%"></i></span>`; }

function render(){
  const sourceView=$('#sourceView'); const sourceGrid=$('#sourceGrid');
  if(!sourceView||!sourceGrid) return;
  let root=$('#coverageAudit');
  if(!root){ root=document.createElement('section'); root.id='coverageAudit'; root.className='coverage-audit'; const summary=$('#sourceUniverseSummary'); (summary?.parentElement||sourceGrid.parentElement).insertBefore(root,summary?summary.nextSibling:sourceGrid); }
  const cases=combinedCases();
  const platformCounts=countsBy(cases.map(item=>item.sourcePlatform));
  const kindCounts=countsBy(cases.map(item=>item.sourceKind));
  const represented=new Set(cases.map(item=>item.sourcePlatform)).size;
  const collections=collectionRows(cases);
  const allCollectionCounts=collections.flatMap(g=>g.rows.map(r=>r.count));
  const maxCollection=Math.max(...allCollectionCounts,1);
  const gaps=collections.flatMap(g=>g.rows.map(r=>({...r,group:g.title}))).filter(r=>r.count<5).sort((a,b)=>a.count-b.count||a.name.localeCompare(b.name));
  const percent=Math.min(100,Math.round(cases.length/TOTAL_TARGET*100));
  root.innerHTML=`
    <div class="coverage-head">
      <div><span>${ui('Editorial coverage','Редакционное покрытие')}</span><h3>${ui('Coverage audit','Аудит покрытия')}</h3><p>${ui('A live map of what the curated library already knows — and what must be researched next.','Живая карта того, что curated-библиотека уже знает и какие зоны нужно добирать следующими.')}</p></div>
      <div class="coverage-target"><strong>${cases.length}</strong><span>/ ${TOTAL_TARGET}</span><small>${percent}% ${ui('to first major milestone','до первого большого рубежа')}</small></div>
    </div>
    <div class="coverage-metrics">
      <article><strong>${cases.length}</strong><span>${ui('curated cases','curated-кейсов')}</span></article>
      <article><strong>${represented}</strong><span>${ui('represented platforms','представленных платформ')}</span></article>
      <article><strong>${SOURCE_PLATFORMS.length}</strong><span>${ui('platforms in discovery universe','платформ в discovery universe')}</span></article>
      <article><strong>${gaps.length}</strong><span>${ui('collections below 5 cases','коллекций меньше 5 кейсов')}</span></article>
    </div>
    <div class="coverage-columns">
      <div class="coverage-panel"><div class="coverage-panel-head"><strong>${ui('Source mix','Микс источников')}</strong><span>${ui('cases','кейсы')}</span></div>${platformCounts.map(([id,count])=>`<div class="coverage-row"><span>${esc(SOURCE_PLATFORM_MAP[id]?.label||id)}</span>${bar(count,Math.max(...platformCounts.map(x=>x[1])))}<strong>${count}</strong></div>`).join('')}</div>
      <div class="coverage-panel"><div class="coverage-panel-head"><strong>${ui('Evidence type','Тип кейса')}</strong><span>${ui('cases','кейсы')}</span></div>${kindCounts.map(([kind,count])=>`<div class="coverage-row"><span>${esc(kind.replaceAll('-',' '))}</span>${bar(count,Math.max(...kindCounts.map(x=>x[1])))}<strong>${count}</strong></div>`).join('')}</div>
    </div>
    <div class="coverage-collection-groups">${collections.map(group=>`<section class="coverage-collection-group"><h4>${esc(group.title)}</h4>${group.rows.map(row=>`<div class="coverage-collection-row" data-level="${level(row.count)}"><span>${esc(collectionLabel(row.name))}</span>${bar(row.count,maxCollection)}<strong>${row.count}</strong><small>${esc(levelLabel(level(row.count)))}</small></div>`).join('')}</section>`).join('')}</div>
    <div class="coverage-next"><div><span>${ui('Next research queue','Следующая очередь ресерча')}</span><strong>${ui('Collections with the weakest coverage','Самые слабые Collections')}</strong></div><div class="coverage-gap-chips">${gaps.slice(0,12).map(row=>`<span>${esc(collectionLabel(row.name))} · ${row.count}</span>`).join('')}</div></div>`;
}

ensureStyle();
queueMicrotask(render);
window.addEventListener('porter-language-change',()=>requestAnimationFrame(render));
const sourceView=$('#sourceView'); if(sourceView)new MutationObserver(()=>{if(!$('#coverageAudit'))render();}).observe(sourceView,{childList:true,subtree:true});
