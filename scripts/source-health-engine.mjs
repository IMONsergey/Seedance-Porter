export function buildSourceHealth({ corpus, plan = null, adapters, highQualityThreshold = 70 }) {
  const candidates = Array.isArray(corpus?.candidates) ? corpus.candidates : [];
  const statMap = new Map((corpus?.sourceStats || []).map(item => [item.source, item]));
  const weakCollections = new Set((plan?.collections || []).filter(item => Number(item.priority || 0) >= 55).map(item => item.id));

  const rows = adapters.map(adapter => {
    const stats = statMap.get(adapter.id) || {};
    const selected = candidates.filter(item => item.sourcePool === adapter.id);
    const discovered = Number(stats.discovered || 0);
    const highQuality = selected.filter(item => Number(item.score || 0) >= highQualityThreshold);
    const directCreator = selected.filter(item => /(?:x\.com|twitter\.com)\//.test(item.sourceUrl || ''));
    const previews = selected.filter(item => item.previewUrl);
    const directVideos = selected.filter(item => item.sourceVideoUrl);
    const collections = new Set(selected.flatMap(item => item.collections || []));
    const weakServed = new Set([...collections].filter(id => weakCollections.has(id)));
    const avgScore = average(selected.map(item => Number(item.score || 0)));
    const avgTraceability = average(selected.map(item => Number(item.metrics?.sourceTraceability || 0)), 1);
    const selectionYield = discovered > 0 ? Math.round((selected.length / discovered) * 100) : null;
    const highQualityRate = selected.length ? Math.round((highQuality.length / selected.length) * 100) : 0;
    const previewRate = selected.length ? Math.round((previews.length / selected.length) * 100) : 0;
    const directCreatorRate = selected.length ? Math.round((directCreator.length / selected.length) * 100) : 0;
    const sourceRuntimeOk = stats.ok !== false && (Boolean(stats.ok) || discovered > 0 || selected.length > 0);

    const healthScore = clamp(Math.round(
      (sourceRuntimeOk ? 25 : 0)
      + Math.min(18, selected.length * 1.5)
      + Math.min(15, highQuality.length * 1.5)
      + Math.min(14, avgTraceability * 2.8)
      + Math.min(10, previewRate * 0.10)
      + Math.min(8, directCreatorRate * 0.08)
      + Math.min(10, weakServed.size * 2)
    ), 0, 100);

    return {
      ...adapter,
      runtime: {
        ok: sourceRuntimeOk,
        error: stats.error || null,
        discovered,
        normalized: numericOrNull(stats.normalized),
        riskFlaggedBeforeMerge: numericOrNull(stats.riskFlagged),
        safeBeforeCrossSourceDedupe: numericOrNull(stats.safeBeforeCrossSourceDedupe)
      },
      yield: {
        selected: selected.length,
        selectionYieldPercent: selectionYield,
        highQuality: highQuality.length,
        highQualityRatePercent: highQualityRate,
        averageScore: avgScore,
        averageTraceability: avgTraceability,
        previewCoveragePercent: previewRate,
        directCreatorSourcePercent: directCreatorRate,
        directSourceVideos: directVideos.length,
        collectionsServed: collections.size,
        weakCollectionsServed: weakServed.size,
        weakCollectionIds: [...weakServed]
      },
      health: {
        score: healthScore,
        status: healthStatus({ sourceRuntimeOk, discovered, selected: selected.length, healthScore }),
        recommendation: recommendation({ sourceRuntimeOk, discovered, selected: selected.length, highQuality: highQuality.length, avgTraceability, weakServed: weakServed.size, adapter })
      }
    };
  }).sort((a, b) => b.health.score - a.health.score || b.yield.weakCollectionsServed - a.yield.weakCollectionsServed || a.label.localeCompare(b.label));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    policy: {
      note: 'Health measures adapter reliability and selected research value. Selection yield is not a literal duplicate rate because global balancing and corpus limits also affect final contribution.',
      highQualityThreshold,
      weakCollectionPriorityThreshold: 55
    },
    summary: {
      registered: adapters.length,
      enabled: adapters.filter(item => item.enabled).length,
      responding: rows.filter(item => item.runtime.ok).length,
      contributing: rows.filter(item => item.yield.selected > 0).length,
      highValue: rows.filter(item => item.health.status === 'high-value').length,
      needsRepair: rows.filter(item => item.health.status === 'failed' || item.health.status === 'zero-yield').length,
      selectedCandidates: rows.reduce((sum, item) => sum + item.yield.selected, 0),
      highQualityCandidates: rows.reduce((sum, item) => sum + item.yield.highQuality, 0)
    },
    adapters: rows
  };
}

function healthStatus({ sourceRuntimeOk, discovered, selected, healthScore }) {
  if (!sourceRuntimeOk) return 'failed';
  if (discovered === 0 && selected === 0) return 'dormant';
  if (selected === 0) return 'zero-yield';
  if (healthScore >= 75) return 'high-value';
  if (healthScore >= 55) return 'productive';
  return 'low-yield';
}

function recommendation({ sourceRuntimeOk, discovered, selected, highQuality, avgTraceability, weakServed, adapter }) {
  if (!adapter.enabled) return 'disabled';
  if (!sourceRuntimeOk) return 'repair-adapter';
  if (discovered === 0) return 'inspect-upstream-structure';
  if (selected === 0) return 'inspect-duplicates-risk-and-parser-quality';
  if (avgTraceability < 3) return 'improve-provenance-before-scaling';
  if (weakServed >= 3 && highQuality >= 3) return 'expand-this-source';
  if (highQuality >= 5) return 'keep-and-deepen';
  return 'keep-monitoring';
}

function average(values, decimals = 0) {
  if (!values.length) return 0;
  const value = values.reduce((sum, item) => sum + item, 0) / values.length;
  return Number(value.toFixed(decimals));
}
function numericOrNull(value) { return Number.isFinite(Number(value)) ? Number(value) : null; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
