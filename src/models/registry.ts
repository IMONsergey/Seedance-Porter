import type { ModelDefinition, ProviderName } from "../core/types.js";
import { PorterError } from "../core/errors.js";

export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  "seedance-2.0": {
    key: "seedance-2.0",
    displayName: "Seedance 2.0",
    family: "seedance",
    lifecycle: "production",
    lastVerified: "2026-08-06",
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
        resolutions: ["480p", "720p"],
        modes: ["text-to-video", "image-to-video", "reference-to-video", "first-last-frame"],
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
        notes: ["fal.ai is a router/provider surface, not ByteDance's official API."],
      },
    },
    sources: [
      "https://docs.byteplus.com/en/docs/ModelArk/2291680",
      "https://github.com/paperfoot/seedance-cli",
      "https://github.com/fal-ai/seedance-2.0-api",
      "https://github.com/Comfy-Org/ComfyUI",
    ],
    notes: ["Use 4-8 second shots for reliability even though the model supports longer clips."],
  },
  "seedance-2.0-fast": {
    key: "seedance-2.0-fast",
    displayName: "Seedance 2.0 Fast",
    family: "seedance",
    lifecycle: "production",
    lastVerified: "2026-08-06",
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
      },
    },
    sources: ["https://github.com/paperfoot/seedance-cli", "https://github.com/fal-ai/seedance-2.0-api"],
    notes: ["Prefer for exploration, variant sweeps and lower-cost iteration."],
  },
  "seedance-2.0-mini": {
    key: "seedance-2.0-mini",
    displayName: "Seedance 2.0 Mini",
    family: "seedance",
    lifecycle: "experimental",
    lastVerified: "2026-08-06",
    duration: { min: 4, max: 15 },
    aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
    referenceLimits: { images: 9, videos: 3, audios: 3 },
    nativeAudio: true,
    supportsSeed: true,
    routes: {
      byteplus: {
        provider: "byteplus",
        officialApi: true,
        modelId: "dreamina-seedance-2-0-mini",
        resolutions: ["480p", "720p", "1080p", "4k"],
        modes: ["text-to-video", "image-to-video", "reference-to-video", "first-last-frame"],
        notes: ["Route observed in current ComfyUI ByteDance API nodes; verify account availability before production."],
      },
    },
    sources: ["https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_api_nodes/nodes_bytedance.py"],
    notes: ["Treat capability surface as provider/account dependent."],
  },
  "seedance-2.5-preview": {
    key: "seedance-2.5-preview",
    displayName: "Seedance 2.5 Preview",
    family: "seedance",
    lifecycle: "preview",
    lastVerified: "2026-08-06",
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
        notes: ["Third-party early-access route. Do not label it official ByteDance API."],
      },
    },
    sources: [
      "https://dreamina.capcut.com/seedance/seedance-2-5",
      "https://github.com/SamurAIGPT/Seedance-2.5-API",
      "https://github.com/Anil-matcha/seedance2.5-comfyui",
    ],
    notes: ["Architecture target for the newest model; provider contract may change without notice."],
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
