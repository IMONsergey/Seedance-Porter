# Prompt Studio v9 — Generation Console + Evaluation Loop

Updated: 2026-08-08

V9 turns the completed authoring/execution/result-return loop into a **production decision system**.

Before V9 the product could:

```text
research
→ structured prompt
→ references
→ timeline/storyboard
→ A/B variants
→ provider export
→ secure single/batch generation
→ local result return
→ continuation references
```

The missing layer was deciding systematically **why one generated take is better than another** and carrying that evidence into the next controlled iteration.

## 1. V9 production loop

```text
Generation Results (V7/V8)
  ↓
Generation Console
  ↓
structured Evaluation
  ↓
saved Comparison
  ↓
explicit human Winner
  ↓
┌─────────────────┬──────────────────────┐
│ explicit reuse  │ explicit Retake      │
│ video/last frame│ one changed lever    │
└─────────────────┴──────────────────────┘
  ↓
next controlled iteration
```

V9 does not add provider execution to the browser.

## 2. New extension-safe project state

V9 deliberately avoids a core project schema migration.

### `generationEvaluations`

Maximum 200 normalized evaluation records.

One canonical evaluation is upserted per generation task. It references:

- task ID;
- provider export SHA-256;
- 13 dimension scores;
- per-dimension note;
- per-dimension evidence/observation;
- verdict;
- strengths;
- weaknesses;
- artifact flags;
- reviewer notes;
- timestamps.

The generation result itself is not duplicated.

### `generationComparisons`

Maximum 100 saved comparisons.

A comparison stores only:

- comparison ID;
- label;
- 2–8 task IDs;
- timestamps.

The visible comparison is derived at runtime from canonical history, batch lineage, v4 Variants and evaluations.

### `generationWinners`

Winner state is separate from the numeric evaluation.

Keyed by comparison ID and stores:

- comparison ID;
- winning task ID;
- winning export hash;
- explicit human rationale;
- timestamp.

**No automatic winner selection exists.**

A high average score may be informative, but the system does not silently convert it into a production decision.

### `generationRetakes`

Maximum 100 Retake Drafts.

A Retake Draft stores:

- source task ID;
- source export SHA;
- exactly one named production lever;
- explicit change instruction;
- expected improvement;
- retained locks;
- `status: draft`;
- timestamps.

Saving a Retake Draft does **not** rewrite the prompt, create a Variant or submit generation.

## 3. Production evaluation rubric

V9 starts with 13 explicit dimensions, each scored 1–5 or left unrated.

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

- score;
- note;
- evidence / observed moment.

`overallScore` is a transparent arithmetic average of **rated dimensions only** and is rounded to two decimals.

It is not an AI confidence score and does not select the winner.

## 4. Generation Console

The V9 Console reads the existing V7/V8 production history.

For each result it surfaces:

- task ID;
- status;
- provider export SHA;
- batch/variant label when available;
- current evaluation score;
- safe external video/last-frame links;
- comparison selection.

Remote generated media is not embedded or automatically downloaded by V9. Existing output URLs remain explicit external links.

## 5. Variant-aware comparison

When a result came from V8, V9 follows:

```text
taskId
→ generationBatchLinks
→ variantId / variantHash
→ v4 normalized Variant
→ frozen-base delta
```

Comparison view derives:

- result record;
- batch lineage;
- variant identity;
- variant delta / changed controls;
- evaluation;
- overall score;
- winner state.

This is designed to answer:

> Which controlled change produced the better result?

rather than only:

> Which output looks nicer?

## 6. Explicit winner

Winner selection is a dedicated action on a saved comparison.

Rules:

- task must belong to that comparison;
- task/export lineage is persisted;
- rationale is stored separately;
- no score threshold auto-selects a winner;
- changing a score does not silently change the winner.

## 7. Winner → continuation

After a winner is selected, V9 can explicitly reuse existing V7 continuation actions.

### Winning video

Creates a new stable Prompt Studio reference:

- `mediaType: video`
- `role: motion`
- generated HTTPS video URL
- new `@refNN`
- V7 generated-output provenance retained.

### Winning last frame

Creates a new stable Prompt Studio reference:

- `mediaType: image`
- `role: first-frame`
- `locked: true`
- generated HTTPS last-frame URL
- new `@refNN`
- V7 generated-output provenance retained.

