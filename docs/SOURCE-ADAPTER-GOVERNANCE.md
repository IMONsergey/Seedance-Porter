# Source Adapter governance

Seedance Porter should not maximize the number of crawlers. It should maximize **reliable attributed research value**.

## Admission rule

A new automated source adapter should normally satisfy all of these:

1. Stable public structure that can be parsed without browser automation or private credentials.
2. Real case/prompt inventory, not only a tool wrapper, API SDK, generic prompting guide or affiliate landing page.
3. Useful provenance: original creator/source link, original authored collection, or a clearly identified editorial source.
4. Enough production detail to map to at least one Porter Collection.
5. Rights/storage policy that permits Porter to store source metadata and a short excerpt without pretending to own the underlying material.
6. A realistic chance of contributing unique candidates after cross-source dedupe.

A large item count alone is not an admission criterion.

## Canonical registry

`scripts/source-adapter-registry.mjs`

The registry is the canonical inventory of automated source pools.

Parser implementations may remain in separate stages while the registry gives the rest of the system one stable view of acquisition infrastructure.

Current stages:

- `base` — original discovery adapters;
- `augment` — established attributed corpora merged after base discovery;
- `expand` — additional vetted source sets with independent parser modules.

## Current release: 9 adapters

### Base

1. YouMind OpenLab
2. CyberBara Seedance Library
3. Seedance2Prompt
4. Lanshu Awesome AI Video Kit

### Augment

5. ZeroLu Awesome Seedance
6. Awesome AI Video-Ad Prompts
7. Awesome Seedance Prompts CN

### Expand

8. HuyLe Awesome Seedance Prompts
9. Astorie / Martini Seedance Source Set

## Why HuyLe was admitted

`HuyLe82US/awesome-seedance-prompts` has:

- a large categorized Seedance prompt collection;
- GitHub-hosted proof clips;
- original X creator/post attribution for many entries;
- a repository LICENSE file (MIT);
- useful commercial, motion and cinematic coverage.

Caveat: repository licensing does not replace third-party creator attribution. The Porter snapshot therefore stores short excerpts + provenance and treats original source links as authoritative.

The corpus also contains named fictional IP. The expansion adapter uses the shared Research Risk Policy before candidates can reach strategic review queues.

## Why Astorie was admitted with stricter storage rules

`astorie-ai/awesome-seedance-2-prompt` contains a smaller high-signal set with:

- original X posts;
- direct source MP4 links for several cases;
- preview images;
- substantial shot/timeline prompts;
- explicit source credits.

A standalone repository LICENSE file was not verified during adapter review.

Therefore the adapter is deliberately **metadata/excerpt-only**:

- source URL;
- source video URL when published;
- creator attribution;
- preview reference;
- <=25-word excerpt;
- research classification/scoring metadata.

## Example of a rejected source

`seedance25api/awesome-seedance-2.5-prompt` was not admitted in this release.

Reason: its README mixes a very large prompt library with promotion of a specific API provider and broad model-spec claims, while creator-level provenance for the large example inventory is not strong enough for Porter’s source-first research layer.

This does not imply that every prompt in the repository is bad. It means the repository is a poor **automated evidence source** for this system.

## Shared Research Risk Policy

`scripts/research-risk-policy.mjs`

Automatic review/promotion routes flag dependency on:

- named fictional franchises/characters;
- branded characters;
- recognizable public figures / celebrity-style dependencies.

This is an operational safety/provenance filter, not a legal judgment.

Risky discovery material should not silently become a recommended production pattern.

## Health model

`source-health.json` is generated from:

- adapter registry;
- runtime `sourceStats`;
- final selected research candidates;
- Coverage Planner weak Collections.

For each adapter, health measures:

- runtime response;
- discovered inventory;
- selected contribution;
- high-quality contribution;
- average research score;
- average traceability;
- preview coverage;
- direct creator-source coverage;
- direct source-video evidence;
- Collection breadth;
- weak-Collection contribution.

## Selection yield is not duplicate rate

`selected / discovered` is shown as selection yield.

It must not be described as an exact duplicate rate because final contribution is also affected by:

- named-IP/public-figure risk filtering;
- cross-source URL dedupe;
- prompt-fingerprint dedupe;
- Collection balancing;
- global corpus size limit;
- higher-quality source winning a duplicate collision.

## Health statuses

- `high-value`
- `productive`
- `low-yield`
- `zero-yield`
- `dormant`
- `failed`

## Recommendations

- `expand-this-source` — strong provenance + high-quality yield + useful weak-Collection contribution.
- `keep-and-deepen` — healthy high-quality supply; keep harvesting/refining.
- `keep-monitoring` — useful but not currently a scaling priority.
- `improve-provenance-before-scaling` — candidate value exists but source traceability is too weak.
- `inspect-duplicates-risk-and-parser-quality` — upstream responds, but selected contribution is zero.
- `inspect-upstream-structure` — parser returns no discoveries.
- `repair-adapter` — runtime adapter failed.

## Scaling rule

Before adding the 10th, 11th or 20th source pool, inspect Source Adapter Health and Coverage Planner.

Prefer an adapter that fills current weak Collections or improves source diversity over an adapter that merely adds hundreds of near-duplicate cinematic prompts.

The system should become broader and more reliable, not merely larger.
