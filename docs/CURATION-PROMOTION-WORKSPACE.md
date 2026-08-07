# Curation Promotion Workspace

Curation Promotion Workspace is the editorial layer between a completed Deep Review and an implementation-ready curated-case draft.

It is intentionally **not** an automatic Industry Digest publisher.

## Pipeline position

```text
Research Corpus candidate
  -> Deep Review Workspace
  -> deep-reviewed JSON
  -> Promotion readiness analysis
  -> editorial / attribution gate
  -> curated implementation draft
  -> reviewed repository change
  -> Industry Digest
```

A high readiness score is not permission to publish. Hard blockers always win over score.

## Inputs

Promotion uses two pieces of evidence:

1. A completed `deep-reviewed` JSON exported from Deep Review Workspace.
2. The matching candidate metadata from the current Research Corpus snapshot.

The `candidateId` joins the two records.

If the candidate is no longer present in the deployed corpus snapshot, promotion is blocked until the source metadata is resolved.

## Readiness analysis

The shared engine evaluates:

- deep-review evidence validity;
- complete-video attestation;
- source traceability;
- creator attribution quality;
- source / archive / preview availability;
- source/license note availability;
- unresolved risk flags;
- research score and Collection coverage;
- quality of the verified signature move;
- quality of the transferable pattern;
- explicit transfer / do-not-transfer rules;
- visible compromises recorded by the reviewer.

The result contains:

- `score` from 0–100;
- `tier`;
- `blockers`;
- `advisories`;
- `eligibleForEditorialReview`.

### Tiers

- `strong-editorial-candidate`: score >= 85 and no hard blockers.
- `editorial-review`: score >= 70 and no hard blockers.
- `needs-work`: score below 70 or any hard blocker.

## Hard blockers

Examples:

- review is not actually `deep-reviewed`;
- complete source video was not attested as watched;
- candidate cannot be joined back to source metadata;
- candidate has unresolved named-IP / celebrity risk flags;
- source URL is missing;
- required observed evidence is incomplete.

Hard blockers cannot be overridden by a high score.

## Advisories

Advisories do not automatically block promotion, but the editor should resolve or consciously accept them.

Examples:

- generic creator attribution;
- weak source traceability;
- no stable preview;
- missing source/license note;
- visible compromises in the generated result.

## Editorial gate

A curated implementation draft cannot be exported until all six confirmations are explicit:

1. `attributionVerified`
2. `sourceRightsChecked`
3. `previewVerified`
4. `namedIpRiskCleared`
5. `independentAdaptationConfirmed`
6. `sourceWordingNotCopied`

The editor must also provide:

- final title;
- category;
- subcategory;
- at least one Collection;
- observed-evidence `whyItWorks`;
- independently written Porter Adaptation.

## Independent Porter Adaptation

The Promotion layer deliberately does not auto-rewrite the source prompt.

The adaptation should be written from:

- observed shot/beat functions;
- verified signature move;
- transferable pattern;
- movement language;
- reference strategy;
- transfer / do-not-transfer rules.

It must not be produced by simply replacing nouns or brand names in the source prompt.

Exact source-specific wording, trademarks, character identity, product identity and incidental locations are not part of the transferable mechanism.

## Output

The final export conforms to:

`schemas/curation-draft.schema.json`

and has:

```json
{
  "kind": "seedance-porter-curated-case-draft",
  "status": "ready-for-curated-implementation"
}
```

This means only that the editorial draft has passed the Promotion gate.

It still does not mutate:

- `INDUSTRY_DIGEST`;
- `MULTI_SOURCE_CASES`;
- the unified 100-card renderer;
- GitHub files automatically.

A reviewed repository change is still required.

## Browser workflow

The browser workspace supports:

1. Uploading a Deep Review JSON file or pasting JSON.
2. Joining it to the deployed Research Corpus snapshot.
3. Showing readiness score, hard blockers and advisories.
4. Showing source/evidence and verified production mechanism.
5. Saving editorial work locally per candidate.
6. Applying the six editorial confirmations.
7. Exporting/copying the implementation draft only when the gate passes.

## CLI workflow

Readiness analysis only:

```bash
npm run curation:build -- --review ./review.json --corpus ./studio/case-candidates.json --output ./curation-analysis.json
```

With an editorial JSON file, the same command can produce the gated implementation draft according to the CLI options exposed by `scripts/build-curation-draft.mjs`.

## Safety boundary

Promotion is designed to make curation harder to fake, not easier to automate blindly.

The invariant is:

> evidence can become an editorial draft automatically; an editorial draft cannot become a curated Digest case automatically.

That final repository mutation must remain explicit, reviewable and CI-protected.
