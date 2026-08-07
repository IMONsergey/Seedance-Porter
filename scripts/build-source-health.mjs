#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SOURCE_ADAPTERS, publicAdapterRecord } from './source-adapter-registry.mjs';

const args = parseArgs(process.argv.slice(2));
const CORPUS = resolve(args.corpus || 'studio/case-candidates.json');
const PLAN = resolve(args.plan || 'studio/coverage-plan.json');
const OUTPUT = resolve(args.output || 'studio/source-health.json');
const HIGH_QUALITY = Number(args['high-quality'] || 70);

const corpus = JSON.parse(await readFile(CORPUS, 'utf8'));
let plan = null;
try { plan = JSON.parse(await readFile(PLAN, 'utf8')); } catch {}

const candidates = Array.isArray(corpus.candidates) ? corpus.candidates : [];
const statMap = new Map((corpus.sourceStats || []).map(item => [item.source, item]));
const weakCollections = new Set((plan?.collections || []).filter(item => Number(item.priority || 0) >= 55).map(item => item.id));

const adapters = SOURCE_ADAPTERS.map(adapter => {
  const stats = statMap.get(adapter.id) || {};
  const selected = candidates.filter(item => item.sourcePool === adapter.id);
  const discovered = Number(stats.discovered || 0);
  const highQuality = selected.filter(item => Number(item.score || 0) >= HIGH_QUALITY);
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
    ...publicAdapterRecord(adapter),
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

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  inputs: { corpus: CORPUS, coveragePlan: plan ? PLAN : null },
  policy: {
    note: 'Health measures adapter reliability and selected research value. Selection yield is not a literal duplicate rate because global balancing and corpus limits also affect final contribution.',
    highQualityThreshold: HIGH_QUALITY,
    weakCollectionPriorityThreshold: 55
  },
  summary: {
    registered: SOURCE_ADAPTERS.length,
    enabled: SOURCE_ADAPTERS.filter(item => item.enabled).length,
    responding: adapters.filter(item => item.runtime.ok).length,
    contributing: adapters.filter(item => item.yield.selected > 0).length,
    highValue: adapters.filter(item => item.health.status === 'high-value').length,
    needsRepair: adapters.filter(item => item.health.status === 'failed' || item.health.status === 'zero-yield').length,
    selectedCandidates: adapters.reduce((sum, item) => sum + item.yield.selected, 0),
    highQualityCandidates: adapters.reduce((sum, item) => sum + item.yield.highQuality, 0)
  },
  adapters
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: OUTPUT, summary: payload.summary, adapters: adapters.map(item => ({ id: item.id, status: item.health.status, score: item.health.score, selected: item.yield.selected, highQuality: item.yield.highQuality, weakCollections: item.yield.weakCollectionsServed })) }, null, 2));

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
function parseArgs(argv) { const output = {}; for (let index = 0; index < argv.length; index += 1) { const arg = argv[index]; if (!arg.startsWith('--')) continue; const key = arg.slice(2); output[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true; } return output; }
