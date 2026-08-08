import { deletePromptStudioProjectAssets } from './prompt-studio-assets.js';

window.addEventListener('porter-prompt-studio-change', event => {
  if (event.detail?.type !== 'delete' || !event.detail?.projectId) return;
  deletePromptStudioProjectAssets(event.detail.projectId).catch(error => {
    console.warn('[Prompt Studio] Failed to clean deleted project assets:', error);
  });
});
