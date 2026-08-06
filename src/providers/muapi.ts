import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { loadConfig, providerKey } from "../core/config.js";
import { assertOk, PorterError } from "../core/errors.js";
import { isRemoteSource } from "../core/media.js";
import type { GenerationRequest, GenerationTask, ReferenceAsset } from "../core/types.js";
import { getRoute } from "../models/registry.js";
import type { SeedanceProvider } from "./provider.js";
import { normalizeStatus } from "./provider.js";

export class MuApiProvider implements SeedanceProvider {
  readonly name = "muapi" as const;
  private readonly cfg = loadConfig();
  private readonly key = providerKey("muapi");

  private headers() {
    if (!this.key) throw new PorterError("CONFIG", "Missing MUAPI_API_KEY");
    return { "x-api-key": this.key, "Content-Type": "application/json" };
  }

  private async uploadLocal(source: string): Promise<string> {
    if (!this.key) throw new PorterError("CONFIG", "Missing MUAPI_API_KEY");
    const bytes = await readFile(source);
    const form = new FormData();
    form.append("file", new Blob([bytes]), basename(source));
    const response = await fetch(`${this.cfg.muapiBaseUrl}/upload_file`, { method: "POST", headers: { "x-api-key": this.key }, body: form });
    const data = (await assertOk(response)) as any;
    const url = data.url ?? data.file_url ?? data.data?.url;
    if (!url) throw new PorterError("API", "MuAPI upload completed without a file URL", false, data);
    return url;
  }

  private async resolved(refs: ReferenceAsset[]): Promise<ReferenceAsset[]> {
    return Promise.all(refs.map(async (ref) => isRemoteSource(ref.url) ? ref : { ...ref, url: await this.uploadLocal(ref.url) }));
  }

  async submit(request: GenerationRequest): Promise<GenerationTask> {
    const route = getRoute(request.modelKey, this.name);
    let endpoint = route.endpoints?.[request.mode];
    if (!endpoint) throw new PorterError("UNSUPPORTED", `${request.mode} is not configured on MuAPI for ${request.modelKey}`);
    if (!route.resolutions.includes(request.resolution)) throw new PorterError("UNSUPPORTED", `${request.resolution} is not configured on MuAPI for ${request.modelKey}`);
    if (request.resolution === "480p") endpoint = `${endpoint}-480p`;

    const refs = await this.resolved(request.references);
    const images = refs.filter((r) => r.kind === "image");
    const videos = refs.filter((r) => r.kind === "video");
    const audios = refs.filter((r) => r.kind === "audio");
    const first = refs.find((r) => r.role === "first_frame") ?? images[0];
    const last = refs.find((r) => r.role === "last_frame" || r.role === "endpoint");

    const body: Record<string, unknown> = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio === "adaptive" ? "16:9" : request.aspectRatio,
      duration: request.duration,
    };
    if (request.seed !== undefined) body.seed = request.seed;
    if (request.mode === "image-to-video") {
      if (!first) throw new PorterError("INVALID_INPUT", "MuAPI image-to-video requires an image reference");
      body.image_url = first.url;
    }
    if (request.mode === "first-last-frame") {
      if (!first || !last) throw new PorterError("INVALID_INPUT", "MuAPI first-last-frame requires first and last frame references");
      body.images_list = [first.url, last.url];
    }
    if (request.mode === "reference-to-video") {
      if (images.length) body.images_list = images.map((r) => r.url);
      if (videos.length) body.videos_list = videos.map((r) => r.url);
      if (audios.length) body.audios_list = audios.map((r) => r.url);
    }

    const response = await fetch(`${this.cfg.muapiBaseUrl}/${endpoint}`, { method: "POST", headers: this.headers(), body: JSON.stringify(body) });
    const data = (await assertOk(response)) as any;
    const id = data.request_id ?? data.id;
    if (!id) throw new PorterError("API", "MuAPI response did not contain request_id", false, data);
    return { id, provider: this.name, modelKey: request.modelKey, status: "queued", raw: data };
  }

  async get(taskId: string, modelKey: string): Promise<GenerationTask> {
    const response = await fetch(`${this.cfg.muapiBaseUrl}/predictions/${encodeURIComponent(taskId)}/result`, { headers: this.headers() });
    const data = (await assertOk(response)) as any;
    const status = normalizeStatus(data.status ?? "queued");
    const videoUrl = data.url ?? data.video_url ?? data.outputs?.[0];
    return {
      id: taskId,
      provider: this.name,
      modelKey,
      status,
      videoUrl: status === "succeeded" ? videoUrl : undefined,
      raw: data,
      error: status === "failed" ? { message: data.error ?? "MuAPI generation failed" } : undefined,
    };
  }
}
