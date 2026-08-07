export const DEFAULT_COVERAGE_TARGETS = Object.freeze({
  curatedPerCollection: 5,
  researchPerCollection: 15,
  highQualityResearchPerCollection: 6,
  sourcePoolsPerCollection: 3,
  queuedForReviewPerCollection: 4,
  highQualityScore: 70,
  backlogSize: 30
});

export function slugCollection(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCoveragePlan(input, overrides = {}) {
  const targets = { ...DEFAULT_COVERAGE_TARGETS, ...overrides };
  const collectionDefs = flattenCollections(input.collectionGroups || []);
  const curatedCases = normalizeCuratedCases(input.curatedCases || []);
  const candidates = normalizeCandidates(input.candidates || []);
  const queue = normalizeQueue(input.queue || []);
  const localDraftCandidateIds = new Set(input.localDraftCandidateIds || []);
  const queuedIds = new Set(queue.map(item => item.candidateId));
  const candidateById = new Map(candidates.map(item => [item.id, item]));

  const collections = collectionDefs.map(def => {
    const curated = curatedCases.filter(item => item.collections.includes(def.id));
    const research = candidates.filter(item => item.collections.includes(def.id) && !item.riskFlags.length);
    const highQuality = research.filter(item => item.score >= targets.highQualityScore);
    const queued = queue.filter(item => item.targetCollection === def.id || item.collectionCandidates.includes(def.id));
    const sourcePools = unique(research.map(item => item.sourcePool).filter(Boolean));
    const localDrafts = research.filter(item => localDraftCandidateIds.has(item.id));

    const deficits = {
      curated: deficit(curated.length, targets.curatedPerCollection),
      research: deficit(research.length, targets.researchPerCollection),
      highQuality: deficit(highQuality.length, targets.highQualityResearchPerCollection),
      sourceDiversity: deficit(sourcePools.length, targets.sourcePoolsPerCollection),
      queue: deficit(queued.length, targets.queuedForReviewPerCollection)
    };

    let priority = Math.round(100 * (
      deficits.curated * 0.35
      + deficits.research * 0.25
      + deficits.highQuality * 0.15
      + deficits.sourceDiversity * 0.10
      + deficits.queue * 0.15
    ));

    if (!research.length && curated.length < targets.curatedPerCollection) priority = Math.max(priority, 88);
    if (!sourcePools.length && curated.length < targets.curatedPerCollection) priority = Math.max(priority, 82);
    priority = clamp(priority, 0, 100);

    const nextAction = chooseNextAction({
      curated: curated.length,
      research: research.length,
      highQuality: highQuality.length,
      sourcePools: sourcePools.length,
      queued: queued.length,
      localDrafts: localDrafts.length,
      targets
    });

    return {
      ...def,
      curated: curated.length,
      research: research.length,
      highQualityResearch: highQuality.length,
      sourcePools: sourcePools.length,
      sourcePoolIds: sourcePools,
      queuedForReview: queued.length,
      localReviewDrafts: localDrafts.length,
      priority,
      health: priorityHealth(priority),
      nextAction,
      deficits,
      candidateIds: research.map(item => item.id),
      queuedCandidateIds: queued.map(item => item.candidateId)
    };
  }).sort((a, b) => b.priority - a.priority || a.curated - b.curated || a.title.localeCompare(b.title));

  const collectionById = new Map(collections.map(item => [item.id, item]));
  const backlog = buildBacklog({
    collections,
    candidates,
    queue,
    queuedIds,
    localDraftCandidateIds,
    targets
  });

  const weakIds = new Set(collections.filter(item => item.priority >= 55).map(item => item.id));
  const sourcePools = buildSourcePoolPlan(candidates, weakIds);

  const summary = {
    collections: collections.length,
    criticalCollections: collections.filter(item => item.health === 'critical').length,
    highPriorityCollections: collections.filter(item => item.health === 'high').length,
    healthyCollections: collections.filter(item => item.health === 'healthy').length,
    curatedCases: curatedCases.length,
    researchCandidates: candidates.filter(item => !item.riskFlags.length).length,
    highQualityCandidates: candidates.filter(item => !item.riskFlags.length && item.score >= targets.highQualityScore).length,
    queuedCandidates: unique(queue.map(item => item.candidateId)).length,
    localReviewDrafts: localDraftCandidateIds.size,
    automatedSourcePools: unique(candidates.map(item => item.sourcePool).filter(Boolean)).length,
    topPriorityCollection: collections[0]?.id || null
  };

  const pipeline = {
    discoveryStarved: collections.filter(item => item.nextAction === 'discover').length,
    sourceDiversityStarved: collections.filter(item => item.nextAction === 'diversify-sources').length,
    readyToQueue: collections.filter(item => item.nextAction === 'queue-for-review').length,
    readyToReview: collections.filter(item => item.nextAction === 'review-now').length,
    reviewInProgress: collections.filter(item => item.nextAction === 'finish-review').length,
    curatedFloorReached: collections.filter(item => item.curated >= targets.curatedPerCollection).length
  };

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    targets,
    summary,
    pipeline,
    collections,
    backlog,
    sourcePools,
    index: {
      collections: Object.fromEntries(collections.map(item => [item.id, item])),
      candidates: Object.fromEntries(candidates.map(item => [item.id, item])),
      queue: Object.fromEntries(queue.map(item => [item.candidateId, item])),
      collectionTitles: Object.fromEntries(collectionDefs.map(item => [item.id, item.title]))
    }
  };
}

