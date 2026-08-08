# Curated Rotation Planner

Seedance Porter keeps a fixed curated runtime of **exactly 100 cases**.

Promotion therefore cannot become an append-only pipeline. A new approved case should enter the curated library only when it creates enough strategic value to justify removing an existing case.

Curated Rotation Planner performs that comparison.

## Core invariant

```text
100 current curated cases
+ 1 incoming Curation Draft
- 1 editor-approved replacement
= 100 curated cases
```

The planner only recommends. It does not implement the swap.

There is no automatic Replace / Publish action.

## Inputs

The planner uses:

- current `CASE_INTELLIGENCE` runtime;
- current `MULTI_SOURCE_CASES` runtime;
- `coverage-plan.json` when available;
- an exported Promotion Curation Draft;
- matching Research Corpus candidate metadata when available.

The current runtime must contain exactly 100 unique cases. Otherwise the analysis is blocked.

## Incoming strategic gain

The incoming case receives strategic value from several independent signals.

### Collection coverage

Higher gain when the case serves:

- a Collection below target;
- a high-priority Collection;
- a critical Collection.

### Source-platform diversity

A source platform absent or rare in the current top-100 gets more value than another case from an already dominant source family.

### Creator diversity

A new creator can add more strategic value than another case from a heavily represented creator.

### Evidence maturity

A genuinely `deep-reviewed` incoming case receives additional value because observed full-video evidence is more useful than prompt-derived evidence.

### Curation readiness

Promotion readiness, source traceability and design score contribute but cannot independently force a swap.

### Independent Porter adaptation

A substantial independently written adaptation adds value. Source wording is not treated as the adaptation.

### Editorial completeness

When editorial checks are present and complete, the planner has more confidence in the incoming draft.

## Removal cost

Every existing curated case receives a removal penalty.

### Collection rarity

Removing the only or one of very few examples in a Collection is expensive.

The cost rises further if removal would push that Collection below its target.

### Source-platform diversity loss

Removing the only case from a source platform carries a penalty.

### Creator diversity loss

Removing the only case from a creator carries a penalty.

### Evidence maturity

Removing a `deep-reviewed` incumbent costs significantly more than removing an unknown / lightly reviewed case.

### Design quality

Higher design relevance increases removal cost.

### Featured editorial status

Featured cases receive an additional penalty.

## Redundancy bonus

Some removals are strategically less damaging because the incumbent is redundant.

Signals include:

- strong Collection overlap with the incoming case;
- heavily represented source platform;
- repeatedly represented creator;
- incoming case is a clear design-quality upgrade;
- incumbent primarily serves already over-covered Collections.

This is a bonus to the swap comparison, not a reason to call an existing case bad.

## Net strategic value

For each possible existing case:

```text
net strategic value
= incoming strategic gain
+ redundancy bonus
- removal penalty
```

The engine ranks all 100 possible removals and returns:

- best replacement candidate;
- up to five alternatives;
- projected Collection deltas;
- warnings;
- decision status;
- confidence level.

## Decisions

### `blocked`

The analysis input is invalid, for example the current curated runtime is not exactly 100 or the incoming candidate is already curated.

### `hold`

The new case does not create enough strategic value to justify a replacement, or comparison confidence is too low.

### `editorial-review`

There may be an upgrade, but the margin is not strong enough for a confident swap recommendation.

### `consider-swap`

The strongest replacement produces a substantial positive net strategic gain without creating a known Collection deficit.

Even `consider-swap` still requires human editorial approval.

## Projected Collection deltas

For every replacement candidate, the report shows Collection counts before/after the hypothetical swap.

Examples:

```text
Beauty 2 → 3
Packshot 1 → 2
Camera 18 → 17
```

A warning is emitted when a swap would create a target deficit.

## Protected incumbents

The planner deliberately makes several cases difficult to replace:

- sole/rare representation of a critical Collection;
- sole source-platform representation;
- sole creator representation;
- `deep-reviewed` evidence;
- strong design relevance;
- featured editorial cases.

This prevents a simplistic “replace the lowest score” policy.

## Confidence

Confidence increases when the planner has:

- exact current 100-case runtime;
- Coverage Plan;
- source URL;
- incoming Collections;
- deep-review evidence;
- completed editorial gate;
- independent adaptation.

Low-confidence analysis never recommends an automatic swap.

## Promotion UI

Curated Rotation Planner is mounted inside Promotion after the normal Promotion workspace.

Workflow:

1. complete Deep Review;
2. create/export Curation Draft in Promotion;
3. paste/upload that Curation Draft into Rotation Planner;
4. inspect decision, confidence and incoming strategic gain;
5. inspect recommended replacement + alternatives;
6. inspect projected Collection deltas/warnings;
7. open existing candidate cases in the normal Digest drawer;
8. manually decide whether a repo-level exact-100 swap should be implemented.

## CLI

```bash
node scripts/build-rotation-plan.mjs \
  --draft path/to/curation-draft.json \
  --coverage studio/coverage-plan.json \
  --corpus studio/case-candidates.json \
  --output rotation-plan.json
```

Coverage/corpus are optional. Missing comparison context lowers confidence instead of inventing data.

## Output

Kind:

```json
{
  "kind": "seedance-porter-curated-rotation-plan",
  "invariant": {
    "curatedSize": 100,
    "autoSwap": false,
    "autoPublish": false
  },
  "doNotAutoReplace": true
}
```

The report is an editorial decision artifact, not a curated implementation patch.

## What the planner cannot do

It cannot:

- append a 101st curated case;
- remove an existing curated case;
- modify `INDUSTRY_DIGEST`;
- modify `MULTI_SOURCE_CASES`;
- rewrite or append `#digestGrid`;
- clear evidence/risk gates;
- approve rights/attribution;
- publish a case.

The actual swap remains a separate reviewed GitHub change protected by the exact-100 renderer contract.
