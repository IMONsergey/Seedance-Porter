import './workspace-router.js';
import './operations-bootstrap.js';
import './prompt-studio-bootstrap.js';
import './prompt-studio-rule-packs-bootstrap.js';
import './command-palette-bootstrap.js';
import './workspace-bundle-bootstrap.js';
import './experience.js';
import './experience-stability.js';
import './case-translation-runtime.js';
import './case-intelligence-locales.js';
import './unified-curated-ui.js';
import './multi-source-polish.js';
import './coverage-audit.js';
import './coverage-planner-bootstrap.js';
import './source-health-bootstrap.js';
import './case-corpus-ui.js';
import './deep-review-bootstrap.js';
import './deep-review-player-bootstrap.js';
import './promotion-bootstrap.js';
import './rotation-bootstrap.js';

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
