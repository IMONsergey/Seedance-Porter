const existing = document.querySelector('link[data-operations-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './operations.css';
  link.dataset.operationsStyles = 'true';
  document.head.appendChild(link);
}

await import('./operations-ui.js');
