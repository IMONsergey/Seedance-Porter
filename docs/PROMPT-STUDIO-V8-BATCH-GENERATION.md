# Prompt Studio v8 — Variant Batch Generation

Last updated: 2026-08-08

V8 connects Prompt Studio v4 A/B Variants to the secure external ModelArk execution boundary introduced by the single-task Runner, without moving paid generation or provider credentials into the browser.

## Production loop

```text
Prompt Studio canonical project
  ↓
v4 frozen-base / delta-only Variants
  ↓
V8 selected variants
  ↓
materialize each variant independently
  ↓
Generation Handoff per item
  ↓
Seedance 2.0 provider export per item
  ↓
integrity-hashed batch-plan.json
  ↓
external Node Batch Runner (ARK_API_KEY)
  ↓
resumable batch-job.json
  ↓
terminal batch-result.json
  ↓
V8 local result import
  ↓
v7 Generation Results history
  ↓
explicit generated video / last-frame continuation references
```

The browser never submits ModelArk tasks in this loop.

## Browser Batch Plan

Prompt Studio v8 adds **Variant Batch Queue** below Generation Results.

The user explicitly selects 1–20 existing v4 variants. Each selected variant is materialized from the frozen variant base and delta, then independently compiled through the existing production path:

1. materialized Prompt Studio project projection;
2. provider-neutral Generation Handoff;
3. verified Seedance 2.0 ModelArk provider export;
4. variant SHA-256;
5. provider-export SHA-256;
6. full batch-plan SHA-256.

One item cannot borrow another variant's provider payload or task lineage.

### Browser policy

Batch plan hard policy:

- `autoSubmit:false`
- `browserNetwork:false`
- `clientSecrets:false`
- `requiresExternalExecution:true`
- `automaticRetry:false`
- `ambiguousSubmissionRetry:false`

The browser may build and download the plan JSON. It does not call the paid provider endpoint.

## Canonical project lineage

Variant materialization is a derived projection, not a new hidden Prompt Studio project.

For provider lineage, every materialized variant keeps the canonical project's:

- project ID;
- project `updatedAt` version;
- Handoff SHA-256.

The batch item separately records:

- `variantId`;
- variant label/status;
- `variantHash`;
- `exportHash`.

This lets a returned result answer both questions:

- which canonical project/version generated it?
- which exact A/B variant generated it?

## External Batch Runner

CLI:

```bash
npm run seedance:batch -- help
```

Credentials:

```bash
export ARK_API_KEY='...'
```

There is no `--api-key` argument.

### Create a resumable job

```bash
npm run seedance:batch -- create my.batch-plan.json \
  --out my.batch-job.json \
  --concurrency 2
```

### Run / resume

```bash
npm run seedance:batch -- run my.batch-plan.json \
  --job my.batch-job.json \
  --result my.batch-result.json \
  --concurrency 2 \
  --poll 10 \
  --timeout 3600
```

If `my.batch-job.json` already exists, `run` resumes it. Items with a known provider task ID continue from that task and are not submitted again.

### Refresh task states once

```bash
npm run seedance:batch -- status my.batch-plan.json my.batch-job.json
```

### Cancel queued provider tasks conservatively

```bash
npm run seedance:batch -- cancel my.batch-plan.json my.batch-job.json
```

Batch cancellation delegates to the single-task conservative cancellation contract:

- queued → cancel;
- running → refuse when ModelArk does not allow cancellation at that stage;
- terminal provider record → refuse destructive deletion.

### Build a final batch result from a completed job

```bash
npm run seedance:batch -- result my.batch-job.json \
  --out my.batch-result.json
```

## Local concurrency is not provider quota

V8 accepts a **local concurrency** from 1 to 8.

This setting only limits how many Batch Runner workers the local process may have active. It is not presented as the user's ModelArk account concurrency/RPM quota.

Provider/account quotas can vary by account/model/region and must be verified separately when exact operational limits matter.

Default recommendation in the plan is 2 local workers.

## Paid-request ambiguity: the critical rule

There are two fundamentally different network failures.

### 1. POST failed before a task ID is known

