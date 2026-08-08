# ADR-017 — Evaluation score must not automatically select the generation winner

Status: Accepted  
Date: 2026-08-08  
Scope: Prompt Studio v9 Generation Console

## Context

V9 introduces structured production evaluation across 13 dimensions. A numeric score is useful for comparison, but production decisions often include tradeoffs that are not represented by an arithmetic average: client intent, strategic fit, an important frame, an acceptable controlled defect, or a result that is uniquely useful for continuation.

Automatically turning the highest score into the winner would collapse evidence and decision into one opaque behavior. The opposite failure is also possible: a user could select a winner before doing enough structured review to make the decision auditable.

## Decision

Evaluation and winner selection are separate project records.

- Evaluation stores dimension scores, evidence and reviewer notes.
- `overallScore` is a transparent average of rated dimensions only.
- Evaluation verdict is limited to `candidate | retake | reject`; `winner` is not an Evaluation verdict.
- A saved comparison contains 2–8 succeeded visual generation task IDs.
- Winner selection requires an explicit human action.
- Winner must belong to the comparison.
- Winner must reference a succeeded visual generation whose export hash still matches canonical Generation Results history.
- Winner requires a **decision-ready saved Evaluation**.
- Decision readiness requires at minimum:
  - 5 rated production dimensions;
  - 3 dimensions with written note/evidence;
  - `production-readiness` explicitly rated.
- Winner requires a non-empty human rationale.
- Winner stores task ID, export hash, rationale and timestamp.
- Changing an evaluation score must not silently change the selected winner.
- No threshold or highest-score rule selects a winner automatically.

The 5/3/readiness threshold is a **Porter product rule**, not a ByteDance/ModelArk provider fact. It exists to prevent low-evidence decisions and may only change through an explicit product/architecture decision.

## Consequences

Positive:
- production intent remains explicit;
- score is explainable rather than magical;
- winner decisions have minimum review coverage;
- winner rationale is durable and auditable;
- reviewers can choose a strategically better result despite a lower aggregate score;
- future automated analysis can recommend but must not silently decide unless a new architecture decision explicitly changes this rule.

Tradeoffs:
- one extra human action is required;
- a candidate cannot become Winner until minimum review coverage exists.

## Invariant

**Score is evidence. Decision readiness is a review gate. Winner is an explicit human decision. They are three different states.**
