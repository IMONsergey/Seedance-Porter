# Prompt Studio v7 — Generation Results and Continuation

Prompt Studio v7 closes the round trip between browser-side authoring and the external ModelArk Runner:

`Studio project → Generation Handoff → Seedance export → external Runner → job/result JSON → Studio Results → explicit continuation reference`

The return path is intentionally local and staged. Importing a Runner manifest does not call ModelArk, fetch generated media, mutate the project, or attach anything automatically.

## Safe Studio lineage

New exports may carry an optional lineage object:

```json
{
  "studioLink": {
    "projectId": "...",
    "projectUpdatedAt": "2026-08-08T12:00:00.000Z",
    "handoffHash": "<sha-256>"
  }
}
```

The Handoff integrity hash already covers the Prompt Studio project identity and now also covers `project.updatedAt`. The Seedance adapter derives `studioLink` from the verified Handoff, and the external Runner passes only these three safe fields into job/result manifests.

No prompt text, provider payload, API key, Authorization header or local asset data is added to lineage.

Historical exports/jobs/results without `studioLink` remain valid. The field is optional in all three JSON schemas.

## Link states

When a manifest is imported, V7 reports one of four states:

- `exact-project` — project ID and `updatedAt` exactly match the generating project state;
- `same-project-drift` — same project ID, but the Studio project has changed since generation;
- `different-project` — manifest belongs to another Prompt Studio project;
- `unlinked` — historical manifest without Studio lineage.

These states are informational. They never silently rewrite or switch projects.

## Local staged import

`prompt-studio-v7-results-ui.js` accepts JSON manifests only and caps imported files at 2 MB.

Import flow:
1. read local file text;
2. parse JSON locally;
3. validate kind/schema/provider/adapter/lifecycle/output/policy;
4. recursively reject credential-like fields;
5. stage the normalized manifest in memory;
6. display lineage/status/output metadata;
7. wait for an explicit user action.

Import performs zero browser network requests.

The Results workspace does not automatically embed generated `<video>` or `<img>` elements. Output URLs appear only as explicit external links (`noopener noreferrer`) or as sources for an explicitly attached Prompt Studio reference.

## Credential rejection

The importer rejects nested credential-like keys such as:
- `Authorization`;
- `apiKey` / `ARK_API_KEY`-style normalized key names;
- `secret`;
- `credential(s)`;
- access/refresh/bearer token fields.

Runner manifests are expected to declare `secretPersisted:false` and `externalExecution:true`. Job manifests also require `apiKeySource:"environment"`.

## Project generation history

Generation history is stored as an extension-safe top-level project field:

`generationResults`

Maximum records: 50.

Records contain only normalized execution metadata:
- task ID;
- status;
- export hash;
- optional Studio lineage;
- output URLs after success;
- usage/error/provider metadata;
- import/completion timestamps.

History is monotonic per task:
- a later import of an old queued job cannot downgrade a saved succeeded result;
- a result outranks a job;
- terminal state outranks non-terminal state;
- same task ID with a different export SHA-256 is rejected as a lineage conflict.

No raw generation prompt/provider payload is copied into project history.

## Explicit continuation references

A succeeded result can be converted into references only by explicit actions.

### Generated video

`Attach video as reference` creates:
- a new stable `@refNN`;
- `mediaType: video`;
- `role: motion`;
- generated HTTPS video URL;
- no local asset duplication.

This makes a finished generation usable as a motion/video reference for the next multimodal Seedance iteration.

### Generated last frame

`Attach last frame as reference` creates:
- a new stable `@refNN`;
- `mediaType: image`;
- `role: first-frame`;
- `locked: true`;
- generated HTTPS last-frame URL.

This creates a deliberate continuation bridge: the previous generation's endpoint becomes a locked starting frame for the next shot.

## Output provenance

Generated references remain compatible with the original Prompt Studio reference schema. Execution provenance is stored separately in the extension-safe project map:

`generationOutputProvenance[referenceId]`

It contains:
- task ID;
- provider / adapter;
- export SHA-256;
- output kind (`video` or `last-frame`);
- source artifact kind (`job` or `result`);
- optional Studio lineage;
- explicit attachment timestamp.

If a generated reference is removed, extension normalization drops stale provenance entries.

## Cross-layer staged-work safety

Generation Results does not bypass the existing Storyboard / Repair workflow model.

V7 import itself is non-mutating and can be staged locally. Mutating Results actions are capture-phase guarded:
- Save record;
- Attach staged video;
- Attach staged last frame;
- Attach saved video;
- Attach saved last frame;
- Delete saved record.

If v4 Storyboard has staged work or v5 Repair has a staged proposal, these actions are blocked before the Results UI mutation handler executes. V7 reads production DOM lock signals rather than importing v4/v5 private state.

Conversely, a staged V7 import does not lock the whole editor because it contains no project mutation. If another project mutation occurs, the staged manifest is automatically invalidated and must be re-imported.

## Public mutation boundary

All V7 project mutations use only:

`window.porterPromptStudio.replaceProject(..., { snapshot:true, preserveIdentity:true })`

No private Prompt Studio state is accessed. Each explicit Save/Attach/Delete produces one revisioned project mutation.

## Schemas

Updated backward-compatible schemas:
- `prompt-studio-seedance-export.schema.json`
- `prompt-studio-generation-job.schema.json`
- `prompt-studio-generation-result.schema.json`

`studioLink` is optional in all three, but when present it is a closed object containing only `projectId`, `projectUpdatedAt`, and 64-character SHA-256 `handoffHash`.

## Production contracts

V7 adds:
- end-to-end project → Handoff → export → Runner → result → Studio history/reference contract;
- JSDOM staged-import/UI/foreign-work guard contract;
- production wiring/schema/no-network/exact-100 contract;
- Node 20/22/24 CI;
- GitHub Pages release gates and built-asset assertions.

The end-to-end test proves exact/same-project-drift/different-project/unlinked lineage, credential rejection, monotonic task history, task/export-hash conflict rejection, generated video continuation, generated last-frame continuation, extension persistence and zero browser network during import.

## Protected invariants

V7 preserves:
- exactly 100 unique curated cases;
- exactly 192 Porter Originals;
- no browser provider submission;
- no client-side provider credential;
- no automatic media fetch during result import;
- no automatic output attachment;
- no automatic project switching;
- no automatic curated mutation.
