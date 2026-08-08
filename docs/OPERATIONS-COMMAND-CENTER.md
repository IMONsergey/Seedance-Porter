# Operations Command Center

Operations Command Center is the top-level execution layer for Seedance Porter.

It does not create a new research model. It combines the state already produced by the lower layers and answers one operational question:

> What should I do next?

## Inputs

The Command Center reads the same machine-readable snapshots used elsewhere:

- `case-candidates.json`
- `case-review-queue.json`
- `coverage-plan.json`
- `source-health.json`

It also reads the protected curated runtime (`CASE_INTELLIGENCE + MULTI_SOURCE_CASES`) and browser-local unfinished work:

- `porterDeepReviewDraft:*`
- `porterDeepReviewMediaEvidence:*`
- `porterPromotionEditorial:*`

It does not write to any curated dataset.

## System health states

### `critical`

Used when a foundational invariant is broken:

- curated runtime is not exactly 100 cards;
- one or more core research-operations snapshots are missing.

### `attention`

Used when the system is operational but significant work is required:

- source adapters are failed/zero-yield;
- critical Collections exist;
- Research Corpus is far below operating minimum.

### `watch`

Used when the system is broadly stable but freshness/target work remains:

- snapshots are stale;
- Research Corpus is below the target but not severely starved.

### `healthy`

Core invariants, snapshots, research minimum, Collection pressure and source health are within the current operating thresholds.

A healthy system can still have useful queued work.

## Action priority model

Actions are sorted by numeric priority. Current high-level priorities:

- curated exact-100 contract drift: 100;
- missing snapshots: 96;
- unfinished Deep Review drafts: 94;
- failed/zero-yield source adapters: 91;
- critical Collection coverage: 90;
- Research Corpus target deficit: approximately 88–96 depending on deficit size;
- unfinished Promotion drafts: 84;
- stale snapshots: 76;
- shallow review queue: 72;
- high-priority (non-critical) coverage: 66;
- expand proven high-value source adapters: 63;
- continue normal strategic Deep Review queue: 58.

The exact weights live in `operations-engine.js` and are CI-tested.

## Finish current work before starting more

The Command Center deliberately gives unfinished Deep Review work a high priority.

Reason: starting more discovery/review while evidence drafts are already open creates work-in-progress inflation and reduces throughput.

The same principle applies to Promotion drafts, at a lower priority than unfinished evidence review.

## Pipeline cards

The top row exposes:

- Curated / 100;
- Research / operating minimum;
- strategic review queue size;
- local Deep Review drafts;
- local Promotion drafts;
- responding / enabled source adapters.

Each card routes to the relevant workspace.

## Prioritized actions

The action list is derived, not manually authored.

Examples:

- repair broken source adapters;
- finish local Deep Review drafts;
- increase corpus supply;
- review a queued candidate serving a critical Collection;
- refresh stale research snapshots;
- continue normal review when no urgent blocker exists.

Actions can route directly to:

- Industry Digest;
- Research Corpus;
- Sources / Coverage Planner / Source Health;
- Deep Review;
- Promotion.

When a queued candidate is known, the Command Center opens Deep Review directly on that candidate.

## Snapshot freshness

By default, a snapshot is considered stale after 168 hours (7 days).

Freshness is an operational signal only. A stale snapshot does not invalidate existing curated cases, but it means research planning may no longer reflect current source availability or coverage.

## Coverage pressure

The Command Center shows the top Coverage Planner priorities, but Coverage Planner remains authoritative for detailed Collection targets and backlog generation.

The Command Center should not duplicate that entire interface.

## Source health

The Command Center shows source adapters needing attention plus current high-value leaders.

Source Adapter Health remains authoritative for detailed yield/provenance metrics.

## Local work

The browser-local work panel separates:

- Deep Review drafts;
- Review Player companion timelines;
- Promotion drafts.

Media timeline presence is informational. It does not increase the priority of a candidate above a real unfinished Deep Review unless the core review draft also exists.

## Navigation architecture

`workspace-router.js` knows the Operations route and runs in capture phase before individual workspace handlers.

Operations is injected as the first sidebar navigation item, but Industry Digest remains the initial page load to avoid changing existing browser/render contracts unexpectedly.

A future release may make Operations the default landing view only after dedicated rendered-navigation tests are added.

## Safety boundaries

Operations Command Center cannot:

- mark a case deep-reviewed;
- check complete-video attestation;
- clear risk flags;
- approve rights/attribution;
- promote a case to curated;
- mutate `#digestGrid`;
- append to curated runtime arrays.

It is an execution router, not an approval authority.
