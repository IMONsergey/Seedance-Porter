export const SOURCE_ADAPTERS = Object.freeze([
  {
    id: 'youmind',
    label: 'YouMind OpenLab',
    stage: 'base',
    kind: 'github-corpus',
    priority: 5,
    enabled: true,
    upstream: 'https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts',
    provenance: 'creator-attributed where source links are published',
    rights: 'CC BY 4.0 repository; snapshot stores attribution + short excerpt only',
    expectedEvidence: ['prompt', 'creator/source link', 'preview where published']
  },
  {
    id: 'cyberbara',
    label: 'CyberBara Seedance Library',
    stage: 'base',
    kind: 'web-gallery',
    priority: 4,
    enabled: true,
    upstream: 'https://cyberbara.com/seedance-prompt-library',
    provenance: 'source/gallery attribution when exposed',
    rights: 'source-only discovery; snapshot stores short excerpt + attribution links',
    expectedEvidence: ['gallery entry', 'creator/source link where exposed', 'preview where exposed']
  },
  {
    id: 'seedance2prompt',
    label: 'Seedance2Prompt',
    stage: 'base',
    kind: 'web-gallery',
    priority: 4,
    enabled: true,
    upstream: 'https://www.seedance2prompt.com/prompts',
    provenance: 'editorial source metadata; creator must be verified before curation',
    rights: 'source-only editorial metadata; no mirrored full prompts',
    expectedEvidence: ['prompt detail page']
  },
  {
    id: 'lanshu',
    label: 'Lanshu Awesome AI Video Kit',
    stage: 'base',
    kind: 'github-corpus',
    priority: 3,
    enabled: true,
    upstream: 'https://github.com/cclank/lanshu-awesome-ai-video-kit',
    provenance: 'source-specific links where published',
    rights: 'snapshot stores short excerpt + source link only',
    expectedEvidence: ['curated prompt entry', 'source link where published']
  },
  {
    id: 'zerolu-awesome-seedance',
    label: 'ZeroLu Awesome Seedance',
    stage: 'augment',
    kind: 'github-corpus',
    priority: 5,
    enabled: true,
    upstream: 'https://github.com/ZeroLu/awesome-seedance',
    provenance: 'many entries preserve original X creator/post attribution',
    rights: 'MIT repository; third-party source attribution remains authoritative; snapshot stores short excerpt only',
    expectedEvidence: ['prompt', 'X source link', 'GitHub-hosted proof clip where published']
  },
  {
    id: 'awesome-ai-video-ads',
    label: 'Awesome AI Video-Ad Prompts',
    stage: 'augment',
    kind: 'original-github-corpus',
    priority: 5,
    enabled: true,
    upstream: 'https://github.com/LichAmnesia/awesome-ad-video-prompts',
    provenance: 'original authored collection',
    rights: 'CC BY 4.0 prompt collection; snapshot stores attribution + short excerpt only',
    expectedEvidence: ['prompt', 'local preview image where published', 'prompt landing page']
  },
  {
    id: 'marsoyang-seedance-prompts',
    label: 'Awesome Seedance Prompts CN',
    stage: 'augment',
    kind: 'github-corpus',
    priority: 4,
    enabled: true,
    upstream: 'https://github.com/marsoyang1/awesome-seedance-prompts',
    provenance: 'source-attributed X examples with local proof media',
    rights: 'source-attributed public repository; snapshot stores attribution + short excerpt only',
    expectedEvidence: ['prompt', 'X source link', 'local GIF/video preview']
  },
  {
    id: 'huyle-awesome-seedance',
    label: 'HuyLe Awesome Seedance Prompts',
    stage: 'expand',
    kind: 'github-corpus',
    priority: 5,
    enabled: true,
    upstream: 'https://github.com/HuyLe82US/awesome-seedance-prompts',
    provenance: 'curator-first collection with proof clips and original X source links',
    rights: 'MIT repository; third-party source attribution remains authoritative; snapshot stores short excerpt only',
    expectedEvidence: ['prompt', 'X creator/post', 'GitHub proof clip']
  },
  {
    id: 'astorie-seedance-source',
    label: 'Astorie / Martini Seedance Source Set',
    stage: 'expand',
    kind: 'github-source-set',
    priority: 4,
    enabled: true,
    upstream: 'https://github.com/astorie-ai/awesome-seedance-2-prompt',
    provenance: 'small source-verified set with original X posts and direct video links',
    rights: 'no standalone LICENSE file verified; source metadata + <=25-word excerpt only',
    expectedEvidence: ['X source post', 'direct source video where published', 'preview image']
  }
]);

export const SOURCE_ADAPTER_MAP = new Map(SOURCE_ADAPTERS.map(adapter => [adapter.id, adapter]));

export function getSourceAdapter(id) {
  const adapter = SOURCE_ADAPTER_MAP.get(id);
  if (!adapter) throw new Error(`Unknown source adapter: ${id}`);
  return adapter;
}

export function enabledSourceAdapters(stage = null) {
  return SOURCE_ADAPTERS.filter(adapter => adapter.enabled && (!stage || adapter.stage === stage));
}

export function publicAdapterRecord(adapter) {
  return {
    id: adapter.id,
    label: adapter.label,
    stage: adapter.stage,
    kind: adapter.kind,
    priority: adapter.priority,
    enabled: adapter.enabled,
    upstream: adapter.upstream,
    provenance: adapter.provenance,
    rights: adapter.rights,
    expectedEvidence: adapter.expectedEvidence
  };
}
