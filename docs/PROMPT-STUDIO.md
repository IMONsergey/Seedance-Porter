# Prompt Studio

Prompt Studio is Seedance Porter's structured production-prompt editor.

It is designed for the workflow:

`source / idea -> editable Studio fork -> structured production controls -> lint/rules -> staged AI patch -> user Apply -> compiled prompt`

The editor is intentionally separate from the curated library. Opening a curated case, Porter Original or Research candidate in Studio creates a new local project. The source is never edited in place.

## Source inventory

Prompt Studio can fork:

- the protected exact **100 curated cases**;
- all **192 Porter Originals**;
- Research Corpus candidates when the generated snapshot is available;
- a manual/new project.

Curated and Original entries can provide full prompt material.

Research candidates are treated differently: candidate excerpts are provenance/research evidence only and are **not** silently inserted into the generated prompt. A Research fork starts as an independent production brief linked back to the candidate.

Research risk flags remain visible in Studio source provenance.

## Project model

Project kind:

`seedance-porter-prompt-studio-project`

Schema:

`schemas/prompt-studio-project.schema.json`

Modes:

- `text-to-video`
- `image-to-video`
- `first-last-frame`
- `multi-reference`

Every project has the same 13 canonical sections:

1. Objective
2. Subject
3. Environment
4. Composition / framing
5. Camera
6. Action / motion
7. Timing / shot plan
8. Lighting
9. Materials / physics
10. Visual style
11. Continuity locks
12. Constraints
13. Avoid / failure boundaries

Sections can be disabled without deleting their text.

The fixed compile order is deliberate. Studio is an editor for production intent, not a free-form document builder.

## Compiler

`compilePromptProject(project)` generates one canonical prompt.

Reference jobs are emitted before the normal prompt sections.

Example:

```text
REFERENCE JOBS
@ref01 — exact shape, proportions and construction geometry; LOCK this property across the clip
@ref02 — motion rhythm/action behavior only; do not copy subject matter
```

Editor-only custom rules are not emitted by default. They constrain editing and AI behavior rather than becoming model instructions automatically.

## Reference Manager

Studio references use stable tokens:

- `@ref01`
- `@ref02`
- ...

Reference roles:

- identity
- geometry
- style
- material
- motion
- camera
- first-frame
- last-frame
- graphics
- pattern
- environment
- other

A reference can also be marked `locked`.

The compiler converts that into an explicit cross-clip lock.

### Local files

Image/video files can be attached locally.

They are stored in IndexedDB by `prompt-studio-assets.js`.

No file-upload endpoint exists in Prompt Studio v1.

The project JSON stores a `localAssetKey`, not the binary asset itself.

Therefore normal JSON export transports prompt logic but not heavy local media. A future asset-bundle format can package those separately.

## Live lint

`lintPromptProject()` produces a 0–100 quality score plus errors, warnings and information.

Current deterministic checks include:

- missing objective/action;
- image-to-video without an image reference;
- first/last-frame without both endpoint references;
- multi-reference with fewer than two references;
- duplicate/invalid reference tokens;
- weak/unspecified reference jobs;
- identity/geometry references that are not locked;
- unresolved reference tokens;
- unresolved template variables;
- locked/static camera combined with moving camera instructions;
- too many competing camera moves;
- generic quality language replacing observable behavior;
- exact text/logo requests without a graphics reference;
- excessive shot density for duration;
- weak continuity when identity/geometry references exist;
- thin constraints;
- unusually short/long compiled prompt;
- vague custom rules.

Lint never rewrites the project automatically.

## Custom editor rules

Each project can carry persistent custom rules.

Examples:

- Never combine orbit + zoom.
- Product geometry from @ref01 is non-negotiable.
- Do not generate readable brand typography.
- Every shot must have one dominant physical event.
- Character face identity must remain stable across all beats.

These rules are passed to the AI co-editor and remain visible in the project.

They are not silently injected into the generation prompt.

