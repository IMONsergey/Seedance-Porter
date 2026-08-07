# Case Intelligence Library — production analysis standard

Seedance Porter should not become a flat prompt dump. Every source case that enters the long-term library must become a reusable production pattern with evidence, shot logic and an independent Porter adaptation.

## Target scale

- Phase 1: 100 deeply analyzed source cases
- Phase 2: 500 curated source cases
- Phase 3: 1,000 source cases with stable taxonomy and quality scoring

The target is breadth **and** analysis depth. Cases without enough evidence for a useful breakdown should not be promoted into the curated layer.

## Collection taxonomy

### Digital / Design
- Website Hero
- SaaS UI
- App Launch
- Dashboard
- Case Study Motion
- Brand Reveal
- Rebranding Transition
- Logo Motion
- Kinetic Type
- Interactive / Web3D

### Commercial
- Packshot
- Beauty
- FMCG
- Food
- Automotive
- Fashion
- Sports
- Luxury
- Electronics
- Real Estate

### Motion Language
- Camera
- Transitions
- Morphs
- Macro
- Material
- Loop
- Freeze
- Scale
- Match Cut
- First / Last Frame

A case may belong to multiple collections. Collections are faceted labels, not exclusive folders.

## Mandatory case schema

Every curated source case should contain:

- `id`
- `title`
- `author`
- `authorUrl`
- `sourceUrl`
- `archiveUrl` when available
- `previewUrl`
- `published`
- `model`
- `category`
- `collections[]`
- `tags[]`
- `originalExcerpt` — short attributable source excerpt, not a mirror of the full source
- `sourcePromptAvailable`
- `designScore`
- `productionScore`
- `evidenceLevel`
- `hook`
- `signatureMove`
- `whyItWorks`
- `shotBreakdown[]`
- `promptMechanics[]`
- `referenceStrategy[]`
- `cameraLanguage[]`
- `transitionLanguage[]`
- `materialLanguage[]`
- `audioRole`
- `postProductionExpectation`
- `transferablePattern`
- `failureRisks[]`
- `porterAdaptation`
- `variables`
- `bosNotes[]`

## Shot analysis standard

Every meaningful shot or temporal block is analyzed with:

```json
{
  "index": 1,
  "label": "Hook / Establishing",
  "sourceTiming": "0–3s",
  "framing": "macro close-up",
  "camera": "slow push-in",
  "action": "product material catches a moving highlight",
  "visualPurpose": "establish material quality before showing function",
  "promptCause": "macro + tactile material + one controlled camera move",
  "continuity": "same product geometry, same lighting direction",
  "whyThisShotExists": "creates perceived value before feature explanation"
}
```

`sourceTiming` is evidence metadata. Porter adaptations should still follow the current ByteDance BOS rule and prefer ordered `Shot N` blocks over brittle exact timestamps unless the provider/model specifically supports them reliably.

## Required analysis questions

For every case, answer:

1. What is the first-frame hook?
2. What are the actual shots / temporal blocks?
3. What changed between each shot?
4. Why did the author choose that framing or camera move?
5. Which prompt clauses most directly caused the visible result?
6. Which details are visual decoration versus structural instructions?
7. What carries continuity across the video?
8. What is the signature move or memorable visual device?
9. Why does the sequence feel premium / clear / viral / useful?
10. What is reusable without copying the original subject matter?
11. What should be rebuilt in post rather than trusted to the model?
12. What would most likely fail if the prompt were reused blindly?
13. How should Porter rewrite it to comply with BOS and reduce brittleness?

## Evidence levels

- `A` — source prompt + source preview/video + attributable creator/source available
- `B` — source prompt + preview, but incomplete process information
- `C` — strong visual case evidence but no reliable full prompt; useful mainly as motion/design reference

Only A/B cases should receive detailed `promptMechanics` claims. C cases can receive visual-analysis claims but must not invent the unseen prompt.

## Quality gates

A curated case cannot ship if:

- source URL is missing;
- author attribution is missing when known;
- preview/evidence is missing;
- collections are empty;
- `shotBreakdown` has fewer than two meaningful beats for multi-shot work;
- `whyItWorks` is generic;
- `signatureMove` is missing;
- Porter adaptation is merely a paraphrase of the source prompt;
- BOS notes are absent;
- claims about unseen production steps are presented as facts.

## Use this pattern for my project

The user flow should be:

1. Open a case.
2. Understand source + shot breakdown + production reasoning.
3. Click **Use this pattern**.
4. Enter project context: product / brand / website / campaign goal.
5. Upload or specify references.
6. Porter maps source pattern into:
   - project objective;
   - recommended reference roles;
   - identity/product/logo anchors;
   - ordered `Shot N` plan;
   - camera language;
   - output policy;
   - constraints;
   - independent adapted prompt.
7. Run official `BOS-2026-07-17` validation.
8. Export a valid Porter project JSON or continue into Production Studio.

The transformation must preserve **production logic**, not original creative subject matter or distinctive wording.

## Research source classes

Priority order for scaling:

1. ByteDance / BytePlus official examples and guides.
2. Public prompt libraries with source video/preview and direct attribution.
3. YouMind Seedance corpus and high-signal creator posts.
4. Curated GitHub Seedance libraries with linked media.
5. Behance / Awwwards / agency case studies for digital-design motion patterns.
6. Commercial AI-video platforms for workflow taxonomy, not authority.

## Current market signal (verified 2026-08-07)

- YouMind exposes a very large, frequently updated image/video prompt library and a dedicated Seedance collection.
- Public GitHub Seedance libraries range from hundreds to several thousand examples.
- Current design-case evidence shows hybrid workflows: Seedance footage combined with After Effects/UI motion/post-production rather than one-click final delivery.

This makes 500–1,000 cases achievable, but curation and analysis depth are the actual constraint.
