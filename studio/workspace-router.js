const CORE_VIEW_IDS = {
  digest: 'digestView',
  prompts: 'promptView',
  sources: 'sourceView'
};

const CUSTOM_VIEW_IDS = {
  operations: 'operationsView',
  corpus: 'corpusView',
  'deep-review': 'deepReviewView',
  promotion: 'promotionView'
};

function allWorkspaceViews() {
  return [...document.querySelectorAll('.library-view, .source-view')];
}

function closeSidebar() {
  const state = document.querySelector('#sidebarState');
  if (state) state.checked = false;
}

export function hideWorkspaceViewsExcept(viewId) {
  for (const view of allWorkspaceViews()) {
    if (!view.id) continue;
    if (view.id === viewId) continue;
    view.hidden = true;
  }
}

export function markWorkspaceNavActive(selector) {
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('is-active'));
  document.querySelector(selector)?.classList.add('is-active');
}

export function activateCustomWorkspace(viewId, navSelector) {
  hideWorkspaceViewsExcept(viewId);
  const view = document.querySelector(`#${CSS.escape(viewId)}`);
  if (view) view.hidden = false;
  markWorkspaceNavActive(navSelector);
  closeSidebar();
  window.dispatchEvent(new CustomEvent('porter-workspace-change', { detail: { viewId } }));
}

function targetViewFromTab(tab) {
  if (tab?.dataset?.view && CORE_VIEW_IDS[tab.dataset.view]) return CORE_VIEW_IDS[tab.dataset.view];
  if (tab?.dataset?.caseView && CUSTOM_VIEW_IDS[tab.dataset.caseView]) return CUSTOM_VIEW_IDS[tab.dataset.caseView];
  return null;
}

function bindRouter() {
  document.addEventListener('click', event => {
    const tab = event.target.closest('.nav-tab[data-view], .nav-tab[data-case-view]');
    if (!tab) return;
    const viewId = targetViewFromTab(tab);
    if (!viewId) return;
    hideWorkspaceViewsExcept(viewId);
    closeSidebar();
  }, true);
}

bindRouter();

export const WORKSPACE_ROUTE_MAP = Object.freeze({
  core: { ...CORE_VIEW_IDS },
  custom: { ...CUSTOM_VIEW_IDS }
});
