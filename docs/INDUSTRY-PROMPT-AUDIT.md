# Global AI Video / Motion Design Prompt Audit — 2026-08-07

This audit is the research layer behind Seedance Porter's two-part prompt product:

1. **Industry Digest** — real public examples with source preview, creator attribution, source/date metadata, a short original prompt excerpt, direct access to the full original, and a separate independently written Porter Adaptation.
2. **Porter Originals** — 192 reusable design-first templates derived from cross-industry production patterns rather than a single creator's wording.

The objective is not to hide provenance and not to create an unattributed mirror. The product should make the original creator **more visible**, while giving a designer a second, reusable Seedance-oriented prompt that can be remixed for another brief.

## Scope

Audit date: **2026-08-07**.

Research classes:

1. First-party model prompting and camera guidance.
2. Prompt corpora with explicit reuse/licensing signals.
3. Public prompt galleries used as source/reference indexes.
4. AI advertising and product-video tooling.
5. 2026 motion-design / SaaS / branding case studies.
6. Award-oriented interactive / web motion references.
7. Large prompt datasets and research.

The resulting library deliberately prioritizes **design, digital, product, SaaS, web hero, UI motion, branding, kinetic typography, packaging, campaign systems and case-study presentation** over generic cinematic-landscape prompting.

---

## Primary source map

### First-party / high-authority model guidance

| Source | Why it matters | URL |
|---|---|---|
| BytePlus ModelArk — Dreamina Seedance 2.0 prompt guide | Source-of-truth Seedance prompt structure, multimodal roles, failure mitigation, Shot N sequencing | https://docs.byteplus.com/en/docs/ModelArk/2222480 |
| BytePlus ModelArk — Seedance 2.0 tutorial | Multimodal reference packaging, prompt optimization skill, real-person asset flow | https://docs.byteplus.com/en/docs/ModelArk/2291680 |
| BytePlus ModelArk — video generation API | Actual provider contract, media roles, prompt limits, route-specific parameters | https://docs.byteplus.com/en/docs/ModelArk/1520757 |
| ByteDance Seed — Seedance 2.0 launch | First-party capability examples and multimodal positioning | https://seed.bytedance.com/en/blog/seedance-2-0-official-launch |
| Runway — Prompting Guide | Clear separation between visual components and motion components | https://academy.runwayml.com/guides/prompting-guide |
| Runway — Image-to-Video Prompting Guide | Image establishes appearance; text should spend attention on motion and temporal progression | https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide |
| Runway — Text-to-Video Prompting Guide | Direct language, natural timing, motion + scene structure | https://help.runwayml.com/hc/en-us/articles/47313737321107-Text-to-Video-Prompting-Guide |
| Runway — Camera Terms / Prompts / Examples | Practical camera-language reference library | https://help.runwayml.com/hc/en-us/articles/46749315925395-Camera-Terms-Prompts-Examples |
| Runway — Product Ad recipe | Product references → storyboard → ad-ready product video; directly relevant to commercial design | https://docs.dev.runwayml.com/recipes/product-ad/ |
| Runway Academy — AI for Advertising | Moodboards, concept, storyboard, previs, product shots, B-roll and talent/product placement | https://academy.runwayml.com/course/ai-advertising |
| Adobe Firefly — effective video prompts | Shot + subject + action + location + aesthetic, plus explicit camera and temporal language | https://helpx.adobe.com/uk/firefly/web/work-with-audio-and-video/work-with-video/writing-effective-text-prompts-for-video-generation.html |
| Adobe Firefly — motion reference | Use real footage for motion reference; reinforces reference-role discipline | https://helpx.adobe.com/uk/firefly/web/work-with-audio-and-video/work-with-video/match-camera-motion-to-reference-video.html |
| Google Flow | Current creative-studio pattern: storyboard, ingredients, frames, edit and custom tools in one workspace | https://labs.google/fx/tools/flow |
| Luma Dream Machine — best practices | Natural-language visual specificity and keyframe-oriented iteration | https://lumalabs.ai/learning-hub/best-practices |
| Luma Dream Machine — keyframes | First/end-frame transition as a distinct production primitive | https://lumalabs.ai/learning-hub/how-to-use-keyframes |

