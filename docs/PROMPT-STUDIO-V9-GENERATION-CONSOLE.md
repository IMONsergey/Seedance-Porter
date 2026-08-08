# Prompt Studio v9 — Generation Console + Evaluation Loop

Updated: 2026-08-08  
Active PR: #48  
Status: release hardening

V9 turns Seedance Porter from a generation pipeline into a **production decision system**.

Before V9 the product already covered:

```text
research
→ structured prompt
→ references
→ Variables / Ingredients / Timeline
→ Storyboard
→ A/B Variants
→ provider-neutral Handoff
→ verified Seedance export
→ secure single/batch external execution
→ local Generation Results return
→ explicit continuation references
```

V9 adds the missing layer:

> What actually happened in the generated footage, which controlled change produced the best production result, and what exactly should happen next?

---

## 1. V9 loop

```text
V7/V8 Generation Results
  ↓
Generation Console
  ↓
explicit opt-in Preview
  ↓
structured human Evaluation
  ↓
Decision Readiness
  ↓
saved Comparison
  ↓
explicit human Winner + rationale
  ↓
┌─────────────────────────┬─────────────────────────┐
│ explicit continuation   │ evidence-driven Retake │
│ video / last frame @ref │ one named lever        │
└─────────────────────────┴─────────────────────────┘
  ↓
next controlled iteration
```

There is no provider execution in the V9 browser layer.

---

## 2. Existing source of truth remains canonical

V9 does not create another generation database.

It reads existing project state:

- V7 `generationResults`;
- V8 `generationBatchLinks`;
- V4 `variants` and frozen base/deltas;
- V7 generated-output provenance.

V9 stores only decision/evaluation extensions that reference canonical task/export lineage.

---

## 3. Extension state

### `generationEvaluations`

Maximum: 200 canonical records.

One canonical Evaluation per generation task.

Stores:

- task ID;
- export SHA-256;
- 13 dimension score objects;
- transparent `overallScore`;
- `ratedDimensions`;
- `evidenceDimensions`;
- `decisionReady`;
- Evaluation verdict;
- strengths;
- weaknesses;
- artifact flags;
- reviewer notes;
- timestamps.

Raw duplicate Evaluations are considered integrity errors by Decision Audit even though normalization can recover the newest canonical task record.

### `generationComparisons`

Maximum: 100.

Each saved Comparison contains:

- ID;
- label;
- 2–8 **unique succeeded visual generation task IDs**;
- timestamps.

Comparison does not copy result, evaluation or Variant payloads.

### `generationWinners`

Maximum: 100 keyed comparison decisions.

Winner stores:

- comparison ID;
- winning task ID;
- winning export SHA;
- required human rationale;
- selection timestamp.

Winner is not an Evaluation verdict.

### `generationRetakes`

Maximum: 100.

Retake Draft stores:

- source task/export;
- one canonical named production lever;
- explicit change instruction;
- expected improvement;
- retained locks;
- `status: draft`;
- timestamps.

It does not contain or apply a rewritten prompt.

---

## 4. Production Evaluation

V9 rubric has exactly 13 dimensions:

1. Task adherence
2. Identity consistency
3. Composition / framing
4. Camera behavior
5. Motion / action quality
6. Timing / shot readability
7. Continuity
8. Material / physics
9. Lighting / color
10. Graphics / text / logo
11. Audio fit
12. Artifact control
13. Production readiness

Each dimension supports:

- score 1–5 or unrated;
- reviewer note;
- evidence / observed frame, moment or behavior.

`overallScore` is the arithmetic average of **rated dimensions only**, rounded to two decimals.

It is:

- not an AI confidence score;
- not a provider metric;
- not a winner selector.

Evaluation verdict is one of:

- `candidate`;
- `retake`;
- `reject`.

There is deliberately no `winner` Evaluation verdict.

---

## 5. Decision Readiness

Winner decisions require minimum review coverage.

A saved Evaluation is `decisionReady:true` only when:

- at least **5** dimensions are rated;
- at least **3** dimensions contain note/evidence;
- `production-readiness` is explicitly rated.

The Console surfaces the coverage live:

```text
4.6 / 5
7 / 13 rated
5 evidence
production readiness rated
DECISION READY
```

These thresholds are Porter product rules, not ByteDance/ModelArk facts.

Full contract: `docs/V9-DECISION-READINESS.md`.

---

## 6. Explicit Review Preview

