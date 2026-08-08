# Prompt Studio v8 — release hardening log

Date: 2026-08-08
PR: #46
Branch: `feat/prompt-studio-v8-batch-generation`

This document records production defects and architecture mismatches found while reconciling V8 against the **actual GitHub main branch**. These findings are durable project context: future refactors must not reintroduce them.

## Why this log exists

V8 started only after checking the real repository state. That reconciliation found that several V7 capabilities described in earlier PR context were not fully wired into the merged production shell/contracts.

The rule going forward is explicit: feature completion is based on the actual GitHub tree and executable/static contracts, not on conversation history or previous PR prose alone.

## Reconciled V7 production debt

### V7 bootstrap was not mounted in the production sidebar

Actual `main` mounted v6 and then Cmd-K. V7 files existed but `studio/sidebar.js` did not import `prompt-studio-v7-bootstrap.js`.

V8 PR fixes the production order to:

```text
v6 → v7 → v8 → Cmd-K
```

### V7 workflow guard existed but was not loaded

`prompt-studio-v7-workflow-guard.js` existed but the V7 bootstrap only imported Results UI.

The bootstrap now imports the capture-phase guard **before** Results UI.

### V7 guard used stale/heuristic staged-state selectors

The older guard attempted to infer foreign staged state from disabled controls.

The production system already exposes direct state signals:

- Storyboard: `#studioV4Dock [data-v4-dirty="true"]`
- Repair: `#studioV5Dock[data-repair-staged="true"]`

V7 guard and JSDOM contract now use those direct signals.

### Single-task Studio lineage stopped at provider export

Provider export already contained safe `studioLink`, but the external Runner transport did not persist it into job/result manifests.

A narrow manifest-boundary helper now copies only:

- `projectId`
- `projectUpdatedAt`
- `handoffHash`

The public Runner CLI applies this boundary after submit and before result persistence. Low-level provider transport remains provider-focused.

Single job/result schemas now allow this optional, closed lineage object.

### V7 generation history was not actually monotonic

The previous save path could replace a stronger terminal result with a stale queued job carrying the same task ID.

Canonical generation history now ranks records and refuses downgrade:

- result artifact outranks job artifact;
- terminal outranks non-terminal;
- succeeded is strongest within the same artifact class.

The same task ID with a different provider export SHA-256 is rejected as a lineage conflict.

### V7 was absent from the Pages release gate

Pages previously stopped at v6 even though v7 was merged.

V8 PR restores v7 engine/UI/production contracts and v7 assets to the pre-deploy graph.

## V8 browser hardening

### MutationObserver render loop

Initial V8 mount logic rendered whenever any DOM mutation occurred. Because `render()` itself changed `innerHTML`, it could schedule itself indefinitely through `MutationObserver` microtasks.

Current mount is idempotent:

```text
if #studioV8BatchDock exists → return
```

Rendering happens on initial mount and explicit state/project events, not on every observed mutation.

### Provider execution remains outside the browser

V8 browser code may:

- materialize selected variants;
- build Handoffs;
- build verified provider exports;
- build/download a batch plan;
- import a local batch result;
- explicitly save validated results into v7 history.

V8 browser code must not contain a paid ModelArk execution path, provider key, automatic result media fetch or automatic result attachment.

## V8 lineage hardening

SHA integrity is not the only check.

Batch-plan validation also cross-checks:

- provider export Studio project ID = batch plan project ID;
- provider export Studio project version = batch plan project version;
- Handoff hash shape is valid.

Batch-result validation cross-checks:

- terminal v7 result task ID = batch item task ID;
- terminal v7 result status = batch item status;
- terminal v7 result export hash = batch item export hash;
- result Studio project ID/version = batch result project ID/version;
- top-level batch status matches item statuses.

This prevents a self-consistent but semantically mixed manifest from being accepted simply because all fields are syntactically valid.

## Paid execution hardening

### Ambiguous POST is never retried automatically

If a POST fails at the transport layer before the Batch Runner learns the provider task ID, the item becomes:

