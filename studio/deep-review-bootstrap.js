const existing = document.querySelector('link[data-deep-review-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './deep-review.css';
  link.dataset.deepReviewStyles = 'true';
  document.head.appendChild(link);
}

await import('./deep-review-ui.js');
