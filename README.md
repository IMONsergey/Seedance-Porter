# Seedance Porter

Production toolkit and prompt-intelligence layer for getting the maximum practical value from ByteDance Seedance.

Seedance Porter is a provider-neutral production layer for cloud Seedance surfaces: official-guide-aware prompt/shot compilation, multimodal reference mapping, generation manifests, provider routing, production memory, evaluation, project continuity, CLI/MCP automation, a browser Production Studio and a source-attributed prompt research site.

## Current target

- **Production default:** Seedance 2.0 through stable providers.
- **Newest-model track:** Seedance 2.5 behind a capability/feature flag while official availability and provider contracts continue to stabilize.
- **Official prompting baseline:** `BOS-2026-07-17`, derived from BytePlus ModelArk's official **Dreamina Seedance 2.0 series prompt guide** and related first-party Seedance documentation, verified 2026-08-07.
- **Prompt-intelligence release:** v0.4 adds the attributed Industry Digest, 192 Porter Originals and a global design/digital prompt audit.
- **No hard-coded assumption that 2.5 equals 2.0:** every provider/model advertises its own capabilities. Until a dedicated official 2.5 prompt guide is verified, preview 2.5 conservatively inherits the latest first-party Seedance methodology.

## Prompt Intelligence Library

Run the Studio:

```bash
npm run studio
```

Then open:

- `http://127.0.0.1:4173/` — Production Studio
- `http://127.0.0.1:4173/library.html` — Prompt Intelligence Library

The library has three surfaces.

### Industry Digest

The default view is a curated digest of real public Seedance examples selected for usefulness in **design, digital, product, fashion, branding, campaign work, UGC, VFX and case-study storytelling**.

Each digest card keeps the source chain visible:

- real source preview with fallback concept preview;
- original creator and publication date;
- direct creator/source link;
- short creator-authored prompt excerpt;
- direct link to the full original prompt/source;
- archive/corpus and license provenance where relevant;
- `Why it works` production analysis;
- editable remix variables;
- a separate, independently written **Porter Adaptation**;
- copyable Porter project JSON.

The initial release contains **24 attributed cases**. Source excerpts are deliberately kept short; the full original stays at the source. The current primary corpus is YouMind OpenLab's Seedance collection, with creator/source attribution preserved. See `docs/INDUSTRY-PROMPT-AUDIT.md` for research and content policy.

### Porter Originals

The second view contains **192 Porter-original reusable prompt cards**: 48 production archetypes × 4 curated art-direction variants across 12 lanes:

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

These are not copied community prompts. They are reusable templates built from the cross-industry production patterns documented in the source audit and constrained by Porter's BOS rules.

### Source audit

The third view exposes the research map behind the library: first-party model documentation, prompt corpora, commercial AI-video products, current motion/SaaS/branding case studies, awarded web references and prompt research. Community evidence never outranks first-party ByteDance/BytePlus guidance.

Library data is CI-validated for source fields, unique IDs, excerpt length, adaptation depth, variables and the exact 192-card Porter Originals invariant.

## Official ByteDance compliance

Porter does not merely store the official guide as documentation. It encodes first-party methodology and ModelArk request constraints into the project schema, compiler, provider adapters and paid-generation gate.

Every compiled project receives an `officialCompliance` report containing the standard/version, source dates, pass/fail state, score, blocking violations, advisories, applied normalization and official source URLs.

Check a project without spending credits:

```bash
npm run porter -- validate examples/product-film.json
```

Exit code is non-zero when blocking official-rule violations remain. `porter generate`, MCP generation and Studio/API generation call the same hard gate before provider submission.

The source methodology is documented in [`docs/BYTEDANCE-OFFICIAL-GUIDE.md`](docs/BYTEDANCE-OFFICIAL-GUIDE.md).

### Official rules encoded

