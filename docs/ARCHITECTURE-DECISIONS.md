# Seedance Porter — architecture decisions

Last updated: 2026-08-08

This file records decisions that should survive individual implementation details. New entries are append-only unless a later decision explicitly supersedes an earlier one.

## ADR-001 — GitHub repository is the canonical source of truth

**Status:** accepted.

All product code, architecture, roadmap, durable project context and release decisions live in `IMONsergey/Seedance-Porter`.

Chat history is useful working context, but it is not the canonical project record.

## ADR-002 — Exact curated runtime is protected

**Status:** accepted.

The curated browser runtime is kept at exactly 100 unique cases. New research candidates do not append directly to curated. Rotation/promotion must be explicit and evidence-gated.

Porter Originals are separately protected at exactly 192 entries.

## ADR-003 — Browser Prompt Studio is local-first and provider-execution-free

**Status:** accepted.

The browser may author, validate, compile, build Handoffs/provider exports and import result manifests. It must not hold provider credentials or submit paid ModelArk requests.

Rationale: stronger security boundary, easier provenance, less accidental spend, clearer testing and recovery semantics.

## ADR-004 — Provider-neutral core, provider-specific edge

**Status:** accepted.

Prompt Studio project/Timeline/Storyboard/Variants/Handoff remain provider-neutral where possible. ModelArk-specific content roles, limits and execution payloads live in a provider adapter.

Rationale: prevents creative authoring architecture from becoming coupled to one API contract.

## ADR-005 — High-impact edits are staged and explicit

**Status:** accepted.

AI patches, Timeline/Ingredients tools, Storyboard, Repair and generation-result imports stage work before project mutation. Cross-layer workflow guards must prevent silent loss when two staged layers overlap.

Rationale: preserve user work and make project history understandable.

## ADR-006 — Project persistence is extension-safe

**Status:** accepted.

New top-level project extensions should survive save/load, revisions, restore, duplicate and JSON export/import. New features should prefer extension fields over destructive schema migrations when practical.

Rationale: Prompt Studio evolves quickly; extension-safe persistence avoids a central schema bottleneck and reduces migration risk.

## ADR-007 — Stable references use `@refNN`

**Status:** accepted.

Prompt Studio uses stable internal reference tokens. Provider adapters translate them to provider-native reference numbering such as `[Image N]`, `[Video N]`, `[Audio N]`.

Rationale: internal project identity must not depend on a provider's positional request syntax.

## ADR-008 — Local reference binaries stay out of project JSON

**Status:** accepted.

Local reference files live in IndexedDB. Project JSON stores metadata/pointers only. A local-only asset is not represented as portable provider media.

## ADR-009 — Generation Handoff is an integrity-bound external-execution boundary

**Status:** accepted.

Handoff is read-only, provider-neutral, SHA-256 integrity-bound and explicitly declares no auto-generation/upload/publish/GitHub write/client secrets.

Provider export verifies Handoff before mapping to ModelArk.

## ADR-010 — External Runner credentials are environment-only

**Status:** accepted.

`ARK_API_KEY` is sourced from the external execution environment. There is no CLI key flag and no browser key surface. Job/result manifests do not persist credentials.

Provider/transport responses are treated as untrusted and current secret values are redacted before persistence/logging.

## ADR-011 — Cancellation is cancellation, not record deletion

**Status:** accepted.

Runner `cancel` checks provider state first. It may delete/cancel a queued task, refuses a running task when provider semantics do not permit cancellation, and refuses destructive deletion of terminal provider records.

## ADR-012 — Generated output returns through manifests, not hidden browser fetch

**Status:** accepted.

External job/result JSON returns into Prompt Studio through local staged import. Successful output URLs become new references only after an explicit Attach action.

Rationale: keeps paid execution, media retrieval and project mutation independently auditable.

## ADR-013 — Generated-output provenance is separate from the reference core object

**Status:** accepted.

Generated continuation references remain normal Prompt Studio references. Their task/export/lineage metadata is stored in a separate extension keyed by reference ID.

Rationale: avoids contaminating the stable reference shape with provider-specific execution history.

## ADR-014 — First-party provider facts outrank community heuristics

**Status:** accepted.

ByteDance/BytePlus first-party documentation is the primary source for model IDs, supported parameters, modes, limits and provider semantics. Facts are dated and reverified before changing production profiles.

Community findings may inform empirical Porter best practices but must remain visibly separate from official rules.

## ADR-015 — Batch execution uses local concurrency, not claimed provider quota

**Status:** accepted for V8.

V8 Batch Runner will expose a bounded configurable local concurrency. It must not label this as the account/provider concurrency quota unless that quota is explicitly verified for the current account/model.

Rationale: ModelArk quotas can vary; inventing a universal provider limit would create false confidence.

## ADR-016 — Ambiguous paid submission state must fail closed

**Status:** accepted for V8.

If a network failure occurs during POST before a task ID is known, the batch item becomes `submission-uncertain` and is not automatically retried. If a task ID is already known, polling may resume using the existing task.

Rationale: automatic retry after an ambiguous POST can create duplicate paid generations.

## ADR-017 — One canonical project, multiple derived projections

**Status:** accepted.

Storyboard, Variants, Generation Handoff, provider export, generation history and batch plans are derived projections/extensions around one canonical Prompt Studio project. They should not become competing hidden project copies.

## ADR-018 — Roadmap/context updates are part of feature completion

**Status:** accepted.

A substantial feature is not considered fully integrated if it changes product phase/architecture but leaves `PROJECT-CONTEXT`, `ROADMAP`, `PROJECT-STATE` or this ADR log stale.

Project-memory changes should land in the same PR as the feature whenever practical.