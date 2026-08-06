# Research notes and upstreams

Snapshot date: **2026-08-06**.

Porter is an original implementation informed by public provider contracts and production patterns. No upstream repository is treated as authoritative unless it maps back to a real provider/model surface.

## High-value upstreams

### Comfy-Org/ComfyUI

Current ByteDance API nodes expose Seedance 2.0, 2.0 Fast and 2.0 Mini model IDs and a broad reference-asset pipeline. High value: current provider surface and multimodal validation patterns.

https://github.com/Comfy-Org/ComfyUI

### paperfoot/seedance-cli

High value: direct BytePlus task contract, stable agent-facing CLI semantics, paid-request duplicate guard, output naming and sidecar manifests. Porter reimplements these ideas in TypeScript and expands them into a provider-neutral layer.

https://github.com/paperfoot/seedance-cli

### fal-ai/seedance-2.0-api

High value: concrete fal endpoint names and request shapes for T2V, I2V and reference-to-video, including native audio and multimodal reference semantics.

https://github.com/fal-ai/seedance-2.0-api

### Emily2040/seedance-2.0

High value: the production/directing viewpoint — scene function before adjective stacking, explicit reference roles, continuity from accepted footage, professional post/QC handoff and one-variable retakes. Porter uses the concepts but does not vendor the repository.

https://github.com/Emily2040/seedance-2.0

### SamurAIGPT/Seedance-2.5-API + Anil-matcha/seedance2.5-comfyui

High value: observable third-party early-access 2.5 request surface. Low authority: MuAPI is not ByteDance. Porter therefore keeps it under `seedance-2.5-preview` and never promotes the route to official.

https://github.com/SamurAIGPT/Seedance-2.5-API
https://github.com/Anil-matcha/seedance2.5-comfyui

## Rejected / dangerous pattern

Repositories can impersonate an official vendor by choosing a convincing organization/name. A discovered `bytedance-seedance/seedance-2.0` repository claimed unsupported features and asked users to execute an external `curl | bash` installer. Porter does not use it.

## Core synthesis

The strongest common pattern is not “longer prompts”. It is **role allocation**:

- one production objective;
- one dominant action per shot;
- one job per reference;
- one camera intention;
- one observable endpoint;
- one changed variable per retake;
- one continuity state carried into the next clip.

That is the operating model encoded in Porter.
