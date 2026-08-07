# Coverage Planner 2.0

Coverage Planner is the strategic operations layer for Seedance Porter research.

It answers a different question from Case Intelligence:

- Case Intelligence: **what does this case teach us?**
- Coverage Planner: **what should we research/review next so the library becomes more useful and less biased?**

## Inputs

Planner combines four evidence layers:

1. **Curated coverage** — all cases currently present in the unified curated runtime (`CASE_INTELLIGENCE + MULTI_SOURCE_CASES`).
2. **Research supply** — safe deduplicated candidates from `case-candidates.json`.
3. **Review supply** — strategic Deep Review queue from `case-review-queue.json`.
4. **Local in-progress signal** — browser-local Deep Review drafts (`porterDeepReviewDraft:*`).

It also measures automated source-pool diversity.

## Default per-Collection targets

These targets are an operating floor, not a claim that every Collection is equally important forever.

- 5 curated cases;
- 15 safe research candidates;
- 6 research candidates with score >=70;
- 3 source pools;
- 4 candidates in the Deep Review queue.

The targets live in `DEFAULT_COVERAGE_TARGETS` and can be overridden by CLI/engine callers.

## Priority score

Each Collection receives a 0–100 operational priority based on deficits against the targets.

Default weights:

- curated depth deficit: 35%;
- research supply deficit: 25%;
- high-quality research deficit: 15%;
- source diversity deficit: 10%;
- review queue deficit: 15%.

Special starvation rules raise priority when a Collection has almost no research supply or no source diversity.

The score is **not a quality score for a case**. It is a backlog priority for research operations.

## Health levels

- `critical`: priority >=75;
- `high`: priority >=55;
- `medium`: priority >=35;
- `healthy`: priority <35.

A healthy Collection can still contain weak individual cases. A critical Collection can still have one excellent case. The metric describes coverage, not creative merit.

## Next-action state machine

Planner converts deficits into a recommended next action.

### `discover`

There are too few safe candidates. More source discovery is required before review throughput matters.

### `diversify-sources`

Candidate volume exists, but provenance is concentrated in too few source pools.

### `queue-for-review`

There are useful candidates, but not enough of them are in the Deep Review queue.

### `review-now`

The Collection has queued candidates and curated coverage is still below the floor.

### `finish-review`

A browser-local review draft already exists for a candidate serving the Collection. Finishing current work is preferred over starting new work.

### `expand-depth`

The curated floor is reached, but research/source depth can still improve.

### `maintain`

Operating floors are currently satisfied.

## Strategic candidate backlog

The planner builds a ranked candidate backlog across weak Collections.

Candidate value considers:

- candidate research score;
- source traceability;
- preview availability;
- Collection priority;
- whether the candidate is already queued;
- source-pool repetition penalty.

Risk-flagged candidates are excluded.

The greedy selection tries to avoid spending the entire backlog on one easily scraped source pool.

## Review queue integration

`build-case-review-queue.mjs` now consumes the shared Coverage Planner engine.

Critical change: curated coverage is calculated from the **full unified curated runtime**, not only the original 24 Case Intelligence cases.

Current queue selection therefore sees the same 100 curated cases protected by the rendered browser contract.

The generated queue records:

- target Collection;
- Collection priority;
- selection reasons;
- source traceability;
- source pool;
- strategic rank;
- evidence checklists.

Fallback capacity is filled by strong safe candidates with a source-pool repetition penalty.

## Machine-readable plan

Run:

```bash
npm run coverage:plan
```

This writes:

`studio/coverage-plan.json`

The baseline file does not know browser-local unfinished review drafts. The browser UI rebuilds the plan with local draft IDs and can therefore prefer `finish-review` where appropriate.

`npm run case:refresh` now generates candidates, strategic queue and coverage plan together.

## Browser UI

Coverage Planner is rendered below the existing Sources coverage audit and includes:

- system metrics;
- pipeline-state counts;
- per-Collection priority map;
- curated/research/70+/source-pool/queue counts;
- next action;
- ranked execution backlog;
- direct jump into Deep Review for already queued candidates;
- source-pool acquisition intelligence.

## Source-pool acquisition intelligence

For each automated pool, Planner reports:

- safe candidates;
- high-quality candidates;
- average research score;
- average traceability;
- preview coverage;
- number of Collections served;
- number of weak Collections served;
- acquisition value.

This helps decide which existing adapters deserve investment before blindly adding more sources.

## Workspace routing

As Porter gains more workspaces, each module must not maintain its own ever-growing list of views to hide.

`workspace-router.js` runs in capture phase before individual nav handlers and guarantees that one visible workspace does not overlap another.

This protects navigation between:

- Industry Digest;
- Porter Originals;
- Sources;
- Research Corpus;
- Deep Review;
- Promotion.

Future workspaces should extend the central route map rather than adding ad hoc cross-hiding logic.

## Evidence boundary

Coverage Planner can prioritize work. It cannot:

- mark a case deep-reviewed;
- clear a risk flag automatically;
- approve attribution/rights;
- promote a case to curated;
- mutate Industry Digest.

Those boundaries remain owned by Deep Review, Promotion and reviewed repository changes.
