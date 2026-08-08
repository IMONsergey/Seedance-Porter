# Final Evidence Package

Final Evidence Package is the immutable handoff between completed Deep Review and downstream Promotion / editorial tooling.

It is intentionally different from Workspace Evidence Bundles.

## Workspace Bundle vs Final Evidence Package

### Workspace Evidence Bundle

Transports **unfinished browser-local work**.

It explicitly rejects:

- `deep-reviewed` status;
- complete-video attestation;
- curated / approved / published Promotion state.

### Final Evidence Package

Transports **completed Deep Review evidence** after the manual evidence gate has passed.

It requires:

- `reviewStatus: deep-reviewed`;
- `reviewedAt` timestamp;
- absolute source video/source URL;
- `evidenceAttestation.completeVideoWatched: true`;
- `evidenceAttestation.method: manual-complete-video-review`;
- full prompt anatomy;
- observed visual evidence;
- transfer analysis.

The two formats serve opposite states and should never be silently converted into one another.

## Package components

A package contains:

1. sanitized candidate/source metadata;
2. authoritative final Deep Review JSON;
3. optional Review Player media-evidence timeline;
4. explicit evidence-state summary;
5. SHA-256 integrity hashes;
6. a boundary statement that forbids automatic curation/publication.

## Candidate metadata

The package preserves:

- candidate ID;
- title;
- creator attribution;
- source pool;
- source/archive/preview/video URLs;
- Collections;
- Research risk flags;
- research score;
- source traceability.

Risk flags are preserved, not cleared.

A valid evidence package may therefore still be inappropriate for curation.

## Deep Review requirements

The package builder checks the same evidence semantics that make a final review useful:

### Prompt anatomy

- thesis;
- signature move;
- one or more requested shots/beats;
- at least two causal mechanics;
- reference strategy;
- motion language;
- at least two failure risks.

### Observed visual review

- one or more observed shots;
- framing;
- camera behavior;
- observed action;
- prompt match;
- attention mechanic;
- transitions or explicit none-observed statement;
- motion observations;
- artifacts or explicit none-observed statement;
- continuity observations;
- verified signature move;
- at least two observed reasons the result works.

### Transfer

- transferable pattern;
- what to transfer;
- what not to transfer.

## Optional media evidence

A Review Player companion timeline may be attached.

When present it must:

- use kind `seedance-porter-review-media-evidence`;
- bind to the same candidate ID;
- keep playback coverage within 0–100;
- contain a marker array;
- not contain complete-video attestation.

The formal Deep Review remains authoritative even when no timeline is attached.

Missing timeline produces a verification warning, not an invalid package.

## Integrity model

The package uses SHA-256.

Canonicalization:

```text
stable-json-v1
```

Object keys are recursively sorted before hashing. Array order remains meaningful.

Hashes are stored for:

- candidate metadata;
- Deep Review;
- media evidence when attached;
- whole package core.

Changing even one observed claim after packaging invalidates verification.

Integrity proves transport consistency. It does not prove that the reviewer was truthful.

## Stable kind

```json
{
  "schemaVersion": 1,
  "kind": "seedance-porter-final-evidence-package"
}
```

## Safety policy

Every package records:

```json
{
  "source": {
    "app": "Seedance Porter",
    "purpose": "final-evidence-handoff",
    "autoCurate": false,
    "autoPublish": false,
    "autoGitHubWrite": false
  }
}
```

A valid package cannot itself:

- approve rights/attribution;
- clear Research risk flags;
- create a Curation Draft;
- rotate the exact-100 curated set;
- publish a case;
- write to GitHub.

Those remain separate editorial stages.

## Build CLI

```bash
node scripts/build-final-evidence-package.mjs \
  --review path/to/deep-review.json \
  --media path/to/review-media.json \
  --corpus studio/case-candidates.json \
  --output evidence-package.json
```

`--media` is optional.

Candidate metadata can also be supplied directly:

```bash
--candidate path/to/candidate.json
```

If no explicit candidate file is supplied, the builder can resolve the candidate from `case-candidates.json` by `candidateId`.

## Verify CLI

```bash
node scripts/verify-final-evidence-package.mjs evidence-package.json
```

Verification recomputes component and package hashes and re-runs evidence/binding validation.

## Tamper detection

Verification fails when:

- Deep Review content changes;
- candidate metadata changes;
- media timeline changes;
- package core changes;
- component hashes do not match;
- package hash does not match.

## Promotion handoff

The intended downstream path is:

```text
Final Evidence Package
  -> verify integrity
  -> inspect risk flags / provenance
  -> Promotion readiness/editorial gate
  -> Curation Draft
  -> Curated Rotation Planner
  -> separate human-approved exact-100 repo change
```

No stage is skipped because the evidence package is valid.

## Why this matters

Without a final package, evidence can become separated from:

- the source candidate it belongs to;
- the source URL actually reviewed;
- optional review notes;
- the exact Deep Review version that Promotion used.

The package makes that handoff deterministic and auditable while keeping curation authority separate.