```text
submission-uncertain
```

It has no invented task ID and is excluded from future automatic execution passes.

This is a spend-safety invariant.

### Known task ID is resumable

If provider submission succeeded and task ID is persisted, later polling/network failure becomes:

```text
interrupted
```

The next batch run continues from the existing provider job and does not POST again.

### Every persisted intermediate snapshot is protocol-valid

A terminal provider poll can arrive inside the single-task Runner's `onPoll` callback before `waitFor...` returns.

Initial V8 code could therefore emit a temporary item like:

```text
status: succeeded
result: null
```

If the process crashed after that write, the manifest was not resumable under its own schema.

V8 now materializes the terminal v7 result in the same state transition before emitting/persisting that snapshot.

Behavioral tests require **every emitted batch snapshot** to pass `validateSeedanceBatchJob(snapshot, plan)`.

### Settled rerun is stable

Running a batch that has no actionable items no longer transiently flips its top-level status to `running`.

A settled `succeeded` / `completed-with-errors` batch remains settled and keeps its completion time unless real work is resumed.

### Top-level lifecycle is validated

Runtime and JSON Schema both bind:

- `succeeded` / `completed-with-errors` → completed batch + `completedAt` string;
- `pending` / `running` / `needs-resume` / `needs-review` → incomplete batch + `completedAt:null`.

Tampered contradictory states are rejected before network execution.

## Batch manifest persistence hardening

### Corrupt existing job fails closed

The first CLI version treated any failure reading an existing job file as if the file were absent and created a new job. A truncated/corrupt resumable manifest could therefore lose known task IDs and cause new paid submissions.

Current behavior:

- only filesystem `ENOENT` means “job does not exist”;
- malformed JSON → `json-invalid`;
- unreadable existing manifest → error;
- existing malformed file is not replaced automatically.

### Explicit create refuses overwrite

`seedance:batch create` refuses an existing output path with `batch-job-exists`.

This prevents an explicit `create` command from destroying a resumable job containing already-paid task IDs.

### Writes are atomic

Batch job/result JSON writes use:

```text
write temporary file → rename(temp, target)
```

This reduces normal crash/truncation risk during frequent resumable state updates.

A dedicated Batch CLI behavioral contract verifies:

- first create succeeds;
- second create on the same path fails;
- original job bytes remain unchanged;
- malformed existing job causes `run` to fail closed;
- malformed bytes remain unchanged.

## Provider quota language

V8 exposes **local concurrency 1–8** only as a client-side worker bound.

It must never be labeled as the user's ModelArk account/model quota unless that quota is independently verified for the current account and model.

Default batch-plan recommendation remains 2 local workers.

## Release gates added

V8 release surface now includes:

- real v4 variant materialization test;
- batch plan integrity/tamper/credential/lineage test;
- external Batch Runner concurrency and paid-request ambiguity test;
- every-snapshot resumability check;
- external Batch CLI fail-closed manifest test;
- V8 JSDOM zero-network UI test;
- V7 reconciled engine/UI/production tests;
- V8 production + project-memory test;
- Node 20/22/24 matrix;
- schemas JSON parse;
- Pages/module graph;
- exact-100 browser renderer;
- exact 192 Porter Originals.

GitHub Pages runs browser V7/V8 contracts but does **not** execute the external paid Batch Runner.

## Durable invariants from this hardening pass

1. A paid POST with unknown outcome is never automatically repeated.
2. A known provider task ID is never discarded simply because polling failed.
3. A corrupt existing resumable manifest is never interpreted as “missing”.
4. Batch job persistence is atomic under normal filesystem semantics.
5. Every emitted batch snapshot must validate and be resumable.
6. Browser V8 has zero paid provider execution path.
7. Project/variant/export/task lineage is cross-checked, not merely displayed.
8. V7/V8 staged mutations respect actual Storyboard/Repair state.
9. Project roadmap/context/ADRs/state are part of feature completion and live in GitHub.
