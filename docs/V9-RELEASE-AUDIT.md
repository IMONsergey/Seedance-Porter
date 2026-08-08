# Prompt Studio v9 — Release Audit Snapshot

Updated: 2026-08-08
Branch: `feat/prompt-studio-v9-generation-console`
PR: #48
Status: **draft / source-hardening**

This is the latest release-audit snapshot for V9. It supersedes older implementation-status notes when there is a conflict.

## Implemented production surface

- 13-dimension generation Evaluation engine;
- transparent rated-dimensions-only `overallScore`;
- bounded extension-safe evaluation state;
- saved 2–8 task Comparisons;
- dynamic V8 batch → V4 Variant lineage view;
- explicit human Winner + rationale record;
- explicit winner → V7 video/last-frame continuation;
- one-lever Retake Draft with retained locks;
- Retake Save does not rewrite prompt sections;
- V9 staged-work guard across V4/V5/V7/V8;
- dirty V9 draft guard;
- Generation Console UI;
- closed evaluation/comparison/winner/retake schema;
- deterministic Decision Lineage Audit;
- engine behavioral contract;
- final render-safe JSDOM Console contract;
- production/project-memory contract;
- V9 feature doc + machine state;
- ADR-017 Score ≠ Winner;
- ADR-018 one-lever Retake;
- V9 Pages preflight definition;
- authoritative `Prompt Studio v9 Release CI` Node 20/22/24 matrix.

## Canonical release tests

Use these as the current authoritative V9 contracts:

- `scripts/validate-prompt-studio-v9-evaluation.mjs`
- `scripts/validate-prompt-studio-v9-decision-audit.mjs`
- `scripts/validate-prompt-studio-v9-console.mjs`
- `scripts/validate-prompt-studio-v9-production.mjs`
- `scripts/validate-pages-contract.mjs`
- protected exact-100 renderer

Canonical release workflow:

- `.github/workflows/prompt-studio-v9-release-ci.yml`

## Decision Audit guarantees

Before V10 can learn from V9 review data, V9 audit detects:

- Evaluation → missing generation task;
- Evaluation/export hash drift;
- Comparison → missing generation task;
- Winner outside comparison;
- Winner → missing generation task;
- Winner/export hash drift;
- Winner without rationale (warning);
- Retake → missing source task;
- Retake/export hash drift;
- Retake without explicit instruction;
- Retake without retained locks (warning);
- V8 batch-lineage export hash drift vs V7 history;
- winner records pointing to deleted comparisons.

V10 must consume audited production evidence, not blindly trust extension records.

## Current release blockers

### Blocker A — obsolete iterative V9 UI tests remain in branch

Superseded files:

- `scripts/validate-prompt-studio-v9-ui.mjs`
- `scripts/validate-prompt-studio-v9-console-ui.mjs`

Final canonical replacement:

- `scripts/validate-prompt-studio-v9-console.mjs`

The old files are not product runtime, but they should be removed or excluded from all release workflows before merge.

### Blocker B — older V9 workflows still reference a superseded test

Earlier iterative workflows:

- `.github/workflows/prompt-studio-v9-ci.yml`
- `.github/workflows/prompt-studio-v9-pages-preflight.yml`

were created before the final render-safe test and may still reference `validate-prompt-studio-v9-console-ui.mjs`.

The new authoritative release workflow uses only the final test, but repository hygiene requires old workflow references to be updated/removed before Ready/Merge.

### Blocker C — verify actual shell mount in PR diff

Release requires:

```text
v7 → v8 → v9 → Cmd-K
```

`studio/sidebar.js` was updated in the implementation branch, but because GitHub contents responses are currently heavily compacted, verify this against the actual PR diff/check before marking #48 ready.

## High-value hardening still recommended before Ready

1. protect direct public `window.porterPromptStudio.openSource()` while a V9 draft is dirty, matching V4/V5 bypass protection;
2. remove `winner` from Evaluation verdict engine/schema so ADR-017 is enforced even for non-UI callers;
3. consider requiring non-empty winner rationale instead of audit-warning only;
4. flatten V4 Variant delta paths so comparison can display controls like `sections.camera`, not only coarse top-level keys;
5. surface model/resolution/ratio/duration in Console result rows.

These are not excuses to merge an ambiguous PR. If included in V9, they need their own contracts.

## GitHub Actions truth rule

The repository has experienced an Actions queue backlog.

- `queued` is not `passed`;
- no assistant response should describe queued checks as green;
- source/contract audit can justify continued implementation, but release readiness requires explicit honesty about what actually executed.

## Memory rule

Project plan/context is GitHub-native. Current V9 memory is distributed across:

- `docs/PROJECT-MEMORY.md`
- `docs/PROJECT-MEMORY.json`
- `docs/PROMPT-STUDIO-V9-GENERATION-CONSOLE.md`
- `docs/PROMPT-STUDIO-V9-STATE.json`
- ADR-017 / ADR-018
- this release-audit snapshot
- PR #48 conversation/diff

The next session should begin by reading these files instead of reconstructing state from chat history.
