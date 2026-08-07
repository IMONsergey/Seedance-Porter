# Production memory and continuity

A generated video should not disappear into a folder with an ambiguous filename. Porter treats every take as a production record.

## Sidecar manifest

Every downloaded generation gets a sibling `.porter.json` containing the normalized project spec, compiled provider request, official compliance report, task response and output paths. This is the durable causal record of how the take was produced.

## Review

```bash
npm run porter -- review outputs/my-project/take.porter.json examples/scorecard.json \
  --decision accept \
  --end-state "Bottle is centered; camera settled; highlight is on the left edge" \
  --extract-frame
```

Review does four things:

1. calculates the weighted Porter score;
2. records accept / retake / reject;
3. stores the actual observed final state, not the hoped-for prompt endpoint;
4. updates `.porter/projects/<project>/ledger.json`.

`--extract-frame` requires `ffmpeg` on PATH and extracts the final decoded frame from the local generated video.

## Continuation

Create a project JSON describing only the next clip's intent, then:

```bash
npm run porter -- continue examples/continuation-shot.json \
  --from outputs/my-project/take.porter.json
```

Porter injects the accepted take's observed end state and, where available, its final frame as a visual continuity reference. It does **not** blindly force the direct ModelArk `first_frame` API role when the next project also needs identity/scene/motion references; the compiler keeps strict first/last interpolation separate from multimodal reference mode in accordance with the official API contract.

By default continuation only compiles. Add `--generate` to spend credits and render it. A rejected or merely unreviewed take cannot anchor continuity.

## Seed variants are provider-route specific

Seed control is not universal across Seedance providers. The verified direct BytePlus Seedance 2.0 route currently marks the `seed` parameter unsupported, so Porter rejects seed sweeps there.

Plan deterministic alternatives only through a route that explicitly advertises seed control, for example the configured fal route:

```bash
npm run porter -- variants examples/product-film.json --count 3 --provider fal
```

Render them sequentially only when you explicitly add `--generate`:

```bash
npm run porter -- variants examples/product-film.json --count 3 --seed-start 100 --provider fal --generate
```

Porter hard-limits a single sweep to eight variants. This is an operational safety rail against accidental agent/batch spend.