A serious evaluation tool must allow footage review without forcing tab hopping, but remote output should not silently load just because the project opened.

V9 therefore uses an **explicit opt-in preview**.

Initial state:

- no remote `<video>` DOM;
- no automatic media download;
- no autoplay.

After the user clicks `Preview` or explicitly opens `Evaluate` / `Retake` for a visual result:

```html
<video controls preload="none" playsinline ...>
```

Rules:

- `preload="none"` is required;
- autoplay is forbidden;
- preview can be closed, removing video DOM;
- last-frame remains an explicit safe external link;
- V9 JavaScript still contains no provider/media `fetch()` path.

This is a review UX feature, not a provider execution feature.

---

## 7. Generation Console

For each canonical Generation Result the Console shows:

- status;
- task ID;
- export SHA;
- V8 batch/Variant label when present;
- Evaluation score;
- rated/evidence coverage;
- Decision Readiness;
- explicit output links;
- explicit Preview;
- Evaluate/Review action;
- comparison selection for succeeded visual outputs.

Failed/cancelled/expired operational history stays visible but cannot enter visual comparison/winner decisions.

---

## 8. Variant-aware comparison

For V8 results, V9 derives:

```text
taskId
→ generationBatchLinks
→ variantId / variantHash
→ V4 normalized Variant
→ frozen-base delta
```

Runtime comparison view exposes:

- Generation Result;
- batch lineage;
- Variant identity;
- changed Variant controls/delta;
- Evaluation;
- overall score;
- review coverage;
- Decision Readiness;
- Winner state.

This answers:

> Which controlled change produced the better result?

rather than only:

> Which video looks nicer?

---

## 9. Human Winner

Winner selection requires all of the following:

- saved Comparison exists;
- candidate task belongs to it;
- candidate is a succeeded visual generation;
- task/export lineage still matches canonical Generation Results;
- candidate has a `decisionReady:true` saved Evaluation;
- user enters a non-empty human rationale;
- user explicitly clicks Winner.

No numeric threshold or highest-score rule automatically selects a winner.

Changing an Evaluation does not silently change Winner state.

Architecture decision: `docs/ADR-017-V9-HUMAN-WINNER.md`.

---

## 10. Winner → continuation

Winning output can explicitly reuse the existing V7 continuation path.

### Winner video

Creates a new stable reference:

- `mediaType: video`;
- `role: motion`;
- generated HTTPS URL;
- new `@refNN`;
- V7 generation provenance retained.

### Winner last frame

Only shown if the result actually has a last-frame URL.

Creates:

- `mediaType: image`;
- `role: first-frame`;
- `locked: true`;
- generated HTTPS URL;
- new `@refNN`;
- V7 provenance retained.

Winner selection alone never auto-attaches either output.

---

## 11. Evidence-driven One-Lever Retake

A Retake Draft may start only from:

- a succeeded visual generation;
- with a saved Evaluation;
- containing at least one rated dimension;
- containing at least one evidence-covered dimension.

It requires:

- exactly one named production lever;
- change instruction;
- expected improvement;
- at least one retained lock.

Canonical initial lever registry:

- objective
- subject
- environment
- composition
- camera
- action
- timing
- lighting
- materials
- style
- continuity
- constraints
- avoid
- references
- provider-settings
- other

Save does **not**:

- rewrite prompt sections;
- mutate references;
- create a Variant;
- call AI;
- submit paid generation.

Architecture decision: `docs/ADR-018-V9-ONE-LEVER-RETAKE.md`.

---

## 12. Canonical registries

To avoid UI/engine drift, V9 exports one canonical set for:

- `GENERATION_EVALUATION_VERDICTS`;
- `GENERATION_RETAKE_LEVERS`;
- `GENERATION_EVALUATION_DIMENSIONS`.

Console and Decision Audit consume these registries rather than maintaining independent hard-coded lists.

---

## 13. Decision Integrity Audit

`prompt-studio-generation-evaluation-audit.js` audits **raw + normalized** decision state.

Hard errors include:

- raw Evaluation missing task/export;
- invalid Evaluation verdict;
- duplicate raw Evaluation task;
- Evaluation export drift;
- non-succeeded visual decision source;
- invalid Comparison cardinality/duplicates;
- orphan Comparison tasks;
- Winner comparison-key mismatch;
- Winner outside Comparison;
- Winner task/export drift;
- empty Winner rationale;
- Winner without Decision Readiness;
- invalid Retake lever;
- Retake source/export drift;
- Retake without Evaluation evidence;
- Retake without instruction;
- Retake without expected improvement;
- Retake without retained locks;
- V8 batch lineage ↔ V7 history export drift.

