export const OPERATIONS_TARGETS = Object.freeze({
  curatedCards: 100,
  researchMinimum: 500,
  reviewQueueMinimum: 30,
  snapshotFreshHours: 168,
  actionLimit: 10
});

export function buildOperationsState(input, overrides = {}) {
  const targets = { ...OPERATIONS_TARGETS, ...overrides };
  const curatedCases = Array.isArray(input.curatedCases) ? input.curatedCases : [];
  const corpus = input.corpus || null;
  const queue = input.queue || null;
  const coverage = input.coverage || null;
  const sourceHealth = input.sourceHealth || null;
  const local = normalizeLocal(input.local || {});
  const now = input.now ? new Date(input.now) : new Date();

  const researchCount = Number(corpus?.stats?.candidates ?? corpus?.candidates?.length ?? 0);
  const researchTarget = Number(corpus?.target?.min || targets.researchMinimum);
  const queueCount = Number(queue?.stats?.queue ?? queue?.queue?.length ?? 0);
  const criticalCollections = Number(coverage?.summary?.criticalCollections || 0);
  const highPriorityCollections = Number(coverage?.summary?.highPriorityCollections || 0);
  const respondingAdapters = Number(sourceHealth?.summary?.responding || 0);
  const enabledAdapters = Number(sourceHealth?.summary?.enabled || 0);
  const adaptersNeedingRepair = Number(sourceHealth?.summary?.needsRepair || 0);
  const highValueAdapters = Number(sourceHealth?.summary?.highValue || 0);
  const curatedCount = new Set(curatedCases.map(item => item?.id).filter(Boolean)).size;

  const snapshots = {
    corpus: snapshotState(corpus, now, targets.snapshotFreshHours),
    queue: snapshotState(queue, now, targets.snapshotFreshHours),
    coverage: snapshotState(coverage, now, targets.snapshotFreshHours),
    sourceHealth: snapshotState(sourceHealth, now, targets.snapshotFreshHours)
  };

  const actions = [];
  const addAction = action => actions.push({
    ...action,
    priority: clamp(Number(action.priority || 0), 0, 100),
    severity: severityForPriority(action.priority)
  });

  if (curatedCount !== targets.curatedCards) {
    addAction({
      id: 'curated-contract',
      type: 'curated-contract',
      priority: 100,
      targetView: 'digest',
      data: { actual: curatedCount, expected: targets.curatedCards }
    });
  }

  const missingSnapshots = Object.entries(snapshots).filter(([, value]) => !value.available).map(([key]) => key);
  if (missingSnapshots.length) {
    addAction({
      id: 'missing-research-snapshots',
      type: 'missing-snapshots',
      priority: 96,
      targetView: 'sources',
      data: { snapshots: missingSnapshots }
    });
  }

  const staleSnapshots = Object.entries(snapshots).filter(([, value]) => value.available && value.stale).map(([key, value]) => ({ key, ageHours: value.ageHours }));
  if (staleSnapshots.length) {
    addAction({
      id: 'stale-research-snapshots',
      type: 'stale-snapshots',
      priority: 76,
      targetView: 'sources',
      data: { snapshots: staleSnapshots }
    });
  }

  if (corpus && researchCount < researchTarget) {
    const deficit = Math.max(0, researchTarget - researchCount);
    addAction({
      id: 'research-target-deficit',
      type: 'research-deficit',
      priority: 88 + Math.min(8, Math.round((deficit / Math.max(1, researchTarget)) * 12)),
      targetView: 'corpus',
      data: { actual: researchCount, target: researchTarget, deficit }
    });
  }

  if (sourceHealth && adaptersNeedingRepair > 0) {
    const adapters = (sourceHealth.adapters || [])
      .filter(item => ['failed','zero-yield'].includes(item.health?.status))
      .map(item => ({ id: item.id, label: item.label, status: item.health?.status, recommendation: item.health?.recommendation }));
    addAction({
      id: 'source-adapters-attention',
      type: 'source-repair',
      priority: 91,
      targetView: 'sources',
      data: { count: adaptersNeedingRepair, adapters }
    });
  }

  if (local.deepReviewDrafts.length) {
    addAction({
      id: 'finish-deep-review-drafts',
      type: 'finish-reviews',
      priority: 94,
      targetView: 'deep-review',
      candidateId: local.deepReviewDrafts[0],
      data: { count: local.deepReviewDrafts.length, candidateIds: local.deepReviewDrafts }
    });
  }

  if (local.promotionDrafts.length) {
    addAction({
      id: 'finish-promotion-drafts',
      type: 'finish-promotions',
      priority: 84,
      targetView: 'promotion',
      candidateId: local.promotionDrafts[0],
      data: { count: local.promotionDrafts.length, candidateIds: local.promotionDrafts }
    });
  }

  if (coverage && criticalCollections > 0) {
    const top = (coverage.collections || []).filter(item => item.health === 'critical' || Number(item.priority || 0) >= 75).slice(0, 5);
    const backlog = (coverage.backlog || []).filter(item => top.some(collection => collection.id === item.targetCollection));
    const first = backlog[0] || coverage.backlog?.[0] || null;
    addAction({
      id: 'critical-collection-coverage',
      type: 'critical-coverage',
      priority: 90,
      targetView: first?.queued ? 'deep-review' : 'sources',
      candidateId: first?.queued ? first.candidateId : null,
      data: { count: criticalCollections, collections: top.map(item => ({ id: item.id, title: item.title, priority: item.priority, nextAction: item.nextAction })), firstBacklog: first }
    });
  }

  if (queue && queueCount < targets.reviewQueueMinimum) {
    addAction({
      id: 'review-queue-depth',
      type: 'queue-depth',
      priority: 72,
      targetView: 'sources',
      data: { actual: queueCount, target: targets.reviewQueueMinimum }
    });
  }

  if (coverage && criticalCollections === 0 && highPriorityCollections > 0) {
    const top = (coverage.collections || []).filter(item => item.health === 'high' || (Number(item.priority || 0) >= 55 && Number(item.priority || 0) < 75)).slice(0, 5);
    addAction({
      id: 'high-priority-coverage',
      type: 'high-coverage',
      priority: 66,
      targetView: 'sources',
      data: { count: highPriorityCollections, collections: top }
    });
  }

  if (sourceHealth && highValueAdapters > 0 && adaptersNeedingRepair === 0 && researchCount < researchTarget) {
    const expand = (sourceHealth.adapters || []).filter(item => item.health?.recommendation === 'expand-this-source').slice(0, 4);
    if (expand.length) {
      addAction({
        id: 'expand-high-value-sources',
        type: 'expand-sources',
        priority: 63,
        targetView: 'sources',
        data: { adapters: expand.map(item => ({ id: item.id, label: item.label, score: item.health?.score, weakCollections: item.yield?.weakCollectionsServed })) }
      });
    }
  }

  if (!actions.some(action => action.priority >= 80) && queueCount > 0) {
    const firstQueued = queue?.queue?.[0] || null;
    addAction({
      id: 'continue-deep-review',
      type: 'continue-review',
      priority: 58,
      targetView: 'deep-review',
      candidateId: firstQueued?.candidateId || null,
      data: { candidate: firstQueued }
    });
  }

  actions.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const pipeline = {
    curated: curatedCount,
    research: researchCount,
    researchTarget,
    reviewQueue: queueCount,
    deepReviewDrafts: local.deepReviewDrafts.length,
    mediaEvidenceDrafts: local.mediaEvidenceDrafts.length,
    promotionDrafts: local.promotionDrafts.length,
    criticalCollections,
    highPriorityCollections,
    adapters: { responding: respondingAdapters, enabled: enabledAdapters, needsRepair: adaptersNeedingRepair, highValue: highValueAdapters }
  };

  const health = overallHealth({ curatedCount, targets, missingSnapshots, staleSnapshots, researchCount, researchTarget, adaptersNeedingRepair, criticalCollections });

  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    health,
    pipeline,
    snapshots,
    local,
    actions: actions.slice(0, targets.actionLimit),
    topCoverage: (coverage?.collections || []).slice(0, 8),
    topBacklog: (coverage?.backlog || []).slice(0, 8),
    sourceAttention: (sourceHealth?.adapters || []).filter(item => item.health?.status === 'failed' || item.health?.status === 'zero-yield').slice(0, 8),
    sourceLeaders: (sourceHealth?.adapters || []).filter(item => item.health?.status === 'high-value').slice(0, 6)
  };
}

