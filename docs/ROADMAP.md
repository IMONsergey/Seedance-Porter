# Seedance Porter — living roadmap

Last updated: 2026-08-08

This is the ordered delivery plan for Seedance Porter. It is not a wishlist. The active phase, next phase and major decisions should be kept synchronized with `docs/PROJECT-CONTEXT.md` and `docs/PROJECT-STATE.json`.

## Product direction

The destination is a serious AI-native Seedance production environment that combines:

- source-attributed prompt/research intelligence;
- structured creative authoring;
- multimodal reference management;
- timeline/storyboard planning;
- reusable ingredients/blueprints;
- variants/A-B exploration;
- safe provider execution;
- batch generation;
- generation history and continuation;
- evidence-based evaluation;
- operational production memory.

The system should feel closer to an integrated creative production environment than to a prompt textarea or a provider dashboard.

## Completed foundation

### Research / curation operations

Implemented:

- curated runtime protected at exactly 100 unique cases;
- 192 Porter Originals;
- multi-source candidate corpus and Source Universe;
- Collections / coverage planning;
- Deep Review Workspace + evidence timeline;
- Final Evidence Package;
- Promotion Workspace;
- Deep Review Quality Auditor;
- Promotion Quality Gate;
- Curated Rotation Planner / swap guard;
- Operations Command Center;
- global Command Palette;
- workspace evidence bundles.

### Prompt Studio v1–v7

Implemented:

- v1 structured editor + Reference Manager + lint + staged AI;
- v2 public mutation API + Rule Packs;
- v3 Variables / Ingredients / Timeline;
- v4 Visual Storyboard / Variants / Generation Handoff;
- v5 Repair / Blueprints / verified Seedance 2.0 export;
- v6 audio references;
- secure external single-task ModelArk Runner;
- v7 Generation Results / lineage / continuation references.

## NOW — v8 Variant Batch Generation

Status: **active development**.

### Goal

Turn existing v4 A/B Variants into a safe multi-generation production workflow.

### Required deliverables

1. **Variant Batch Plan engine**
   - select 1–20 non-destructive variant projections;
   - materialize each independently;
   - build a separate verified Generation Handoff and Seedance provider export per item;
   - SHA-256 hash variant projection, provider export and full plan;
   - include project/variant/export lineage;
   - zero browser network execution.

2. **Prompt Studio v8 Batch UI**
   - variant selector;
   - explicit Build Plan;
   - plan readiness/errors/warnings per item;
   - local JSON download;
   - local batch-result import;
   - explicit Save Results to v7 generation history;
   - no automatic provider submit or result attachment.

3. **External Batch Runner**
   - Node-only;
   - environment-only `ARK_API_KEY`;
   - configurable local concurrency 1–8;
   - no claim that local concurrency equals provider quota;
   - persistent resumable batch job after every state transition;
   - per-item task lifecycle;
   - terminal batch result manifest;
   - optional queued-only batch cancellation.

4. **Duplicate-paid-request protection**
   - network failure during POST before task ID → `submission-uncertain`;
   - `submission-uncertain` must never auto-retry;
   - network failure after a known task ID → resumable/interrupted item;
   - resume uses the known task ID and must not submit another POST.

5. **Return path**
   - validate every batch result item locally;
   - successful per-item result uses the existing v7 generation-history format;
   - preserve `variantId`, `variantHash`, `exportHash`, `taskId` and Studio lineage;
   - monotonic history rules still apply.

6. **Production contracts**
   - Node 20/22/24;
   - plan engine behavioral tests;
   - Batch Runner mock-provider tests;
   - JSDOM V8 UI contract;
   - schema/runtime consistency;
   - Pages publishes browser V8 only;
   - server Batch Runner is never executed by Pages;
   - exact-100 / 192 remain protected.

### V8 exit criteria

V8 is complete only when:

- a real v4 variant set can deterministically create a ready batch plan;
- one mock batch can run with bounded concurrency and resume safely;
- ambiguous submit cannot produce an automatic duplicate POST;
- terminal results can return to v7 history;
- browser execution count remains zero;
- all temporary implementation scaffolding is removed;
- final PR is mergeable and not behind `main`;
- project memory files are updated to mark V8 completed and V9 active.

