const existing=document.querySelector('link[data-prompt-studio-production-tools-styles]');
if(!existing){
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='./prompt-studio-production-tools.css';
  link.dataset.promptStudioProductionToolsStyles='true';
  document.head.appendChild(link);
}

await import('./prompt-studio-production-tools.js');
await import('./prompt-studio-variable-key-guard.js');
