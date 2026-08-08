# Prompt Studio v6 — Audio References

Prompt Studio v6 adds first-class audio reference handling from the existing Reference Manager through provider-neutral Generation Handoff into the BytePlus Seedance 2.0 ModelArk export adapter.

The implementation is deliberately extension-safe: it does not change the Prompt Studio project schema version or break older projects/revisions.

## Official Seedance 2.0 boundary

Verified against current BytePlus ModelArk documentation on 2026-08-08. The current create-video API reference reports an update date of 2026-08-07.

For Seedance 2.0 multimodal reference generation:
- up to 9 reference images;
- up to 3 reference videos;
- up to 3 reference audios;
- audio is represented by `audio_url` with role `reference_audio`;
- prompt references use provider-native `[Audio N]` tokens;
- reference audio supports WAV / MP3;
- each reference audio is documented as 2–15 seconds and total reference-audio duration must not exceed 15 seconds;
- audio cannot be the only reference modality: at least one image or video is required;
- image + audio, video + audio, and image + video + audio are valid multimodal combinations;
- exact first-frame / first+last-frame image-to-video scenarios are mutually exclusive with multimodal reference video/audio inputs.

Official sources:
- `https://docs.byteplus.com/en/docs/ModelArk/1520757`
- `https://docs.byteplus.com/api/docs/ModelArk/2298881`
- `https://docs.byteplus.com/en/docs/ModelArk/2291680`

## Extension-safe project representation

Prompt Studio core schema v1 historically normalizes reference `mediaType` to `image`, `video`, or `unknown`. V6 avoids a destructive schema migration by keeping an audio reference core-compatible:

```json
{
  "references": [
    {
      "id": "ref-audio",
      "token": "@ref02",
      "mediaType": "unknown"
    }
  ],
  "referenceMediaOverrides": {
    "ref-audio": "audio"
  }
}
```

`prompt-studio-reference-media.js` is the single resolver for the effective media type. Existing future-extension persistence guarantees preserve this top-level field through save/load/revision/duplicate/import flows without forcing older projects to migrate.

Switching the reference back to image/video/unknown removes the audio override and writes the normal core media type again. Stale override entries for deleted references are ignored/removed by normalization.

## Reference Manager

`prompt-studio-v6-audio-ui.js` extends the existing Reference Manager rather than replacing it.

It:
- adds `audio` to the media-type selector;
- extends local file selection to `audio/*`, WAV and MP3;
- intercepts audio changes in capture phase so the legacy core handler cannot misclassify audio as image;
- stores local audio through the existing IndexedDB asset system;
- mutates projects only through `window.porterPromptStudio.replaceProject()`;
- never reaches into Prompt Studio private state.

Local audio remains local-browser media and therefore cannot be silently submitted to a remote provider.

## Preview

The shared Reference Preview layer resolves the effective media type. Audio references render with native `<audio controls>` and `preload="metadata"`. They never autoplay.

Local IndexedDB audio uses the same object-URL lifecycle as existing image/video references.

## Generation Handoff

Generation Handoff now resolves every enabled reference through `effectiveReferenceMediaType()`.

Therefore an audio reference is exported as:

```json
{
  "token": "@ref02",
  "mediaType": "audio",
  "availability": "url"
}
```

Preflight summaries include image/video/audio reference counts. Existing integrity hashing and no-auto-execution policy remain unchanged.

## Seedance 2.0 provider translation

The provider adapter maps audio independently from image/video indexing:

- Studio `@refNN` → provider `[Audio N]`;
- `mediaType: audio` → `type: audio_url`;
- provider role → `reference_audio`.

Example:

```json
{
  "type": "audio_url",
  "audio_url": {
    "url": "https://example.com/reference.mp3"
  },
  "role": "reference_audio"
}
```

V6 enforces:
- maximum 3 audio references;
- audio cannot be the only reference modality;
- local/missing audio blocks portable provider export;
- image-to-video exact first-frame mode cannot mix reference video/audio;
- first+last-frame mode requires exactly two endpoint images and cannot mix reference video/audio;
- ordinary multimodal image references remain `reference_image`, even if their editorial Studio role happens to resemble a frame role.

The provider export JSON Schema models the full current content ceiling: one text element + 9 images + 3 videos + 3 audios = maximum 16 content items.

## Duration metadata boundary

V6 deliberately does not fetch public audio URLs in the browser to inspect their duration. Doing that would add network behavior, CORS variability and a hidden provider-adjacent side effect.

The official 2–15 second per-audio and <=15 second aggregate duration constraints are documented here, while V6 currently enforces the deterministic constraints it can prove without fetching media: modality, count, portability and scenario compatibility. A future local metadata inspector can validate attached local files without changing this provider boundary.

## Safety invariants

V6 preserves:
- no provider browser submission;
- no client-side API key;
- no automatic asset upload;
- no silent conversion of browser-local audio to remote media;
- no automatic project schema migration;
- no automatic curated mutation;
- exactly 100 unique curated cases;
- exactly 192 Porter Originals.

Pages and the dedicated Node 20/22/24 CI matrix run audio engine, audio UI and production contracts before protected release validation.
