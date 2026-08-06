# Seedance Porter

Production toolkit for getting the maximum practical value from ByteDance Seedance.

Seedance Porter is not a model-weight repository and does not pretend Seedance can run locally. It is a provider-neutral production layer for cloud Seedance surfaces: prompt/shot compilation, multimodal reference mapping, repeatable generation manifests, provider routing, evaluation, project continuity, CLI automation and MCP access for Codex/Cursor/Claude-compatible clients.

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
6. Separate model facts from creative guidance and date-source technical claims.
7. Make the same core usable from terminal, agents, CI and a future studio UI.
8. Never depend on fake “official” GitHub clients or unverified local installers.

## Architecture

```text
Seedance-Porter/
├── src/
│   ├── cli.ts                 # command-line entrypoint
│   ├── core/                  # types, config, polling, manifests, errors
│   ├── models/                # model/capability registry
│   ├── providers/             # BytePlus, fal.ai, MuAPI adapters
│   ├── prompt/                # director read, shot planner, prompt compiler
│   ├── eval/                  # take scoring and retake diagnosis
│   └── mcp/                   # MCP server for agent-driven video production
├── recipes/                   # reusable production recipes
├── knowledge/                 # camera/reference/prompt production knowledge
├── examples/                  # project briefs and benchmark scenarios
├── docs/                      # setup, providers, prompting, evaluation, security
└── AGENTS.md                  # operating contract for Codex/agents
```

## Quick start

```bash
npm install
cp .env.example .env
npm run build
npm run porter -- models
npm run porter -- compile examples/product-film.json
```

Generate after configuring a provider key:

```bash
npm run porter -- generate examples/product-film.json --provider fal --wait
```

Or expose the toolkit to an MCP-compatible agent:

```bash
npm run mcp
```

## Provider strategy

`byteplus` is the preferred direct production path when its account/API contract is available. `fal` is a convenient stable router for Seedance 2.0. `muapi` is isolated as an experimental path for Seedance 2.5 preview/early-access surfaces and must not be treated as an official ByteDance API.

Provider details live in `docs/PROVIDERS.md`; model facts live in `src/models/registry.ts` instead of being scattered through the codebase.

## What Porter adds on top of an API

- Director's Read before narrative/performance prompts.
- Shot contracts with one dominant action per beat.
- Reference-role binding (`identity`, `product`, `environment`, `motion`, `camera`, `style`, `audio`, `endpoint`).
- First/last-frame planning.
- Sequence continuity ledger for multi-clip films.
- One-variable retake protocol.
- Batch variants and deterministic seed tracking when supported.
- Sidecar `.porter.json` manifests for every accepted generation.
- Provider cost/limit normalization.
- Agent-friendly JSON output and MCP tools.
- Benchmark scenarios for comparing models/providers as they change.

## Security and provenance

Do not run random `curl | bash` installers from repositories that impersonate ByteDance. Seedance Porter uses ordinary package-manager dependencies and documented HTTP APIs only. Secrets are read from environment variables; output manifests never store raw API keys.

## Status

Initial production foundation. See `ROADMAP.md` for the next build stages and `docs/RESEARCH-NOTES.md` for the source-informed design decisions behind the architecture.

## License

MIT. Third-party projects informed the architecture, but their code is not vendored wholesale. Keep attribution and license review for any future copied asset or code fragment.