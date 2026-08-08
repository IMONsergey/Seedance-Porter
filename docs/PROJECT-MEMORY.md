# Seedance Porter — Current Project Memory

**Status:** canonical current project memory  
**Updated:** 2026-08-08  
**Repository:** `IMONsergey/Seedance-Porter`  
**Completed release:** Prompt Studio v8 — Variant Batch Generation  
**NOW:** Prompt Studio v9 — Generation Console + Evaluation Loop

> Freshness rule: when this document has a later update date/phase than older phase markers in `PROJECT-CONTEXT.md`, `ROADMAP.md` or `PROJECT-STATE.json`, this document is the authoritative current transition record. The older files remain useful architectural/history references and should be compacted back into sync in the next maintenance pass.

## 1. Product mission

Seedance Porter is becoming a **production control system for AI video**, not a prompt gallery.

The product should connect:

```text
research/reference intelligence
  → structured creative intent
  → references and continuity locks
  → shot/timing plan
  → storyboard
  → A/B variants
  → provider-neutral handoff
  → verified Seedance provider export
  → secure external execution
  → generation results
  → evaluation
  → continuation/remix
  → accumulated production memory
```

The core value is repeatability: understand why a generation works, preserve useful constraints, compare variants, avoid accidental drift, and learn from accepted/failed output rather than repeatedly starting from prompt text alone.

## 2. Source of truth

GitHub is the durable source of truth.

Current memory layers:

- this file — latest human-readable transition state;
- `docs/PROJECT-MEMORY.json` — latest machine-readable transition state;
- `docs/PROJECT-CONTEXT.md` — broader architecture/product context;
- `docs/ROADMAP.md` — long-form roadmap/history;
- `docs/ARCHITECTURE-DECISIONS.md` — ADR history;
- `docs/PROJECT-STATE.json` — previous machine-readable phase state;
- feature-specific docs — implementation contracts and release hardening;
- PRs/commits — exact implementation history.

Chat history is not sufficient as a project record.

## 3. Completed production stack

### Research / curation

- Source Universe and multi-source research adapters;
- Research Corpus / candidate pipeline;
- Deep Review Workspace + evidence timeline;
- Promotion Workspace + quality gates;
- Coverage Planner / Source Health;
- Operations Command Center;
- Curated Rotation Planner / exact-100 guard.

Protected content invariants remain:

- exactly **100 unique curated runtime cases**;
- exactly **192 Porter Originals**.

### Prompt Studio v1

Structured prompt editor with canonical sections, source provenance, stable `@refNN`, Reference Manager, IndexedDB local assets, compile/lint and local AI staged patches.

### v2

Rule Packs / production profiles + public extension mutation API.

### v3

Variables, Ingredients, Shared Ingredient Library, Shot Timeline, extension-safe persistence.

### v4

Visual Storyboard, frozen-base/delta-only Variants, provider-neutral Generation Handoff, cross-draft guards.

### v5

Repair Center, reusable Blueprints, verified Seedance 2.0 ModelArk export adapter, provider preflight and no-browser-submit boundary.

### v6

First-class audio references through Reference Manager → Handoff → Seedance export.

### Secure external single-task Runner

Node-only execution path:

```text
submit → status → wait → conservative cancel → output download
```

`ARK_API_KEY` remains environment-only. No browser provider credential.

### v7

Generation Results return path:

```text
external job/result JSON
  → local staged import
  → validated generation history
  → explicit generated video / last-frame references
```

V7 production wiring was reconciled during V8:

- v7 bootstrap is actually mounted;
- staged-work guard is actually loaded;
- guard uses direct Storyboard/Repair state signals;
- single Runner manifests preserve safe Studio lineage;
- generation history is monotonic and same-task/export-hash conflict-safe;
- V7 is restored to Pages release gates.

### v8 — completed

Variant Batch Generation:

```text
selected v4 variants
  → independent materialization
  → per-item Handoff
  → per-item Seedance export
  → integrity-bound batch plan
  → external Batch Runner
  → resumable batch job
  → terminal batch result
  → V7 Generation Results
```

Key guarantees:

- max 20 planned variant items;
- local worker concurrency 1–8;
- local concurrency is not represented as provider account quota;
- browser performs zero paid provider submission;
- `submission-uncertain` paid POST outcome is never auto-retried;
- known provider task IDs resume without another POST;
- every persisted execution snapshot is protocol-valid/resumable;
- damaged existing batch job fails closed;
- explicit batch `create` refuses overwrite;
- job/result writes are temp-file → rename atomic;
- project / variant / export / task lineage is cross-checked;
- batch results return explicitly into V7 history;
- generated output attachment remains explicit.

Detailed V8 contracts:

- `docs/PROMPT-STUDIO-V8-BATCH-GENERATION.md`
- `docs/PROMPT-STUDIO-V8-RELEASE-HARDENING.md`

## 4. Non-negotiable invariants

