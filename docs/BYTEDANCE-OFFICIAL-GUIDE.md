# ByteDance Official Seedance Prompting Standard

Source of truth for Porter prompt generation and project validation.

## Official sources

1. BytePlus ModelArk — **Dreamina Seedance 2.0 series prompt guide**
   - https://docs.byteplus.com/en/docs/ModelArk/2222480
   - Official prompt methodology and troubleshooting guide.
   - Porter source snapshot checked: 2026-08-07. The official page currently shows **Last updated: 2026-07-17**.
2. BytePlus ModelArk — **Dreamina Seedance 2.0 series tutorial**
   - https://docs.byteplus.com/en/docs/ModelArk/2291680
   - Official capability/workflow tutorial, including reference asset and identity/real-person usage rules.
3. BytePlus ModelArk — **Create a video generation task**
   - https://docs.byteplus.com/en/docs/ModelArk/1520757
   - Official API contract: request modes, media roles/limits, prompt length guidance, output resolution rules and provider-specific parameter support.
4. ByteDance Seed — **Seedance 2.0 Official Launch**
   - https://seed.bytedance.com/en/blog/seedance-2-0-official-launch
   - Official model capability statement and first-party prompt examples.

No dedicated official BytePlus/ByteDance Seed prompt guide for Seedance 2.5 was verified during the 2026-08-07 research pass. Porter therefore applies the latest verified Seedance 2.0 first-party methodology as the conservative baseline to preview 2.5 routes until ByteDance publishes model-specific guidance.

## The official mental model

BytePlus describes Seedance 2.0 as a multimodal AI director that separates a request into a **spatial layer** (what is in the frame) and a **temporal layer** (how things change over time). A good prompt is an engineering instruction, not advertising copy.

Official advanced formula:

> precise subject + action details + scene/environment + lighting & color tone + camera movement + visual style + image quality + constraints

Porter compiles projects in that order and validates each dimension.

## Porter Official Standard (BOS-2026-07-17)

### BOS-01 — Define subjects precisely

For referenced people, products, logos, props or other core subjects:

- bind the subject to its source asset explicitly;
- describe 2–3 clear, stable static features so the subject can be uniquely identified;
- keep the same subject label throughout the prompt;
- keep definitions concise and non-contradictory;
- prefer separate clean reference images over one collage mixing face, pose, outfit and detail references.

Porter encodes this structurally. `identity`, `product` and `logo` references must include:

- `anchors`: exactly 2–3 stable identifying features;
- `note`: the explicit job/source responsibility of that asset.

Example:

```json
{
  "role": "product",
  "faceSource": "none",
  "anchors": [
    "tall dark-green cylindrical body",
    "short neck with unchanged cap proportions",
    "matte low-reflection finish"
  ],
  "note": "Exact product geometry and material source"
}
```

### BOS-02 — Complex videos use ordered shots, not rigid timestamps

For complex prompts, BytePlus recommends a timeline storyboard expressed as `Shot 1`, `Shot 2`, `Shot 3`, etc.

Exact timing such as `0–3 seconds` is explicitly described as unstable for Seedance 2.0 and can cause abnormal results. Porter may keep start/end timing internally for planning and budgets, but the compiled model prompt uses **ordered Shot N blocks without exact seconds**.

Each shot is organized as:

1. camera movement or shot transition;
2. subject action and expression;
3. position/spatial change;
4. audio information.

### BOS-03 — Actions are physical and measurable

Describe action with visible mechanics:

- identify the body part or object component involved;
- describe degree, speed or force where useful;
- specify transitions/inertia between sequential actions;
- prefer slow, gentle, coherent movements when the creative intent allows it;
- express emotion through visible behavior instead of abstract adjectives.

Examples of useful action language: `slowly raises the right hand`, `slightly lowers the head`, `pushes firmly off the ground`, `turns and uses that inertia to naturally raise the arm`.

### BOS-04 — One camera movement per shot

Seedance understands professional camera language directly. Use normal terms such as wide shot, medium shot, close-up, fixed shot, slow push-in or smooth lateral tracking.

The official guide warns against combining many movement instructions in one shot. Porter treats clearly compounded camera movement as a blocking compliance error.

### BOS-05 — Complete the control dimensions

Every production project should explicitly control:

- scene/environment;
- lighting and color tone;
- visual style;
- image-quality intent;
- constraints.

Porter supplies a conservative image-quality default when none is provided, but does not silently invent a visual style for a project.

### BOS-06 — Give every reference one job

Official reference patterns:

- image: use a subject/scene/composition/style from `Image N`;
- video: use action, camera movement, style, special effects or sound from `Video N`;
- audio: use timbre/rhythm/atmosphere from `Audio N`.

Porter requires a role for every asset and renders an explicit reference contract. The canonical compiler uses human-readable `[Image 1]`, `[Video 1]`, `[Audio 1]` bindings; provider adapters translate syntax only where a provider route requires another spelling.

### BOS-07 — Do not fill every reference slot by default

BytePlus groups assets into four practical functions:

1. character anchoring;
2. scene tone-setting;
3. camera/action reference;
4. rhythmic atmosphere/audio.

Its recommended production configuration is usually **4–5 assets total**: 1–2 character images, 1 scene image, 1 camera movement video and 1 audio clip. The guide warns that using too many materials makes priority ambiguous and can cause style conflict, weak subject identification and deviation.

