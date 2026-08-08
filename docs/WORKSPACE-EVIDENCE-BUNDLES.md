# Workspace Evidence Bundles

Workspace Evidence Bundles make browser-local Seedance Porter work portable without turning transport into an approval mechanism.

## Problem

Deep Review, Review Player timeline evidence and Promotion editorial drafts are intentionally browser-local. That keeps the static Pages app simple and avoids hidden database/GitHub writes, but it creates a practical problem:

- switching browsers/devices loses continuity;
- handing work to Codex or another local environment is awkward;
- browser storage is not a durable project archive.

Workspace Bundles solve transport only.

## What a bundle may contain

One candidate bundle may contain any unfinished combination of:

- `deepReviewDraft`
- `mediaEvidence`
- `promotionDraft`

Candidate metadata is deliberately small:

- candidate ID;
- title;
- author;
- source pool;
- source/archive/preview/video URLs;
- Collection IDs.

The transport summary does not duplicate Research Corpus excerpts or source prompts.

## What a bundle cannot contain as trusted state

Import is rejected when a component tries to transport approval/evidence completion such as:

- `reviewStatus: deep-reviewed`;
- `evidenceAttestation.completeVideoWatched: true`;
- `completeVideoWatched: true`;
- Promotion status `approved`, `curated` or `published`;
- boolean `approved`, `curated` or `published` flags.

Reason: moving JSON between browsers is not evidence review and is not editorial approval.

A finalized Deep Review remains a separate exported evidence artifact and must pass the normal review schema/gate.

## Stable kind

Single bundle:

```json
{
  "kind": "seedance-porter-workspace-bundle",
  "schemaVersion": 1
}
```

Multi-candidate archive:

```json
{
  "kind": "seedance-porter-workspace-bundle-archive",
  "schemaVersion": 1
}
```

## Export modes

Operations Command Center exposes:

- Copy bundle JSON;
- Export one candidate bundle;
- Export all current local work as an archive.

Export is explicit and user initiated.

No GitHub or network write is performed.

## Import workflow

Import supports:

- JSON file;
- pasted JSON.

Nothing is written on file selection/paste. Porter first parses and validates the payload, then shows an import plan.

### Fill missing only

Default mode.

Existing local components are preserved. Only missing components are written.

Use this for safe continuation on a browser that already contains some local work.

### Replace local components

Explicit overwrite mode.

Incoming valid unfinished components replace the matching local components for the candidate.

The preview shows write/skip counts before import.

## Candidate binding

A component that contains its own `candidateId`, `sourceCaseId`, nested review candidate ID or candidate object must match the bundle candidate ID.

Cross-candidate transport is rejected.

## Media evidence

Review Player companion evidence may be transported, including:

- playback ranges;
- coverage percentage;
- timeline markers.

Coverage must remain between 0 and 100.

Media evidence still cannot carry complete-video attestation.

## Size limits

The engine limits:

- each component to 1 MB JSON;
- one bundle to 2.5 MB JSON;
- one archive to at most 250 candidate bundles.

These limits protect browser-local transport from accidentally becoming a large source-content mirror.

## Local storage mapping

Bundle UI maps components only to the established namespaces:

- Deep Review → `porterDeepReviewDraft:<candidateId>`
- media timeline → `porterDeepReviewMediaEvidence:<candidateId>`
- Promotion → `porterPromotionEditorial:<candidateId>`

No arbitrary localStorage keys are accepted from the bundle payload.

## Operations synchronization

Same-document `storage` events do not fire for the tab that made the write.

After explicit bundle import, Porter emits `porter-local-work-change` and the bundle bootstrap reuses the Operations focus refresh path so the Command Center immediately reflects restored work.

## Safety metadata

Every generated bundle states:

```json
{
  "source": {
    "app": "Seedance Porter",
    "transport": "browser-local-workspace-bundle",
    "autoApproval": false,
    "autoGitHubWrite": false
  }
}
```

This is also enforced by the JSON schema.

## What transport does not do

Importing a Workspace Bundle does not:

- confirm that a source video was watched;
- mark a review deep-reviewed;
- validate the final Deep Review schema;
- clear Research risk flags;
- approve rights/attribution;
- create a curated implementation;
- publish a case;
- mutate the exact-100 curated runtime;
- write to GitHub.

It restores unfinished local work only.
