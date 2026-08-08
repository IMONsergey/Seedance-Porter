# V9 Implementation Notes — Generation Console + Evaluation Loop

Updated: 2026-08-08
Branch: `feat/prompt-studio-v9-generation-console`
PR: #48

This file is a short implementation journal. Durable product rules belong in the feature doc/ADRs; this file records current implementation state and release blockers so work can resume without chat history.

## Implemented in branch

- extension-safe Evaluation engine;
- 13 production dimensions;
- transparent rated-dimensions-only average;
- saved 2–8 task Comparison;
- V8 batch → V4 Variant lineage view;
- explicit human Winner with rationale;
- winner → explicit V7 video/last-frame continuation;
- one-lever Retake Draft with retained locks;
- Retake Save does not rewrite prompt sections;
- V9 cross-layer staged-work guard;
- Generation Console UI;
- closed evaluation/comparison/winner/retake schema;
- engine behavioral contract;
- final render-safe JSDOM Console contract;
- production/project-memory contract;
- Node 20/22/24 CI workflow;
- Pages preflight workflow;
- V9 feature doc + machine state;
- ADR-017 human winner;
- ADR-018 one-lever Retake.

## Release blockers still open

### 1. Remove/neutralize obsolete early V9 UI tests

Two earlier iterative test files remain in the branch:

- `scripts/validate-prompt-studio-v9-ui.mjs`
- `scripts/validate-prompt-studio-v9-console-ui.mjs`

They are superseded by:

- `scripts/validate-prompt-studio-v9-console.mjs`

The older tests contain test-harness assumptions that do not survive Console re-rendering and must not be part of release gates.

### 2. Point V9 workflows to final Console test

Both:

- `.github/workflows/prompt-studio-v9-ci.yml`
- `.github/workflows/prompt-studio-v9-pages-preflight.yml`

must run `validate-prompt-studio-v9-console.mjs` only.

### 3. Verify production shell mount

`studio/sidebar.js` must contain:

```text
v7 → v8 → v9 → Cmd-K
```

The branch attempted this update. Verify against the actual PR diff before marking ready.

### 4. Optional but high-value hardening

- wrap direct public `window.porterPromptStudio.openSource()` while V9 draft is dirty, matching V4/V5 bypass protection;
- remove `winner` from Evaluation verdict engine/schema completely so ADR-017 is impossible to violate through non-UI callers;
- decide whether winner rationale must be non-empty;
- flatten Variant delta paths (`sections.camera`, etc.) instead of only top-level delta keys in comparison view;
- add provider metadata columns (model/resolution/ratio/duration) to Console result rows.

## Release rule

PR #48 stays draft until the obsolete tests/workflow references and production mount are verified/fixed.

Do not interpret queued GitHub Actions as passing checks.
