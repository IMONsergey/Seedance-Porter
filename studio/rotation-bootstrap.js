const existing = document.querySelector('link[data-rotation-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './rotation.css';
  link.dataset.rotationStyles = 'true';
  document.head.appendChild(link);
}

await import('./rotation-ui.js');
