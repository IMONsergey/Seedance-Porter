const existing=document.querySelector('link[data-prompt-studio-v7-styles]');
if(!existing){const link=document.createElement('link');link.rel='stylesheet';link.href='./prompt-studio-v7.css';link.dataset.promptStudioV7Styles='true';document.head.appendChild(link);}
await import('./prompt-studio-v7-results-ui.js');
