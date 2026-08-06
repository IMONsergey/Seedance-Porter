# Seedance Porter

Production toolkit for getting the maximum practical value from ByteDance Seedance.

Seedance Porter is not a model-weight repository and does not pretend Seedance can run locally. It is a provider-neutral production layer for cloud Seedance surfaces: prompt/shot compilation, multimodal reference mapping, repeatable generation manifests, provider routing, production memory, evaluation, project continuity, CLI automation, MCP access and a local browser Studio.

## Current target

- **Production default:** Seedance 2.0 through stable providers.
- **Newest-model track:** Seedance 2.5 behind a capability/feature flag while official availability and provider contracts continue to stabilize.
- **No hard-coded assumption that 2.5 equals 2.0:** every provider/model advertises its own capabilities, limits and endpoints.

## Design goals

1. Direct scenes instead of stacking visual adjectives.
2. Give every image/video/audio reference one explicit job.
3. Compile long ideas into short shot contracts and continuity-aware clips.
4. Preserve provenance: every output gets a machine-readable manifest.
5. Make retakes surgical: change one variable, keep everything else locked.
6. Continue from what the accepted footage actually produced, not what the previous prompt intended.
7. Separate model facts from creative guidance and date-source technical claims.
8. Make the same core usable from terminal, agents, CI, local HTTP automation and the Studio UI.
9. Never depend on fake “official” GitHub clients or unverified local installers.

## Architecture

```text
Seedance-Porter/
├── src/
│   ├── cli.ts                 # command-line entrypoint
│   ├── core/                  # types, config, polling, manifests, errors
│   ├── models/                # model/capability registry
│   ├── providers/             # BytePlus, fal.ai, MuAPI adapters
│   ├── prompt/                # director read, shot planner, prompt compiler
│   ├── eval/                  # take scoring + persistent review
│   ├── projects/              # ledger, continuity, seed variants
│   ├── media/                 # ffmpeg production helpers
│   ├── mcp/                   # MCP server for agent-driven production
│   └── server/                # local Studio + HTTP automation API
├── studio/                    # browser UI
├── integrations/              # ComfyUI / n8n integration guidance
├── recipes/                   # reusable production recipes
├── knowledge/                 # camera/reference/prompt production knowledge
├── examples/                  # project briefs and benchmark scenarios
├── skills/                    # agent skill package
├── docs/                      # setup, providers, workflow, security, memory
└── AGENTS.md                  # operating contract for Codex/agents
```

## Quick start

```bash
npm install
cp .env.example .env
npm run check
npm test
npm run porter -- doctor
npm run porter -- models
npm run porter -- compile examples/product-film.json
```

Configure a provider key in `.env`, replace the example media URLs with real references, then generate:

```bash
npm run porter -- generate examples/product-film.json --provider byteplus
```

### Review → accept → continue

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

### Bounded seed variants

Plan without spending credits:

```bash
npm run porter -- variants examples/product-film.json --count 3
```

Add `--generate` to render. A single sweep is hard-limited to eight variants.

### Local Studio

```bash
npm run studio
```

Open `http://127.0.0.1:4173`. The Studio lets you edit a project, inspect the model registry, compile without spending credits, explicitly confirm a paid generation, inspect JSON results and preview returned video.

### MCP for Codex / Cursor / compatible agents

```bash
npm run mcp
```

Use `examples/mcp-config.json` as a starting point. MCP exposes model lookup, compile, explicit paid generation, scoring, persistent take review, continuity preparation, ledger lookup and zero-cost variant planning.

## Provider strategy

`byteplus` is the preferred direct production path when its account/API contract is available. `fal` is a convenient stable router for Seedance 2.0. `muapi` is isolated as an experimental path for Seedance 2.5 preview/early-access surfaces and must not be treated as an official ByteDance API.

Provider details live in `docs/PROVIDERS.md`; model facts live in `src/models/registry.ts` instead of being scattered through the codebase.

## What Porter adds on top of an API

- Director's Read before narrative/performance prompts.
- Shot contracts with one dominant action per beat.
- Reference-role binding (`identity`, `product`, `environment`, `motion`, `camera`, `style`, `audio`, `first_frame`, `last_frame`, `endpoint`).
- First/last-frame planning.
- Sequence continuity locks for multi-clip films.
- One-variable retake protocol and weighted take scorecard.
- Persistent accept/retake/reject project ledger.
- Actual observed end-state memory and ffmpeg final-frame extraction.
- Continuation compilation from accepted footage.
- Bounded deterministic seed sweeps.
- Duplicate paid-request protection against accidental retries.
- Sidecar `.porter.json` manifests with normalized source project + task/output metadata.
- Provider/model capability registry with verification dates and source references.
- Agent-friendly CLI, MCP tools and local HTTP API.
- Browser Studio for hands-on work.
- Benchmark scenarios for comparing new models/providers without moving the goalposts.
- ComfyUI and n8n integration strategy without depending on random provider-specific community nodes.

## Benchmark philosophy

“Newest” and “default” are intentionally different concepts. When a newer Seedance route appears, add it to the registry and run the fixed benchmark pack. Promote it only after it wins enough real production categories and its latency, cost and error semantics are understood. See `docs/MODEL-UPGRADE-PROTOCOL.md` and `examples/benchmark-pack.json`.

## Security and provenance

Do not run random `curl | bash` installers from repositories that impersonate ByteDance. Seedance Porter uses ordinary package-manager dependencies and documented HTTP APIs only. Secrets are read from environment variables; output manifests never store raw API keys. The Studio binds to localhost by default and supports an optional bearer token if deliberately exposed beyond localhost.

## Status

**v0.2 production core is implemented:** provider adapters, model registry, director/shot/reference compiler, CLI, MCP, Studio/API, evaluation, persistent take ledger, final-frame extraction, accepted-take continuation, bounded seed variants, examples, tests and CI configuration are in the repository.

Live provider generation still requires your own API credentials and paid credits. The current environment cannot reach npm/GitHub over the network, and GitHub Actions has not surfaced a run yet, so the repository does **not** falsely claim a green dependency/typecheck run or live generation against your accounts.

See `ROADMAP.md` for the remaining higher-order layers: cost accounting, queue controls, reusable controlled reference storage, richer visual review UI and vision-assisted evaluation.

## License

MIT. Third-party projects informed the architecture, but their code is not vendored wholesale. Keep attribution and license review for any future copied asset or code fragment.
