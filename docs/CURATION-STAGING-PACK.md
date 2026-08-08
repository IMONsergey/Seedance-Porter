# Curation Staging Pack

Curation Staging Pack is the last review artifact before a human-approved curated top-100 code change.

It does **not** perform the change.

## Inputs

The staging CLI requires:

- an exported Promotion Curation Draft;
- a Curated Rotation Plan.

It also reads the current protected curated runtime and scans curated source-data files to locate the proposed incumbent case.

## Purpose

The pack answers four concrete questions before implementation:

1. What exactly is the incoming case?
2. Which current curated case is proposed for removal?
3. Where does that existing case live in the repository?
4. Does the hypothetical remove-one/add-one operation still preserve exact-100 uniqueness and Collection intent?

## Repository location index

The CLI scans the curated data families:

- `studio/digest-data.js`
- `studio/multi-source-cases.js`
- `studio/multi-source-cases-batch2.js`
- `studio/multi-source-cases-batch3.js`
- `studio/multi-source-cases-batch4.js`
- `studio/multi-source-cases-batch5.js`

Every current curated ID must resolve to a data-file location.

If the proposed removal cannot be located, staging is invalid.

CI also verifies that all live 100 curated IDs are discoverable in these data files and that no curated ID appears in multiple curated data files.

## Exact-100 invariant

For a proposed swap:

```text
before = 100
remove = 1
add = 1
after = 100
unique after = 100
```

If the current runtime is not exactly 100, staging is blocked.

If the incoming candidate already exists in curated, staging is blocked.

## Rotation relationship

The pack consumes the Rotation Planner output.

### `consider-swap`

A structurally valid pack may become:

```text
implementationReady = true
```

This means only that the exact-100 implementation can be reviewed manually.

### `editorial-review`

The pack may be generated for comparison, but `implementationReady` remains false.

### `hold`

Preview is allowed; implementation remains false and an explicit warning is emitted.

### `blocked`

Staging is invalid.

## JSON staging pack

Kind:

```json
{
  "kind": "seedance-porter-curation-staging-pack"
}
```

Important fields include:

- incoming Curation Draft summary;
- proposed removal summary;
- exact repository location;
- Rotation metrics;
- Collection deltas;
- exact-100 invariant;
- implementation manifest;
- explicit human approval state.

Generated approval state always starts as:

```json
{
  "humanApproval": {
    "required": true,
    "approved": false,
    "approvedBy": null,
    "approvedAt": null
  },
  "autoApply": false,
  "autoPublish": false
}
```

## Static HTML preview

The CLI also creates an inert standalone HTML file.

It shows:

- incoming case;
- proposed removal;
- source/evidence/design metadata;
- repository location;
- Rotation decision/confidence/gain/net value;
- projected Collection deltas;
- errors/warnings;
- preconditions;
- manual implementation steps;
- postconditions.

The HTML contains no JavaScript and cannot change repository state.

## Implementation manifest

The manifest is an instruction set, not a patch.

### Preconditions

It requires, among other things:

- exact current 100 unique curated IDs;
- incumbent still present in the expected file;
- incoming candidate still absent;
- source/rights/risk/adaptation approved by a human editor;
- Rotation warnings explicitly reviewed.

### Manual steps

The default manifest says to:

1. remove exactly one incumbent record;
2. add exactly one incoming record;
3. add/update localization and Case Intelligence data;
4. run all CI, especially exact-100 rendered DOM;
5. inspect the deployed card/drawer/source media.

### Postconditions

It requires:

- exactly 100 unique curated IDs;
- removed case absent;
- incoming case present exactly once;
- no evidence/risk/editorial state silently promoted;
- source attribution + Porter adaptation intact.

## CLI

```bash
node scripts/build-curation-staging-pack.mjs \
  --draft path/to/curation-draft.json \
  --rotation path/to/rotation-plan.json \
  --outdir staging/curation
```

Outputs:

```text
<id>.staging-pack.json
<id>.staging-preview.html
```

## Suggested incoming data family

The pack suggests a data family based on source platform:

- X-like source → Industry Digest family;
- non-X source → multi-source family.

This is a suggestion only. The final file placement remains an implementation/editorial decision.

## What staging cannot do

The staging layer cannot:

- remove the incumbent case;
- add the incoming case;
- change the 100-card runtime;
- update localization automatically;
- alter evidence state;
- clear Research risk flags;
- approve rights;
- approve the Rotation decision;
- publish a case.

It exists to make the eventual manual patch smaller, inspectable and harder to get wrong.
