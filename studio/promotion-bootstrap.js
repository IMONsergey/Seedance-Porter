const existing = document.querySelector('link[data-promotion-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './promotion.css';
  link.dataset.promotionStyles = 'true';
  document.head.appendChild(link);
}

await import('./promotion-ui.js');
