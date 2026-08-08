const existing=document.querySelector('link[data-prompt-studio-v6-styles]');
if(!existing){const link=document.createElement('link');link.rel='stylesheet';link.href='./prompt-studio-v6.css';link.dataset.promptStudioV6Styles='true';document.head.appendChild(link);}
await import('./prompt-studio-v6-audio-ui.js');
