# Case Intelligence workflow

Seedance Porter separates **source discovery**, **prompt anatomy** and **observed visual review**. This prevents prompt interpretation from being presented as if it were direct observation of the generated video.

## State machine

`candidate -> prompt-reviewed -> deep-reviewed -> curated`

### Candidate

A real public source entry has been discovered, canonicalized and deduplicated. Candidate metadata may contain title, creator/source label, source URL, archive URL, preview, a short excerpt, likely Collections and a research score.

Candidate means only: **worth investigating**. It is not a recommendation and does not enter the curated Digest.

### Prompt-reviewed

A reviewer has inspected the published prompt/source material and documented shot/beat functions, requested framing/camera behavior, subject/object action, reference jobs, causal hypotheses, signature move, rhythm/motion language, transferable pattern and likely failure modes.

This state must remain visibly labeled as prompt-derived evidence when the complete generated video has not been watched.

### Deep-reviewed

The complete source video has been visually inspected. Record what is actually visible rather than assuming the model followed the prompt.

Required evidence includes actual shot boundaries, framing, camera behavior, subject/object motion, transitions, pacing, material/physics behavior, continuity successes/failures, visible artifacts, prompt-following gaps, verified signature move and observed reasons the result works or fails.

Only this state may claim **“the video works because…”** as observed evidence.

### Curated

A deep-reviewed case can enter the main Digest when it additionally has useful attribution, meaningful design/commercial/motion value, at least one Collection, a reusable production pattern separable from source subject matter, and an independently written Porter adaptation.

## Collections

The taxonomy contains 30 Collections.

**Digital / Design:** Website Hero, SaaS UI, App Launch, Dashboard, Case Study Motion, Brand Reveal, Rebranding Transition, Logo Motion, Kinetic Type, Interactive / Web3D.

**Commercial:** Packshot, Beauty, FMCG, Food, Automotive, Fashion, Sports, Luxury, Electronics, Real Estate.

**Motion language:** Camera, Transitions, Morphs, Macro, Material, Loop, Freeze, Scale, Match Cut, First / Last Frame.

A case may belong to several Collections. Membership describes what is reusable about the production pattern, not merely nouns found in the prompt.

## Unified research refresh

Run:

```bash
npm run case:refresh
```

The current pipeline performs seven operational stages:

1. Base discovery from public source adapters.
2. Attributed augmentation from additional public corpora.
3. Expansion from vetted source sets added through the adapter registry.
4. Final cross-source dedupe + named-IP/public-figure risk enforcement + Collection balancing.
5. Strategic Deep Review queue generation from the full unified 100-case curated baseline.
6. Coverage Planner snapshot generation.
7. Source Adapter Health snapshot generation.

Generated runtime snapshots:

- `studio/case-candidates.json`
- `studio/case-review-queue.json`
- `studio/coverage-plan.json`
- `studio/source-health.json`

The snapshot stores attribution, source links, preview/video references where available, scoring metadata and short excerpts. It does **not** mirror whole third-party prompt collections into Porter.

## Source Universe vs automated source adapters

The browser Source Universe currently maps **31 useful platforms/source families** for manual discovery, curation and source attribution. That number must not be confused with automated crawlers.

The automated Research Corpus currently registers **9 real source pools**:

### Base

- YouMind OpenLab
- CyberBara Seedance Library
- Seedance2Prompt
- Lanshu Awesome AI Video Kit

### Augment

- ZeroLu Awesome Seedance
- Awesome AI Video-Ad Prompts (`LichAmnesia/awesome-ad-video-prompts`)
- Awesome Seedance Prompts CN (`marsoyang1/awesome-seedance-prompts`)

### Expand

- HuyLe Awesome Seedance Prompts (`HuyLe82US/awesome-seedance-prompts`)
- Astorie / Martini source set (`astorie-ai/awesome-seedance-2-prompt`)

