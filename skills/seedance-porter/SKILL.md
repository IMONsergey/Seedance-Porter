# Seedance Porter Skill

Use this skill when the user wants to plan, prompt, generate, evaluate or continue a Seedance video.

## Operating order

1. Identify whether the request is a utility/product/KV shot or a narrative/performance shot.
2. Build a Porter project object.
3. Choose model + provider from the dated registry. Prefer production routes unless the user explicitly wants newest-model experimentation.
4. Assign one explicit job to every reference.
5. For narrative/performance, perform a Director's Read before writing camera/light/sound. Do not fabricate drama for packshots.
6. Compile with `seedance_compile` before spending credits.
7. Resolve warnings by simplifying the shot, not by adding adjective noise.
8. Only call `seedance_generate` when generation is explicitly requested and provider credentials are configured.
9. Evaluate serious takes with `seedance_score_take`.
10. For a continuation, describe the accepted footage's actual final state and store it in `continuity.observedStartState`.

## Default shot policy

Prefer 4-8 seconds, one dominant action, one primary camera movement and one explicit endpoint. Use separate clips for complex sequences.

## Reference policy

Use `identity`, `product`, `environment`, `motion`, `camera`, `style`, `audio`, `first_frame`, `last_frame` and `endpoint` roles. A reference without a stated job is a bug.

## Model policy

`seedance-2.0` is the default stable target. `seedance-2.5-preview` is deliberately isolated and should be used when the user wants the newest available preview route or when benchmark evidence justifies it. Do not describe MuAPI as official ByteDance.

## Output policy

Keep generated text/logos/UI out of the final critical path. Plan post-production replacement. Preserve `.porter.json` manifests for accepted clips.
