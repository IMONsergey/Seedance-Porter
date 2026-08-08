# ADR-018 — Retake is one evidence-driven lever, not an automatic rewrite

Status: Accepted  
Date: 2026-08-08  
Scope: Prompt Studio v9 Generation Console

## Context

Uncontrolled retakes change camera, light, action, references and wording together. The next result may improve, but causal learning becomes impossible.

A Retake also needs to preserve **why** it was proposed. If the source Evaluation changes later, future Production Memory must not silently reinterpret the historical hypothesis.

## Decision

A V9 Retake Draft may start only from:

- a succeeded visual generation;
- with a saved Evaluation;
- at least one rated dimension;
- at least one evidence-covered dimension.

The Retake stores:

- source task ID;
- source export SHA;
- **source Evaluation snapshot**;
- one canonical named production lever;
- non-empty change instruction;
- non-empty expected improvement;
- at least one retained lock;
- timestamps;
- `status: draft`.

Source Evaluation snapshot contains:

- task ID;
- Evaluation ID;
- Evaluation updatedAt;
- score/verdict;
- rated/evidence counts;
- decision-ready state.

If the current Evaluation is edited later, the Retake hypothesis remains historically unchanged and Decision Audit emits `retake-evidence-drift` warning.

A missing, malformed or task-mismatched source snapshot is a hard integrity error.

Saving Retake does **not**:

- mutate prompt sections;
- mutate references;
- create a Variant;
- call AI;
- submit provider generation.

## Consequences

Positive:

- one-variable diagnosis remains interpretable;
- hypothesis is tied to observed evidence;
- expected improvement makes the next result falsifiable;
- retained locks make successful properties explicit;
- V10 can compare hypothesis → later result without rewriting historical review evidence.

Tradeoffs:

- Retake requires a minimum real review before save;
- later source-review changes surface audit warnings rather than silently updating the hypothesis.

## Invariant

**Retake = one named lever + source evidence snapshot + expected improvement + retained locks. It records a controlled hypothesis; it does not execute the change.**
