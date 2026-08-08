# V9 Decision Readiness — production decision contract

Status: release contract  
Date: 2026-08-08  
PR: #48  
Phase: Prompt Studio v9 — Generation Console + Evaluation Loop

## Why this exists

An arithmetic score is useful, but a sparse score cannot be treated as a production decision. V9 therefore separates three states:

1. **Evaluation evidence** — what was observed and scored.
2. **Decision readiness** — whether enough structured review exists to make a winner decision auditable.
3. **Winner** — an explicit human production decision with rationale.

None of these states is inferred from the others automatically.

## Evaluation scope

V9 evaluates succeeded visual generation outputs only. Operational failed/cancelled/expired history remains visible in the Console but cannot enter visual comparison/winner decisions.

The 13 dimensions are:

- task adherence;
- identity consistency;
- composition / framing;
- camera behavior;
- motion / action quality;
- timing / shot readability;
- continuity;
- material / physics;
- lighting / color;
- graphics / text / logo;
- audio fit;
- artifact control;
- production readiness.

Each dimension supports:

- score 1–5 or unrated;
- reviewer note;
- evidence / observed frame, moment or behavior.

`overallScore` is the transparent arithmetic average of rated dimensions only.

## Decision-ready rule

A saved Evaluation becomes `decisionReady:true` only when all conditions are true:

- at least **5** dimensions are rated;
- at least **3** dimensions contain note/evidence;
- `production-readiness` is explicitly rated.

The saved Evaluation also records:

- `ratedDimensions`;
- `evidenceDimensions`;
- `decisionReady`.

These thresholds are **Porter product rules**, not ByteDance/ModelArk provider claims.

## Winner gate

A task can become Winner only when:

- it belongs to the saved Comparison;
- it is a succeeded visual generation;
- its export SHA still matches canonical Generation Results history;
- it has a saved `decisionReady:true` Evaluation;
- the user provides a non-empty human rationale.

Winner is stored separately from Evaluation. Evaluation verdict is limited to:

- `candidate`;
- `retake`;
- `reject`.

There is no Evaluation verdict named `winner`.

No highest-score or threshold rule automatically selects a Winner.

## Retake gate

A Retake Draft can only start from a succeeded visual generation with a saved Evaluation.

It requires:

- one named production lever;
- non-empty change instruction;
- non-empty expected improvement;
- at least one retained lock;
- source task/export lineage.

Retake save does not mutate prompt sections, references, Variants or provider execution.

## Decision integrity audit

`prompt-studio-generation-evaluation-audit.js` audits raw + normalized project state and must detect:

- duplicate raw Evaluations;
- Evaluation task/export drift;
- non-succeeded visual decision sources;
- saved Evaluation that is not decision-ready;
- duplicate/orphan Comparisons;
- Winner outside its Comparison;
- Winner task/export drift;
- empty Winner rationale;
- Winner without decision-ready Evaluation;
- duplicate/orphan Retakes;
- Retake without instruction, expected improvement or retained locks;
- Retake without a saved Evaluation;
- V8 batch lineage ↔ V7 Generation Results export drift.

The audit does not auto-fix, auto-select or mutate decisions.

## Workflow safety

V9 decisions are blocked while these foreign drafts are staged:

- V4 Storyboard;
- V5 Repair;
- V7 Generation Result;
- V8 Batch Result.

While a V9 Evaluation/Retake draft is dirty, the capture-phase guard blocks project-changing actions and directly wraps `window.porterPromptStudio.openSource()` so source switching cannot silently discard the draft.

If a project replacement happens through an un-interceptable external path, V9 invalidates the unsaved draft visibly rather than applying it to a newer project version.

## Browser boundary

V9 remains a local review/decision layer:

- no provider key;
- no paid provider submission;
- no provider `fetch` / XHR / beacon;
- no automatic remote media embedding;
- no automatic generated-output attachment;
- no automatic prompt mutation;
- no automatic winner.

## V10 handoff

V10 Production Memory + Learning may consume only explicit, provenance-bearing V9 evidence. It must distinguish:

- ordinary Evaluation;
- decision-ready Evaluation;
- selected Winner;
- Retake hypothesis;
- subsequent outcome.

This distinction is required so empirical learning does not treat sparse or abandoned reviews as validated production knowledge.