No output is automatically attached just because it became a winner.

## 8. One-lever Retake

The Retake workflow exists to reduce ambiguous experimentation.

Recommended rule:

> When diagnosing a weak generation, change one named production lever and explicitly preserve the successful locks.

Supported initial levers:

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
- provider settings
- other

Retake Draft records what should change; it does not apply the change automatically.

A later explicit action can turn the draft into a Variant/patch once that mutation path has its own safety contract.

## 9. Cross-layer staged-work safety

V9 mutating actions are blocked while another production layer has staged work:

- V4 dirty Storyboard;
- V5 staged Repair;
- V7 staged Generation Result;
- V8 staged Batch Result.

V9 also tracks its own dirty Evaluation/Retake draft.

While a V9 draft is dirty, capture-phase guard blocks project-changing actions such as:

- New / Duplicate / project import / delete;
- project switch;
- source Fork;
- revision Restore;
- mutations in V4/V5/V7/V8 layers.

User must Save or Discard the V9 draft first.

If the project changes through another external/public mutation despite the UI guard, V9 invalidates the unsaved draft visibly rather than applying it to a newer project state.

## 10. Browser security boundary

Generation Console must remain credential-free.

No V9 browser module may contain:

- provider `fetch` execution;
- XHR provider execution;
- beacon submission;
- `ARK_API_KEY`;
- Authorization headers;
- automatic result-media download.

V9 is a review/decision layer over already-returned result manifests.

## 11. Public mutation boundary

Every saved decision uses the existing public Prompt Studio API:

```text
window.porterPromptStudio.replaceProject(
  nextProject,
  {
    snapshot: true,
    preserveIdentity: true,
    reason: ...
  }
)
```

No private Prompt Studio state access.

Evaluation, Comparison, Winner, Retake and winner-continuation actions each create an explicit revisioned mutation.

## 12. Evaluation schema

V9 adds:

`schemas/prompt-studio-generation-evaluation.schema.json`

The schema is closed and models:

- max 200 evaluations;
- max 100 comparisons;
- winner map;
- max 100 Retake Drafts;
- 13 named dimension score structures;
- bounded notes/evidence;
- task/export hashes;
- one-lever retake semantics.

## 13. Release contracts

V9 release must verify:

### Engine

- 13 dimensions;
- score average math;
- task/export mismatch rejection;
- saved comparison 2–8 task bound;
- V8 batch → V4 variant lineage recovery;
- winner must belong to comparison;
- winner rationale persistence;
- explicit winner continuation reference;
- one-lever Retake Draft;
- no prompt rewrite from Retake save;
- extension persistence through core refresh.

### Browser UI

- zero `fetch` calls;
- no automatic `<video>`/`<img>` output embedding;
- revisioned evaluation save;
- revisioned comparison save;
- explicit human winner;
- explicit winner continuation;
- Retake Draft does not mutate sections;
- staged V4/V5/V7/V8 blocks;
- dirty V9 blocks core mutations;
- project mutation invalidates unsaved draft visibly.

### Production

- mount order `v7 → v8 → v9 → Cmd-K`;
- guard loaded before Console UI;
- browser/provider boundary preserved;
- schema closed;
- Pages module graph includes V9;
- project memory remains V9-current;
- exact 100 curated runtime cases;
- exact 192 Porter Originals.

## 14. What V9 intentionally does not do

V9 does not yet:

- run automated vision scoring of remote video;
- download generated video automatically;
- decide winners algorithmically;
- learn global rules from evaluations;
- automatically rewrite a prompt from Retake Draft;
- submit new paid generation;
- aggregate across multiple providers.

Those are separate future product decisions with different safety/data implications.

## 15. Next after V9

### V10 — Production Memory + Learning

Use accepted/rejected evaluations as evidence for reusable empirical production knowledge:

- recurring failure signatures;
- successful camera/motion/material recipes;
- reference-role patterns;
- model/provider-specific empirical rules;
- confidence + evidence;
- clear separation between official facts, Porter observations and project-specific preferences.

### V11 — Multi-provider execution abstraction

Only after the evaluation/learning loop is mature.

## 16. Current product state

With V9, Seedance Porter becomes:

**structured authoring + controlled variants + secure execution + returned generation history + evidence-based human evaluation + explicit winner/retake/continuation.**
