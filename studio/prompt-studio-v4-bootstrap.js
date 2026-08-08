const existing=document.querySelector('link[data-prompt-studio-v4-styles]');
if(!existing){
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='./prompt-studio-v4.css';
  link.dataset.promptStudioV4Styles='true';
  document.head.appendChild(link);
}
await import('./prompt-studio-v4-workflow-guard.js');
await import('./prompt-studio-v4-ui.js');
