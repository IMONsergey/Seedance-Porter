# V9 Decision Readiness — production decision contract

Status: release contract  
Date: 2026-08-08  
PR: #48

## Three different states

V9 deliberately separates:

1. **Evaluation evidence** — what was observed and scored in one generated take.
2. **Decision readiness** — whether review coverage is sufficient for production comparison.
3. **Winner** — an explicit human decision made only after every candidate is ready.

A high score never collapses these states into one automatic action.

## Per-result Evaluation readiness

A saved Evaluation becomes `decisionReady:true` only when all conditions are true:

- at least **5** dimensions are rated;
- at least **3** dimensions contain note/evidence;
- `production-readiness` is explicitly rated.

The saved record persists:

- `ratedDimensions`;
- `evidenceDimensions`;
- `decisionReady`;
- transparent `overallScore`;
- verdict `candidate | retake | reject`.

There is no Evaluation verdict named `winner`.

These thresholds are Porter product rules, not ByteDance/ModelArk facts.

## Comparison-wide readiness

A saved Comparison contains 2–8 unique succeeded visual generation tasks.

The Comparison becomes decision-ready only when **every candidate** has a saved `decisionReady:true` Evaluation.

Example:

```text
A = decision-ready
B = not ready
C = decision-ready

Comparison = NOT READY
Winner buttons = disabled for A, B and C
```

Only after all candidates pass review coverage:

```text
3 / 3 candidates decision-ready
COMPARISON READY
```

can a human Winner be selected.

This prevents a biased decision where the preferred take is deeply reviewed while alternatives are barely inspected.

## Human Winner gate

Winner requires:

- saved Comparison;
- every Comparison candidate decision-ready;
- selected task belongs to the Comparison;
- selected task/export still matches canonical Generation Results;
- non-empty human rationale;
- explicit user action.

No highest-score rule or threshold selects Winner automatically.

## Winner evidence snapshot

When Winner is selected, V9 snapshots the Evaluation version of **every comparison candidate**.

Each candidate snapshot stores:

- task ID;
- Evaluation ID;
- Evaluation `updatedAt`;
- overall score;
- verdict;
- rated-dimension count;
- evidence-dimension count;
- decision-ready flag.

Winner therefore records both:

- the selected outcome;
- the exact review evidence state that existed when the selection was made.

If an Evaluation changes later, the Winner record is not silently rewritten.

Decision Audit emits:

```text
winner-evidence-drift
```

as a warning. The historical decision remains intact but is clearly marked as based on an older evidence version.

A missing/malformed/incomplete candidate snapshot set is a hard integrity error.

## Retake readiness

Retake has a lower evidence threshold than Winner because it is a hypothesis, not a final production decision.

Retake source must be:

- succeeded visual generation;
- saved Evaluation exists;
- at least 1 rated dimension;
- at least 1 evidence-covered dimension.

Retake Draft then requires:

- one named production lever;
- explicit change instruction;
- explicit expected improvement;
- at least one retained lock.

## Retake source Evaluation snapshot

Retake stores the source Evaluation version that motivated the hypothesis:

- task ID;
- Evaluation ID;
- Evaluation `updatedAt`;
- score/verdict;
- rated/evidence counts;
- decision-ready state.

If the source Evaluation changes later, Decision Audit emits:

```text
retake-evidence-drift
```

as a warning rather than rewriting the Retake hypothesis.

A missing/invalid/mismatched source snapshot is a hard integrity error.

## Why snapshots matter for V10

V10 Production Memory + Learning needs to answer:

> What did we know when we made this decision?

not only:

> What does the project happen to say now?

V9 snapshots make the causal record stable:

```text
variant delta
→ generated result
→ Evaluation version
→ Comparison decision
→ Winner or Retake hypothesis
→ later outcome
```

This is the minimum trustworthy evidence graph for empirical production learning.

## Workflow safety

V9 cannot start/save decision work over staged:

- V4 Storyboard;
- V5 Repair;
- V7 Generation Result;
- V8 Batch Result.

While V9 Evaluation/Retake draft is dirty:

- project lifecycle/source/restore actions are blocked;
- V7/V8 import staging is blocked;
- V4 Storyboard staging is blocked;
- direct public `porterPromptStudio.openSource()` is blocked.

Uninterceptable external project replacement invalidates the V9 draft visibly.

## Browser review boundary

Initial Console render loads no remote video DOM.

Only explicit `Preview`, `Evaluate` or `Retake` action may create:

```html
<video controls preload="none" playsinline>
```

Autoplay is forbidden.

V9 still contains no provider submission/fetch/key path.

## Core invariant

**Review every candidate before deciding. Snapshot the evidence state at decision time. Never rewrite historical decisions because current reviews changed later.**