A saved but incomplete Evaluation is reported as a warning, not silently upgraded.

Audit never auto-fixes or auto-selects.

---

## 14. Cross-layer staged-work safety

V9 cannot start or save a staged decision while these foreign layers are staged:

- V4 Storyboard;
- V5 Repair;
- V7 Generation Result;
- V8 Batch Result.

This applies to starting `Evaluate` / `Retake`, not only their Save buttons.

While a V9 Evaluation/Retake draft is dirty:

- project New / Duplicate / Import / Delete are blocked;
- project switch is blocked;
- source Fork is blocked;
- revision Restore is blocked;
- conflicting V4/V5/V7/V8 staged actions are blocked;
- V4 Storyboard field input/change is capture-blocked;
- V7/V8 result import inputs are capture-blocked;
- `porter-open-prompt-studio` event is blocked;
- direct public `window.porterPromptStudio.openSource()` is wrapped and blocked.

Ordinary prompt/reference edits inside the **same canonical project** are allowed because V9 Save reads the fresh project and overlays only its decision extensions.

If an external mutation cannot be intercepted, V9 visibly invalidates its unsaved draft rather than applying stale decision state.

---

## 15. Browser / security boundary

V9 keeps provider execution outside the browser.

Browser V9 contains no:

- provider `fetch()`;
- XHR submission;
- beacon submission;
- `ARK_API_KEY`;
- Authorization header;
- automatic paid request;
- automatic Winner;
- automatic output attachment;
- automatic prompt mutation.

Explicit preview is the only new remote-media review surface and remains opt-in/preload-none.

---

## 16. Public mutation boundary

All persisted V9 decisions use:

```text
window.porterPromptStudio.replaceProject(next, {
  snapshot: true,
  preserveIdentity: true,
  reason: ...
})
```

V9 does not access private Prompt Studio project state.

Evaluation, Comparison, Winner, Retake and winner-continuation are explicit revisioned actions.

---

## 17. Closed schema

`schemas/prompt-studio-generation-evaluation.schema.json`

Top-level `additionalProperties:false`.

Bounds:

- evaluations ≤ 200;
- comparisons ≤ 100;
- winners ≤ 100;
- retakes ≤ 100;
- comparison candidate count 2–8;
- bounded notes/evidence/list entries.

Schema stores transparent decision-readiness counters and required winner/retake fields.

---

## 18. Release architecture

One canonical V9 CI workflow:

`.github/workflows/prompt-studio-v9-ci.yml`

Node matrix:

- 20
- 22
- 24

It runs:

- TypeScript + Vitest;
- V4 baseline;
- V7 baseline;
- V8 baseline;
- V9 Evaluation/Readiness engine;
- V9 adversarial Decision Audit;
- V9 canonical Console JSDOM contract;
- V9 production/project-memory contract;
- central Pages module graph;
- protected exact-100 renderer;
- schema/memory parse;
- syntax checks.

Duplicate V9 preflight/release workflows and superseded draft UI tests were removed.

The **real** `.github/workflows/pages.yml` also runs all four V9 contracts before deployment and asserts V9 runtime assets exist in `_site`.

The external paid Batch Runner remains server-only and is never executed by Pages.

---

## 19. Protected invariants

V9 preserves:

- exactly 100 unique curated runtime cases;
- exactly 192 Porter Originals;
- no automatic curated mutation;
- no browser provider credential;
- no browser paid submission;
- no automatic generated-output attachment;
- no automatic Winner;
- no automatic Retake prompt mutation;
- extension-safe project persistence.

---

## 20. V10 handoff

V10 Production Memory + Learning must distinguish evidence classes:

- ordinary Evaluation;
- decision-ready Evaluation;
- Winner decision;
- Retake hypothesis;
- subsequent outcome.

It must never treat sparse/abandoned reviews as validated empirical knowledge.

V10 must also preserve epistemic source class:

- official ByteDance/BytePlus fact;
- Porter empirical observation;
- project/client-specific preference.

---

## Current product statement

With V9, Seedance Porter becomes:

**structured authoring + controlled variants + secure execution + returned generation history + explicit footage review + evidence-based human evaluation + auditable winner + controlled retake + explicit continuation.**
