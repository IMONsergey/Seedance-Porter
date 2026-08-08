const existing=document.querySelector('link[data-prompt-studio-v5-styles]');
if(!existing){const link=document.createElement('link');link.rel='stylesheet';link.href='./prompt-studio-v5.css';link.dataset.promptStudioV5Styles='true';document.head.appendChild(link);}
await import('./prompt-studio-v5-workflow-guard.js');
await import('./prompt-studio-v5-ui.js');