## Deterministic Rules Engine

Prompt Studio remains useful without any neural model.

Built-in staged presets:

- Tighten prompt
- Make motion physical
- Fix camera conflicts
- Strengthen continuity
- Fix reference jobs
- Shorten
- Expand shot plan
- Add failure boundaries

The rules engine returns the same patch shape as the neural editor.

It does not directly modify project state.

## Local AI co-editor

The AI controller is `prompt-studio-ai.js`.

Its first backend is the browser built-in language model when available.

The editor does not embed a cloud API key.

For Russian custom instructions, Studio attempts local Russian -> English translation when the browser Translator capability exists.

If neural editing is unavailable, common instructions can map back to the deterministic Rules Engine.

### Structured patch only

The neural editor receives:

- project metadata;
- all structured sections;
- reference jobs;
- custom rules;
- compiled prompt;
- current lint issues;
- limited provenance metadata.

It must return a constrained patch:

```json
{
  "summary": "...",
  "changes": [
    {
      "sectionId": "camera",
      "content": "...",
      "reason": "..."
    }
  ],
  "warnings": []
}
```

Unknown section IDs are rejected.

The AI controller has no project-apply function.

## Staged diff and Apply boundary

AI output appears in a staged diff panel.

For every changed section Studio shows:

- current text;
- proposed text;
- reason.

The user must explicitly press **Apply staged patch**.

Before Apply, Studio creates a local revision snapshot.

AI cannot:

- apply its own patch;
- write curated data;
- edit a source case;
- write GitHub;
- publish;
- clear Research risk;
- claim to have visually inspected a reference that was not actually provided to a multimodal model.

## Project persistence

Projects use localStorage.

Namespaces:

- project index: `porterPromptStudio:index:v1`
- current project: `porterPromptStudio:current:v1`
- project: `porterPromptStudio:project:<id>`
- revisions: `porterPromptStudio:revisions:<id>`

Up to 25 local revisions are kept per project.

Reference binaries use IndexedDB, not localStorage.

## Open in Prompt Studio bridge

The source bridge adds `Open in Studio` / `В Prompt Studio` actions without changing the original renderers.

It decorates:

- curated cards by stable `data-digest-id`;
- Porter Originals by stable `data-id`;
- Research Corpus cards only when their visible title maps uniquely to one current candidate.

If a Research title is ambiguous, the bridge refuses to guess and does not add the action.

The full source library inside Prompt Studio remains available regardless.

## Public browser API

Prompt Studio exposes a small non-mutating integration surface:

```js
window.porterPromptStudio.open()
window.porterPromptStudio.openSource({ kind, id })
window.porterPromptStudio.getProject()
window.porterPromptStudio.compile()
window.porterPromptStudio.lint()
```

`openSource` creates a Studio fork. It never edits the source item.

## CI / production invariants

Prompt Studio has dedicated Node 20/22/24 CI.

Contracts verify:

- exact 100 curated source inventory;
- all 192 Porter Originals;
- canonical 13-section project shape;
- reference requirements by mode;
- legacy reference conversion;
- Research excerpt/provenance separation;
- Research risk preservation;
- camera conflict detection;
- patch unknown-section rejection;
- patch isolation;
- deterministic rules fallback;
- structured AI patch schema;
- custom rules supplied to AI;
- AI controller has no Apply path;
- local assets use IndexedDB and no upload endpoint;
- no embedded OpenAI/Gemini cloud API secret path;
- source bridge does not mutate curated datasets;
- Pages publishes all Studio assets;
- exact-100 browser renderer remains unchanged.

## v1 deliberate limits

Prompt Studio v1 does not yet:

- run Seedance generation itself;
- upload media to a cloud backend;
- send images into a multimodal AI editor;
- package IndexedDB media blobs into project export;
- automatically choose a model/provider;
- automatically apply AI edits;
- write projects to GitHub.

Those should be separate explicit capabilities, not accidental side effects of the editor.