function flattenCollections(groups) {
  return groups.flatMap(group => (group.items || []).map(title => ({
    id: slugCollection(title),
    title,
    groupId: group.id || slugCollection(group.title),
    groupTitle: group.title
  })));
}

function normalizeCuratedCases(items) {
  return items.map(item => ({
    id: item.id,
    title: item.title || item.id,
    sourcePlatform: item.sourcePlatform || 'x',
    collections: unique((item.collections || item.intelligence?.collections || []).map(slugCollection))
  }));
}

function normalizeCandidates(items) {
  return items.map(item => ({
    ...item,
    id: item.id || item.candidateId,
    score: Number(item.score || 0),
    sourcePool: item.sourcePool || 'unknown',
    sourcePoolLabel: item.sourcePoolLabel || item.sourcePool || 'Unknown source',
    collections: unique((item.collections || []).map(slugCollection)),
    riskFlags: Array.isArray(item.riskFlags) ? item.riskFlags : [],
    metrics: item.metrics || {}
  })).filter(item => item.id);
}

function normalizeQueue(items) {
  return items.map(item => ({
    ...item,
    candidateId: item.candidateId || item.id,
    targetCollection: slugCollection(item.targetCollection || ''),
    collectionCandidates: unique((item.collectionCandidates || []).map(slugCollection)),
    score: Number(item.score || 0)
  })).filter(item => item.candidateId);
}

function deficit(value, target) {
  if (!target || target <= 0) return 0;
  return clamp((target - Math.min(value, target)) / target, 0, 1);
}

function chooseNextAction(values) {
  const { curated, research, highQuality, sourcePools, queued, localDrafts, targets } = values;
  if (localDrafts > 0 && curated < targets.curatedPerCollection) return 'finish-review';
  if (research < Math.max(4, Math.ceil(targets.researchPerCollection * 0.4))) return 'discover';
  if (sourcePools < Math.min(2, targets.sourcePoolsPerCollection)) return 'diversify-sources';
  if (highQuality >= 1 && queued < Math.min(2, targets.queuedForReviewPerCollection)) return 'queue-for-review';
  if (queued > 0 && curated < targets.curatedPerCollection) return 'review-now';
  if (curated < targets.curatedPerCollection) return 'review-now';
  if (sourcePools < targets.sourcePoolsPerCollection || research < targets.researchPerCollection) return 'expand-depth';
  return 'maintain';
}

function priorityHealth(priority) {
  if (priority >= 75) return 'critical';
  if (priority >= 55) return 'high';
  if (priority >= 35) return 'medium';
  return 'healthy';
}

function buildBacklog({ collections, candidates, queue, queuedIds, localDraftCandidateIds, targets }) {
  const queueById = new Map(queue.map(item => [item.candidateId, item]));
  const usedCandidates = new Set();
  const sourceUse = new Map();
  const backlog = [];
  const orderedCollections = collections.filter(item => item.priority >= 30);

  for (const collection of orderedCollections) {
    if (backlog.length >= targets.backlogSize) break;
    const pool = candidates
      .filter(item => !item.riskFlags.length && item.collections.includes(collection.id) && !usedCandidates.has(item.id))
      .map(item => {
        const queued = queuedIds.has(item.id);
        const sourceCount = sourceUse.get(item.sourcePool) || 0;
        const traceability = Number(item.metrics?.sourceTraceability || 0);
        const quality = item.score
          + traceability * 2
          + (item.previewUrl ? 2 : 0)
          + (queued ? 7 : 0)
          + collection.priority * 0.35
          - sourceCount * 4;
        return { item, queued, quality, sourceCount, queueItem: queueById.get(item.id) || null };
      })
      .sort((a, b) => b.quality - a.quality || b.item.score - a.item.score || String(a.item.title).localeCompare(String(b.item.title)));

    const pick = pool[0];
    if (!pick) continue;
    usedCandidates.add(pick.item.id);
    sourceUse.set(pick.item.sourcePool, (sourceUse.get(pick.item.sourcePool) || 0) + 1);
    const action = localDraftCandidateIds.has(pick.item.id)
      ? 'finish-review'
      : pick.queued
        ? 'review-now'
        : collection.nextAction === 'discover'
          ? 'source-example'
          : 'queue-for-review';

    backlog.push({
      rank: backlog.length + 1,
      candidateId: pick.item.id,
      title: pick.item.title,
      author: pick.item.author || '',
      sourceUrl: pick.item.sourceUrl || '',
      archiveUrl: pick.item.archiveUrl || '',
      previewUrl: pick.item.previewUrl || '',
      sourcePool: pick.item.sourcePool,
      sourcePoolLabel: pick.item.sourcePoolLabel,
      candidateScore: pick.item.score,
      sourceTraceability: Number(pick.item.metrics?.sourceTraceability || 0),
      targetCollection: collection.id,
      targetCollectionTitle: collection.title,
      collectionPriority: collection.priority,
      action,
      queued: pick.queued,
      queuePriority: pick.queueItem?.priority || null,
      reasons: backlogReasons(collection, pick.item, pick.queued)
    });
  }

  if (backlog.length < targets.backlogSize) {
    const remaining = candidates
      .filter(item => !item.riskFlags.length && !usedCandidates.has(item.id))
      .sort((a, b) => b.score - a.score || Number(b.metrics?.sourceTraceability || 0) - Number(a.metrics?.sourceTraceability || 0));
    for (const item of remaining) {
      if (backlog.length >= targets.backlogSize) break;
      const targetCollection = item.collections
        .map(id => collections.find(collection => collection.id === id))
        .filter(Boolean)
        .sort((a, b) => b.priority - a.priority)[0];
      if (!targetCollection || targetCollection.priority < 20) continue;
      usedCandidates.add(item.id);
      backlog.push({
        rank: backlog.length + 1,
        candidateId: item.id,
        title: item.title,
        author: item.author || '',
        sourceUrl: item.sourceUrl || '',
        archiveUrl: item.archiveUrl || '',
        previewUrl: item.previewUrl || '',
        sourcePool: item.sourcePool,
        sourcePoolLabel: item.sourcePoolLabel,
        candidateScore: item.score,
        sourceTraceability: Number(item.metrics?.sourceTraceability || 0),
        targetCollection: targetCollection.id,
        targetCollectionTitle: targetCollection.title,
        collectionPriority: targetCollection.priority,
        action: queuedIds.has(item.id) ? 'review-now' : 'queue-for-review',
        queued: queuedIds.has(item.id),
        queuePriority: queueById.get(item.id)?.priority || null,
        reasons: backlogReasons(targetCollection, item, queuedIds.has(item.id))
      });
    }
  }

  return backlog.map((item, index) => ({ ...item, rank: index + 1 }));
}

