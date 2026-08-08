# Curated Swap Guard

Curated Swap Guard verifies the repository **after** a human-approved top-100 patch.

Rotation decides whether a swap is strategically worth considering. Staging describes what should change. Swap Guard proves that the final curated runtime changed exactly as staged.

## Why the existing exact-100 test is not enough

The existing browser contract proves:

```text
100 rendered curated cards
```

That is necessary, but a bad patch could still preserve 100 while accidentally changing the wrong third case.

Swap Guard therefore protects identity, not only count.

## Phase 1 — Build baseline before patch

Given an implementation-ready Curation Staging Pack, the baseline freezes:

- exact current 100 curated IDs;
- the one proposed removal ID;
- the one incoming ID;
- the 99 protected incumbent IDs;
- expected after-set;
- expected Collection counts;
- expected removal repository file;
- suggested incoming file;
- SHA-256 integrity hash.

Baseline kind:

```json
{
  "kind": "seedance-porter-curated-swap-baseline"
}
```

The baseline does not approve the patch.

## Protected 99

If one case is intentionally removed, the other 99 become protected.

After implementation every protected ID must still be present.

This prevents an unrelated case from disappearing while the total count remains 100.

## Expected after-set

The expected set is constructed as:

```text
before 100
- proposed removal
+ incoming candidate
```

The resulting sorted ID set is hashed with SHA-256.

After patch, the live runtime must produce the same case-set hash.

## Collection counts

The baseline applies only the staged Collection change:

- subtract incumbent Collections;
- add incoming Collections.

After implementation the current curated Collection counts must match these expected values.

This catches cases where the incoming case was added with incomplete or incorrect Collection metadata.

## Repository location verification

When the after-patch curated data-file index is supplied, the guard additionally requires:

- removed ID no longer resolves to any curated data file;
- incoming ID resolves to a curated data file;
- incoming ID does not appear in multiple curated data files.

## Phase 2 — Verify after patch

Verification kind:

```json
{
  "kind": "seedance-porter-curated-swap-verification"
}
```

A valid verification proves:

- exactly 100 current curated rows;
- exactly 100 unique IDs;
- removed case is absent;
- incoming case is present exactly once;
- all protected 99 remain;
- no unexpected curated IDs were introduced;
- Collection counts equal staging expectation;
- baseline integrity is intact;
- data-file presence is correct when location index is available.

## Integrity

The baseline and final verification use SHA-256 over stable canonical JSON.

Tampering with the baseline after creation invalidates verification.

Integrity proves the intended identity transition was preserved. It does not prove editorial correctness.

## CLI — create baseline

Before editing curated files:

```bash
node scripts/build-curated-swap-baseline.mjs \
  --staging path/to/candidate.staging-pack.json \
  --output candidate.swap-baseline.json
```

## CLI — verify implementation

After the human patch:

```bash
node scripts/verify-curated-swap-implementation.mjs \
  --baseline candidate.swap-baseline.json \
  --output candidate.swap-verification.json
```

The verifier reads the actual current curated runtime and curated data files.

Exit code is non-zero when verification fails.

## Failure examples

Verification fails when:

- current runtime contains 99 or 101 cases;
- incoming case appears twice;
- incumbent was not removed;
- another protected incumbent disappeared;
- an unexpected third case was added;
- incoming Collections differ from staging expectation;
- baseline JSON was modified after it was created;
- removed ID still exists in curated data files;
- incoming ID cannot be found in curated data files.

## CI contract

`curated-swap-guard-ci` runs on Node 20/22/24 and includes:

- Swap Guard synthetic verification;
- parent Curation Staging contract;
- parent Curated Rotation contract;
- protected exact-100 rendered DOM contract.

The synthetic test explicitly verifies that:

- one-out/one-in passes;
- an unrelated protected-ID change fails;
- duplicate/101-row state fails;
- removal-not-removed fails;
- Collection drift fails;
- baseline tampering fails;
- non-implementation-ready staging cannot create a valid baseline.

## Safety boundary

A successful Swap Guard verification does not:

- approve the incoming content;
- approve rights or attribution;
- validate the human Deep Review itself;
- publish the site;
- change any curated file;
- mark the incoming case curated by itself.

It proves only that a previously staged human-approved patch changed the exact curated identity set as intended.

The verification output explicitly keeps:

```json
{
  "autoApprove": false,
  "autoPublish": false
}
```
