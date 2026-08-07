const sidebarState = document.querySelector('#sidebarState');

function closeSidebar() {
  if (sidebarState) sidebarState.checked = false;
}

document.querySelectorAll('.nav-tab').forEach((tab) => {
  tab.addEventListener('click', closeSidebar);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSidebar();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 980) closeSidebar();
});