function normalizeLocal(value) {
  return {
    deepReviewDrafts: unique(value.deepReviewDrafts || []),
    mediaEvidenceDrafts: unique(value.mediaEvidenceDrafts || []),
    promotionDrafts: unique(value.promotionDrafts || [])
  };
}

function snapshotState(snapshot, now, staleHours) {
  if (!snapshot) return { available: false, generatedAt: null, ageHours: null, stale: false };
  const raw = snapshot.generatedAt || snapshot.createdAt || null;
  if (!raw) return { available: true, generatedAt: null, ageHours: null, stale: false };
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return { available: true, generatedAt: raw, ageHours: null, stale: false };
  const ageHours = Math.max(0, Math.round(((now.getTime() - date.getTime()) / 3600000) * 10) / 10);
  return { available: true, generatedAt: date.toISOString(), ageHours, stale: ageHours > staleHours };
}

function overallHealth(values) {
  if (values.curatedCount !== values.targets.curatedCards || values.missingSnapshots.length) return 'critical';
  if (values.adaptersNeedingRepair > 0 || values.criticalCollections > 0 || values.researchCount < values.researchTarget * 0.75) return 'attention';
  if (values.staleSnapshots.length || values.researchCount < values.researchTarget) return 'watch';
  return 'healthy';
}

function severityForPriority(priority) {
  if (priority >= 90) return 'critical';
  if (priority >= 75) return 'high';
  if (priority >= 55) return 'medium';
  return 'low';
}

function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
