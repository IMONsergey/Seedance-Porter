const existing = document.querySelector('link[data-deep-review-player-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './deep-review-player.css';
  link.dataset.deepReviewPlayerStyles = 'true';
  document.head.appendChild(link);
}

await import('./deep-review-player.js');
