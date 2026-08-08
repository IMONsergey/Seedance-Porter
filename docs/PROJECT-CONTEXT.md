# Seedance Porter — canonical project context

Last updated: 2026-08-08

This file is the human-readable project memory for Seedance Porter. It is part of the source of truth and must be updated when architecture, product scope, invariants, current phase or major decisions change.

## Source of truth

The repository `IMONsergey/Seedance-Porter` is the canonical project source of truth.

Project memory is split across:

- `AGENTS.md` — mandatory operating contract for Codex/agents;
- `docs/PROJECT-CONTEXT.md` — product/architecture context and non-negotiable boundaries;
- `docs/ROADMAP.md` — current delivery plan and ordered future work;
- `docs/ARCHITECTURE-DECISIONS.md` — durable decisions and their rationale;
- `docs/PROJECT-STATE.json` — machine-readable current state;
- feature-specific docs — implementation contracts for individual subsystems.

Any substantial PR that changes architecture, current phase, provider behavior, safety boundaries or roadmap status must update the relevant project-memory files in the same PR.

## Mission

Seedance Porter is an AI-native production environment and prompt-intelligence system for getting reliably better practical output from ByteDance Seedance while keeping model facts, creative direction, provenance, provider execution and production memory separate and auditable.

It is not just a prompt gallery and not just an API wrapper. The intended product loop is:

`research → source intelligence → structured prompt authoring → references → timeline/storyboard → variants → provider handoff → external generation → result import → continuation/evaluation → reusable production memory`

## Product pillars

### 1. Prompt Intelligence

A source-attributed research layer for real production examples, patterns and reusable Porter-original structures.

Protected runtime invariants:

- exactly **100 unique curated cases** in the current curated runtime;
- exactly **192 Porter Originals**;
- source attribution and provenance remain visible;
- Research candidates do not automatically become curated cases;
- Research excerpts are never silently treated as Porter prompts;
- curated mutation is always explicit/editorial.

Research target remains **500–1000 reviewed source candidates**, organized into meaningful Collections rather than one undifferentiated corpus.

### 2. Prompt Studio

Local-first structured authoring environment with explicit production controls.

Current implemented generations:

- **v1** — structured 13-section Prompt Studio, source forks, stable `@refNN`, local Reference Manager, deterministic lint, local AI/deterministic editor, revisions and JSON project lifecycle;
- **v2** — public project mutation API and production Rule Packs;
- **v3** — Variables, Ingredients, Shared Ingredient Library and Shot Timeline with extension-safe persistence;
- **v4** — Visual Storyboard, immutable-base/delta-only Variants A/B and provider-neutral SHA-256 Generation Handoff;
- **v5** — Repair Center, Project Blueprints, stronger staged-work guards and verified Seedance 2.0 ModelArk export adapter;
- **v6** — extension-safe audio references through Reference Manager → Handoff → ModelArk export;
- **v7** — external Runner job/result return path, generation history, safe Studio lineage and explicit generated-video/last-frame continuation references.

Active work: **v8 Variant Batch Generation / Batch Runner**.

### 3. External generation execution

Provider submission is deliberately separated from browser Prompt Studio.

Current external ModelArk Runner supports:

- submit;
- status;
- resumable wait/poll;
- queued-only cancel;
- result manifest;
- output download without forwarding provider Authorization to output CDN.

Security boundary:

- `ARK_API_KEY` comes from environment only;
- browser Studio never submits to ModelArk;
- client-side provider keys are forbidden;
- raw provider credentials are never persisted into job/result manifests;
- provider/transport responses are treated as untrusted and secret values are redacted;
- terminal provider records are not silently deleted by `cancel`.

### 4. Research / review / curation operations

The repository also contains the operational pipeline around candidate intake, source health, Deep Review, evidence packages, Promotion and exact-100 curated rotation.

Promotion is evidence-gated; formally complete but weak Deep Review content is not sufficient. Curated changes remain protected by explicit editorial gates.

## Current repository state

Current production `main` baseline after Prompt Studio v7:

- commit: `d16d73841516d453def385a441365bf74dedc2c0`;
- exact curated runtime: 100 unique cases;
- Porter Originals: 192;
- Prompt Studio: v1–v7 production layers;
- secure external single-task ModelArk Runner: merged;
- current active development branch: `feat/prompt-studio-v8-batch-generation`.

The earlier initial 24-case digest remains historical release context; the protected runtime is now the exact-100 curated release.

## Prompt Studio canonical project boundaries

### Structured prompt sections

Canonical 13-section hierarchy:

1. objective
2. subject
3. environment
4. composition
5. camera
6. action
7. timing
8. lighting
9. materials
10. style
11. continuity
12. constraints
13. avoid

### References

