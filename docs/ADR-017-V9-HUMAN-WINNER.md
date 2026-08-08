# ADR-017 — Evaluation score must not automatically select the generation winner

Status: Accepted  
Date: 2026-08-08  
Scope: Prompt Studio v9 Generation Console

## Context

V9 introduces structured production evaluation across 13 dimensions. A numeric score is useful for comparison, but production decisions often include tradeoffs that are not represented by an arithmetic average: client intent, strategic fit, an important frame, an acceptable controlled defect, or a result that is uniquely useful for continuation.

Automatically turning the highest score into the winner would collapse evidence and decision into one opaque behavior.

## Decision

Evaluation and winner selection are separate project records.

- Evaluation may store dimension scores, evidence and reviewer notes.
- `overallScore` is a transparent average of rated dimensions only.
- A saved comparison contains the candidate task IDs.
- Winner selection requires an explicit human action.
- Winner must belong to the comparison.
- Winner stores task ID, export hash, rationale and timestamp.
- Changing an evaluation score must not silently change the selected winner.

## Consequences

Positive:
- production intent remains explicit;
- score is explainable rather than magical;
- reviewers can choose a strategically better result despite a lower aggregate score;
- future automated analysis can recommend but must not silently decide unless a new architecture decision explicitly changes this rule.

Tradeoff:
- one extra human action is required.

## Invariant

**Score is evidence. Winner is a decision. They are not the same state.**
