const existing = document.querySelector('link[data-workspace-bundle-styles]');
if (!existing) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './workspace-bundle.css';
  link.dataset.workspaceBundleStyles = 'true';
  document.head.appendChild(link);
}

await import('./workspace-bundle-ui.js');

// `storage` does not fire in the same document that performed the write.
// Reuse Operations' focus refresh after explicit bundle imports.
window.addEventListener('porter-local-work-change', () => {
  window.dispatchEvent(new Event('focus'));
});
