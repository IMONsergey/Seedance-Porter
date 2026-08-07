# Prompt Library Render Contract

The public Industry Digest must render the curated corpus, not only the original prompt-first subset.

Current milestone contract:
- 24 prompt-first digest cards
- 76 multi-source Case Intelligence cards
- 100 unique rendered `.digest-card` elements with default filters
- `#digestCount` displays `100`
- Platform filter is mounted
- Coverage Audit is mounted

`scripts/validate-render-contract.mjs` executes the actual browser modules in a DOM runtime and fails CI when this contract is broken.
