# Deep Review Workspace

Deep Review Workspace is the manual evidence layer between the Research Corpus and the curated Industry Digest.

It exists to prevent a common failure mode in AI-video research: reading a prompt, seeing a thumbnail or short preview, and then writing confident causal analysis as if the complete generated video had been observed.

## Pipeline position

```text
research candidate
  -> prompt anatomy
  -> complete-video visual review
  -> deep-reviewed JSON
  -> editorial / attribution check
  -> curated case draft
  -> Industry Digest
```

A completed Deep Review is **not automatically a curated case**. It is structured evidence that can support curation.

## Evidence gate

A review cannot be exported with `reviewStatus: "deep-reviewed"` until the workspace has all required evidence.

### Required attestation

The reviewer must explicitly confirm that the complete source video was watched.

The exported JSON records:

```json
{
  "evidenceAttestation": {
    "completeVideoWatched": true,
    "attestedAt": "<ISO timestamp>",
    "method": "manual-complete-video-review"
  }
}
```

A prompt, thumbnail, GIF, still frame, source description or partial clip does not satisfy this requirement.

## Stage 1 — Prompt anatomy

Prompt anatomy records what the source **asked for**:

- thesis / intended production logic;
- requested signature move;
- requested shots or continuous beats;
- causal mechanics: instruction -> expected visible consequence;
- reference strategy;
- requested camera / subject / material motion language;
- expected failure risks.

This is still prompt-derived evidence.

## Stage 2 — Observed visual review

Visual review records what the complete output **actually did**.

For every observed shot or beat record:

- framing;
- camera behavior;
- subject/object action;
- prompt match: `strong`, `partial`, `weak` or `invented`;
- attention mechanic;
- optional notes.

Also record:

- actual transitions, or explicitly confirm that none were observed;
- actual camera/body/object/material motion;
- visible artifacts / compromises, or explicitly confirm none were observed;
- continuity successes and failures;
- verified or revised signature move;
- at least two observed reasons the result works;
- meaningful things that did not work.

Do not copy requested behavior from the prompt into observed fields unless it is actually visible in the output.

## Stage 3 — Transfer

The final stage separates the production mechanism from the source subject matter.

Record:

- transferable production pattern;
- what should be transferred;
- what must not be transferred;
- project types / industries where the pattern is useful.

Do not transfer source-specific characters, celebrity identity, trademarks, products, distinctive wording or incidental locations unless the user independently owns / supplies those elements for their own project.

## Local drafts

The static Pages workspace stores unfinished drafts in browser `localStorage` using a candidate-specific key.

This is intentionally local-only:

- no automatic GitHub writes;
- no hidden database write;
- no automatic promotion to curated;
- no paid generation call.

Resetting browser storage can remove local drafts. Export evidence that matters.

## Export

Copy/export actions stay disabled until the evidence gate passes.

A valid export conforms to `schemas/case-review.schema.json` and receives:

```json
{
  "reviewStatus": "deep-reviewed"
}
```

The export contains evidence and transfer analysis. A later promotion workflow should consume that file, run attribution/editorial checks, build a Porter Adaptation, and only then create a curated case draft.

## Next layer

The intended next implementation after the workspace is a **promotion pipeline**:

1. ingest one or more completed deep-review JSON files;
2. validate against the schema;
3. join them back to candidate/source metadata;
4. score curation readiness;
5. generate a curated-case draft without copying source prompt wording;
6. require final editorial approval before adding the case to the Industry Digest.
