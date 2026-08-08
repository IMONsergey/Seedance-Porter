# Promotion Quality Gate

Seedance Porter treats **evidence integrity** and **review quality** as different requirements.

A Deep Review can be formally valid — correct schema, complete-video attestation, source URL, observed fields — and still be too generic, prompt-derived or confirmation-biased to enter Promotion.

The Promotion Quality Gate closes that gap.

## Required path

`Deep Review -> Quality Audit -> Final Evidence Package -> Promotion Handoff -> Promotion editorial gate`

The Final Evidence Package proves that the evidence artifact is authentic and internally bound. The Quality Audit determines whether the review itself is useful enough to serve as editorial evidence.

Both must pass.

## Promotion threshold

The shared Deep Review Quality Auditor remains authoritative.

Promotion requires:

- audit gate = `quality-pass`;
- audit score >= **76 / 100**;
- no high or critical quality flag;
- Final Evidence Package verification passes;
- no unresolved Research risk flags;
- source/provenance input remains available.

The threshold is exported as `PROMOTION_QUALITY_MINIMUM = 76` from `promotion-handoff-engine.js`.

## Handoff states

### `ready-for-promotion-review`

All evidence, review-quality and Research-risk gates required before entering the Promotion workspace are satisfied.

This still does **not** satisfy the Promotion editorial gate.

### `quality-review-required`

Final Evidence is valid, but the Deep Review is not strong enough for Promotion.

Typical causes:

- generic observational language;
- weak visual specificity;
- prompt/observation overlap;
- insufficient negative evidence;
- weak transfer boundaries;
- score below 76.

### `blocked-review-quality`

The Quality Auditor reports `blocked`, usually because of evidence-integrity inconsistency such as invalid timestamps, source binding or attestation state.

### `risk-review-required`

Review quality passed, but Research risk flags remain.

### `quality-and-risk-review-required`

Both review quality and Research risk require human work.

### `blocked-invalid-evidence-package`

The upstream Final Evidence Package itself fails integrity/evidence verification.

## Integrity binding

The complete quality audit is stored inside the Promotion Handoff.

The handoff records:

- quality score;
- grade;
- gate;
- diagnostic flags;
- dimensions;
- minimum Promotion score;
- `promotionReady` state;
- SHA-256 hash of the audit.

`verifyPromotionHandoff()` recomputes the Quality Audit from the embedded Deep Review using the same audit timestamp.

Changing the stored score, grade or gate and merely recalculating the outer handoff hash is therefore insufficient: the recomputed audit must still match.

## CLI artifact boundary

`build-promotion-handoff.mjs` always writes:

- Promotion context JSON;
- inert Promotion handoff HTML inspector.

It writes the actual `.promotion-review.json` **only when** `promotionInputReady === true`.

Therefore a weak or risky review cannot leave behind a file that looks like an approved Promotion input merely because the CLI ran successfully.

Exit codes remain:

- `0` — Promotion review input is ready;
- `2` — invalid evidence package / invalid handoff;
- `3` — valid evidence exists, but quality and/or risk work is still required.

## What this gate does not do

It cannot:

- upgrade `reviewStatus`;
- attest complete-video viewing;
- rewrite observed evidence;
- clear Research risk;
- approve source rights;
- approve attribution;
- pass the Promotion editorial gate;
- create a Curation Draft automatically;
- rotate the curated top-100;
- write to GitHub.

It is a quality admission gate, not an editorial authority.

## CI

The Promotion Handoff workflow runs all three layers together on Node 20, 22 and 24:

1. Final Evidence Package integrity contract;
2. adversarial Deep Review Quality contract;
3. Promotion Handoff contract.

The integration fixture covers:

- strong specific review -> `ready-for-promotion-review`;
- weak/generic review -> quality review required;
- strong review + Research risk -> risk review required;
- weak review + Research risk -> both gates remain visible;
- falsified quality score, even with an updated outer handoff hash -> rejected;
- invalid Final Evidence -> blocked;
- Promotion review file emission only after all pre-Promotion gates pass.

The protected exact-100 browser render contract is also run unchanged.