Porter warns when a project exceeds five references even when the API technically allows more.

### BOS-08 — Constraints and output intent are explicit

Default output policy is:

```json
{
  "generatedText": "forbid",
  "generatedLogo": "forbid",
  "generatedWatermark": "forbid"
}
```

The compiler adds relevant no-subtitle/no-unrequested-text/no-logo/no-watermark constraints. If the creative brief actually requires generated text or logos, the project must declare that intent explicitly.

For strict logo use, `generatedLogo: "reference-only"` requires a dedicated `role: "logo"` asset with 2–3 stable anchors. This reflects the official recommendation to use a logo/image reference when strict logo/text presentation matters.

For multiple identity references, Porter adds an anti-duplicate/twin-character constraint.

### BOS-09 — Text/dialogue has structure

The guide recommends explicit information types:

- music: parentheses;
- sound effects: angle brackets;
- dialogue: braces;
- subtitles: dedicated subtitle notation.

It also recommends keeping dialogue language consistent and avoiding unnecessary language mixing. Porter preserves authored dialogue rather than silently rewriting it; dialogue-specific linting can evolve separately from the base project schema.

### BOS-10 — Choose extension vs segmented generation by story function

Official recommendation:

- extension/continuous take: conversations, emotional progression and movement along one continuous path;
- separate clips + edit: plot turns, chases, fights, montages and other complex/high-energy transitions.

Porter continuity follows the same principle: continue only from accepted footage and use actual observed end state; split major action or scene turns into separate generations.

### BOS-11 — Known failure mitigation is encoded

Porter surfaces or encodes mitigations for:

- unwanted subtitles/logos/watermarks;
- style drift;
- character ID drift/twin duplication;
- special effects that need a reference video instead of prose;
- voice-reference mismatch;
- quality degradation after repeated continuation;
- join glitches that may need post-production trimming/alignment.

These are a mix of compiler constraints, project workflow rules and troubleshooting guidance; not every failure mode can be detected statically before generation.

### BOS-12 — Official prompt/API parameter boundaries

The ModelArk create-task documentation recommends prompts below **1000 words** because long prompts scatter attention and can cause missing details. Porter uses this as an official hard ceiling and maintains a tighter internal advisory range for production efficiency.

The same official contract currently marks `seed` as **unsupported for Seedance 2.0 models** on the direct ModelArk route. Therefore Porter does not allow deterministic seed sweeps on verified BytePlus Seedance 2.0 routes. Seed variants remain available only on provider routes that explicitly advertise seed control.

### BOS-13 — Every BytePlus visual reference declares face provenance

The official tutorial states that direct reference inputs containing real human faces are not treated like arbitrary normal reference uploads. ModelArk exposes supported paths such as:

- trusted ModelArk-generated outputs;
- preset digital characters;
- registered/authorized real-person assets.

Because a real face can appear in an identity image, scene image, first/last frame or reference video, Porter requires `faceSource` for **every image/video reference** when the provider is BytePlus. This is intentionally stricter than checking only `role: identity`; it prevents accidental unsupported real-face inputs from being hidden inside another reference role.

Allowed declarations:

- `none` — no human face in the asset;
- `synthetic` — synthetic human-like character, not a real-person reference;
- `non-human`;
- `modelark-trusted-output`;
- `preset-digital-character`;
- `authorized-real-person`.

Example:

```json
{
  "kind": "image",
  "role": "environment",
  "faceSource": "none"
}
```

`preset-digital-character` and `authorized-real-person` must use the registered ModelArk asset flow (`asset://...`). A `modelark-trusted-output` declaration is still subject to provider-side account/eligibility/trust-window validation.

The earlier `identitySource` field remains only as a compatibility alias for early v0.3 identity files; new projects use `faceSource`.

### BOS-14 — Keep first/last-frame and multimodal reference API scenarios separate

The official ModelArk API treats strict first/last-frame generation and multimodal reference generation as different request scenarios.

Porter enforces:

- strict `first-last-frame`: exactly one `first_frame` image + one `last_frame` image, with no video/audio package mixed in;
- `image-to-video`: one starting image on the direct BytePlus route;
- `reference-to-video`: multimodal/multi-image package, where image/video/audio media are sent with `reference_image`, `reference_video`, `reference_audio` API roles while the prompt carries their semantic jobs.

If a creative wants a semantic endpoint image together with other references, Porter uses reference-to-video rather than falsely sending that package as strict first/last interpolation.

## Enforcement

`compileProject()` returns an `officialCompliance` report containing the standard ID, source date, pass/fail state, blocking violations, advisories and applied normalization.

`porter validate <project>` prints only this report and exits non-zero on a blocking violation.

`generateProject()` calls `assertOfficialCompliance()` **before provider creation/submission**, so a project with blocking BOS violations cannot spend generation credits through Porter.

Every generated `.porter.json` sidecar stores the `officialCompliance` report used for that generation.

This creates two layers:

- **Official compliance:** source-dated rules directly grounded in ByteDance/BytePlus documentation.
- **Porter best practice:** stricter empirical recommendations that may evolve from our own generation benchmarks.

The two must not be conflated. First-party guidance always remains separately identifiable and source-dated.
