# Case Intelligence workflow

Seedance Porter separates **source discovery**, **prompt anatomy** and **observed visual review**. This prevents prompt interpretation from being presented as if it were direct observation of the generated video.

## State machine

`candidate -> prompt-reviewed -> deep-reviewed -> curated`

### Candidate

A real public source entry has been discovered, canonicalized and deduplicated. Candidate metadata may contain title, creator/source label, source URL, archive URL, preview, a short excerpt, likely Collections and a research score.

Candidate means only: **worth investigating**. It is not a recommendation and does not enter the curated Digest.

### Prompt-reviewed

A reviewer has inspected the published prompt/source material and documented:

- shot / beat functions;
- requested framing and camera behavior;
- subject/object action;
- reference jobs and continuity locks;
- causal hypothesis for why the instructions should create the intended look;
- signature move;
- rhythm and motion language;
- transferable pattern;
- likely failure modes.

This state must remain visibly labeled as prompt-derived evidence when the complete generated video has not been watched.

### Deep-reviewed

The complete source video has been visually inspected. Record what is actually visible rather than assuming the model followed the prompt.

Required evidence:

1. Actual shot boundaries or continuous-take structure.
2. Actual framing for every beat.
3. Actual camera behavior.
4. Actual subject/object motion.
5. Actual transitions.
6. Pacing, hold time and attention mechanics.
7. Material and physics behavior.
8. Continuity successes and failures.
9. Visible artifacts / compromises.
10. Which requested instructions were followed, compressed, ignored or invented.
11. Verified signature move.
12. Why the observed result works — or why it does not.

Only this state may claim **“the video works because…”** as observed evidence.

### Curated

A deep-reviewed case can enter the main Digest when it additionally has useful attribution, meaningful design/commercial/motion value, at least one Collection, a reusable production pattern separable from source subject matter, and a Porter adaptation.

## Collections

The taxonomy contains the 30 requested Collections.

**Digital / Design:** Website Hero, SaaS UI, App Launch, Dashboard, Case Study Motion, Brand Reveal, Rebranding Transition, Logo Motion, Kinetic Type, Interactive / Web3D.

**Commercial:** Packshot, Beauty, FMCG, Food, Automotive, Fashion, Sports, Luxury, Electronics, Real Estate.

**Motion language:** Camera, Transitions, Morphs, Macro, Material, Loop, Freeze, Scale, Match Cut, First / Last Frame.

A case may belong to several Collections. Membership describes what is reusable about the production pattern, not merely nouns found in the prompt.

## Research Corpus

Use the unified refresh path:

```bash
npm run case:refresh
```

or explicitly:

```bash
node scripts/refresh-case-corpus.mjs --limit 750 --min 500 --queue 90
```

The refresh pipeline performs four stages:

1. Discover candidates from the base public-source adapters.
2. Augment the corpus with additional attributed prompt/case repositories.
3. Canonicalize and deduplicate by original-source URL and prompt fingerprint, filter obvious named-IP / celebrity-dependent candidates, then rebalance across all 30 Collections.
4. Build the deep-review queue from the final combined snapshot.

The snapshot stores attribution, source links, preview references, scoring metadata and a short excerpt. It does **not** mirror whole third-party prompt collections into Porter.

### Source Universe vs automated corpus pools

The browser Source Universe currently maps **31 useful platforms/source families** for manual discovery, curation and source attribution. That number must not be confused with automated crawlers.

The automated Research Corpus currently uses **7 real discovery pools**:

- YouMind OpenLab;
- CyberBara Seedance Library;
- Seedance2Prompt;
- Lanshu Awesome AI Video Kit;
- ZeroLu Awesome Seedance;
- Awesome AI Video-Ad Prompts (`LichAmnesia/awesome-ad-video-prompts`);
- Awesome Seedance Prompts CN (`marsoyang1/awesome-seedance-prompts`).

New adapters should be added only when a source has a stable public structure and useful attribution. A source being easy to scrape is not enough. Porter should prefer fewer reliable pools over inflated source counts with weak provenance.

### Corpus target and partial snapshots

The operating target remains **500–1000 deduplicated research candidates**. This is a research corpus target, not a promise that 500–1000 cases are curated.

If the automated sources temporarily produce fewer than 500 safe unique candidates, the workflow may publish a partial snapshot so the Research Corpus UI stays useful. The snapshot and GitHub Action summary must keep the minimum target visible and must not describe a partial snapshot as a completed 500+ corpus.

## Deep-review queue

The unified refresh builds the queue automatically. It can also be rebuilt directly:

```bash
node scripts/build-case-review-queue.mjs --input studio/case-candidates.json --limit 90 --output studio/case-review-queue.json
```

The queue gives priority to under-covered Collections before candidate score. Every queue item carries separate prompt-anatomy and visual-review checklists.

The critical evidence rule does not change with scale: **do not mark a case `deep-reviewed` until the complete source video has actually been watched.** Prompt text, metadata, a thumbnail, GIF preview or source description are insufficient.

## Research Corpus browser

The Research Corpus browser is intentionally separate from Industry Digest.

- Industry Digest = curated production examples.
- Research Corpus = discovery candidates that still need review.

The candidate layer has independent search, Collection, source-pool and research-score filters and paginates the large corpus instead of injecting candidates into the curated renderer. The exact 100-card curated DOM contract remains independently CI-validated.

## Use this pattern for my project

The Pattern Adapter keeps shot function, information hierarchy, camera/motion logic, causal structure and the signature mechanism while replacing source subject matter.

It must discard source-specific character identity, product/trademark, location when incidental, distinctive wording and unsupported generated typography/logo assumptions.

Reference URLs or local paths and exact-lock notes can be written into the generated Porter project. The static GitHub Pages tool does not upload assets or spend credits. Run the generated JSON through the authoritative local `porter validate` / Studio compliance gate before paid generation.
