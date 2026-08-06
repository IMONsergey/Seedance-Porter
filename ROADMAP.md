# Roadmap

## v0.1 — foundation (current)

- [x] Provider-neutral model registry.
- [x] Direct BytePlus ModelArk adapter.
- [x] fal.ai Seedance 2.0 adapter.
- [x] Isolated MuAPI Seedance 2.5 preview adapter.
- [x] Structured project schema.
- [x] Reference-role compiler.
- [x] Director Read + shot planning.
- [x] Continuity locks.
- [x] Duplicate paid-request guard.
- [x] Poll/download/sidecar manifest flow.
- [x] CLI and MCP server.
- [x] Take scorecard and one-variable retake logic.
- [x] Benchmark/project examples.

## v0.2 — production memory

- [ ] Project ledger: accepted/rejected takes and observed end states.
- [ ] Automatic last-frame extraction with ffmpeg.
- [ ] Continuation compiler that reads the accepted clip ledger.
- [ ] Cost ledger per provider/model/project.
- [ ] Batch seed sweeps and A/B variants with spend caps.
- [ ] Reference asset library with checksums and reusable IDs.
- [ ] Provider queue concurrency controls.

## v0.3 — visual studio

- [ ] Local web UI for project briefs, references and shot cards.
- [ ] Drag/drop reference role assignment.
- [ ] Video review + frame-accurate annotations.
- [ ] Side-by-side take comparison.
- [ ] Scorecard UI and retake button.
- [ ] Project timeline / continuity board.

## v0.4 — intelligence layer

- [ ] Optional LLM brief-to-project planner.
- [ ] Prompt compression and conflict detector.
- [ ] Vision-assisted generated-take evaluator.
- [ ] Auto-diagnosis from frames + motion + audio.
- [ ] Retrieval over accepted prompts/results by project type.

## Seedance 2.5 promotion gate

Do not make 2.5 the default merely because it is newer. Promote `seedance-2.5-preview` to production when:

1. an official stable ByteDance/BytePlus/Volcano route is verified, or an explicitly chosen third-party route meets reliability requirements;
2. route IDs and limits have survived a real benchmark run;
3. output quality beats 2.0 on the majority of our production benchmark categories;
4. cost/latency are known;
5. generation, polling and error semantics are stable enough for automation.
