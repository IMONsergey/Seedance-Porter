const sidebarState = document.querySelector('#sidebarState');
const sidebarToggle = document.querySelector('#sidebarToggle');
const sidebarClose = document.querySelector('#sidebarClose');
const sidebarBackdrop = document.querySelector('#sidebarBackdrop');

function openSidebar() {
  if (sidebarState) sidebarState.checked = true;
}

function closeSidebar() {
  if (sidebarState) sidebarState.checked = false;
}

sidebarToggle?.addEventListener('click', openSidebar);
sidebarClose?.addEventListener('click', closeSidebar);
sidebarBackdrop?.addEventListener('click', closeSidebar);

document.querySelectorAll('.nav-tab').forEach((tab) => {
  tab.addEventListener('click', closeSidebar);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSidebar();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 980) closeSidebar();
});

// Keep intelligence layers isolated from the core prompt-library runtime.
// If either optional layer fails, the base library remains usable.
Promise.allSettled([
  import('./case-intelligence-ui.js'),
  import('./case-corpus-ui.js')
]).then((results) => {
  for (const result of results) if (result.status === 'rejected') console.warn('Optional Case Intelligence layer did not load', result.reason);
});