## NEXT — v9 Generation Console + Evaluation Loop

Purpose: turn generation history into a production decision system instead of a pile of files.

Planned scope:

- Generation Console across single + batch runs;
- project/variant/task lineage visualization;
- filter by status, model, variant, date and source project;
- normalized provider usage/cost fields where reliable provider data exists;
- side-by-side generated-output comparison without auto-fetching hidden media;
- explicit take scorecard;
- compare generated output against Storyboard / continuity / reference expectations;
- mark Winner / Reject / Retake;
- one-variable retake suggestions derived from the weakest measured dimension;
- winner can promote the associated Variant explicitly;
- rejected output remains in history, never silently deleted.

Safety:

- evaluation can recommend but not auto-rerun paid generation;
- no winner should mutate the project without explicit user action;
- provider usage/pricing is dated and must not be guessed.

## v10 Production Memory + Learning

Purpose: make accepted production decisions reusable across projects.

Planned scope:

- reusable successful prompt/reference/timeline patterns;
- observed failure taxonomy;
- per-model/provider empirical notes separate from first-party facts;
- accepted output end-state memory;
- continuation recipe generation from observed footage;
- per-collection production heuristics;
- project-level lessons and known-good locks;
- searchable local production memory.

Important boundary:

Empirical learning must never silently override first-party ByteDance/BytePlus rules. Official facts and Porter empirical findings remain visibly separated.

## v11 Multi-provider execution abstraction

Purpose: keep Prompt Studio provider-neutral while supporting multiple real execution routes.

Planned scope:

- one canonical Handoff;
- provider capability negotiation;
- comparable export previews;
- execution adapters with dated capability profiles;
- provider-specific incompatibility report;
- optional provider selection per batch item only when deterministic and explicit;
- no universal assumption that provider parameters are equivalent.

Promotion criterion for any provider/model:

- official/provider documentation verified;
- capability profile encoded;
- benchmark scenarios run;
- failure semantics understood;
- no secret/browser regression.

## v12 Research Corpus 500–1000 + stronger design intelligence

Parallel long-running track.

Goals:

- 500–1000 genuinely useful source cases;
- broader platform coverage beyond X/Twitter;
- better attribution and source health;
- more design/digital/brand/product-specific Collections;
- deduplication by production mechanism, not only URL/title;
- structured pattern extraction into Ingredients / Blueprints / benchmark recipes;
- no automatic promotion into exact-100 curated runtime.

## UX / product quality track

Runs continuously across all phases.

Targets:

- clearer visual hierarchy across Prompt Studio docks;
- stronger keyboard navigation and Cmd-K integration;
- fewer hidden states;
- consistent staged/apply semantics;
- reliable responsive desktop/tablet behavior;
- good empty/error/loading states;
- visible provenance and lineage;
- local-first recovery from refresh/crash;
- fast handling of large project histories without UI degradation.

## Security / reliability track

Permanent requirements:

- no committed secrets;
- no browser provider credential;
- no hidden paid network action;
- fail closed on ambiguous submission state;
- provider responses treated as untrusted;
- job/result artifacts exclude raw secrets;
- external signed output downloads do not receive provider Authorization;
- operational job/result/batch artifacts ignored by Git by default;
- destructive provider actions remain explicit and conservative.

## Research / provider verification track

Before changing any current model/provider fact:

1. verify a first-party ByteDance/BytePlus source when available;
2. record verification date;
3. encode capability change in one provider/profile registry location;
4. update relevant schemas/tests/docs;
5. run fixed regression/benchmark coverage;
6. do not describe third-party routers as official ByteDance API surfaces.

## Deferred until the production loop is stronger

Not immediate priorities:

- mandatory cloud account/state for Prompt Studio;
- team collaboration requiring a backend;
- auto-upload of local reference media;
- automatic paid generation from browser;
- automatic curation/publishing;
- broad social/community features.

These may be revisited after batch execution, evaluation and production memory are stable.