# Curation Promotion architecture invariants

This file records implementation constraints that should remain true as Promotion evolves.

## Boundary 1 — Research score is not curation authority

A candidate can have a high research score and still be blocked from editorial review.

Hard blockers include evidence failure, missing source metadata and unresolved risk flags.

## Boundary 2 — Deep Review is required

Promotion accepts `deep-reviewed` evidence only.

`completeVideoWatched: true` and `manual-complete-video-review` attestation are mandatory.

## Boundary 3 — Analysis and editorial decisions are separate

`buildPromotionAnalysis()` may calculate readiness and adaptation guidance.

It must not fabricate editorial confirmations.

`buildCuratedImplementationDraft()` may only run after `validateEditorialGate()` passes.

## Boundary 4 — Adaptation is independent

The generated analysis contains a production-mechanism brief, not a rewritten source prompt.

The editor supplies the final Porter Adaptation and confirms both:

- `independentAdaptationConfirmed`;
- `sourceWordingNotCopied`.

## Boundary 5 — No automatic curated mutation

Promotion code must not append to or overwrite the runtime curated datasets.

The browser workspace exports a draft file only.

The CLI writes a draft file only.

Adding the case to the Industry Digest remains a separate repository change protected by CI.

## Boundary 6 — Deployment completeness

Promotion browser modules and `promotion.css` are critical GitHub Pages assets.

The Pages contract must fail before deployment if they are missing from `_site`.

## Boundary 7 — Existing curated renderer remains independent

Promotion must not query or mutate `#digestGrid`.

The exact 100-card rendered browser contract remains an independent CI check.
