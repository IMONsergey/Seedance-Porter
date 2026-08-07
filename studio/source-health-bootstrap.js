const existing = document.querySelector('link[data-source-health-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './source-health.css';
  link.dataset.sourceHealthStyles = 'true';
  document.head.appendChild(link);
}

await import('./source-health-ui.js');
