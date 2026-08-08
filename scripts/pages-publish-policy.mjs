export function workflowPublishesStudioAsset(workflow, asset) {
  const name = String(asset || '');
  if (!name || name.includes('/') || name.includes('..')) return false;
  if (workflow.includes(`cp studio/${name} _site/${name}`)) return true;
  const bulk = workflow.includes('find studio -maxdepth 1 -type f') && workflow.includes('-exec cp {} _site/');
  if (!bulk) return false;
  if (name.endsWith('.js')) return workflow.includes("-name '*.js'");
  if (name.endsWith('.css')) return workflow.includes("-name '*.css'");
  return false;
}

export function workflowPublishesResearchSnapshots(workflow) {
  return workflow.includes('for snapshot in case-candidates.json case-review-queue.json coverage-plan.json source-health.json; do')
    && workflow.includes('cp "studio/$snapshot" "_site/$snapshot"');
}

export function workflowRunsValidator(workflow, validator) {
  return workflow.includes(`node scripts/${validator}`);
}

export function workflowUsesBulkStudioPublication(workflow) {
  return workflow.includes('find studio -maxdepth 1 -type f')
    && workflow.includes("-name '*.js'")
    && workflow.includes("-name '*.css'")
    && workflow.includes('-exec cp {} _site/');
}
