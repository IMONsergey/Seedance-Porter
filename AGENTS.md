# AGENTS.md — Seedance Porter operating contract

This repository exists for one purpose: get reliably better production output from the newest practical Seedance model without confusing model marketing, provider capabilities and creative direction.

## Non-negotiable rules

1. **Official ByteDance guidance is the baseline.** Every project must be compiled and validated against `docs/BYTEDANCE-OFFICIAL-GUIDE.md` / `BOS-2026-07-17` before any paid generation. Keep official rules separately identifiable from Porter empirical best practices.
2. **Model facts are dated facts.** Before changing IDs, limits, pricing, resolution, duration or provider status, verify the source and update `lastVerified` + `sources` in `src/models/registry.ts`.
3. **Do not call a third-party route official.** BytePlus/Volcano are ByteDance cloud surfaces. fal.ai and MuAPI are providers/routers. Seedance 2.5 preview through MuAPI is isolated intentionally.
4. **No fake local inference.** There are no public Seedance 2.x weights in this repository. Do not add installers claiming otherwise without independently verified official weights.
5. **Compile before spending credits.** `porter validate` and `porter compile` are free. `porter generate` hard-blocks if `officialCompliance.passed` is false.
6. **Every reference gets one explicit role and job.** Identity/product/logo/environment/motion/camera/style/audio/endpoint must not be left implicit. Identity/product/logo references require exactly 2–3 stable `anchors` plus a concise source/job note.
7. **Real-person identity provenance is explicit on BytePlus.** Identity references must declare `identitySource`. Registered authorized real-person and preset digital-character inputs use ModelArk's asset flow; do not treat an arbitrary uploaded real-face image as a supported direct reference.
8. **Do not max out references by default.** The official guide recommends a focused working set of roughly 4–5 functional assets. More is a warning even when the API supports it.
9. **Use `Shot N`, not hard timestamps, for the model prompt.** start/end seconds are internal planning metadata only. BytePlus explicitly warns that precise per-shot duration constraints are unstable for Seedance 2.0.
10. **One camera movement type per shot.** Split compound push/pan/orbit/zoom instructions instead of stacking them in a single shot.
11. **Make action physical.** Describe visible body/object mechanics, speed/range/force when useful, natural transitions/inertia, and physical expression instead of only abstract emotion labels.
12. **Keep API scenarios separate.** Strict first/last-frame interpolation is an endpoint-only two-image package. Multimodal/reference-to-video uses reference assets; do not mix those ModelArk request semantics.
13. **Continuations start from observed footage, not the original intention.** Record the accepted clip's actual end state and compile the next clip from that state.
14. **Retakes change one variable.** Preserve successful locks and reference set. Preserve a seed only on routes that explicitly advertise seed control; the verified direct BytePlus Seedance 2.0 route does not.
15. **Text/logo intent must be explicit.** Default output policy forbids generated text, invented logos and watermarks. Strict logo use requires `generatedLogo: reference-only` plus a dedicated `role: logo` reference. Generated text can be allowed deliberately, but must be reviewed for exactness.
16. **Never commit provider keys, uploaded private media URLs or client-sensitive manifests.**

## Agent workflow

For a new idea:

1. Convert it into a Porter project spec.
2. Decide the minimum viable mode: T2V, I2V, R2V or first/last-frame.
3. Define the core subject and bind every reference asset to one function; add stable anchors and identity provenance where required.
4. Supply scene/environment, lighting/color tone, visual style, image quality and constraints.
5. Build complex sequences as ordered `Shot 1`, `Shot 2`, etc.; give each shot one camera movement type and physical action description.
6. Use a Director's Read only when narrative/performance benefits from it; do not invent drama for packshots or utility motion.
7. Compile and inspect `officialCompliance` + Porter advisories.
8. Fix all official-compliance errors before generation.
9. Generate only after the compliance hard gate passes.
10. Score the take on all production dimensions.
11. Accept, or retake by changing exactly the weakest production lever.
12. Keep `.porter.json` sidecars next to accepted outputs; they record the applied official standard.

## Model upgrade workflow

When a new Seedance version appears, do not fork the architecture. Add a registry entry + provider route, verify whether ByteDance published model-specific prompting guidance, then run the benchmark pack. If no newer official guide exists, keep the latest first-party methodology as the conservative baseline and clearly mark the inheritance.

## Upstream research policy

First-party ByteDance/BytePlus documentation outranks community heuristics. Community upstreams such as ComfyUI's ByteDance API nodes, `paperfoot/seedance-cli`, `fal-ai/seedance-2.0-api`, `Emily2040/seedance-2.0`, and current 2.5 wrappers may inform implementation or empirical best practices, but must not silently override a source-dated official rule. Do not wholesale copy files without checking licenses and attribution.
