const existing = document.querySelector('link[data-coverage-planner-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './coverage-planner.css';
  link.dataset.coveragePlannerStyles = 'true';
  document.head.appendChild(link);
}

await import('./coverage-planner-ui.js');

function placePlannerAfterAudit() {
  const sourceView = document.querySelector('#sourceView');
  const audit = sourceView?.querySelector('#coverageAudit');
  const planner = sourceView?.querySelector('#coveragePlanner');
  if (!sourceView || !audit || !planner) return false;
  if (audit.nextElementSibling !== planner) audit.insertAdjacentElement('afterend', planner);
  return true;
}

if (!placePlannerAfterAudit()) {
  const sourceView = document.querySelector('#sourceView');
  if (sourceView) {
    const observer = new MutationObserver(() => {
      if (!placePlannerAfterAudit()) return;
      observer.disconnect();
    });
    observer.observe(sourceView, { childList: true, subtree: false });
  }
}
