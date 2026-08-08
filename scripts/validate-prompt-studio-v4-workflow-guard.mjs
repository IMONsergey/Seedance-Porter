#!/usr/bin/env node
import { JSDOM } from 'jsdom';

const dom=new JSDOM(`<!doctype html><html><body>
<section id="promptStudioView">
  <button id="newProject" data-studio-action="new">New</button>
  <button id="forkSource" data-studio-source-id="source-1">Fork</button>
  <button id="restoreRevision" data-restore-revision="rev-1">Restore</button>
  <select id="studioProjectSelect"><option value="p1">P1</option><option value="p2">P2</option></select>
</section>
<section id="studioV4Dock">
  <header><button id="variantsTab" data-studio-v4-action="tab" data-studio-v4-tab="variants">Variants</button><button id="handoffTab" data-studio-v4-action="tab" data-studio-v4-tab="handoff">Handoff</button><b data-v4-dirty="true">staged</b></header>
  <footer class="studio-v4-footer"><span></span></footer>
</section>
</body></html>`,{url:'https://example.test/'});

globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.MutationObserver=dom.window.MutationObserver;globalThis.Event=dom.window.Event;globalThis.CustomEvent=dom.window.CustomEvent;
const failures=[];const assert=(condition,message)=>{if(!condition)failures.push(message);};
let coreClicks=0,coreChanges=0,v4TabCalls=0,openEventCalls=0,openSourceCalls=0;
document.addEventListener('click',event=>{if(event.target.closest('[data-studio-action],[data-studio-source-id],[data-restore-revision]'))coreClicks++;if(event.target.closest('[data-studio-v4-action="tab"]'))v4TabCalls++;});
document.addEventListener('change',event=>{if(event.target.id==='studioProjectSelect')coreChanges++;});
window.addEventListener('porter-open-prompt-studio',()=>{openEventCalls++;});
window.porterPromptStudio={getProject:()=>({id:'p1'}),openSource:()=>{openSourceCalls++;return'opened';}};

await import(`../studio/prompt-studio-v4-workflow-guard.js?contract=${Date.now()}`);
function click(id){const event=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true});document.getElementById(id).dispatchEvent(event);return event;}

click('variantsTab');click('handoffTab');assert(v4TabCalls===0,'Variants/Handoff tab handlers must not receive clicks while Storyboard is dirty.');
click('newProject');click('forkSource');click('restoreRevision');assert(coreClicks===0,'New/Fork/Restore must be blocked at capture phase while Storyboard is dirty.');
const select=document.getElementById('studioProjectSelect');select.value='p2';select.dispatchEvent(new dom.window.Event('change',{bubbles:true,cancelable:true}));assert(coreChanges===0,'Project select change must not reach core handler while Storyboard is dirty.');assert(select.value==='p1','Blocked project select must restore canonical project ID.');
window.dispatchEvent(new dom.window.CustomEvent('porter-open-prompt-studio',{cancelable:true}));assert(openEventCalls===0,'Capture guard must stop porter-open-prompt-studio before core bubble listener.');
const dirtyOpenResult=window.porterPromptStudio.openSource({kind:'curated',id:'x'});assert(dirtyOpenResult===null&&openSourceCalls===0,'Direct public openSource must be guarded while Storyboard is dirty.');
const footer=document.querySelector('.studio-v4-footer span');assert(/Apply or discard/.test(footer.textContent),'Blocked workflow must expose a visible boundary message.');

document.querySelector('[data-v4-dirty]').dataset.v4Dirty='false';await new Promise(resolve=>queueMicrotask(resolve));
click('variantsTab');assert(v4TabCalls===1,'V4 tab navigation must resume after Storyboard is clean.');click('newProject');assert(coreClicks===1,'Core lifecycle click must resume after Storyboard is clean.');select.value='p2';select.dispatchEvent(new dom.window.Event('change',{bubbles:true,cancelable:true}));assert(coreChanges===1,'Project select must resume after Storyboard is clean.');window.dispatchEvent(new dom.window.CustomEvent('porter-open-prompt-studio',{cancelable:true}));assert(openEventCalls===1,'Open event must resume after Storyboard is clean.');const cleanOpenResult=window.porterPromptStudio.openSource({kind:'curated',id:'x'});assert(cleanOpenResult==='opened'&&openSourceCalls===1,'Direct public openSource must resume after Storyboard is clean.');

if(failures.length){console.error('Prompt Studio v4 workflow guard contract failed:\n'+failures.map(item=>`- ${item}`).join('\n'));process.exit(1);}console.log(JSON.stringify({ok:true,v4TabsBlocked:true,captureBlocksCoreLifecycle:true,projectSelectRestored:true,customOpenEventBlocked:true,publicOpenSourceWrapped:true,resumesWhenClean:true},null,2));
