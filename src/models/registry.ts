import type { ModelDefinition, ProviderName } from "../core/types.js";
import { PorterError } from "../core/errors.js";

export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  "seedance-2.0": {
    key: "seedance-2.0",
    displayName: "Seedance 2.0",
    family: "seedance",
    lifecycle: "production",
    lastVerified: "2026-08-07",
    duration: { min: 4, max: 15, auto: true },
    aspectRatios: ["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    referenceLimits: { images: 9, videos: 3, audios: 3 },
    nativeAudio: true,
    supportsSeed: true,
    routes: {
      byteplus: {
        provider: "byteplus",
        officialApi: true,
        modelId: "dreamina-seedance-2-0-260128",
        resolutions: ["480p", "720p", "1080p", "4k"],
        modes: ["text-to-video", "image-to-video", "reference-to-video", "first-last-frame"],
        supportsSeed: false,
        notes: [
          "Official ModelArk route. The current create-task documentation marks Seedance 2.0 seed control as unsupported.",
          "4K output is available on the standard model route; verify account/region availability before production use.",
        ],
      },
      fal: {
        provider: "fal",
        officialApi: false,
        endpoints: {
          "text-to-video": "bytedance/seedance-2.0/text-to-video",
          "image-to-video": "bytedance/seedance-2.0/image-to-video",
          "reference-to-video": "bytedance/seedance-2.0/reference-to-video",
        },
        resolutions: ["480p", "720p"],
        modes: ["text-to-video", "image-to-video", "reference-to-video"],
        supportsSeed: true,
        notes: ["fal.ai is a router/provider surface, not ByteDance's official API."],
      },
    },
    sources: [
      "https://docs.byteplus.com/en/docs/ModelArk/2222480",
      "https://docs.byteplus.com/en/docs/ModelArk/2291680",
      "https://docs.byteplus.com/en/docs/ModelArk/1520757",
      "https://github.com/fal-ai/seedance-2.0-api",
      "https://github.com/Comfy-Org/ComfyUI",
    ],
    notes: [
      "Official prompt methodology is enforced by BOS-2026-07-17 before paid generation.",
      "Porter empirical recommendation: begin with shorter clips for iteration even though the model supports up to 15 seconds.",
    ],
  },
  "seedance-2.0-fast": {
    key: "seedance-2.0-fast",
    displayName: "Seedance 2.0 Fast",
    family: "seedance",
    lifecycle: "production",
    lastVerified: "2026-08-07",
    duration: { min: 4, max: 15, auto: true },
    aspectRatios: ["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    referenceLimits: { images: 9, videos: 3, audios: 3 },
    nativeAudio: true,
    supportsSeed: true,
    routes: {
      byteplus: {
        provider: "byteplus",
        officialApi: true,
        modelId: "dreamina-seedance-2-0-fast-260128",
        resolutions: ["480p", "720p"],
        modes: ["text-to-video", "image-to-video", "reference-to-video", "first-last-frame"],
        supportsSeed: false,
        notes: ["Official ModelArk route; current create-task documentation marks Seedance 2.0 series seed control as unsupported."],
      },
      fal: {
        provider: "fal",
        officialApi: false,
        endpoints: {
          "text-to-video": "bytedance/seedance-2.0/fast/text-to-video",
          "image-to-video": "bytedance/seedance-2.0/fast/image-to-video",
          "reference-to-video": "bytedance/seedance-2.0/fast/reference-to-video",
        },
        resolutions: ["480p", "720p"],
        modes: ["text-to-video", "image-to-video", "reference-to-video"],
        supportsSeed: true,
      },
    },
    sources: [
      "https://docs.byteplus.com/en/docs/ModelArk/1520757",
      "https://github.com/fal-ai/seedance-2.0-api"
    ],
    notes: ["Use a route that explicitly advertises seed control before attempting deterministic seed variants."],
  },
  "seedance-2.0-mini": {
    key: "seedance-2.0-mini",
    displayName: "Seedance 2.0 Mini",
    family: "seedance",
    lifecycle: "experimental",
    lastVerified: "2026-08-07",
    duration: { min: 4, max: 15 },
    aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    referenceLimits: { images: 9, videos: 3, audios: 3 },
    nativeAudio: true,
    supportsSeed: false,
    routes: {
      byteplus: {
        provider: "byteplus",
        officialApi: true,
        modelId: "dreamina-seedance-2-0-mini",
        resolutions: ["480p", "720p"],
        modes: ["text-to-video", "image-to-video", "reference-to-video", "first-last-frame"],
        supportsSeed: false,
        notes: [
          "Mini availability is account/provider dependent.",
          "Current ModelArk create-task documentation does not expose 1080p/4K for Mini and marks Seedance 2.0 seed control unsupported.",
        ],
      },
    },
    sources: [
      "https://docs.byteplus.com/en/docs/ModelArk/1520757",
      "https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_bytedance.py"
    ],
    notes: ["Treat capability surface as provider/account dependent and re-verify before promotion."],
  },
  "seedance-2.5-preview": {
    key: "seedance-2.5-preview",
    displayName: "Seedance 2.5 Preview",
    family: "seedance",
    lifecycle: "preview",
    lastVerified: "2026-08-07",
    duration: { min: 4, max: 30 },
    aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "9:21"],
    referenceLimits: { images: 20, videos: 6, audios: 6 },
    nativeAudio: true,
    supportsSeed: true,
    routes: {
      muapi: {
        provider: "muapi",
        officialApi: false,
        endpoints: {
          "text-to-video": "seedance-2.5-text-to-video",
          "image-to-video": "seedance-2.5-image-to-video",
          "reference-to-video": "seedance-2.5-omni-reference",
          "first-last-frame": "seedance-2.5-first-last-frame",
        },
        resolutions: ["480p", "720p"],
        modes: ["text-to-video", "image-to-video", "reference-to-video", "first-last-frame"],
        supportsSeed: true,
        notes: ["Third-party early-access route. Do not label it official ByteDance API."],
      },
    },
    sources: [
      "https://dreamina.capcut.com/seedance/seedance-2-5",
      "https://github.com/SamurAIGPT/Seedance-2.5-API",
      "https://github.com/Anil-matcha/seedance2.5-comfyui",
    ],
    notes: [
      "Architecture target for the newest preview model; provider contract may change without notice.",
      "Until a dedicated official 2.5 prompt guide is verified, Porter applies the latest verified first-party Seedance methodology as a conservative prompting baseline.",
    ],
  },
};

export function getModel(key: string): ModelDefinition {
  const model = MODEL_REGISTRY[key];
  if (!model) throw new PorterError("INVALID_INPUT", `Unknown model: ${key}`);
  return model;
}

export function getRoute(modelKey: string, provider: ProviderName) {
  const model = getModel(modelKey);
  const route = model.routes[provider];
  if (!route) throw new PorterError("UNSUPPORTED", `${modelKey} has no configured ${provider} route`);
  return route;
}

export function listModels() {
  return Object.values(MODEL_REGISTRY);
}
