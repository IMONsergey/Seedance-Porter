# AGENTS.md — Seedance Porter operating contract

This repository exists for one purpose: get reliably better production output from the newest practical Seedance model without confusing model marketing, provider capabilities and creative direction.

## Non-negotiable rules

1. **Model facts are dated facts.** Before changing IDs, limits, pricing, resolution, duration or provider status, verify the source and update `lastVerified` + `sources` in `src/models/registry.ts`.
2. **Do not call a third-party route official.** BytePlus/Volcano are ByteDance cloud surfaces. fal.ai and MuAPI are providers/routers. Seedance 2.5 preview through MuAPI is isolated intentionally.
3. **No fake local inference.** There are no public Seedance 2.x weights in this repository. Do not add installers claiming otherwise without independently verified official weights.
4. **Compile before spending credits.** Run `porter compile` and inspect warnings before `porter generate`.
5. **Every reference gets one explicit role.** Identity/product/environment/motion/camera/style/audio/endpoint must not be left implicit.
6. **One dominant action per shot.** Split complex ideas into time-coded beats or separate clips.
7. **Continuations start from observed footage, not the original intention.** Record the accepted clip's actual end state and compile the next clip from that state.
8. **Retakes change one variable.** Preserve successful locks, seed and reference set whenever possible.
9. **Critical text/logo/UI belongs in post.** Seedance can approximate it; Porter must not promise typographic fidelity.
10. **Never commit provider keys, uploaded private media URLs or client-sensitive manifests.**

## Agent workflow

For a new idea:

1. Convert it into a Porter project spec.
2. Decide the minimum viable mode: T2V, I2V, R2V or first/last-frame.
3. Map every reference asset by job.
4. Use a Director's Read only when narrative/performance benefits from it; do not invent drama for packshots or utility motion.
5. Compile and inspect the prompt + warnings.
6. Prefer a 4-8 second first attempt.
7. Generate.
8. Score the take on all seven dimensions.
9. Accept, or retake by changing exactly the weakest production lever.
10. Keep `.porter.json` sidecars next to accepted outputs.

## Model upgrade workflow

When a new Seedance version appears, do not fork the architecture. Add a registry entry + provider route, then run the benchmark pack. Promote to `production` only after the provider surface is stable enough for repeatable use.

## Upstream research policy

Useful upstreams include ComfyUI's ByteDance API nodes, `paperfoot/seedance-cli`, `fal-ai/seedance-2.0-api`, `Emily2040/seedance-2.0`, and current 2.5 wrappers. Learn from their contracts and production practices; do not wholesale copy files without checking licenses and attribution.
