# ADR-018 — Retake Draft changes one named production lever and never auto-rewrites the prompt

Status: Accepted  
Date: 2026-08-08  
Scope: Prompt Studio v9 Generation Console

## Context

A weak generation often triggers an uncontrolled rewrite: camera, lighting, action, prompt wording and references all change together. The next output may improve, but the team no longer knows which intervention caused the improvement.

V9 is intended to create production learning, so retakes must preserve causal clarity and must start from observed review evidence rather than a vague desire to “try again”.

## Decision

A V9 Retake Draft can only start from a **succeeded visual generation with a saved Evaluation**.

It stores exactly one named production lever:

- objective
- subject
- environment
- composition
- camera
- action
- timing
- lighting
- materials
- style
- continuity
- constraints
- avoid
- references
- provider settings
- other

The draft must also store:

- source task ID and export hash;
- explicit change instruction;
- **non-empty expected improvement** — what should become measurably/visibly better;
- **at least one retained lock** — successful facts that must not drift;
- timestamps.

Saving a Retake Draft does **not**:

- mutate Prompt Studio sections;
- change references;
- create a Variant automatically;
- call local AI automatically;
- submit provider generation.

A later explicit mutation may apply a Retake Draft only through its own guarded/revisioned path.

## Consequences

Positive:
- A/B diagnosis remains interpretable;
- every retake is linked to observed Evaluation evidence;
- expected improvement makes the next review falsifiable rather than subjective;
- successful locks are preserved explicitly;
- future Production Memory can learn from controlled changes;
- retake intent is reviewable before prompt mutation or paid execution.

Tradeoffs:
- a Retake Draft requires more explicit thought before it can be saved;
- multi-lever creative rewrites require multiple explicit steps or a separately named broader experiment.

## Invariant

**Retake Draft = one evidence-driven lever + expected improvement + retained locks. It records the proposed controlled change; it is not the change itself.**