- precise subject definition;
- `identity`, `product` and `logo` references require exactly **2–3 stable `anchors`** plus a clear reference job;
- every BytePlus image/video reference requires explicit `faceSource` provenance so arbitrary real-face uploads are not silently treated as supported;
- complex prompts compile as ordered **`Shot 1`, `Shot 2`, ...**, not rigid per-shot second ranges;
- one camera movement type per shot;
- physical/action-specific motion language and visible emotional behavior;
- explicit environment, lighting/color tone, visual style, image-quality intent and constraints;
- one explicit job for every reference;
- warning above five references, reflecting BytePlus's recommended focused working set;
- explicit generated-text/logo/watermark policy;
- dedicated `logo` reference role and `reference-only` logo mode;
- anti-duplicate/twin-character constraints for multiple character references;
- official prompt ceiling below 1000 words;
- strict separation of first/last-frame vs multimodal reference API scenarios;
- provider-route-aware parameter validation;
- source-dated official compliance persisted into every generated `.porter.json` manifest.

## Architecture

```text
Seedance-Porter/
├── src/
│   ├── cli.ts                 # command-line entrypoint
│   ├── core/                  # types, schema, config, manifests, errors
│   ├── models/                # model/capability registry
│   ├── providers/             # BytePlus, fal.ai, MuAPI adapters
│   ├── prompt/                # official compliance, directing, shots, references
│   ├── eval/                  # take scoring + persistent review
│   ├── projects/              # ledger, continuity, seed variants
│   ├── media/                 # ffmpeg production helpers
│   ├── mcp/                   # MCP server for agent-driven production
│   └── server/                # local Studio + HTTP automation API
├── studio/
│   ├── index.html             # Production Studio
│   ├── library.html           # Industry Digest + Porter Originals + Source audit
│   ├── digest-data.js         # attributed digest cases + Porter Adaptations
│   └── library-data.js        # 192 Porter-original cards
├── scripts/
│   └── validate-library.mjs   # digest/library release invariants
├── integrations/              # ComfyUI / n8n integration guidance
├── recipes/                   # reusable production recipes
├── knowledge/                 # camera/reference/prompt production knowledge
├── examples/                  # compliant project briefs and benchmarks
├── skills/                    # agent skill package
├── docs/                      # official guide, industry audit, workflow, security
└── AGENTS.md                  # mandatory operating contract for agents
```

## Quick start

```bash
npm install
cp .env.example .env
npm run check
npm test
npm run validate:library
npm run porter -- doctor
npm run porter -- models
npm run porter -- validate examples/product-film.json
npm run porter -- compile examples/product-film.json
npm run studio
```

Configure a provider key in `.env`, replace example media URLs with real references, then generate:

```bash
npm run porter -- generate examples/product-film.json --provider byteplus
```

If official compliance fails, generation stops before provider submission.

## Project shape

A production project explicitly carries output intent, reference anchors and visual face provenance for BytePlus media.

```json
{
  "outputPolicy": {
    "generatedText": "forbid",
    "generatedLogo": "forbid",
    "generatedWatermark": "forbid"
  },
  "brief": {
    "subject": "A matte dark-green aluminum bottle",
    "environment": "Minimal dark-green studio",
    "lighting": "Large soft source from camera-left",
    "style": "Contemporary premium commercial photography",
    "imageQuality": "HD, rich details, stable geometry, natural colors"
  },
  "references": [
    {
      "kind": "image",
      "role": "product",
      "faceSource": "none",
      "anchors": [
        "tall cylindrical dark-green aluminum body",
        "short neck with unchanged cap proportions",
        "matte low-reflection surface finish"
      ],
      "note": "Exact product geometry and material source"
    }
  ]
}
```

For every BytePlus image/video reference use one of: `"faceSource": "none"`, `"synthetic"`, `"non-human"`, `"modelark-trusted-output"`, `"preset-digital-character"` or `"authorized-real-person"`. Registered authorized-real-person/preset-character inputs use the ModelArk asset flow.