1. GitHub is the durable source of truth.
2. Exact-100 curated runtime set stays protected until an explicit editorial migration changes it.
3. 192 Porter Originals stay protected until an explicit migration changes that invariant.
4. Browser Prompt Studio does not own provider credentials.
5. Browser does not automatically submit paid provider tasks.
6. Provider/API facts are source-dated and verified against first-party docs.
7. Provider-neutral core; provider-specific behavior at adapters/external execution boundary.
8. Prompt Studio mutations are explicit and revisioned.
9. Staged Storyboard/Repair/results cannot silently overwrite one another.
10. `@refNN` stays stable within a project.
11. Local binary media stays out of ordinary project JSON.
12. Generated output is never auto-attached as a new creative reference.
13. Ambiguous paid POST must fail closed; never automatic duplicate submission.
14. Corrupt resumable manifests must not be interpreted as missing.
15. Feature completion includes updating project memory and release contracts.

## 5. NOW — v9 Generation Console + Evaluation Loop

V8 solved multi-variant execution. The next problem is **production decision quality after generation**.

Today we can generate multiple candidates and return their results, but selection/evaluation remains too manual and disconnected from the source creative controls.

V9 goal: turn generation output into a structured review console where a producer can compare candidates, understand what changed, score quality, choose winners, and turn the winning evidence into the next iteration.

### V9 core surfaces

#### Generation Console

One operational view for:

- batch / task status;
- variant identity;
- model / resolution / ratio / duration;
- result URLs / local downloaded media state;
- warnings/errors;
- project / Handoff / export / task lineage;
- continuation references already created from a result.

The browser console remains read/import oriented unless a future explicit server connection is designed. Provider credentials do not move into the client.

#### Variant comparison

For each result show:

- variant label + variantHash;
- changed controls/sections vs frozen base;
- provider settings;
- resulting media;
- structured evaluation score;
- reviewer notes;
- winner status.

The user should be able to answer:

> Which change actually improved the output?

not merely:

> Which video looks nicer?

#### Evaluation rubric

Initial structured dimensions:

- prompt/task adherence;
- subject / identity consistency;
- composition/framing;
- camera behavior;
- motion/action quality;
- timing / shot readability;
- continuity across clip;
- material/physics quality;
- lighting/color;
- graphics/text/logo correctness when relevant;
- audio/dialogue/music fit when relevant;
- artifacts/failure severity;
- overall production readiness.

Scores should support explicit evidence/notes rather than opaque single-number ranking.

#### Winner → continuation

Winning result should be able to explicitly seed:

- generated video reference;
- generated last frame / first frame continuation;
- a new Variant delta;
- a Repair/retake task;
- a continuation project/shot.

No automatic attach or hidden prompt mutation.

#### Retake delta

V9 should help enforce:

> change one production lever at a time when diagnosing a weak generation.

A retake should explicitly state:

- retained locks;
- changed control(s);
- reason for change;
- expected improvement;
- source result/task lineage.

## 6. V9 exit criteria

V9 is complete when:

1. generated single/batch results can be viewed in a unified console;
2. each result is traceable to project → variant → Handoff → provider export → task;
3. results can be compared against frozen variant base/deltas;
4. reviewer can score structured production dimensions;
5. reviewer notes/evidence are stored extension-safely;
6. explicit winner selection exists;
7. winner can explicitly create continuation/reference/retake actions;
8. no provider credential enters the browser;
9. no output/reference mutation auto-applies;
10. existing V7/V8 history remains backward-compatible;
11. Node 20/22/24 + browser UI + Pages contracts exist;
12. exact-100 / 192 invariants remain green;
13. project memory is updated before merge.

## 7. V9 likely architecture

Suggested new extensions rather than core schema breakage:

```text
generationEvaluations[taskId]
generationWinners[comparisonId]
generationRetakes[retakeId]
```

Evaluation record should reference, not duplicate:

- taskId;
- exportHash;
- batch/variant lineage when present;
- reviewer dimensions;
- notes/evidence;
- winner / rejected state;
- timestamps.

Media binaries should not be duplicated into project JSON.

## 8. After V9

### V10 — Production Memory + Learning

Convert approved/rejected generations into reusable production intelligence:

- recurring failure signatures;
- prompt/control heuristics;
- successful reference-role patterns;
- camera/motion/material recipes;
- model/provider-specific empirical learnings;
- confidence/evidence attached to learned rules.

The system should distinguish:

- official provider fact;
- Porter empirical observation;
- user/project-specific preference.

### V11 — Multi-provider execution abstraction

Only after the single-provider production loop is mature:

- provider capability contracts;
- adapter parity matrix;
- execution provider selection outside the creative core;
- no silent downgrade of unsupported features.

### Parallel — Research Corpus 500–1000

Continue expanding source cases without degrading curation:

- adapters collect candidates;
- evidence/deep review validates;
- promotion gate selects;
- exact-100 curated runtime remains controlled through rotation.

## 9. Next implementation order

1. Create V9 branch from current `main`.
2. Build extension-safe evaluation engine/schema.
3. Build Generation Console over existing V7/V8 history.
4. Add comparison engine against v4 variant frozen base/deltas.
5. Add winner + retake model.
6. Add explicit continuation actions through public Prompt Studio API.
7. Add JSDOM/no-network/cross-draft guards.
8. Add production and Pages contracts.
9. Update current project memory in the same PR.

## 10. Current project state in one sentence

**Seedance Porter now has a complete structured authoring → verified export → secure single/batch execution → result-return loop; V9 turns that loop into an evidence-based creative evaluation and iteration system.**