Stable Studio references use `@refNN` tokens.

Core roles include identity, geometry, style, material, motion, camera, first-frame, last-frame, graphics, pattern, environment and other. Audio support is extension-safe and does not require a destructive core schema migration.

Rules:

- every reference has an explicit production job;
- missing referenced media blocks portable provider export;
- browser-local media can remain in IndexedDB but is not pretended to be portable;
- generated outputs can become references only through an explicit user action;
- generated-output provenance is stored separately from the reference core object.

### Staged-work model

Independent staged layers must never silently overwrite each other.

Examples:

- AI patches are staged before Apply;
- v3 production tools use staged drafts;
- Storyboard edits are staged;
- Repair proposals are staged;
- Generation Result import is staged before Save/Attach.

Cross-layer guards are required whenever two staged layers can mutate overlapping project state.

### Persistence

Prompt Studio is extension-safe by design. Unknown top-level project extensions must survive:

- save/load;
- revisions and restore;
- duplicate;
- JSON export/import.

New product layers should prefer extension fields over destructive schema rewrites unless a migration is genuinely necessary.

## Provider truth

First-party ByteDance/BytePlus documentation outranks community heuristics.

Verified Seedance 2.0 ModelArk profile currently encoded in Prompt Studio includes:

- model `dreamina-seedance-2-0-260128`;
- async task endpoint under BytePlus ModelArk;
- text/image/video/audio content mapping;
- image roles `first_frame`, `last_frame`, `reference_image`;
- video role `reference_video`;
- audio role `reference_audio`;
- duration 4–15 seconds or provider auto mode;
- supported ratios/resolutions as encoded by the dated profile;
- no assumed `seed`, `camera_fixed`, `frames`, `draft` or configurable `service_tier` support on the verified direct Seedance 2.0 profile.

Model/provider facts are dated facts. Before changing them, verify current first-party documentation and update verification metadata.

## Browser / server boundary

Browser Prompt Studio may:

- author projects;
- build provider-neutral Handoffs;
- build provider export JSON;
- inspect/copy/export execution artifacts;
- import local job/result manifests;
- attach validated generated output URLs explicitly as references.

Browser Prompt Studio must not:

- hold provider API credentials;
- submit paid provider generation requests;
- silently upload local reference media;
- automatically attach generated output;
- auto-publish to GitHub;
- mutate curated data.

External Runner may perform provider network execution, but must preserve the env-only credential boundary and resumable manifest contracts.

## UX principles

1. Explicit beats magical. High-impact mutations require an explicit Apply/Save/Attach/Promote action.
2. Show provenance. Source, reference jobs, provider lineage and output lineage should be inspectable.
3. Preserve user work. Cross-layer drafts must be guarded rather than silently replaced.
4. Fail closed on ambiguous paid execution. Unknown submission state must not cause automatic duplicate paid requests.
5. Local-first where practical. Project editing, references and history should work without introducing a cloud dependency by default.
6. One canonical project, multiple projections. Storyboard, Variants, Handoff, provider export and batch plan should be projections/derivatives, not competing hidden project copies.
7. Provider-neutral core, provider-specific edge. Creative authoring should not be rewritten around one API contract.

## GitHub workflow

For substantial changes:

1. branch from the actual current `main` SHA;
2. implement one coherent product slice;
3. add behavioral contracts and production wiring checks;
4. keep protected exact-100 / 192 invariants enabled;
5. update project context/roadmap/state when phase or architecture changes;
6. open a draft PR early enough for diff auditing;
7. remove temporary migration/finalizer scaffolding before merge;
8. verify branch is not behind `main`;
9. merge with exact head SHA, preferably squash for feature branches;
10. update `docs/PROJECT-STATE.json` to the resulting release state.

## Current active objective — Prompt Studio v8

V8 should connect existing v4 A/B Variants to safe external batch execution without moving provider execution into the browser.

Target loop:

`selected variants → independent materialization → provider exports → integrity-hashed batch plan → external concurrency-limited Batch Runner → resumable batch job → terminal batch result → import results back into v7 generation history`

Critical V8 rules:

- no browser provider requests;
- no client API key;
- plan max must remain bounded;
- local concurrency is configurable and must not be represented as an official provider quota;
- no automatic retry of ambiguous POST submission state;
- known task IDs may resume without another POST;
- batch result imports must validate every item before mutating project history;
- all successful per-item results must retain variant/export/Studio lineage;
- batch operational artifacts should be ignored by Git by default.

## Next strategic direction after v8

See `docs/ROADMAP.md`. The immediate sequence is to make generation at scale reliable before adding broader collaboration or cloud state. The next product focus should be generation observability/evaluation and a tighter learning loop from results back to future prompt/variant decisions.