# Seedance Porter Skill

Use this skill when the user wants to plan, prompt, generate, evaluate or continue a Seedance video.

## Source hierarchy

1. The source-dated official ByteDance/BytePlus methodology in `docs/BYTEDANCE-OFFICIAL-GUIDE.md` is mandatory.
2. Provider/model facts come from the dated registry.
3. Porter empirical best practices may be stricter, but must stay visibly separate from official requirements.
4. Community heuristics never silently override first-party guidance.

Current official baseline: `BOS-2026-07-17`, verified 2026-08-07. A dedicated official 2.5 prompt guide has not been verified, so preview 2.5 inherits this baseline conservatively until ByteDance publishes model-specific guidance.

## Operating order

1. Identify whether the request is a utility/product/KV shot or a narrative/performance shot.
2. Build a Porter project object.
3. Choose model + provider from the dated registry. Prefer production routes unless the user explicitly wants newest-model experimentation.
4. Define the core subject precisely and assign one explicit job to every reference.
5. For identity/product/logo references, add exactly 2–3 stable `anchors` plus a concise note explaining the source/job and what must remain unchanged.
6. On BytePlus, every image/video reference declares `faceSource`: `none`, `synthetic`, `non-human`, `modelark-trusted-output`, `preset-digital-character`, or `authorized-real-person`. Provider-managed identity assets follow the corresponding ModelArk asset/trust flow.
7. Supply environment, lighting/color tone, visual style, image-quality intent and constraints.
8. For narrative/performance, perform a Director's Read before writing camera/light/sound. Do not fabricate drama for packshots.
9. Build complex requests as ordered `Shot 1`, `Shot 2`, etc. Do not send hard per-shot second ranges to Seedance 2.0.
10. Keep one camera movement type per shot and make actions physically observable: body/object part, motion amount/speed/force when useful, natural transition/inertia and visible emotional behavior.
11. Keep strict first/last interpolation separate from multimodal reference generation: endpoint-only FLF uses exactly two endpoint images; multimodal reference packages use reference mode.
12. Compile with `seedance_validate_official` / `seedance_compile` before spending credits and inspect `officialCompliance`.
13. Fix every official-compliance error. Warnings require conscious review but do not automatically block.
14. Only call `seedance_generate` when generation is explicitly requested, credentials are configured and the official hard gate passes.
15. Evaluate serious takes with `seedance_score_take` / persistent review.
16. For a continuation, use the accepted footage's actual final state and extracted final frame rather than the original expected endpoint.

## Default shot policy

Porter empirical default: prefer 4–8 seconds for first attempts. Officially, ordered shot sequence matters more than forced exact per-shot timing. Use separate clips for plot turns, fights, chases, montage and other complex/high-energy transitions; use continuation for one coherent conversation, emotional progression or movement path.

## Reference policy

Use `identity`, `product`, `logo`, `environment`, `motion`, `camera`, `style`, `audio`, `first_frame`, `last_frame` and `endpoint` roles. A reference without a stated job is a bug.

Do not fill every available reference slot by default. The official guide recommends a focused working set around 4–5 functional assets: usually 1–2 character images, one scene image, one camera/action video and one audio reference. Exceeding five references should trigger review for priority/style conflicts.

For BytePlus visual inputs, `faceSource` is mandatory in Porter. ModelArk-managed authorized/preset assets use the asset flow; trusted ModelArk outputs remain subject to provider-side account/trust-window checks.

## Model/provider policy

`seedance-2.0` is the stable target. `seedance-2.5-preview` remains isolated behind a third-party route until a stable official route is verified. Do not describe MuAPI as official ByteDance. Prompt methodology for preview 2.5 inherits the latest verified first-party Seedance guide unless/until a 2.5-specific official guide is published.

Do not assume seed control from the model name alone. The verified direct BytePlus Seedance 2.0 route does not support seed control; use seed variants only on provider routes that explicitly advertise it.

## Output policy

The project must declare output intent:

- generated text: `forbid` or `allow`;
- generated logo: `forbid`, `reference-only`, or `allow`;
- generated watermark: `forbid` or `allow`.

Defaults forbid unrequested generated text, invented logos and watermarks. For strict brand-logo use, prefer `generatedLogo: reference-only` plus a dedicated `role: logo` image. Seedance can generate text, but exact commercial typography still requires QC and may need post-production replacement.

Always preserve `.porter.json` manifests for generated clips; they include the source project, request and official-compliance report.