The Astorie adapter is intentionally metadata/excerpt-only because a standalone repository LICENSE file was not verified. HuyLe has a verified repository MIT LICENSE, but third-party creator/source attribution remains authoritative for collected community material.

New adapters should be added only when a source has a stable public structure and useful provenance. A source being easy to scrape is not enough.

## Source Adapter Registry

Canonical adapter metadata lives in:

`scripts/source-adapter-registry.mjs`

Every adapter declares:

- stable ID;
- label;
- pipeline stage;
- source kind;
- priority;
- enabled state;
- upstream URL;
- provenance expectation;
- rights/storage policy;
- expected evidence types.

The registry is deliberately separate from parser implementation. It gives CI, Pages, health reporting and future agents one canonical map of acquisition infrastructure without forcing a risky rewrite of already stable parser code.

## Research risk policy

`scripts/research-risk-policy.mjs` centralizes named fictional IP, branded-character and public-figure dependency checks for new source expansion and future adapters.

Automatic review/promotion queues must exclude candidates that depend on protected named characters/franchises or recognizable public figures.

The expansion stage also re-checks existing snapshot title/author/excerpt text so the policy can retroactively remove obvious risky candidates that slipped through older narrower filters.

Risk policy is a routing safeguard, not a legal determination.

## Source Adapter Health

Run:

```bash
npm run source:health
```

Health combines runtime source stats with the final selected candidate corpus and Coverage Planner weak-Collection data.

For each adapter it reports:

- runtime success/failure;
- discovered items;
- selected contribution after global processing;
- selection yield;
- high-quality candidate count/rate;
- average research score;
- average source traceability;
- preview coverage;
- direct creator-source coverage;
- direct source-video count;
- Collections served;
- weak Collections served;
- health score/status;
- acquisition recommendation.

**Selection yield is not called duplicate rate.** Final contribution is also changed by risk filtering, cross-source dedupe, Collection balancing and the global corpus limit.

Recommendations include:

- `expand-this-source`
- `keep-and-deepen`
- `keep-monitoring`
- `improve-provenance-before-scaling`
- `inspect-duplicates-risk-and-parser-quality`
- `inspect-upstream-structure`
- `repair-adapter`

The Sources UI renders the same data in Source Adapter Health directly below Coverage Planner.

## Corpus target and partial snapshots

The operating target remains **500–1000 deduplicated research candidates**. This is a research corpus target, not a promise that 500–1000 cases are curated.

If automated sources temporarily produce fewer than 500 safe unique candidates, Pages may publish a partial snapshot so Research Corpus, Deep Review, Coverage Planner and Source Health remain useful. The target must stay visible; partial data must never be presented as a completed 500+ corpus.

## Deep Review queue

The queue is generated from the final combined corpus and the Coverage Planner engine. Curated coverage is calculated from the full unified curated runtime, not only the original 24 Case Intelligence cases.

Every queue item carries prompt-anatomy and visual-review checklists plus target Collection, strategic priority, source pool and source traceability.

Critical evidence rule: **do not mark a case `deep-reviewed` until the complete source video has actually been watched.** Prompt text, metadata, a thumbnail, GIF preview or source description are insufficient.

## Research Corpus browser

Research Corpus remains separate from Industry Digest.

- Industry Digest = curated production examples.
- Research Corpus = discovery candidates that still need review.

The candidate layer has independent search, Collection, source-pool and research-score filters and paginates the large corpus instead of injecting candidates into the curated renderer. The exact 100-card curated DOM contract remains independently CI-validated.

## Use this pattern for my project

The Pattern Adapter keeps shot function, information hierarchy, camera/motion logic, causal structure and the signature mechanism while replacing source subject matter.

It must discard source-specific character identity, product/trademark, incidental location, distinctive wording and unsupported generated typography/logo assumptions.

Reference URLs or local paths and exact-lock notes can be written into the generated Porter project. The static GitHub Pages tool does not upload assets or spend credits. Run generated JSON through the authoritative local Porter validation/compliance gate before paid generation.