### Prompt corpora / galleries

| Source | Current signal (audit date) | Reuse treatment in Porter | URL |
|---|---|---|---|
| **YouMind OpenLab — Awesome Seedance 2 Prompts** | **5,741 prompts**, last updated 2026-08-07; repository carries **CC BY 4.0** badge; creator/X links and previews preserved | Primary attributed digest corpus. Porter still shows only a short original excerpt and sends the user to the creator/source for the full prompt; creator + corpus + license remain visible | https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts |
| **yangyuwen-bri — Seedance Prompt Library** | **4,493 prompts**, last updated 2026-08-07; public X collection with interactive gallery | Research/source index. README says public-tweet research/creative reference, but no explicit permissive license was found in the audit, so Porter does not bulk mirror prompt text | https://github.com/yangyuwen-bri/seedance-prompt-library |
| gracech0322 — Seedance 2 Prompt Library | Media-backed community prompt gallery | Research/source index unless per-item rights are clear | https://github.com/gracech0322-cmd/seedance-2-prompt-library |
| weshopai — Awesome Seedance 2.0 Prompt | Large media-heavy community collection | Research taxonomy / discovery source | https://github.com/weshopai/awesome-Seedance-2.0-prompt |
| LeaddeOpenLab — Awesome Seedance 2.0 Prompts | Community prompt collection | Research taxonomy / discovery source | https://github.com/LeaddeOpenLab/awesome-seedance2.0-prompts |
| Seedance Gallery | Searchable gallery organized by categories and aspect ratios | Source discovery / direct-link cards | https://seedance.gallery/ |
| Seedance2.tech Prompt Library | S-A-C-S-C framework and scenario templates | Pattern evidence; not first-party ByteDance guidance | https://seedance2.tech/prompts |
| Seedance Prompt Library Chrome extension | Search/favorite/copy UX for community prompts; useful product-pattern evidence | Interface benchmarking, not authority | https://chromewebstore.google.com/detail/seedance-prompt-library/ajfmdghpfbcmjgeekjfbefnbjlgdegfd |
| Seedance.tv practical prompt guides | Product, social, camera, SaaS and website-hero prompt examples | Useful field-guide/product evidence, explicitly unofficial; never outranks BOS | https://www.seedance.tv/blog/seedance-2-0-prompt-guide |
| Seedance.tv SaaS hero guide | Treats AI motion as product-led landing-page proof instead of decorative video | Strong digital-use-case signal, unofficial | https://www.seedance.tv/blog/seedance-saas-hero-videos-2026 |
| Seedance.tv website hero guide | Static UI/product screen → controlled short hero loop | Strong web-product signal, unofficial | https://www.seedance.tv/blog/seedance-website-hero-videos-2026 |

### AI advertising / commercial tooling

| Source | Why it matters | URL |
|---|---|---|
| Higgsfield Marketing Studio | Current market demand: UGC, professional product demos, TV spots, app demos, campaign formats | https://higgsfield.ai/marketing-studio-intro |
| Higgsfield Ads | Product-image-to-commercial template model; useful taxonomy of commercial shots | https://higgsfield.ai/blog/The-Fastest-Way-to-Create-Cinematic-Product-Commercials |
| Runway Product Ad recipe | Reference-image-driven product advertising workflow | https://docs.dev.runwayml.com/recipes/product-ad/ |
| Runway Academy AI Advertising | Campaign pipeline rather than isolated clip generation | https://academy.runwayml.com/course/ai-advertising |

### 2026 design / digital / motion case studies

