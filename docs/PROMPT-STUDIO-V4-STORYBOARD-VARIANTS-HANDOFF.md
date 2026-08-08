# Prompt Studio v4 — Storyboard, Variants and Generation Handoff

Prompt Studio v4 turns the structured prompt editor into a visual production planning and handoff environment. It is deliberately built as extensions over the v1–v3 public API and does not access private Prompt Studio state.

## 1. Visual Storyboard

Storyboard is linked to the structured Shot Timeline by stable beat IDs.

Each Storyboard card contains:
- beat ID;
- enabled state;
- label;
- frame role: keyframe / start / middle / end / transition;
- frame intent;
- composition;
- visible action/state;
- continuity note;
- `@refNN` reference tokens;
- notes.

`Rebuild from Timeline` creates one card for every enabled Timeline beat. Existing cards for the same beat ID keep manual annotations instead of being overwritten. Removed beats become disabled orphan cards by default so editorial work is not silently destroyed.

Storyboard lint detects:
- missing cards;
- Timeline beats with no card;
- orphaned cards;
- duplicate cards for one beat;
- missing frame intent;
- missing action/state;
- missing visual reference;
- unresolved `@refNN` tokens.

Storyboard tracks a Timeline fingerprint and reports whether the visual plan is still synchronized with the current Timeline.

### Reference previews

Storyboard never copies image/video binaries into project JSON. It reuses the existing Prompt Studio Reference Manager:
- URL references display directly;
- local references resolve through the existing IndexedDB asset store;
- object URLs are revoked when project/context changes;
- no upload endpoint is introduced.

Storyboard editing is staged. The core project is updated only by explicit `Apply Storyboard`, which calls the public `replaceProject()` API with a revision snapshot.

## 2. Variants / A-B

Variants are designed for prompt strategy comparison without duplicating whole projects.

The first initialization freezes one lightweight base projection containing only generation-relevant state:
- mode;
- aspect;
- duration;
- model profile;
- custom rules;
- canonical section enabled/content state;
- variables;
- Timeline extension.

It intentionally excludes:
- source provenance;
- references and local media;
- Storyboard;
- revision history;
- project IDs;
- UI state.

Every captured variant stores only a delta from that frozen base. Maximum: 20 variants.

Variant operations:
- Initialize base;
- Capture current;
- Rename;
- Compare A ↔ B;
- Delete non-base variant;
- Promote variant;
- Promote + mark Winner.

Comparison reports changed sections and changed top-level generation fields. Materialization is deterministic: frozen base + selected delta.

`Promote` is explicit and revisioned. Variant capture/rename/delete only change variant metadata and do not create prompt revisions.

A workflow guard blocks Variant mutations while a Storyboard draft is staged. The user must first Apply or Discard the Storyboard draft, preventing hidden loss of visual planning work.

## 3. Generation Handoff

Generation Handoff is a provider-neutral, integrity-bound export package. It does not execute generation.

The package includes:
- project identity and generation settings;
- sanitized source provenance;
- compiled Prompt Studio prompt;
- reference manifest with roles/locks/availability;
- Timeline score, issues and duration summary;
- Storyboard score, coverage and cards;
- Prompt Studio lint result;
- blocker/warning list;
- readiness status;
- explicit execution policy;
- SHA-256 integrity hash.

Statuses:
- `ready` — no blockers or warnings;
- `needs-review` — no hard blockers, but warnings/local-only refs/etc. remain;
- `blocked` — prompt/timeline/storyboard hard errors or unresolved template variables.

Reference availability:
- `url` — portable URL reference;
- `local-browser` — valid local IndexedDB asset but not portable outside this browser;
- `missing` — no usable media location.

The handoff never embeds local binary assets.

### Safety policy

Every handoff hard-codes:
- `autoGenerate:false`;
- `autoUpload:false`;
- `autoPublish:false`;
- `autoGitHubWrite:false`;
- `clientSecrets:false`;
- `requiresExplicitExternalExecution:true`.

No OpenAI/Gemini/Seedance API key or provider endpoint is added to browser code.

### Integrity

The handoff core is canonicalized with `stable-json-v1` and hashed with SHA-256 using WebCrypto. `verifyPromptStudioGenerationHandoff()` recomputes the hash and rejects tampering.

Export surfaces:
- JSON package;
- plain Agent Brief;
- copy JSON;
- copy Agent Brief.

## 4. Persistence

The v3 store was made extension-safe before v4. Unknown extension fields survive:
- save/load;
- revision restore;
- duplicate;
- JSON export/import.

Therefore `storyboard` and `variants` are preserved without core-store surgery.

## 5. Production UI architecture

New modules:
- `prompt-studio-storyboard.js` — Storyboard engine;
- `prompt-studio-variants.js` — A/B delta engine;
- `prompt-studio-generation-handoff.js` — handoff builder/verifier;
- `prompt-studio-v4-workflow-guard.js` — cross-draft safety boundary;
- `prompt-studio-v4-ui.js` — Storyboard / Variants / Handoff dock;
- `prompt-studio-v4-bootstrap.js` — CSS + plugin mount;
- `prompt-studio-v4.css` — production UI styles.

Mount order:
1. Prompt Studio core;
2. Rule Packs;
3. v3 Production Tools;
4. v4 Storyboard / Variants / Handoff;
5. global Command Palette.

V4 uses only:
- `window.porterPromptStudio.getProject()`;
- `window.porterPromptStudio.replaceProject()`;
- existing Reference Manager asset APIs.

It never reaches into core private `state.project`.

## 6. CI and deployment

V4 has Node 20/22/24 CI covering:
- base TypeScript/tests;
- v1 Prompt Studio baseline;
- v2 Rule Pack baseline;
- v3 extension persistence baseline;
- v4 engine behavior;
- v4 production wiring;
- generalized Pages module graph;
- protected exact-100 browser render;
- syntax checks.

Pages publication remains bulk top-level `studio/*.js` / `studio/*.css`; v4 assets therefore publish through the same module-graph contract.

Protected invariants remain:
- exactly 100 unique curated cases;
- 192 Porter Originals;
- no automatic curated mutation;
- no automatic generation/upload/publish;
- no client-side cloud secrets.
