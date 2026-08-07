# Provider strategy

Verified/updated: **2026-08-07**.

Porter separates the **model** from the **route used to reach the model**. Provider contracts differ even when the marketing model name is the same, so capabilities and parameters are route-specific.

## BytePlus ModelArk — preferred production route

BytePlus is ByteDance's international cloud surface. Porter uses:

- base URL: `https://ark.ap-southeast.bytepluses.com/api/v3`
- create: `POST /contents/generations/tasks`
- status: `GET /contents/generations/tasks/{id}`
- cancel: `DELETE /contents/generations/tasks/{id}`
- auth: `Authorization: Bearer <key>`
- Seedance 2.0: `dreamina-seedance-2-0-260128`
- Seedance 2.0 Fast: `dreamina-seedance-2-0-fast-260128`

Current first-party ModelArk contract encoded by Porter:

- Seedance 2.0 Standard: 480p / 720p / 1080p / 4K route capabilities, subject to account/region availability;
- Seedance 2.0 Fast: 480p / 720p;
- direct Seedance 2.0 ModelArk route: `seed` is currently marked unsupported;
- strict first/last interpolation is kept separate from multimodal reference generation;
- multimodal image/video/audio entries are translated to `reference_image`, `reference_video`, `reference_audio` API roles;
- every BytePlus image/video reference declares `faceSource`, and ModelArk-managed identity assets follow the supported asset/trust flow rather than being treated as arbitrary uploads.

Set `BYTEPLUS_API_KEY` (or compatibility aliases `SEEDANCE_API_KEY` / `ARK_API_KEY`). See `docs/BYTEDANCE-OFFICIAL-GUIDE.md` for the source-dated prompt and request standard.

## fal.ai — stable convenience route

Current useful Seedance 2.0 endpoints include:

- `bytedance/seedance-2.0/text-to-video`
- `bytedance/seedance-2.0/image-to-video`
- `bytedance/seedance-2.0/reference-to-video`
- fast equivalents under `bytedance/seedance-2.0/fast/...`

Porter deliberately uses `fal.subscribe()` for a simple synchronous adapter. That makes it useful for quick production use but means task lookup is not persistent across Porter processes yet. The configured fal route advertises seed control, so Porter seed-variant planning is allowed there even though the direct BytePlus Seedance 2.0 route does not expose the same parameter.

## MuAPI — isolated Seedance 2.5 preview route

Current third-party 2.5 routes used by Porter:

- `seedance-2.5-text-to-video`
- `seedance-2.5-image-to-video`
- `seedance-2.5-first-last-frame`
- `seedance-2.5-omni-reference`
- 480p variants append `-480p`
- polling: `GET /predictions/{request_id}/result`

The observed preview wrapper advertises 4–30 second clips, 480p/720p and up to 20 image / 6 video / 6 audio references for omni-reference. **This is not an official ByteDance API contract.** Keep it behind the preview model route and expect changes.

No dedicated first-party Seedance 2.5 prompt guide was verified in the 2026-08-07 research pass, so Porter conservatively applies the latest verified first-party Seedance methodology to this preview route while keeping provider-specific capabilities separate.

## Why there is no “generic Seedance API” class

A generic class that guesses parameter names is fragile. Porter normalizes the creative request, runs official compliance, then each adapter translates the request to the provider's concrete schema. Provider differences stay local and cannot silently rewrite the official production contract.
