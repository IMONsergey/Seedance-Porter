const existing = document.querySelector('link[data-coverage-planner-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './coverage-planner.css';
  link.dataset.coveragePlannerStyles = 'true';
  document.head.appendChild(link);
}

await import('./coverage-planner-ui.js');
