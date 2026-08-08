# ADR-018 — Retake Draft changes one named production lever and never auto-rewrites the prompt

Status: Accepted  
Date: 2026-08-08  
Scope: Prompt Studio v9 Generation Console

## Context

A weak generation often triggers an uncontrolled rewrite: camera, lighting, action, prompt wording and references all change together. The next output may improve, but the team no longer knows which intervention caused the improvement.

V9 is intended to create production learning, so retakes must preserve causal clarity.

## Decision

A V9 Retake Draft stores one named production lever:

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

The draft also stores:

- source task ID and export hash;
- explicit change instruction;
- expected improvement;
- retained locks;
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
- successful locks are preserved explicitly;
- future Production Memory can learn from controlled changes;
- retake intent is reviewable before prompt mutation or paid execution.

Tradeoff:
- multi-lever creative rewrites require multiple explicit steps or a separately named broader experiment.

## Invariant

**Retake Draft records the proposed controlled change; it is not the change itself.**
