# Model upgrade protocol

When Seedance 2.5 or a later model gains a new route:

1. Verify the provider page/API documentation and exact model/endpoint ID.
2. Record `lastVerified`, source URLs, duration, resolutions, aspect ratios and reference limits.
3. Add a route in `src/models/registry.ts`; do not modify prompt architecture just to accommodate a provider spelling difference.
4. Add adapter translation only when request/response shapes differ.
5. Run the benchmark pack in `examples/benchmark-pack.json` with fixed briefs and reference assets.
6. Compare at least: fidelity, motion, camera, temporal continuity, audio, artifacts, brief match, latency and cost.
7. Test T2V, I2V, multimodal reference and first/last-frame separately. A model can improve one mode and regress another.
8. Promote lifecycle from `preview` only after repeatable wins and operational stability.
9. Keep the previous production route available for rollback.

“Newest” is a research target; “default” is an operational decision.