## Review → accept → continue

After generation, score and persist a take:

```bash
npm run porter -- review outputs/.../take.porter.json examples/scorecard.json \
  --decision accept \
  --end-state "Describe the actual final visual/physical state" \
  --extract-frame
```

Then compile the next clip from that accepted take:

```bash
npm run porter -- continue examples/continuation-shot.json \
  --from outputs/.../take.porter.json
```

Add `--generate` only when you want to render the continuation. See `docs/PRODUCTION-MEMORY.md`.

## Bounded seed variants

Seed variants are **route-specific**, not a universal Seedance feature. The verified direct BytePlus Seedance 2.0 route currently does not support the `seed` parameter. Use this workflow only on a route that explicitly advertises seed control, for example the configured fal route:

```bash
npm run porter -- variants examples/product-film.json --count 3 --provider fal
```

A single sweep is hard-limited to eight variants and every generated variant still passes the official compliance gate.

## MCP for Codex / Cursor / compatible agents

```bash
npm run mcp
```

Use `examples/mcp-config.json` as a starting point. `AGENTS.md` and `skills/seedance-porter/SKILL.md` require first-party guidance to outrank community heuristics.

## Provider strategy

`byteplus` is the preferred direct production path when its account/API contract is available. `fal` is a stable router for Seedance 2.0. `muapi` remains an experimental third-party path for Seedance 2.5 preview and must not be represented as an official ByteDance API.

Provider details live in `docs/PROVIDERS.md`; model facts live in `src/models/registry.ts`; official prompting/API facts live in `docs/BYTEDANCE-OFFICIAL-GUIDE.md`; industry/library research lives in `docs/INDUSTRY-PROMPT-AUDIT.md`.

## What Porter adds on top of an API

- source-dated official ByteDance/BytePlus prompting + API compliance;
- paid-generation hard gate;
- attributed Industry Prompt Digest;
- 192 design-first Porter Originals;
- remix variables and Porter project export;
- global prompt/design source audit;
- Director's Read for narrative/performance work;
- official `Shot N` storyboard compiler;
- structured stable reference anchors, visual face provenance and explicit roles;
- first/last-frame planning with API-mode separation;
- sequence continuity locks;
- one-variable retake protocol and weighted take scorecard;
- persistent accept/retake/reject project ledger;
- actual observed end-state memory and ffmpeg final-frame extraction;
- continuation compilation from accepted footage;
- bounded provider-aware seed sweeps where supported;
- duplicate paid-request protection;
- `.porter.json` provenance + compliance manifests;
- provider/model capability registry;
- CLI, MCP, local HTTP API and browser Studio;
- fixed benchmark scenarios for model upgrades.

## Benchmark philosophy

“Newest” and “default” are intentionally different concepts. When a newer Seedance route appears, verify its official model-specific documentation first, add its capabilities to the registry and run the fixed benchmark pack. Promote it only after output quality and operational stability are understood.

## Security and provenance

Do not run random `curl | bash` installers from repositories that impersonate ByteDance. Secrets are read from environment variables; output manifests never store raw API keys. The Studio binds to localhost by default and supports an optional bearer token if deliberately exposed beyond localhost.

## Status

**v0.4 Prompt Intelligence release:** production providers, official BOS compliance, CLI/MCP/Studio, production memory, continuation/evaluation, the attributed Industry Digest, 192 Porter Originals, source audit and CI library validation are implemented.

Live provider generation still requires your own credentials and paid credits. Source-attributed digest previews and links remain dependent on their external publishers. Porter does not represent source-authored excerpts as Porter originals; the full Porter Adaptation is a separate work.

## License

Porter code is MIT. Third-party projects informed parts of the architecture, but their code is not vendored wholesale. First-party ByteDance/BytePlus documentation is referenced as methodology and remains separately attributed. Industry Digest cards retain creator/source/corpus provenance; source content remains subject to its original source and license terms.
