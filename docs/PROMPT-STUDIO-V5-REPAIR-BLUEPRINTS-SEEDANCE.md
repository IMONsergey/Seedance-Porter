# Prompt Studio v5 — Repair Center, Blueprints and Seedance 2.0 Export

V5 closes the gap between structured authoring and a repeatable production workflow. It adds targeted lint repair, reusable project Blueprints and a provider-specific Seedance 2.0 export adapter without adding browser-side provider requests or API secrets.

## Repair Center

Repair Center combines Prompt Studio, Shot Timeline and Visual Storyboard lint into one issue list. Every issue is classified as a safe section patch, a deterministic project-level repair, or a manual/AI-assisted issue that requires explicit judgment.

Safe repairs include camera conflict cleanup, continuity/constraint strengthening, Timeline fit-to-duration, Storyboard rebuild from Timeline and an object-level `locked:true` repair when an attached identity/geometry reference is known but not locked. The Repair Center does not fake media fixes by adding prose: legacy `[Image N]` / `[Video N]` mappings, missing exact-graphics references, unresolved media mappings and missing beat references remain manual.

Missing objective/action may use the existing local Prompt Studio AI controller, but the returned structured patch is revalidated against the issue-specific allowed section set. No Repair proposal auto-applies. Apply uses the public Prompt Studio mutation API and creates a revision first.

## Cross-layer staged-work guard

V5 coordinates v4 Storyboard and v5 Repair as separate staged layers. A dirty Storyboard blocks Repair staging/apply, Blueprint mutations and Seedance export. A staged Repair blocks project switching/fork/restore/import/export/delete, Blueprints/Seedance navigation, direct public `openSource()` and Storyboard editing. Any other project mutation invalidates a staged Repair proposal.

A dedicated JSDOM behavioral contract proves capture-phase blocking and clean-state recovery.

Generation Handoff also verifies the committed Storyboard against the current Timeline fingerprint. If Timeline content changes after Storyboard review, the Handoff is blocked with `storyboard-timeline-out-of-sync`; V5 never silently rebuilds the Storyboard. The user must explicitly reconcile the two layers before provider execution export becomes ready again.

## Project Blueprints

Built-ins:
1. Product Precision
2. Character Continuity
3. UI / Interface Motion
4. First / Last Frame Transition
5. Multimodal Reference Ad
6. General Production

Blueprints may include generation settings, custom rules, section templates, variables, Ingredients, optional Timeline state and required-reference-role hints. They deliberately exclude source provenance, attached references/media, Storyboard and Variants.

`Fill empty only` preserves project settings, extensions and all populated sections. `Apply full Blueprint` explicitly applies Blueprint settings/sections and may merge Blueprint Variables/Ingredients/Timeline, while still preserving provenance and attached references. `New project from Blueprint` creates a new project ID.

All built-in Blueprints reference canonical Prompt Studio profile IDs; UI / Interface Motion uses `ui-motion`. Lookup also carries explicit `builtin:true|false`, so custom templates can be deleted safely while built-ins remain immutable.

Custom Blueprint library namespace: `porterPromptStudio:blueprints:v1`. Maximum custom Blueprints: 100. No cloud storage is used.

## Seedance 2.0 ModelArk adapter

The adapter profile was verified against BytePlus / ModelArk official Seedance documentation current on 2026-08-08.

Verified model: `dreamina-seedance-2-0-260128`

Task endpoint: `https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks`

Verified profile:
- up to 9 images;
- up to 3 videos;
- up to 3 audio references at API level;
- duration 4–15 seconds or `-1` automatic;
- ratios `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9`, `adaptive`;
- resolutions `480p`, `720p`, `1080p`, `4k` for the verified Seedance 2.0 standard profile;
- `generate_audio`, `return_last_frame`, `watermark`, and priority 0–9 supported.

The verified 2.0 profile explicitly rejects `seed`, `camera_fixed`, `frames`, `draft`, and configurable `service_tier`.

## Reference translation

Prompt Studio Handoff uses stable `@refNN` tokens. The adapter assigns provider-native media indexes and rewrites the prompt to `[Image N]` / `[Video N]`.

Image role mapping:
- `first-frame` → `first_frame`;
- `last-frame` → `last_frame`;
- ordinary identity/geometry/style/material/etc. → `reference_image`.

Video references use `reference_video`.

Local-browser-only or missing media cannot become a portable ModelArk payload and block provider export.

## Provider preflight

The adapter first verifies the v4 Generation Handoff integrity and safety policy. It blocks tampered/blocked Handoffs, stale Storyboard/Timeline state, unsupported options, invalid duration/resolution/ratio/priority, too many references, unsupported reference media, non-portable references, incomplete first/last-frame roles and unmapped `@refNN` tokens. Invalid parameters are not silently clamped. Provider-neutral Handoff warnings are preserved in the Seedance export instead of disappearing at the adapter boundary.

## Export only

Provider bundle policy is hard-coded:
- `autoSubmit:false`
- `apiKeyEmbedded:false`
- `networkRequest:false`
- `requiresExternalExecution:true`

The browser contains no ModelArk submission path. Export surfaces are diagnostic/provider JSON, cURL using `$ARK_API_KEY`, and a Node/server snippet using `process.env.ARK_API_KEY`. cURL and Node execution snippets are refused when the bundle is blocked; diagnostic JSON remains available for debugging.

A behavioral regression installs a `globalThis.fetch` sentinel and proves that building provider exports or snippets performs zero actual provider network calls in the browser-side adapter.

## Official sources

- BytePlus ModelArk API Reference: `https://docs.byteplus.com/en/docs/ModelArk/1520757`
- BytePlus ModelArk Generate videos with Seedance 2.0: `https://docs.byteplus.com/en/docs/ModelArk/2222480`
- BytePlus ModelArk video generation / migration context: `https://docs.byteplus.com/en/docs/ModelArk/2291680`
- ByteDance Seed — Seedance 2.0 official launch: `https://seed.bytedance.com/en/blog/seedance-2-0-official-launch`

Provider capability data is isolated in `SEEDANCE2_MODELARK_PROFILE` so future official API changes can be reviewed without rewriting the whole adapter.

## Production architecture

New modules:
- `prompt-studio-repair.js`
- `prompt-studio-blueprints.js`
- `prompt-studio-seedance-adapter.js`
- `prompt-studio-v5-workflow-guard.js`
- `prompt-studio-v5-ui.js`
- `prompt-studio-v5-bootstrap.js`
- `prompt-studio-v5.css`

V5 mounts after v4 and before Cmd-K. GitHub Pages runs the v5 engine, workflow-guard and production contracts before the protected exact-100 browser render. V5 CI runs on Node 20/22/24 and syntax-checks the changed Handoff/runtime surface.

Protected invariants remain: exactly 100 unique curated cases, 192 Porter Originals, no automatic curated mutation, no automatic AI patch apply, no provider browser submission, and no client-side provider credentials.