If the network breaks during paid submission, the client may not know whether ModelArk created the task.

V8 records:

```text
submission-uncertain
```

Properties:

- no task ID is invented;
- no automatic retry occurs;
- re-running the batch does not POST the item again;
- the item requires manual reconciliation.

Why: automatically retrying an ambiguous POST can create a duplicate paid generation.

### 2. Polling failed after task ID is known

If task creation succeeded and the task ID is persisted, but a later GET/poll fails, V8 records:

```text
interrupted
```

The item retains its provider job/task ID.

On the next `run`, V8 resumes the known provider task and does **not** send another POST.

## Batch job states

Top-level states:

- `pending`
- `running`
- `needs-resume`
- `needs-review`
- `succeeded`
- `completed-with-errors`

Per-item execution states include:

- `pending`
- `submitting`
- `submitted`
- `queued`
- `running`
- `unknown`
- `interrupted`
- `submission-uncertain`
- `blocked`
- `succeeded`
- `failed`
- `cancelled`
- `expired`

`submission-uncertain` and `blocked` are explicit manual-review stop states. They do not masquerade as terminal provider results.

## Persistence

The Batch Runner exposes state after transitions/polls so the CLI can continuously overwrite the batch job manifest.

Operational files are ignored by Git by default:

```gitignore
*.batch-plan.json
*.batch-job.json
*.batch-result.json
```

The batch plan may contain prompt/reference URLs; the job/result contain production execution state. They are local operational artifacts unless the user deliberately decides otherwise.

## Return to Prompt Studio

V8 accepts a local `*.batch-result.json` import.

Import behavior:

- local file read only;
- no provider request;
- no output video fetch;
- no automatic project mutation;
- every item is validated;
- every terminal item must contain a valid v7 generation result;
- task/status/export lineage must match the containing batch item;
- credential-like fields reject the whole import.

The result remains staged until **Save to Generation Results**.

Save uses one revisioned public Prompt Studio project mutation for the batch.

Successful terminal item results enter the normal v7 `generationResults` history. Batch-specific metadata is stored separately in:

```text
generationBatchLinks[taskId]
```

including:

- batch ID;
- batch plan hash;
- batch item ID;
- variant ID/label/hash;
- provider export hash;
- explicit saved timestamp.

Generated output is still not automatically attached to the project. Video/last-frame attachment remains an explicit v7 action.

## Cross-layer draft safety

Building/saving a batch is blocked while Prompt Studio has overlapping staged mutations:

- staged v4 Storyboard;
- staged v5 Repair.

A locally imported batch result also invalidates if the current project ID/version changes before Save.

## Single-task lineage repair included with V8

V7 introduced `studioLink` on provider exports, but the low-level single-task Runner transport did not itself add that field to job/result manifests.

V8 adds a small manifest-boundary helper used by the public Runner CLI:

- provider export `studioLink` → job manifest;
- job `studioLink` → result manifest.

The field remains limited to:

- `projectId`;
- `projectUpdatedAt`;
- `handoffHash`.

The single generation-history core is also hardened so a stale queued job cannot overwrite a stronger terminal result and the same task ID cannot silently switch to another provider-export hash.

## Security invariants

V8 does not change the core security model:

- browser has no ModelArk key;
- `ARK_API_KEY` is environment-only;
- no `--api-key` flag;
- batch manifests reject credential-like fields;
- no automatic retry after ambiguous paid submission;
- output CDN downloads stay separate from provider Authorization;
- Pages publishes browser V8 but never executes the external Batch Runner.

## Release gates

V8 release validation covers:

- real v4 variant materialization;
- per-item Handoff/provider export;
- plan SHA-256 integrity;
- tamper rejection;
- browser zero-network plan/UI contract;
- bounded observed mock concurrency;
- `submission-uncertain` no-retry regression;
- known-task interrupted resume without second POST;
- single Runner lineage manifest boundary;
- v7 monotonic/hash-conflict history;
- batch result item validation;
- V7 history + `generationBatchLinks` return path;
- Node 20/22/24;
- Pages/module graph;
- project-memory contracts;
- exact 100 unique curated cases;
- exact 192 Porter Originals.
