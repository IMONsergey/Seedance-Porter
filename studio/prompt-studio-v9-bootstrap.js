const existing=document.querySelector('link[data-prompt-studio-v9-styles]');
if(!existing){const link=document.createElement('link');link.rel='stylesheet';link.href='./prompt-studio-v9.css';link.dataset.promptStudioV9Styles='true';document.head.appendChild(link);}
await import('./prompt-studio-v9-workflow-guard.js');
await import('./prompt-studio-v9-console-ui.js');
