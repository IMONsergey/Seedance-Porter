# Final Evidence → Promotion Handoff

The Promotion Handoff unwraps a verified Final Evidence Package into artifacts that the existing Promotion workflow can consume without losing integrity, provenance or Research risk state.

## Input

One file:

```text
seedance-porter-final-evidence-package
```

The handoff engine verifies the package before reading its contents.

If package integrity/evidence validation fails, handoff is blocked.

## Output status

### `ready-for-promotion-review`

Used when:

- Final Evidence Package verifies;
- final Deep Review is preserved;
- source URL is available;
- no unresolved Research risk flags are present.

This means only that the normal Promotion review/editorial workflow can begin.

### `risk-review-required`

Used when Final Evidence is valid but candidate metadata still carries Research risk flags.

The handoff remains valid evidence, but:

```text
promotionInputReady = false
```

Risk is not automatically cleared.

### `blocked-invalid-evidence-package`

Used when Final Evidence verification fails.

No trusted Promotion input is produced.

## Generated artifacts

CLI generates up to three files:

### Promotion review input

```text
<candidate>.promotion-review.json
```

This is the verified final Deep Review JSON in the format already accepted by Promotion.

It is written only when the Final Evidence Package itself is valid.

### Promotion context

```text
<candidate>.promotion-context.json
```

Contains:

- evidence package hash;
- verified evidence state;
- candidate metadata;
- Deep Review input;
- media-evidence summary;
- provenance;
- Research risk flags;
- handoff status;
- safety policy;
- handoff integrity hash.

### Static inspector

```text
<candidate>.promotion-handoff.html
```

Shows:

- evidence state;
- package hash;
- provenance;
- Research risk state;
- Review Player coverage/marker summary;
- suggested artifact names;
- Promotion readiness;
- editorial boundary.

The inspector contains no JavaScript.

## Research risk preservation

A Final Evidence Package can be perfectly valid evidence while still carrying Research risk flags.

Example:

```text
named-ip-or-celebrity
```

The handoff preserves the flag and switches to `risk-review-required`.

It never writes:

```text
risk cleared = true
```

Promotion/editorial tooling must resolve the issue explicitly or reject the case.

## Provenance

The context records:

- candidate source URL;
- archive URL;
- reviewed source video URL;
- creator name/profile;
- source pool/label;
- a field-level provenance completeness summary.

Missing fields produce warnings. The handoff does not invent attribution.

## Review Player timeline

When Final Evidence contains companion media evidence, the handoff summarizes:

- coverage percentage;
- marker count;
- marker types;
- source video URL.

Formal Deep Review remains authoritative.

## Integrity

The handoff binds the exact upstream Final Evidence Package hash.

It also receives its own SHA-256 `handoffHash`.

Tampering with provenance/status/context after generation invalidates handoff verification.

## CLI

```bash
node scripts/build-promotion-handoff.mjs \
  --package path/to/final-evidence.json \
  --outdir handoff/promotion
```

Exit codes:

- `0`: valid and ready for Promotion review;
- `2`: invalid Final Evidence package / blocked handoff;
- `3`: evidence valid but human Research risk review still required.

## Safety policy

Every valid handoff contains:

```json
{
  "autoApprove": false,
  "autoCurate": false,
  "autoPublish": false,
  "autoGitHubWrite": false
}
```

The handoff cannot:

- clear Research risk flags;
- approve rights/attribution;
- complete Promotion editorial checks;
- create a Curation Draft automatically;
- run Curated Rotation;
- change the exact-100 curated runtime;
- publish;
- write to GitHub.

## Full pipeline

```text
Deep Review
  -> Final Evidence Package
  -> verify SHA-256 + evidence binding
  -> Promotion Handoff
  -> Research risk/provenance check
  -> Promotion editorial workflow
  -> Curation Draft
  -> Curated Rotation Planner
  -> Curation Staging Pack
  -> human exact-100 patch
  -> Curated Swap Guard
```

Each transition keeps a separate authority boundary rather than allowing one valid artifact to silently approve the next stage.
