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

## Research corpus

Run:

```bash
node scripts/import-case-candidates.mjs --limit 750 --min 500 --output studio/case-candidates.json
```

The importer discovers candidates from multiple public pools, stores source metadata + a short excerpt rather than a wholesale prompt mirror, canonicalizes URLs, deduplicates by source URL and prompt fingerprint, flags obvious named-IP / celebrity-dependent cases, maps likely Collections and ranks candidates by source traceability, design/commercial usefulness, motion specificity, shot structure and reference strategy.

The 500–1000 target is a **research corpus**, not a promise that 1000 entries are curated.

## Deep-review queue

Run:

```bash
node scripts/build-case-review-queue.mjs --input studio/case-candidates.json --limit 90 --output studio/case-review-queue.json
```

The queue gives priority to under-covered Collections before candidate score. Every queue item carries separate prompt-anatomy and visual-review checklists.

## Use this pattern for my project

The Pattern Adapter keeps shot function, information hierarchy, camera/motion logic, causal structure and the signature mechanism while replacing source subject matter.

It must discard source-specific character identity, product/trademark, location when incidental, distinctive wording and unsupported generated typography/logo assumptions.

Reference URLs or local paths and exact-lock notes can be written into the generated Porter project. The static GitHub Pages tool does not upload assets or spend credits. Run the generated JSON through the authoritative local `porter validate` / Studio compliance gate before paid generation.
