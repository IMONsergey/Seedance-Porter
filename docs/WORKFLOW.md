# Porter production workflow

## 1. Start with the production object, not the prompt

A good project JSON answers:

- What is the clip for?
- What exact subject/object must survive?
- What is the one visible action?
- Where does the shot start and end?
- Which reference controls identity/product/environment/motion/camera/style/audio?
- What must remain locked across continuation clips?

## 2. Choose the cheapest mode that preserves control

- **T2V:** exploration, atmospheres, generic subjects.
- **I2V:** a controlled first frame/product/KV already exists.
- **R2V / omni-reference:** multiple jobs need separate references.
- **First/last frame:** the endpoint matters as much as the start.

Do not use reference-to-video just because it is available. Every extra reference competes for attention.

## 3. Compile before generate

```bash
npm run porter -- compile examples/product-film.json
```

Check the generated reference contract and warnings. If the prompt is very long or the shot has several independent actions, split it.

## 4. Generate a short first take

```bash
npm run porter -- generate examples/product-film.json --provider byteplus
```

For exploration, prefer Fast or a lower-cost route. For critical fidelity, move to the best-performing model/provider after the concept works.

## 5. Score every serious take

Rate 0-5:

- identity/product fidelity
- motion/physics
- camera/composition
- temporal continuity
- audio sync
- artifact control
- brief match

A weak take is not repaired by rewriting everything. Use the weakest dimension's single retake lever.

## 6. Continue from reality

For a multi-clip film, the generated clip's actual last state becomes the next clip's start state. Update `continuity.observedStartState` before compiling the next shot. Never assume the model ended exactly where the original prompt said it would.

## 7. Finish in post

Treat generated typography, logos, tiny UI and legal copy as temporary. Replace them in post. Use Seedance for motion, performance, camera, environment and material behavior; use compositing/editing tools for exact graphics.
