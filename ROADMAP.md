# Roadmap

## v0.1 — foundation

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
- [x] Local Studio + HTTP API.

## v0.2 — production memory

- [x] Normalized project spec persisted in each generation manifest.
- [x] Persistent accepted/rejected take ledger.
- [x] Review command + weighted score persisted to manifests.
- [x] Actual final-frame extraction with ffmpeg.
- [x] Continuation compiler anchored to an accepted take's observed final state.
- [x] Bounded provider-aware seed variant planning/generation where the route explicitly supports seed control.

## v0.3 — official ByteDance guidance layer

- [x] Source-dated official BytePlus Seedance prompt methodology captured in-repo.
- [x] `BOS-2026-07-17` compliance report on every compile.
- [x] Paid-generation hard gate before provider submission.
- [x] Official `Shot N` sequencing instead of rigid per-shot timestamps.
- [x] One-camera-movement-per-shot validator.
- [x] Structured 2–3 stable subject anchors for identity/product/logo references.
- [x] Explicit output policy for generated text/logo/watermark.
- [x] Recommended focused reference-set warning above five assets.
- [x] BytePlus identity provenance / supported real-person asset-flow validation.
- [x] Strict separation of first/last-frame and multimodal reference API modes.
- [x] Route-specific seed/resolution semantics in the model registry.
- [x] CLI/MCP/HTTP/Studio official validation surfaces.
- [x] Official compliance persisted into `.porter.json` manifests.
- [x] CI validates the canonical project against the official standard.

## Next — production operations

- [ ] Cost ledger per provider/model/project.
- [ ] Provider queue concurrency controls.
- [ ] Reusable reference asset library with checksums and controlled remote storage.
- [ ] Non-seed A/B variant strategy for official routes without seed control.

## Next — visual review studio

- [ ] Structured forms in addition to raw project JSON.
- [ ] Drag/drop reference role/anchor/provenance assignment and local media upload.
- [ ] Live official-compliance checklist instead of JSON-only report.
- [ ] Video review + frame-accurate annotations.
- [ ] Side-by-side take comparison.
- [ ] Scorecard UI and review/accept controls.
- [ ] Project timeline / continuity board.

## Intelligence layer

- [ ] Optional LLM brief-to-project planner constrained by BOS before compilation.
- [ ] Prompt compression and conflict detector.
- [ ] Vision-assisted generated-take evaluator.
- [ ] Auto-diagnosis from frames + motion + audio.
- [ ] Retrieval over accepted prompts/results by project type.

## Seedance 2.5 promotion gate

Do not make 2.5 the default merely because it is newer. Promote `seedance-2.5-preview` to production when:

1. an official stable ByteDance/BytePlus/Volcano route is verified, or an explicitly chosen third-party route meets reliability requirements;
2. model-specific first-party prompting/API guidance is checked and the BOS inheritance is updated if necessary;
3. route IDs and limits have survived a real benchmark run;
4. output quality beats 2.0 on the majority of our production benchmark categories;
5. cost/latency are known;
6. generation, polling and error semantics are stable enough for automation.
