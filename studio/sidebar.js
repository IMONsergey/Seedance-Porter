import './experience.js';
import './experience-stability.js';
import './case-translation-runtime.js';
import './multi-source-ui.js';
import './multi-source-batch2-ui.js';
import './multi-source-batch3-ui.js';
import './multi-source-batch4-ui.js';
import './multi-source-batch5-ui.js';
import './multi-source-polish.js';
import './coverage-audit.js';

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