function backlogReasons(collection, candidate, queued) {
  const reasons = [];
  if (collection.curated < DEFAULT_COVERAGE_TARGETS.curatedPerCollection) reasons.push('curated coverage below floor');
  if (collection.research < DEFAULT_COVERAGE_TARGETS.researchPerCollection) reasons.push('research pool below target');
  if (collection.sourcePools < DEFAULT_COVERAGE_TARGETS.sourcePoolsPerCollection) reasons.push('source diversity below target');
  if (candidate.score >= DEFAULT_COVERAGE_TARGETS.highQualityScore) reasons.push('high research score');
  if (Number(candidate.metrics?.sourceTraceability || 0) >= 4) reasons.push('strong source traceability');
  if (queued) reasons.push('already in deep-review queue');
  return reasons;
}

function buildSourcePoolPlan(candidates, weakIds) {
  const map = new Map();
  for (const item of candidates) {
    if (item.riskFlags.length) continue;
    if (!map.has(item.sourcePool)) {
      map.set(item.sourcePool, {
        sourcePool: item.sourcePool,
        sourcePoolLabel: item.sourcePoolLabel,
        candidates: 0,
        highQuality: 0,
        scoreTotal: 0,
        weakCollections: new Set(),
        allCollections: new Set(),
        previews: 0,
        traceabilityTotal: 0
      });
    }
    const entry = map.get(item.sourcePool);
    entry.candidates += 1;
    entry.scoreTotal += item.score;
    entry.traceabilityTotal += Number(item.metrics?.sourceTraceability || 0);
    if (item.score >= DEFAULT_COVERAGE_TARGETS.highQualityScore) entry.highQuality += 1;
    if (item.previewUrl) entry.previews += 1;
    for (const collection of item.collections) {
      entry.allCollections.add(collection);
      if (weakIds.has(collection)) entry.weakCollections.add(collection);
    }
  }

  return [...map.values()].map(entry => ({
    sourcePool: entry.sourcePool,
    sourcePoolLabel: entry.sourcePoolLabel,
    candidates: entry.candidates,
    highQuality: entry.highQuality,
    averageScore: Math.round(entry.scoreTotal / Math.max(1, entry.candidates)),
    averageTraceability: Number((entry.traceabilityTotal / Math.max(1, entry.candidates)).toFixed(1)),
    previewCoverage: Math.round((entry.previews / Math.max(1, entry.candidates)) * 100),
    weakCollectionsServed: entry.weakCollections.size,
    collectionsServed: entry.allCollections.size,
    weakCollectionIds: [...entry.weakCollections],
    acquisitionValue: Math.round(
      entry.weakCollections.size * 8
      + entry.highQuality * 1.5
      + (entry.traceabilityTotal / Math.max(1, entry.candidates)) * 4
      + (entry.previews / Math.max(1, entry.candidates)) * 8
    )
  })).sort((a, b) => b.acquisitionValue - a.acquisitionValue || b.highQuality - a.highQuality || b.candidates - a.candidates);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
