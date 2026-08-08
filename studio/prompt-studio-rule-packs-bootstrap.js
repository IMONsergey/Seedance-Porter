const existing=document.querySelector('link[data-prompt-studio-rule-packs-styles]');
if(!existing){
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='./prompt-studio-rule-packs.css';
  link.dataset.promptStudioRulePacksStyles='true';
  document.head.appendChild(link);
}

await import('./prompt-studio-profile-panel.js');
