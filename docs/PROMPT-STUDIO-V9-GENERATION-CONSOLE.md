# Prompt Studio v9 — Generation Console + Evaluation Loop

Updated: 2026-08-08  
Active PR: #48  
Status: release hardening

V9 adds the production-decision layer after V7 Generation Results and V8 Variant Batch execution.

```text
returned generation history
→ explicit footage preview
→ structured human Evaluation
→ per-result Decision Readiness
→ comparison-wide Decision Readiness
→ explicit human Winner + rationale
→ explicit continuation OR evidence-driven Retake
→ later V10 learning
```

## Source of truth

V9 does not create another generation store. It references existing:

- V7 `generationResults`;
- V8 `generationBatchLinks`;
- V4 frozen-base/delta Variants;
- V7 generated-output provenance.

It stores only extension-safe decision state:

- `generationEvaluations` ≤ 200;
- `generationComparisons` ≤ 100;
- `generationWinners` ≤ 100;
- `generationRetakes` ≤ 100.

## Generation Console

The Console shows single and batch results together with:

- task/status/export lineage;
- V8 Variant label and exact changed controls when present;
- Evaluation score and review coverage;
- comparison membership;
- explicit preview/review actions.

Operational failed/cancelled/expired history remains visible but cannot enter visual Evaluation/Comparison/Winner decisions.

## Explicit footage preview

Initial Console render creates no remote video DOM.

Only an explicit `Preview`, `Evaluate` or `Retake` action may render:

```html
<video controls preload="none" playsinline>
```

Rules:

- no autoplay;
- `preload="none"` required;
- preview can be closed, removing video DOM;
- last frame remains an explicit external link;
- V9 JavaScript contains no provider/media `fetch`, XHR or beacon path.

This gives in-console review without background remote-media loading.

## 13-dimension Evaluation

1. task adherence
2. identity consistency
3. composition / framing
4. camera behavior
5. motion / action quality
6. timing / shot readability
7. continuity
8. material / physics
9. lighting / color
10. graphics / text / logo
11. audio fit
12. artifact control
13. production readiness

Each dimension supports:

- score 1–5 or unrated;
- note;
- evidence / observed frame, moment or behavior.

`overallScore` is the transparent average of rated dimensions only.

Evaluation verdict is only:

- `candidate`;
- `retake`;
- `reject`.

`winner` is deliberately not an Evaluation verdict.

## Per-result Decision Readiness

A saved Evaluation is `decisionReady:true` only when:

- at least 5 dimensions are rated;
- at least 3 dimensions contain note/evidence;
- production-readiness is rated.

The record persists:

- `ratedDimensions`;
- `evidenceDimensions`;
- `decisionReady`.

These thresholds are Porter product rules, not ByteDance/ModelArk facts.

## Comparison-wide Decision Readiness

A saved Comparison contains 2–8 unique succeeded visual results.

**Every candidate must be decision-ready before any Winner can be selected.**

The Console exposes:

```text
1 / 2 candidates decision-ready · review every candidate
2 / 2 candidates decision-ready · COMPARISON READY
```

No Winner button is enabled until the whole Comparison is ready.

This prevents asymmetric review where one preferred take is deeply evaluated while alternatives are barely inspected.

## Explicit human Winner

Winner requires:

- saved Comparison;
- every candidate decision-ready;
- selected task belongs to Comparison;
- task/export lineage remains canonical;
- non-empty human rationale;
- explicit user action.

No score or ranking automatically selects Winner.

### Candidate Evaluation versions are snapshotted

At Winner time, V9 stores an Evaluation snapshot for **every comparison candidate**:

- task ID;
- Evaluation ID;
- Evaluation updatedAt;
- score;
- verdict;
- rated/evidence counts;
- decision-ready flag.

Later Evaluation edits never rewrite the historical Winner.

Decision Audit emits `winner-evidence-drift` warning if current review state changed after the decision. Missing/malformed/incomplete snapshot set is a hard integrity error.

ADR: `docs/ADR-017-V9-HUMAN-WINNER.md`.

## Variant-aware comparison

For V8 result tasks:

```text
task ID
→ generationBatchLinks
→ variant ID/hash
→ normalized V4 Variant
→ frozen-base delta
```

The runtime comparison view derives exact changed controls, including section-level changes such as:

```text
section:camera
section:lighting
provider-settings
```

rather than only saying “sections changed”.

## Winner → explicit continuation

Winner selection alone attaches nothing.

Explicit actions reuse canonical V7 output attachment:

### Winner video

- `mediaType: video`;
- `role: motion`;
- stable new `@refNN`;
- V7 provenance preserved.

### Winner last frame

Only available when result has last-frame URL:

- `mediaType: image`;
- `role: first-frame`;
- `locked: true`;
- stable new `@refNN`;
- V7 provenance preserved.

## Evidence-driven One-Lever Retake

