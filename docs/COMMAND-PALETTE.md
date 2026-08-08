# Global Command Palette

The Command Palette is the global navigation/search layer for Seedance Porter.

Open it with:

- macOS: `⌘K`
- Windows/Linux: `Ctrl+K`

It is intentionally a navigation/index layer. It does not own or mutate library data.

## Indexed content

The palette indexes:

- application workspaces;
- all 30 Collections;
- the unified 100 curated cases;
- 192 Porter Originals;
- audited Sources and Source Universe entries;
- safe Research Corpus candidates when the snapshot is available;
- creators derived from curated/research metadata.

Risk-flagged Research Corpus candidates are excluded from the global index.

## Search modes

### Normal

Searches everything.

Examples:

- `beauty macro`
- `dashboard`
- `@creator-name` when typed without a separating space can still match text, but explicit creator mode is preferred.

### `>` Workspaces

Example:

```text
> review
```

Restricts results to application workspaces.

### `#` Collections

Example:

```text
# beauty
```

Restricts results to Collections.

### `@` Creators

Example:

```text
@ alice
```

Restricts results to creator entities.

The prefix chips in the UI are interactive and write the corresponding prefix into the search input.

## Ranking

Ranking is deterministic and CI-tested.

Main signals:

- exact title;
- title prefix;
- title contains query;
- subtitle match;
- exact/partial keyword match;
- all-token / partial-token coverage;
- normalized compact-title match;
- entity-type utility boost;
- Research Corpus score;
- queued Research candidate boost;
- recent-selection boost.

Empty search prefers workspaces before content noise.

## Research routing

Safe Research candidates are indexed only after `case-candidates.json` loads.

If a candidate is already in `case-review-queue.json`, selecting it routes directly to that candidate in Deep Review.

Otherwise it opens Research Corpus with the candidate title as the search query.

## Curated routing

Selecting a curated case:

1. opens Industry Digest;
2. resets digest filters;
3. switches Collection filter to All cases;
4. locates the existing rendered card;
5. opens the existing case drawer.

The palette never re-renders, appends or mutates curated cards.

## Porter Originals

Selecting a Porter Original opens the Originals workspace, resets filters and opens the existing prompt card/drawer.

## Sources

Selecting a Source opens Sources and writes the source title/name into the existing Sources search field.

## Creators

Selecting a creator prefers the existing creator dropdown when the creator is present in the curated filter. Otherwise it falls back to digest search.

## Keyboard controls

- `⌘K` / `Ctrl+K`: open/close;
- `Escape`: close;
- `ArrowDown`: next result;
- `ArrowUp`: previous result;
- `Enter`: activate result.

Mouse hover updates keyboard selection so pointer/keyboard states stay synchronized.

## Recents

The palette stores up to 8 recent selections in browser localStorage:

`porterCommandRecent`

Recents provide a small ranking boost, especially useful on empty or broad queries.

No cloud sync or hidden write occurs.

## Failure mode

Research snapshots are optional for core palette function.

If Research Corpus / Review Queue JSON cannot load, workspaces, curated cases, Porter Originals, Collections, Sources and creators still remain searchable.

## Safety boundaries

The Command Palette cannot:

- append curated cards;
- modify `INDUSTRY_DIGEST` or `MULTI_SOURCE_CASES`;
- mark a case deep-reviewed;
- change evidence attestation;
- promote a case;
- clear risk flags.

It is a global navigation/search layer only.
