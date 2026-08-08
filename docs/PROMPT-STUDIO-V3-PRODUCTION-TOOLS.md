# Prompt Studio v3 — Production Tools

Prompt Studio v3 adds a structured production graph on top of the v1 editor and v2 Rule Packs.

The three tools are deliberately staged:

- Variables
- Ingredients
- Shot Timeline

Editing the tools does not mutate the active Prompt Studio project on every keypress.

The user explicitly applies the staged tools draft through the v2 project mutation API. One Apply creates one revision.

## Variables

Project variables use stable keys such as:

- `product`
- `material`
- `camera_move`
- `endpoint_hold`

Template syntax:

```text
{{product}}
```

Variable keys are immutable after creation in v3. This is deliberate: renaming a key can silently break section/ingredient templates. Delete and recreate the variable instead.

Variable values and descriptions remain editable.

### Explicit resolution

Variables are never silently resolved across prompt sections.

The user can:

- use variables inside ingredient templates;
- explicitly resolve variables in the active section;
- insert a resolved ingredient into a target section.

Unresolved variables block ingredient insertion by default.

## Ingredients

Ingredients are reusable production blocks.

Types:

- subject
- environment
- composition
- camera
- action
- lighting
- material
- style
- continuity
- constraint
- avoid
- other

Each ingredient stores:

- label
- type
- default target section
- template
- tags

Templates may use project variables.

### Starter ingredients

v3 ships starter blocks for:

- product geometry lock
- one dominant camera rule
- material physics
- stable endpoint
- character identity lock
- UI legibility hierarchy

### Shared Ingredient Library

Project ingredients are local to the active project.

A useful project ingredient can be copied into the shared local Studio library.

Shared storage namespace:

`porterPromptStudio:ingredientLibrary:v1`

The shared library remains browser-local and has no cloud request path.

## Shot Timeline

The timeline stores structured beats independently from the free-form Timing section.

Each beat has:

- stable ID / order
- label
- shot type
- duration
- purpose
- camera
- action/state change
- reference tokens
- notes
- enabled/disabled state

Shot types include establishing, wide, medium, close-up, macro, overhead, POV, tracking, packshot, interface, transition and custom.

## Timeline duration

The timeline displays total enabled beat duration against the project duration.

`Fit duration` proportionally scales enabled beats to the project duration and corrects the final rounding delta on the last beat.

## Timeline lint

The independent timeline lint checks:

- duration mismatch;
- excessive beat density;
- extremely short beats;
- missing beat purpose/action;
- multiple competing camera moves in one beat;
- unresolved `@refXX` tokens.

Timeline lint does not modify the timeline.

## Explicit Timing sync

Structured timeline metadata does not silently replace the Prompt Studio Timing section.

The user explicitly chooses:

`Sync → Timing`

The compiler emits one line per enabled beat:

```text
Beat 1 — 00:00.0–00:02.0 | Shot: packshot | Purpose: establish identity | Camera: locked | Action: ... | Refs: @ref01
```

Only the Timing section and timeline sync metadata change.

All other prompt sections remain untouched.

A sync creates a normal Prompt Studio revision through `replaceProject()`.

## Import Timing

Existing structured Timing lines can be imported into the staged timeline.

If Timing is free-form rather than structured, Studio creates a conservative beat list from its lines instead of pretending to understand a production hierarchy that is not present.

## Staged tools model

The Production Tools plugin keeps its own draft state.

Regular inputs only modify that draft.

Core Prompt Studio project mutation happens only on explicit actions:

- Apply tools
- Resolve active section
- Insert ingredient
- Sync Timeline → Timing

The plugin never reaches into Prompt Studio private `state.project`.

## Extension schema

`schemas/prompt-studio-production-tools.schema.json`

defines optional:

- `variables`
- `ingredients`
- `timeline`

The original Prompt Studio v1 project kind remains unchanged.

## Safety boundaries

v3 cannot:

- auto-resolve project variables across all sections;
- auto-insert ingredients;
- auto-sync Timeline to Timing;
- mutate private Prompt Studio state;
- simulate hidden click/change events for project mutation;
- mutate curated cases;
- alter the exact-100 contract;
- upload shared ingredients to a cloud service.

## CI

Node 20/22/24 CI validates:

- variable normalization/resolution;
- unresolved blocking;
- ingredient target-section isolation;
- starter ingredients;
- timeline fitting/ranges;
- Timeline → Timing isolation;
- structured Timing import;
- unresolved beat reference lint;
- per-beat camera overload lint;
- staged production-tools mutation boundary;
- local-only shared ingredient library;
- Pages/module publication;
- exact 100 curated + 192 Porter Originals baseline.
