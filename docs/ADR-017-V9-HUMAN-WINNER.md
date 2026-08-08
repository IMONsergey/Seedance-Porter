# ADR-017 — Winner is a human decision after full comparison review

Status: Accepted  
Date: 2026-08-08  
Scope: Prompt Studio v9 Generation Console

## Context

V9 has a 13-dimension production Evaluation and transparent average score. The score helps inspection but cannot safely answer the final production question by itself.

Two failure modes must be prevented:

1. highest score silently becomes Winner;
2. preferred candidate is reviewed deeply while alternatives are barely reviewed, then Winner is selected anyway.

A third problem appears later: if Evaluations are edited after the decision, future learning must still know which evidence existed **at decision time**.

## Decision

Evaluation, Decision Readiness and Winner are separate states.

### Evaluation

- one canonical Evaluation per generated task;
- verdict is `candidate | retake | reject`;
- `winner` is not an Evaluation verdict;
- overall score is only the average of rated dimensions.

### Per-candidate readiness

An Evaluation is decision-ready only when:

- at least 5 dimensions are rated;
- at least 3 dimensions contain note/evidence;
- production-readiness is rated.

### Comparison-wide readiness

A Comparison contains 2–8 unique succeeded visual results.

**Every candidate must be decision-ready before any Winner action is enabled or accepted by the engine.**

### Human Winner

Winner requires:

- comparison is decision-ready;
- selected task belongs to comparison;
- task/export lineage is intact;
- non-empty human rationale;
- explicit user action.

No numeric score, threshold or ranking automatically chooses the Winner.

### Historical evidence snapshot

At Winner selection time, V9 snapshots the Evaluation version for **all comparison candidates**:

- task ID;
- Evaluation ID;
- Evaluation updatedAt;
- overall score;
- verdict;
- rated/evidence counts;
- decision-ready flag.

Later Evaluation edits do not rewrite the Winner.

Decision Audit reports post-decision review changes as `winner-evidence-drift` warning. A malformed or incomplete snapshot set is a hard integrity error.

## Consequences

Positive:

- alternatives receive symmetric minimum review;
- score remains evidence, not authority;
- rationale remains human and durable;
- historical decision evidence is reconstructable;
- V10 can learn from the evidence state that actually produced the decision, not from later edits.

Tradeoffs:

- Winner requires more review work;
- changing an Evaluation after Winner may produce an audit warning until the team deliberately re-evaluates the decision.

## Invariant

**Review every candidate. Then decide explicitly. Snapshot the evidence state that existed when the decision was made.**
