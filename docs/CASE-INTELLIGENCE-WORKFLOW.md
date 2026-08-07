# Case Intelligence workflow

Seedance Porter separates **source discovery**, **prompt anatomy** and **observed visual review**. This prevents the library from presenting prompt interpretation as if it were direct observation of the generated video.

## State machine

`candidate -> prompt-reviewed -> deep-reviewed -> curated`

### Candidate

A real public source entry has been discovered and deduplicated. Candidate metadata may include title, creator, source URL, archive URL, preview, a short excerpt, likely Collections and a research score.

Candidate status means only: **this source is worth investigating**. It is not a recommendation and it is not allowed into the main curated feed.

### Prompt-reviewed

A reviewer has read the published prompt/source material and documented:

- shot functions;
- requested framing and camera behavior;
- subject/object action;
- reference jobs and continuity locks;
- causal hypothesis for why the instructions should produce the intended look;
- signature move;
- motion language;
- transferable pattern;
- likely failure modes.

This analysis must be explicitly labeled as prompt-derived evidence when the complete generated video has not been watched.

### Deep-reviewed

The complete source video has been visually inspected. The reviewer must record what is actually visible rather than assuming the model followed the prompt.

Required evidence:

1. Actual shot boundaries.
2. Actual framing for every shot.
3. Actual camera behavior.
4. Actual subject/object motion.
5. Actual transitions.
6. Pacing / hold time / attention mechanics.
7. Material and physics behavior.
8. Continuity successes and failures.
9. Visible artifacts or compromises.
10. Which requested instructions were followed, compressed, ignored or invented.
11. Verified signature move.
12. Why the observed result works — or why it does not.

Only this state may claim **“the video works because…”** as an observation rather than a prompt hypothesis.

### Curated

Deep-reviewed cases can enter the main Digest when they additionally have:

- useful source attribution;
- meaningful design / commercial / motion value;
- at least one requested Collection;
- a reusable pattern that can be separated from source-specific subject matter;
- a Porter Adaptation;
- no unresolved rights / source ambiguity that makes reuse misleading.

## Collections

The taxonomy contains 30 requested Collections.

### Digital / Design

Website Hero, SaaS UI, App Launch, Dashboard, Case Study Motion, Brand Reveal, Rebranding Transition, Logo Motion, Kinetic Type, Interactive / Web3D.

### Commercial

Packshot, Beauty, FMCG, Food, Automotive, Fashion, Sports, Luxury, Electronics, Real Estate.

### Motion language

Camera, Transitions, Morphs, Macro, Material, Loop, Freeze, Scale, Match Cut, First / Last Frame.

A case can belong to several Collections. Collection membership describes **what is reusable about the case**, not merely the nouns in its prompt.

## Corpus refresh

`node scripts/import-case-candidates.mjs --limit 750 --min 500 --output studio/case-candidates.json`

The importer:

- discovers public entries from multiple source pools;
- stores source metadata and a short excerpt, not a wholesale copied prompt dump;
- canonicalizes URLs;
- deduplicates by source URL and prompt fingerprint;
- flags obvious IP / brand-dependent examples;
- classifies candidates into Collections;
- scores source traceability, design/commercial usefulness, motion specificity, shot structure and reference strategy;
- balances selection across Collections before filling remaining slots by score.

The 500–1000 candidate target is a **research corpus**, not the curated feed.

## Review queue

`node scripts/build-case-review-queue.mjs --input studio/case-candidates.json --limit 90 --output studio/case-review-queue.json`

The queue prioritizes Collections with the weakest current coverage, then uses candidate research score. Every queue entry carries a prompt-anatomy checklist and a separate full-video visual-review checklist.

## Use this pattern for my project

The browser library can transfer a reviewed pattern to a new project.

The transfer keeps:

- shot function;
- information hierarchy;
- camera logic;
- motion grammar;
- causal structure;
- transition / material / scale mechanism when relevant.

The transfer must discard:

- source character identity;
- source product / trademark;
- source location when it is merely subject matter;
- source-specific wording;
- unsupported generated text / logo assumptions.

The result is a structured Porter project JSON. On GitHub Pages this happens locally in the browser. The project must still pass the authoritative local `porter validate` / Studio compliance gate before paid generation.

## Quality target

The long-term objective is not “1000 cards.” It is:

- 500–1000 high-signal source candidates;
- balanced coverage across the 30 Collections;
- a growing deep-reviewed subset;
- every curated case carrying shot-by-shot observed evidence;
- every reusable case offering a safe pattern transfer into a BOS-valid Porter project.
