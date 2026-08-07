# Seedance Porter

Production toolkit for getting the maximum practical value from ByteDance Seedance.

Seedance Porter is a provider-neutral production layer for cloud Seedance surfaces: official-guide-aware prompt/shot compilation, multimodal reference mapping, generation manifests, provider routing, production memory, evaluation, project continuity, CLI automation, MCP access and a local browser Studio.

## Current target

- **Production default:** Seedance 2.0 through stable providers.
- **Newest-model track:** Seedance 2.5 behind a capability/feature flag while official availability and provider contracts continue to stabilize.
- **Official prompting baseline:** `BOS-2026-07-17`, derived from BytePlus ModelArk's official **Dreamina Seedance 2.0 series prompt guide** and related first-party Seedance documentation, verified 2026-08-07.
- **No hard-coded assumption that 2.5 equals 2.0:** every provider/model advertises its own capabilities. Until a dedicated official 2.5 prompt guide is verified, preview 2.5 conservatively inherits the latest first-party Seedance methodology.

## Official ByteDance compliance

Porter does not merely store the official guide as documentation. It encodes first-party methodology and ModelArk request constraints into the project schema, compiler, provider adapters and paid-generation gate.

Every compiled project receives an `officialCompliance` report containing the standard/version, source dates, pass/fail state, score, blocking violations, advisories, applied normalization and official source URLs.

Check a project without spending credits:

```bash
npm run porter -- validate examples/product-film.json
```

Exit code is non-zero when blocking official-rule violations remain. `porter generate`, MCP generation and Studio/API generation call the same hard gate before provider submission.

The source methodology is documented in [`docs/BYTEDANCE-OFFICIAL-GUIDE.md`](docs/BYTEDANCE-OFFICIAL-GUIDE.md).

### Official rules encoded in v0.3

- precise subject definition;
- `identity`, `product` and `logo` references require exactly **2–3 stable `anchors`** plus a clear reference job;
- BytePlus identity references require explicit `identitySource` provenance and supported ModelArk asset/trust flow for real-person use;
- complex prompts compile as ordered **`Shot 1`, `Shot 2`, ...**, not rigid per-shot second ranges;
- one camera movement type per shot;
- physical/action-specific motion language and visible emotional behavior;
- explicit environment, lighting/color tone, visual style, image-quality intent and constraints;
- one explicit job for every reference;
- warning above five references, reflecting BytePlus's recommended focused 4–5 asset working set;
- explicit generated-text/logo/watermark policy;
- dedicated `logo` reference role and `reference-only` logo mode;
- anti-duplicate/twin-character constraints for multiple character references;
- official prompt ceiling below 1000 words;
- strict separation of first/last-frame vs multimodal reference API scenarios;
- provider-route-aware parameter validation: direct BytePlus Seedance 2.0 does **not** use seed control, while third-party routes may expose it;
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
├── studio/                    # browser UI
├── integrations/              # ComfyUI / n8n integration guidance
├── recipes/                   # reusable production recipes
├── knowledge/                 # camera/reference/prompt production knowledge
├── examples/                  # compliant project briefs and benchmarks
├── skills/                    # agent skill package
├── docs/                      # official guide, providers, workflow, security, memory
└── AGENTS.md                  # mandatory operating contract for agents
```

## Quick start

```bash
npm install
cp .env.example .env
npm run check
npm test
npm run porter -- doctor
npm run porter -- models
npm run porter -- validate examples/product-film.json
npm run porter -- compile examples/product-film.json
```

Configure a provider key in `.env`, replace example media URLs with real references, then generate:

```bash
npm run porter -- generate examples/product-film.json --provider byteplus
```

If official compliance fails, generation stops before provider submission.

## Project shape

A production project explicitly carries output intent and reference anchors. Identity references on BytePlus also declare provenance.

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

For a character identity on BytePlus, add for example `"identitySource": "synthetic"`, `"modelark-trusted-output"`, `"preset-digital-character"`, `"authorized-real-person"` or `"non-human"`. Registered authorized-real-person/preset-character inputs use the ModelArk asset flow.

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

## Local Studio

```bash
npm run studio
```

Open `http://127.0.0.1:4173`. Validate/compile first to inspect prompt + `officialCompliance`; paid generation is separately confirmed and uses the same hard gate.

## MCP for Codex / Cursor / compatible agents

```bash
npm run mcp
```

Use `examples/mcp-config.json` as a starting point. `AGENTS.md` and `skills/seedance-porter/SKILL.md` require first-party guidance to outrank community heuristics.

## Provider strategy

`byteplus` is the preferred direct production path when its account/API contract is available. `fal` is a stable router for Seedance 2.0. `muapi` remains an experimental third-party path for Seedance 2.5 preview and must not be represented as an official ByteDance API.

Provider details live in `docs/PROVIDERS.md`; model facts live in `src/models/registry.ts`; official prompting/API facts live in `docs/BYTEDANCE-OFFICIAL-GUIDE.md`.

## What Porter adds on top of an API

- source-dated official ByteDance/BytePlus prompting + API compliance;
- paid-generation hard gate;
- Director's Read for narrative/performance work;
- official `Shot N` storyboard compiler;
- structured stable reference anchors, identity provenance and explicit roles;
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
- fixed benchmark scenarios for model upgrades;
- ComfyUI and n8n integration strategy without depending on random provider-specific community nodes.

## Benchmark philosophy

“Newest” and “default” are intentionally different concepts. When a newer Seedance route appears, verify its official model-specific documentation first, add its capabilities to the registry and run the fixed benchmark pack. Promote it only after output quality and operational stability are understood. See `docs/MODEL-UPGRADE-PROTOCOL.md` and `examples/benchmark-pack.json`.

## Security and provenance

Do not run random `curl | bash` installers from repositories that impersonate ByteDance. Secrets are read from environment variables; output manifests never store raw API keys. The Studio binds to localhost by default and supports an optional bearer token if deliberately exposed beyond localhost.

## Status

**v0.3 official-guidance release:** provider adapters, model registry, official ByteDance compliance layer, official-order prompt compiler, structured subject anchors, identity provenance, output intent policy, API-mode validation, route-specific parameter validation, CLI validation/hard generation gate, MCP, Studio/API, production memory, evaluation, continuation, variants, examples and regression tests are implemented.

Live provider generation still requires your own credentials and paid credits. Do not interpret repository-level compliance as a guarantee that a stochastic model will always follow every instruction; it guarantees that Porter structures and validates requests against the verified first-party methodology and provider contract before submission.

## License

MIT. Third-party projects informed parts of the architecture, but their code is not vendored wholesale. First-party ByteDance/BytePlus documentation is referenced as methodology and remains separately attributed.
