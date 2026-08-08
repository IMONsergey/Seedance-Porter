# Deep Review Quality Auditor

The Deep Review schema prevents missing fields. It does not guarantee that those fields contain useful observations.

Deep Review Quality Auditor evaluates the **quality of the evidence writing** before Promotion.

It does not change review status.

## What it looks for

### 1. Structural completeness — 20 points

Checks that the review actually contains the required evidence surfaces:

- deep-reviewed status;
- complete-video attestation;
- observed shots;
- at least two why-it-worked observations;
- transitions;
- motion;
- artifacts;
- continuity;
- verified signature move.

### 2. Observational specificity — 25 points

Measures whether observed fields contain enough concrete detail to be useful.

Signals include:

- statement length;
- detailed vs very short fields;
- concrete framing/camera/object/light/material/timing vocabulary;
- specificity of the verified signature move.

A review full of values like `cinematic`, `smooth`, `looks good`, `dynamic` scores poorly even when JSON is formally complete.

### 3. Prompt / observation separation — 20 points

Compares prompt-derived anatomy with observed evidence using meaningful-token Jaccard overlap.

Healthy Deep Review should describe what was actually seen, not simply copy the requested behavior.

Flags:

- `prompt-observation-overlap`
- `prompt-observation-parroting`

High overlap is a review-quality problem because the source prompt and generated output are not the same evidence.

### 4. Critical reflection — 15 points

Rewards evidence that records compromises instead of only confirmation.

Signals include:

- `whatDidNotWork`;
- visible artifact findings;
- continuity successes/failures;
- partial/weak/invented prompt matches;
- at least two distinct why-it-worked observations.

### 5. Transfer quality — 10 points

Checks that the review extracts a usable mechanism while preserving a real transfer boundary:

- transferable pattern has meaningful depth;
- `doTransfer` is populated;
- `doNotTransfer` is populated.

### 6. Evidence integrity — 10 points

Checks:

- final `deep-reviewed` status;
- complete-video attestation;
- `manual-complete-video-review` method;
- valid reviewed/attested timestamps;
- `reviewedAt` is not earlier than `attestedAt`;
- valid source video URL;
- optional expected candidate binding.

Integrity failures are critical and block the quality gate.

## Suspicious-review diagnostics

The auditor explicitly challenges several patterns that often indicate weak review discipline.

### All shots are `strong`

A low-severity warning asks the reviewer to recheck whether anything was compressed, ignored or invented.

### No failures + no artifacts

A “perfect output” warning asks for another full-resolution review.

This is not proof the reviewer is wrong; it is a confirmation-bias check.

### Repeated evidence language

Near-duplicate evidence statements are flagged using token similarity.

### Generic language

Short statements dominated by broad visual adjectives are flagged.

Examples:

- cinematic;
- dynamic;
- beautiful;
- smooth;
- high quality;
- realistic;
- premium;
- looks good;
- works well.

These words are not forbidden. They are weak when they replace observable detail.

## Score and grade

The raw dimension score is 0–100, then flag penalties are applied.

Grades:

- A: 88–100
- B: 76–87
- C: 62–75
- D: 48–61
- F: <48

## Quality gate

### `quality-pass`

Strong review quality, generally score ≥76 with no high-severity prompt-parroting signal.

### `editorial-review`

Usable but needs human review before Promotion.

### `rewrite-review`

Evidence writing is too thin/generic/overlapping to trust as a high-quality review.

### `blocked`

Evidence integrity itself is invalid.

The quality gate is advisory for Promotion workflow design; it never changes the authoritative `reviewStatus` field.

## CLI

```bash
node scripts/audit-deep-review-quality.mjs \
  --review path/to/deep-review.json \
  --output path/to/quality-audit.json \
  --min-score 76
```

Optional candidate binding:

```bash
--candidate candidate-id
```

Exit codes:

- 0: audit reaches configured minimum and is not blocked;
- 2: evidence integrity blocked;
- 3: review quality is below configured minimum.

## CI adversarial fixtures

The quality contract includes:

1. a specific observed review with concrete camera/material/timing evidence;
2. a prompt-parrot review that copies requested language into observed fields;
3. a generic `cinematic / smooth / looks good` review;
4. broken attestation/status/source evidence;
5. suspicious all-strong / no-failure perfect-output review;
6. reversed review/attestation timestamps.

The strong fixture must score above the adversarial variants.

## Boundary

Quality Audit cannot:

- mark a review deep-reviewed;
- attest complete-video viewing;
- change observed evidence;
- clear Research risk flags;
- approve rights;
- create a Curation Draft;
- promote or publish a case.

It evaluates review discipline only.
