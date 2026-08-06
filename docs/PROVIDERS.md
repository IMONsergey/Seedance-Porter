# Provider strategy

Verified/updated: **2026-08-06**.

Porter separates the **model** from the **route used to reach the model**. This matters because a provider may expose fewer modes/resolutions than another provider even when the marketing name is the same.

## BytePlus ModelArk — preferred production route

BytePlus is ByteDance's international cloud surface. Porter uses:

- base URL: `https://ark.ap-southeast.bytepluses.com/api/v3`
- create: `POST /contents/generations/tasks`
- status: `GET /contents/generations/tasks/{id}`
- cancel: `DELETE /contents/generations/tasks/{id}`
- auth: `Authorization: Bearer <key>`
- Seedance 2.0: `dreamina-seedance-2-0-260128`
- Seedance 2.0 Fast: `dreamina-seedance-2-0-fast-260128`

This contract is reflected by the current ModelArk integrations and `paperfoot/seedance-cli`. Set `BYTEPLUS_API_KEY` (or compatibility aliases `SEEDANCE_API_KEY` / `ARK_API_KEY`).

## fal.ai — stable convenience route

Current useful Seedance 2.0 endpoints include:

- `bytedance/seedance-2.0/text-to-video`
- `bytedance/seedance-2.0/image-to-video`
- `bytedance/seedance-2.0/reference-to-video`
- fast equivalents under `bytedance/seedance-2.0/fast/...`

Porter deliberately uses `fal.subscribe()` for a simple synchronous adapter. That makes it excellent for quick production use but means task lookup is not persistent across Porter processes yet. Use BytePlus when durable task IDs/control are more important.

## MuAPI — isolated Seedance 2.5 preview route

Current third-party 2.5 routes used by Porter:

- `seedance-2.5-text-to-video`
- `seedance-2.5-image-to-video`
- `seedance-2.5-first-last-frame`
- `seedance-2.5-omni-reference`
- 480p variants append `-480p`
- polling: `GET /predictions/{request_id}/result`

The observed preview wrapper advertises 4-30 second clips, 480p/720p and up to 20 image / 6 video / 6 audio references for omni-reference. **This is not an official ByteDance API contract.** Keep it behind the preview model route and expect changes.

## Why there is no “generic Seedance API” class

A generic class that guesses parameter names is fragile. Porter normalizes the creative request, then each adapter translates it to the provider's concrete schema. Provider differences stay local.
