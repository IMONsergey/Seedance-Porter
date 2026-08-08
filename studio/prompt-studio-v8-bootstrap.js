const existing=document.querySelector('link[data-prompt-studio-v8-styles]');
if(!existing){const link=document.createElement('link');link.rel='stylesheet';link.href='./prompt-studio-v8.css';link.dataset.promptStudioV8Styles='true';document.head.appendChild(link);}
await import('./prompt-studio-v8-batch-ui.js');
