const existing = document.querySelector('link[data-prompt-studio-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './prompt-studio.css';
  link.dataset.promptStudioStyles = 'true';
  document.head.appendChild(link);
}

await import('./prompt-studio-ui.js');
