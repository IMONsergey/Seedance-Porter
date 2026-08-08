import { promptStudioSourceCatalog } from './prompt-studio-source-catalog.js';
import { getLanguage } from './i18n.js';

let queued=false;
let researchTitleMap=new Map();

rebuildResearchTitleMap();
bindBridge();
scheduleDecorate();

function bindBridge(){
  document.addEventListener('click',event=>{
    const command=event.target.closest('[data-open-prompt-studio-command]');
    if(command){event.preventDefault();event.stopPropagation();window.porterPromptStudio?.open?.();return;}
    const button=event.target.closest('[data-open-prompt-studio-kind][data-open-prompt-studio-id]');
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    window.porterPromptStudio?.openSource?.({kind:button.dataset.openPromptStudioKind,id:button.dataset.openPromptStudioId});
  },true);
  window.addEventListener('porter-language-change',()=>requestAnimationFrame(decorate));
  new MutationObserver(scheduleDecorate).observe(document.body,{childList:true,subtree:true});
}

function scheduleDecorate(){
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;decorate();});
}

function decorate(){
  decorateCurated();
  decorateOriginals();
  decorateResearch();
  decorateCommandPalette();
  updateLabels();
}

function decorateCurated(){
  document.querySelectorAll('#digestGrid [data-digest-id]').forEach(card=>{
    const id=card.dataset.digestId;if(!id)return;
    const actions=card.querySelector('.card-actions');if(!actions||actions.querySelector('[data-open-prompt-studio-id]'))return;
    actions.appendChild(makeButton('curated',id));
  });
}

function decorateOriginals(){
  document.querySelectorAll('#promptGrid [data-id]').forEach(card=>{
    const id=card.dataset.id;if(!id)return;
    const actions=card.querySelector('.card-actions');if(!actions||actions.querySelector('[data-open-prompt-studio-id]'))return;
    actions.appendChild(makeButton('original',id));
  });
}

function decorateResearch(){
  rebuildResearchTitleMap();
  document.querySelectorAll('#corpusBody .corpus-card').forEach(card=>{
    const actions=card.querySelector('.corpus-actions');if(!actions||actions.querySelector('[data-open-prompt-studio-id]'))return;
    const title=String(card.querySelector('h3')?.textContent||'').trim();
    const match=researchTitleMap.get(title);
    if(!match||match.ambiguous)return;
    actions.appendChild(makeButton('research',match.id));
  });
}

function decorateCommandPalette(){
  const hints=document.querySelector('#commandModeHints');
  if(!hints||hints.querySelector('[data-open-prompt-studio-command]'))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='command-mode-chip';
  button.dataset.openPromptStudioCommand='true';
  button.innerHTML='<kbd>✦</kbd><span>Studio</span>';
  hints.appendChild(button);
}

function rebuildResearchTitleMap(){
  const map=new Map();
  for(const entry of promptStudioSourceCatalog().research){
    const title=String(entry.title||'').trim();if(!title)continue;
    if(map.has(title)){map.set(title,{ambiguous:true});continue;}
    map.set(title,{id:entry.id,ambiguous:false});
  }
  researchTitleMap=map;
}

function makeButton(kind,id){
  const button=document.createElement('button');
  button.type='button';
  button.className='open-prompt-studio-action';
  button.dataset.openPromptStudioKind=kind;
  button.dataset.openPromptStudioId=id;
  setButtonLabel(button);
  return button;
}

function updateLabels(){
  document.querySelectorAll('.open-prompt-studio-action').forEach(setButtonLabel);
  document.querySelectorAll('[data-open-prompt-studio-command] span').forEach(span=>{const value=getLanguage()==='ru'?'Студио':'Studio';if(span.textContent!==value)span.textContent=value;});
}
function setButtonLabel(button){
  const value=label();
  if(button.textContent!==value)button.textContent=value;
  if(button.getAttribute('aria-label')!==value)button.setAttribute('aria-label',value);
}
function label(){return getLanguage()==='ru'?'В Prompt Studio':'Open in Studio';}
