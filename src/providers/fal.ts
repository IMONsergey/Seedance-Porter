import { fal } from "@fal-ai/client";
import { providerKey } from "../core/config.js";
import { PorterError } from "../core/errors.js";
import { isRemoteSource } from "../core/media.js";
import type { GenerationRequest, GenerationTask } from "../core/types.js";
import { getRoute } from "../models/registry.js";
import type { SeedanceProvider } from "./provider.js";

export class FalProvider implements SeedanceProvider {
  readonly name = "fal" as const;
  private completed = new Map<string, GenerationTask>();

  private configure() {
    const key = providerKey("fal");
    if (!key) throw new PorterError("CONFIG", "Missing FAL_KEY");
    fal.config({ credentials: key });
  }

  async submit(request: GenerationRequest): Promise<GenerationTask> {
    this.configure();
    const route = getRoute(request.modelKey, this.name);
    const endpoint = route.endpoints?.[request.mode];
    if (!endpoint) throw new PorterError("UNSUPPORTED", `${request.mode} is not configured on fal for ${request.modelKey}`);
    const local = request.references.find((ref) => !isRemoteSource(ref.url));
    if (local) throw new PorterError("UNSUPPORTED", `fal adapter currently expects remote reference URLs; ${local.id} is local. Upload it to controlled storage or use BytePlus/MuAPI local-media support.`);

    const images = request.references.filter((r) => r.kind === "image");
    const videos = request.references.filter((r) => r.kind === "video");
    const audios = request.references.filter((r) => r.kind === "audio");
    const first = request.references.find((r) => r.role === "first_frame") ?? images[0];
    const last = request.references.find((r) => r.role === "last_frame" || r.role === "endpoint");

    const input: Record<string, unknown> = {
      prompt: request.prompt,
      resolution: request.resolution,
      duration: String(request.duration),
      aspect_ratio: request.aspectRatio === "adaptive" ? "auto" : request.aspectRatio,
      generate_audio: request.generateAudio,
    };
    if (request.seed !== undefined) input.seed = request.seed;

    if (request.mode === "image-to-video") {
      if (!first) throw new PorterError("INVALID_INPUT", "fal image-to-video requires a first image reference");
      input.image_url = first.url;
      if (last) input.end_image_url = last.url;
    }
    if (request.mode === "reference-to-video") {
      if (images.length) input.image_urls = images.map((r) => r.url);
      if (videos.length) input.video_urls = videos.map((r) => r.url);
      if (audios.length) input.audio_urls = audios.map((r) => r.url);
    }

    const result = (await fal.subscribe(endpoint, { input })) as any;
    const id = result.requestId ?? result.request_id ?? `fal-${Date.now()}`;
    const videoUrl = result.data?.video?.url ?? result.data?.video_url ?? result.video?.url ?? result.video_url;
    const task: GenerationTask = {
      id,
      provider: this.name,
      modelKey: request.modelKey,
      status: videoUrl ? "succeeded" : "failed",
      videoUrl,
      raw: result,
      error: videoUrl ? undefined : { message: "fal completed without a video URL" },
    };
    this.completed.set(id, task);
    return task;
  }

  async get(taskId: string, modelKey: string): Promise<GenerationTask> {
    return this.completed.get(taskId) ?? {
      id: taskId,
      provider: this.name,
      modelKey,
      status: "failed",
      error: { message: "This Porter fal adapter uses subscribe(); task state is only retained in the current process." },
    };
  }
}
