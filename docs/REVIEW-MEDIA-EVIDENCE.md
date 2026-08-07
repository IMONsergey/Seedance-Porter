# Review Player + Media Evidence Timeline

Review Player is a companion tool inside Deep Review Workspace. It reduces context switching while preserving the core evidence boundary.

## What it does

For the selected Research Corpus candidate, the player attempts the strongest available source-media path:

1. direct source video (`sourceVideoUrl`, MP4/WebM/MOV/M4V, `video.twimg.com`);
2. Cloudflare Stream;
3. YouTube;
4. Vimeo;
5. embedded X source post;
6. source/preview fallback.

A direct video uses the browser's native video element and can expose playback time/ranges. Cross-origin iframe sources normally cannot expose playback telemetry to Porter.

## Native playback coverage

For direct video only, Porter records the browser's `video.played` ranges and derives an approximate played coverage percentage.

This exists to help a reviewer answer questions such as:

- Did I actually inspect the beginning, middle and end?
- Where was I when I noticed an artifact?
- Have I skipped large sections while writing the review?

Playback coverage is **not** proof of review quality and is **not** complete-video attestation.

A user can seek, replay or run the video while distracted. Telemetry cannot know whether the reviewer actually observed and understood the content.

Therefore Review Player never checks the Deep Review `completeVideoWatched` checkbox and never assigns `reviewStatus: deep-reviewed`.

## Observation timeline

The reviewer may add optional time-coded markers:

- `shot-boundary`
- `transition`
- `artifact`
- `continuity`
- `signature-move`
- `note`

Each marker contains:

- timecode;
- numeric time in seconds when available;
- marker type;
- reviewer note;
- creation timestamp.

For direct native video, the current player time can populate the timecode and clicking a marker can seek back to it.

For cross-origin iframe embeds, timecodes are entered manually.

## Storage boundary

Timeline/playback evidence uses its own browser-local namespace:

`porterDeepReviewMediaEvidence:<candidateId>`

It is intentionally separate from the core Deep Review draft namespace:

`porterDeepReviewDraft:<candidateId>`

The player must never silently modify the core review record.

## Export

The companion export conforms to:

`schemas/review-media-evidence.schema.json`

Kind:

```json
{
  "kind": "seedance-porter-review-media-evidence"
}
```

It includes:

- candidate ID;
- source media URL when known;
- playback telemetry;
- observation markers;
- export timestamp;
- explicit evidence-boundary statement.

This file can be kept with the final Deep Review as reviewer provenance, but it does not replace `schemas/case-review.schema.json`.

## Deep Review gate remains authoritative

The only path to a final Deep Review remains the evidence gate in `deep-review-ui.js`:

- explicit manual complete-video confirmation;
- full source-video/source URL;
- prompt anatomy;
- observed shots;
- observed transitions;
- observed motion;
- artifacts or explicit none-observed statement;
- continuity observations;
- verified signature move;
- at least two observed reasons the result works;
- transfer/do-not-transfer analysis.

Review Player cannot bypass any of these requirements.

## Why timeline is not automatically merged into final review JSON

The timeline is deliberately a companion artifact rather than an automatically injected field.

Reasons:

- markers are free-form working notes and may be incomplete;
- playback telemetry may be unavailable for embedded posts;
- a reviewer may intentionally discard exploratory annotations;
- the formal Deep Review schema should remain focused on final observed claims rather than raw scratch evidence.

A future evidence-package layer may bundle both files while preserving these different roles.

## Production invariant

The player is part of the deployed Pages module graph. Its JS/CSS and validator are production-critical, but any failure of external media playback must degrade to a source fallback rather than taking the curated library down.
