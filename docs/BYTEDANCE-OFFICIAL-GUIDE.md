# ByteDance Official Seedance Prompting Standard

Source of truth for Porter prompt generation and project validation.

## Official sources

1. BytePlus ModelArk — **Dreamina Seedance 2.0 series prompt guide**
   - https://docs.byteplus.com/en/docs/ModelArk/2222480
   - Official prompt methodology and troubleshooting guide.
   - Porter source snapshot checked: 2026-08-07. The English page surfaced an update timestamp of 2026-07-31.
2. BytePlus ModelArk — **Dreamina Seedance 2.0 series tutorial**
   - https://docs.byteplus.com/en/docs/ModelArk/2291680
   - Official capability/workflow tutorial.
3. BytePlus ModelArk — **Create a video generation task**
   - https://docs.byteplus.com/en/docs/modelark/1520757
   - Official API contract; recommends prompts below 1000 words and points back to the Seedance 2.0 prompt guide.
4. ByteDance Seed — **Seedance 2.0 Official Launch**
   - https://seed.bytedance.com/en/blog/seedance-2-0-official-launch
   - Official model capability statement and first-party prompt examples.

No official BytePlus/ByteDance Seed prompt guide for Seedance 2.5 was found during the 2026-08-07 verification. Porter therefore applies the latest official Seedance 2.0 methodology as the conservative baseline to preview 2.5 routes until ByteDance publishes model-specific guidance.

## The official mental model

BytePlus describes Seedance 2.0 as a multimodal AI director that separates a request into a **spatial layer** (what is in the frame) and a **temporal layer** (how things change over time). A good prompt is an engineering instruction, not advertising copy.

Official advanced formula:

> precise subject + action details + scene/environment + lighting & color tone + camera movement + visual style + image quality + constraints

Porter compiles projects in that order and validates each dimension.

## Porter Official Standard (BOS-2026-07-31)

### BOS-01 — Define subjects precisely

For referenced people, products, props or other core subjects:

- bind the subject to its source asset explicitly;
- describe 2–3 clear, stable static features so the subject can be uniquely identified;
- keep the same subject label throughout the prompt;
- keep definitions concise and non-contradictory;
- prefer separate clean reference images over one collage mixing face, pose, outfit and detail references.

Porter requires a descriptive `note` for `identity` and `product` references. The note is treated as the stable-feature/source contract.

### BOS-02 — Complex videos use ordered shots, not rigid timestamps

For complex prompts, BytePlus recommends a timeline storyboard expressed as `Shot 1`, `Shot 2`, `Shot 3`, etc.

Exact timing such as `0–3 seconds` is explicitly described as unstable for Seedance 2.0 and can cause abnormal results. Porter may keep start/end timing internally for planning and budgets, but the default compiled model prompt uses **ordered Shot N blocks without exact seconds**.

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

The official guide warns against combining many movement instructions in one shot. Porter flags compound camera movement and blocks clearly overloaded instructions in strict generation mode.

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

Porter requires a role for every asset and renders an explicit reference contract. Provider adapters translate the canonical official-style tokens to provider-specific syntax where needed.

### BOS-07 — Do not fill every reference slot by default

BytePlus groups assets into four practical functions:

1. character anchoring;
2. scene tone-setting;
3. camera/action reference;
4. rhythmic atmosphere/audio.

Its recommended production configuration is usually **4–5 assets total**: 1–2 character images, 1 scene image, 1 camera movement video and 1 audio clip. The guide specifically warns that using too many materials makes priority ambiguous and can cause style conflict, weak subject identification and deviation.

Porter warns when a project exceeds five references even when the model API technically allows more.

### BOS-08 — Constraints are part of the prompt, not an afterthought

Default production constraints are added when applicable:

- avoid unwanted text/subtitles;
- avoid unwanted logos;
- avoid unwanted watermarks;
- prevent duplicated/twin characters in multi-character scenes;
- preserve product/subject identity and geometry.

A project that intentionally needs generated text/logo must declare that intent rather than fighting the default constraint set.

### BOS-09 — Text/dialogue has structure

The guide recommends explicit information types:

- music: parentheses;
- sound effects: angle brackets;
- dialogue: braces;
- subtitles: dedicated subtitle notation.

It also recommends keeping dialogue language consistent and avoiding unnecessary language mixing. Porter does not rewrite authored dialogue automatically, but its official validator flags ambiguous mixed-language or unstructured dialogue when detectable.

### BOS-10 — Choose extension vs segmented generation by story function

Official recommendation:

- extension/continuous take: conversations, emotional progression and movement along one continuous path;
- separate clips + edit: plot turns, chases, fights, montages and other complex/high-energy transitions.

Porter continuity follows the same principle: continue only from accepted footage and use actual observed end state; split major action or scene turns into separate generations.

### BOS-11 — Known failure mitigation is encoded

Porter should surface official mitigations for:

- unwanted subtitles/logos/watermarks;
- style drift;
- character ID drift/twin duplication;
- special effects that need a reference video instead of prose;
- voice-reference mismatch (describe voice characteristics and match line delivery style);
- quality degradation after repeated continuation;
- join glitches that may need post-production trimming/alignment.

### BOS-12 — Official prompt length ceiling

The ModelArk API documentation recommends prompts below **1000 words** because long prompts scatter attention and can cause missing details. Porter uses this as an official hard ceiling and maintains a tighter internal advisory range for production efficiency.

## Enforcement

`compileProject()` returns an `officialCompliance` report containing the standard ID, source date, pass/fail state, blocking violations, advisories and applied normalization.

`generateProject()` refuses a paid generation if blocking official-compliance violations remain.

This creates two layers:

- **Official compliance:** hard requirements directly grounded in ByteDance/BytePlus documentation.
- **Porter best practice:** stricter empirical recommendations that may evolve from our own generation benchmarks.

The two must not be conflated. First-party guidance always remains separately identifiable and source-dated.
