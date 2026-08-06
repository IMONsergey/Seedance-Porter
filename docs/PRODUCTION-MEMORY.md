# Production memory and continuity

A generated video should not disappear into a folder with an ambiguous filename. Porter treats every take as a production record.

## Sidecar manifest

Every downloaded generation gets a sibling `.porter.json` containing the normalized project spec, compiled provider request, task response and output paths. This is the durable causal record of how the take was produced.

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

Porter injects the accepted take's observed end state and, where available, its final-frame visual anchor as the next clip's first frame. By default this only compiles. Add `--generate` to spend credits and render it.

A rejected or merely unreviewed take cannot anchor continuity.

## Seed variants

Plan three deterministic alternatives without spending credits:

```bash
npm run porter -- variants examples/product-film.json --count 3
```

Render them sequentially only when you explicitly add `--generate`:

```bash
npm run porter -- variants examples/product-film.json --count 3 --seed-start 100 --generate
```

Porter hard-limits a single sweep to eight variants. This is an operational safety rail against accidental agent/batch spend.