Retake source must be:

- succeeded visual generation;
- saved Evaluation exists;
- at least 1 rated dimension;
- at least 1 evidence-covered dimension.

Retake Draft requires:

- one named production lever;
- change instruction;
- expected improvement;
- at least one retained lock.

Canonical lever registry is exported by the engine and consumed by UI/Audit.

### Source Evaluation snapshot

Retake stores the Evaluation version that motivated the hypothesis:

- task ID;
- Evaluation ID;
- Evaluation updatedAt;
- score/verdict;
- rated/evidence counts;
- decision-ready flag.

Later source-review edits do not rewrite the Retake. Audit emits `retake-evidence-drift` warning.

Saving Retake does not:

- rewrite prompt sections;
- mutate references;
- create a Variant;
- call AI;
- submit paid generation.

ADR: `docs/ADR-018-V9-ONE-LEVER-RETAKE.md`.

## Decision Integrity Audit

`prompt-studio-generation-evaluation-audit.js` audits raw + normalized state.

Hard errors cover:

- raw Evaluation missing/invalid task/export/verdict;
- duplicate raw Evaluations;
- Evaluation ↔ Result drift;
- invalid Comparison task set;
- orphan/non-succeeded Comparison tasks;
- Winner comparison-key mismatch;
- Winner outside Comparison;
- Winner task/export drift;
- empty rationale;
- Comparison no longer decision-ready;
- Winner evidence snapshot set/shape errors;
- invalid Retake lever;
- Retake source/export drift;
- missing/thin source Evaluation;
- missing instruction/expected improvement/locks;
- invalid/mismatched Retake source Evaluation snapshot;
- V8 batch lineage ↔ V7 history drift.

Warnings cover legitimate historical evidence evolution:

- saved Evaluation not yet decision-ready;
- `winner-evidence-drift`;
- `retake-evidence-drift`.

Audit never auto-fixes, auto-selects or mutates decisions.

## Cross-layer staged-work safety

V9 cannot **start or save** decision work while these are staged:

- V4 Storyboard;
- V5 Repair;
- V7 Generation Result;
- V8 Batch Result.

While V9 Evaluation/Retake draft is dirty:

- New / Duplicate / Import / Delete are blocked;
- project switch is blocked;
- source Fork is blocked;
- revision Restore is blocked;
- conflicting V4/V5/V7/V8 actions are blocked;
- Storyboard field staging is capture-blocked;
- V7/V8 import input staging is capture-blocked;
- `porter-open-prompt-studio` is blocked;
- direct public `window.porterPromptStudio.openSource()` is wrapped and blocked.

Ordinary edits inside the same canonical project remain allowed because V9 Save reads the fresh project and overlays only decision extensions.

Uninterceptable external project replacement invalidates the unsaved V9 draft visibly.

## Security boundary

V9 browser has no:

- provider credential;
- paid provider submit;
- Authorization header;
- provider `fetch` / XHR / beacon;
- automatic generated-output attachment;
- automatic Winner;
- automatic Retake prompt mutation.

## Schema

`schemas/prompt-studio-generation-evaluation.schema.json`

Closed top-level schema.

It includes a closed `decisionSnapshot` used by:

- Winner `candidateEvaluations` (2–8);
- Retake `sourceEvaluation`.

## Release architecture

One canonical V9 CI workflow:

`.github/workflows/prompt-studio-v9-ci.yml`

Node matrix:

- 20
- 22
- 24

It runs V4/V7/V8 baselines plus V9:

- Evaluation/readiness engine;
- adversarial Decision Audit;
- canonical Generation Console JSDOM contract;
- production/project-memory contract;
- central Pages module graph;
- exact-100 renderer;
- schema/state parsing;
- syntax checks.

The real `.github/workflows/pages.yml` runs all V9 contracts before deploy and asserts V9 browser assets exist in `_site`.

External paid Batch Runner remains server-only.

## Protected invariants

- exactly 100 unique curated runtime cases;
- exactly 192 Porter Originals;
- no automatic curated mutation;
- no browser provider credential;
- no browser paid submission;
- no automatic generated-output attachment;
- no automatic Winner;
- no automatic Retake prompt mutation;
- extension-safe persistence.

## V10 handoff

V10 Production Memory + Learning should consume this stable evidence graph:

```text
controlled Variant delta
→ generated result
→ Evaluation version
→ Comparison-wide review
→ Winner evidence snapshot OR Retake source snapshot
→ later outcome
```

It must distinguish:

- official ByteDance/BytePlus facts;
- Porter empirical observations;
- project/client-specific preferences.

Sparse/abandoned reviews must never become validated production knowledge.

## Current product statement

**Seedance Porter v9 = structured authoring + controlled variants + secure execution + returned history + explicit footage review + comparison-wide evidence gating + auditable human winner + controlled one-lever retake + explicit continuation.**
