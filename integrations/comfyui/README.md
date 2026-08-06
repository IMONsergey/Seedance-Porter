# ComfyUI integration strategy

Porter does not duplicate ComfyUI's actively maintained ByteDance API nodes. Use ComfyUI for visual graph authoring and Porter for production planning, prompt compilation, model/provider facts, continuity and evaluation.

Recommended flow:

1. Build/compile the project in Porter.
2. Copy the compiled prompt and reference-role map into ComfyUI's current ByteDance/Seedance nodes.
3. Generate/iterate visually in ComfyUI.
4. Store the accepted output together with a Porter manifest/scorecard.

Current upstream worth tracking:

- `Comfy-Org/ComfyUI` — built-in ByteDance API nodes.
- `fkxianzhou/ComfyUI-Jimeng-API` — actively updated Jimeng/Volcano integration.

Do not install custom nodes merely because they contain `Seedance` in the name. Review source, provider endpoint and install script first.
