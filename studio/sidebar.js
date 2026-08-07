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

// Keep Case Intelligence isolated from the core prompt library runtime.
// If this layer fails, the base library remains usable.
import('./case-intelligence-ui.js').catch((error) => {
  console.warn('Case Intelligence UI did not load', error);
});