| Source | Pattern extracted | URL |
|---|---|---|
| Animazzio Motion Design Showreel 2026 | Hero video, SaaS/product video, UI animation, Lottie and logo animation | https://www.behance.net/gallery/252033221/Motion-Design-Showreel-2026-Animazzio |
| SaaS Promo with AI Avatar | Seedance footage + custom SaaS UI motion / After Effects hybrid | https://www.behance.net/gallery/248941345/SaaS-Promo-with-AI-Avatar |
| AI motion graphic creatives | Seedance + Kling + Flow inside intentionally art-directed motion-design workflow | https://www.behance.net/gallery/251921431/AI-motion-graphic-creatives |
| Hyperbolic AI Motion Branding | Tech brand + nostalgic/nature visual identity translated to motion | https://www.behance.net/gallery/243104669/AI-Motion-Branding |
| Measure Brand Motion | Kinetic typography, logo motion, fluid transitions, rhythm | https://www.behance.net/gallery/244433487/Measure-Brand-Motion-and-Logo-animation |
| A1 Mobile Launch Video | SaaS launch: UI clarity, feature storytelling, social variants | https://www.behance.net/gallery/243834449/A1-Mobile-Launch-Video |
| Signal Motion Design Concept | Minimal compositions + 3D visual metaphors for structured communication | https://www.behance.net/gallery/246609067/Signal-Motion-Design-Concept |
| Digital Rush Rebranding Animation | Old-to-new identity transition, concise digital-platform brand reveal | https://www.behance.net/gallery/243273181/Digital-Rush-Rebranding-Animation |
| Hybrid Logo Reveal | Greybox / procedural foundation → AI detailing → AE compositing | https://www.behance.net/gallery/243175145/Hybrid-Logo-Reveal-%28Generative-AI-Motion-Design%29 |
| Adidas AI Film | Seedance + Kling + post + sound design product-film workflow | https://www.behance.net/gallery/250625515/Adidas-AI-Film |
| AI-assisted Streetwear Motion Reel | Generative ideation embedded in manually art-directed brand motion | https://www.behance.net/gallery/243682267/AI-Assisted-Motion-Reel-for-Streetwear-Brand |
| Docusign Brand — Awwwards | Rebrand storytelling through interactive typography, abstract imagery and depth | https://www.awwwards.com/sites/docusign-brand |
| Bezier Animation Studio — Awwwards | Motion-first studio presentation, curve language, portfolio-as-motion-system | https://www.awwwards.com/sites/bezier-animation-studio |

### Research / design-space evidence

- **Seedance 2.0 technical report** — first-party model capability and multimodal evaluation context: https://arxiv.org/abs/2604.14148
- **VidProM** — 1.67M unique real text-to-video prompts / large-scale prompt diversity evidence: https://arxiv.org/abs/2403.06098
- **Prompting for products** — product-design exploration research showing prompt structure matters differently for feasibility/novelty/aesthetics: https://arxiv.org/abs/2408.03946
- **From Prompt to Production** — 2026 brand-safe marketing imagery research emphasizing automated generation plus human quality oversight: https://arxiv.org/abs/2602.13349

---

## What the audit says

### 1. There is a clear product gap between “prompt galleries” and “design production”

Most large public Seedance corpora are rich in cinematic scenes, anime, comedy, action and social experimentation. They are valuable for breadth, but **web hero motion, SaaS/UI, motion identity, packaging systems and case-study transitions are underrepresented** relative to how much design teams actually need them.

Porter therefore should not clone the taxonomy of a generic video gallery. Design/digital is the product wedge.

### 2. The high-value commercial unit is becoming a short reusable motion asset

Current product/design signals repeatedly point toward:

- website hero loops;
- product launch snippets;
- feature-specific SaaS/UI motion;
- product/pack feature macros;
- social variants;
- motion identity / logo systems;
- short case-study transition assets.

A good library entry should therefore say **where the clip is used**, not merely what it looks like.

### 3. Hybrid is stronger than “AI did everything”

The strongest design cases repeatedly use AI as one controlled layer:

1. establish product / UI / logo geometry first;
2. use generative video for motion, transitions, atmosphere or impossible shots;
3. finish typography, UI, logo fidelity, timing, sound and compositing in AE / C4D / Premiere / Resolve.

Every Porter adaptation includes a production/post expectation instead of pretending that stochastic output is always the final asset.

