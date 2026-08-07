import { loadConfig, providerKey } from "../core/config.js";
import { assertOk, PorterError } from "../core/errors.js";
import { resolveBytePlusSource } from "../core/media.js";
import type { GenerationRequest, GenerationTask, ReferenceAsset } from "../core/types.js";
import { getRoute } from "../models/registry.js";
import type { SeedanceProvider } from "./provider.js";
import { normalizeStatus } from "./provider.js";

const genericRoleFor = (ref: ReferenceAsset) => {
  if (ref.role === "first_frame") return "first_frame";
  if (ref.role === "last_frame" || ref.role === "endpoint") return "last_frame";
  if (ref.kind === "image") return "reference_image";
  if (ref.kind === "video") return "reference_video";
  return "reference_audio";
};

function bytePlusPrompt(prompt: string): string {
  // Canonical Porter prompts already use [Image 1] / [Video 1] / [Audio 1],
  // matching the human-readable convention in the official BytePlus guide.
  // Keep compatibility with older manifests that used @Image1 tokens.
  return prompt
    .replace(/@Image(\d+)/g, "[Image $1]")
    .replace(/@Video(\d+)/g, "[Video $1]")
    .replace(/@Audio(\d+)/g, "[Audio $1]");
}

export class BytePlusProvider implements SeedanceProvider {
  readonly name = "byteplus" as const;
  private readonly cfg = loadConfig();
  private readonly key = providerKey("byteplus");

  private headers() {
    if (!this.key) throw new PorterError("CONFIG", "Missing BYTEPLUS_API_KEY / SEEDANCE_API_KEY / ARK_API_KEY");
    return { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" };
  }

  async submit(request: GenerationRequest): Promise<GenerationTask> {
    const route = getRoute(request.modelKey, this.name);
    if (!route.modes.includes(request.mode)) throw new PorterError("UNSUPPORTED", `${request.mode} is not enabled for ${request.modelKey} on BytePlus`);
    if (!route.resolutions.includes(request.resolution)) throw new PorterError("UNSUPPORTED", `${request.resolution} is not enabled for ${request.modelKey} on BytePlus`);
    const model = request.modelId ?? route.modelId;
    if (!model) throw new PorterError("CONFIG", `No BytePlus model ID configured for ${request.modelKey}`);

    const content: any[] = [{ type: "text", text: bytePlusPrompt(request.prompt) }];
    const explicitFirst = request.references.some((ref) => ref.role === "first_frame");
    const fallbackFirst = request.mode === "image-to-video" && !explicitFirst
      ? request.references.find((ref) => ref.kind === "image")?.id
      : undefined;

    for (const ref of request.references) {
      const url = await resolveBytePlusSource(ref.url, ref.kind);
      const role = ref.id === fallbackFirst ? "first_frame" : genericRoleFor(ref);
      if (ref.kind === "image") content.push({ type: "image_url", image_url: { url }, role });
      if (ref.kind === "video") content.push({ type: "video_url", video_url: { url }, role });
      if (ref.kind === "audio") content.push({ type: "audio_url", audio_url: { url }, role });
    }

    const body: Record<string, unknown> = {
      model,
      content,
      resolution: request.resolution,
      ratio: request.aspectRatio,
      duration: request.duration,
      generate_audio: request.generateAudio,
      watermark: request.watermark ?? false,
    };
    if (request.seed !== undefined) body.seed = request.seed;

    const response = await fetch(`${this.cfg.byteplusBaseUrl}/contents/generations/tasks`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    const data = (await assertOk(response)) as any;
    return { id: data.id, provider: this.name, modelKey: request.modelKey, status: "queued", raw: data };
  }

  async get(taskId: string, modelKey: string): Promise<GenerationTask> {
    const response = await fetch(`${this.cfg.byteplusBaseUrl}/contents/generations/tasks/${encodeURIComponent(taskId)}`, { headers: this.headers() });
    const data = (await assertOk(response)) as any;
    return {
      id: taskId,
      provider: this.name,
      modelKey,
      status: normalizeStatus(data.status ?? "queued"),
      videoUrl: data.content?.video_url,
      lastFrameUrl: data.content?.last_frame_url,
      error: data.error ? { code: data.error.code, message: data.error.message ?? "Generation failed" } : undefined,
      raw: data,
    };
  }

  async cancel(taskId: string, modelKey: string): Promise<GenerationTask> {
    const response = await fetch(`${this.cfg.byteplusBaseUrl}/contents/generations/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE", headers: this.headers() });
    await assertOk(response);
    return { id: taskId, provider: this.name, modelKey, status: "cancelled" };
  }
}