### 4. Reference role discipline is a universal pattern

BytePlus, Adobe, Runway and real production workflows converge on the same principle: **each reference should have one job**. The library exposes identity, product, environment, motion, camera, style, audio and endpoint roles instead of treating “reference image” as one generic bucket.

### 5. Image-to-video prompts should not redundantly redescribe the image

If the image already defines product, composition, palette and art direction, the prompt should spend its attention on **motion, camera, temporal progression and preservation constraints**. Porter Originals explicitly separate these responsibilities.

### 6. UI / SaaS video is a distinct craft

Useful SaaS motion usually follows hierarchy:

1. hero promise;
2. one interface action;
3. visible state change/proof;
4. limited device/environment context;
5. restrained branded endpoint.

This is why Porter Originals include dashboard macro, glass UI, product-tour transition, cursor-led navigation, data-to-interface transformation, device-to-screen transfer, onboarding and AI-avatar/UI hybrid patterns.

### 7. Camera vocabulary is information architecture

For commercial design:

- macro = material / feature evidence;
- push-in = importance;
- lateral tracking = progression;
- orbit = dimensionality;
- top-down = system/composition;
- static frame = trust, clarity and endpoint.

The best reusable prompt systems tie camera choice to information purpose rather than “cinematic” decoration.

### 8. Real source examples are useful when the adaptation is explicit

A digest card becomes much more valuable when it contains two visibly different layers:

**Source layer**
- preview from the source;
- creator;
- published date;
- short original prompt excerpt;
- direct full-original link;
- corpus/archive/license information where relevant.

**Porter layer**
- why the pattern is useful;
- independently rewritten BOS-aware prompt;
- reusable variables;
- optional Porter project JSON;
- explicit assumptions about post-production.

This lets a designer learn from the original creator **and** immediately repurpose the underlying production logic without pretending the adaptation is the original prompt.

---

## Attribution / content policy

1. **Attribution is mandatory.** Creator name and original source link sit directly on the digest card/drawer.
2. **Full original stays at the source.** The Porter site stores a short creator-authored excerpt, not an invisible wholesale mirror. The button opens the full source prompt.
3. **Licensed corpus metadata remains visible.** YouMind is currently marked CC BY 4.0; the digest shows corpus/license provenance as an additional attribution chain, not as a replacement for the individual creator.
4. **No-license corpora are source indexes, not ingestion feeds.** If no clear reuse license was verified, Porter stores source metadata/preview and independently authored notes/adaptations rather than bulk prompt text.
5. **Porter Adaptation is a separate work.** It is written from the production pattern, BOS rules and design use case; it should not masquerade as the creator's prompt.
6. **Source preview is labeled.** A real preview is marked `source preview`; generated conceptual graphics are marked `Porter concept preview`.
7. **BOS remains authoritative.** Industry examples are evidence, never an excuse to override first-party BytePlus constraints.

---

## Current site release

### Industry Digest

Initial curated release: **24 attributed cases** selected for design/commercial usefulness, including:

- product / beauty systems;
- luxury pack/feature films;
- fashion/editorial transformations;
- retail campaign pacing;
- UGC / creator demos;
- branded 3D character advertising;
- continuous material morphs;
- camera-language studies;
- narrative/case-film contrast;
- sports/brand composition.

Every card pairs a source excerpt/link with an independent Porter Adaptation.

### Porter Originals

**48 production archetypes × 4 curated variations = 192 reusable prompt cards** across 12 lanes:

1. Web / hero motion
2. SaaS / UI
3. Brand / logo motion
4. Kinetic typography
5. Product / packshot
6. Packaging / retail
7. 3D / materials
8. Editorial / fashion
9. Data / abstract technology
10. Case study / portfolio
11. UGC / marketing
12. VFX / transitions

### Interface

Implemented in:

- `studio/library.html`
- `studio/library.js`
- `studio/library.css`
- `studio/digest.css`
- `studio/digest-data.js`
- `studio/library-data.js`

The three top-level modes are **Industry Digest / Porter Originals / Source audit**.
