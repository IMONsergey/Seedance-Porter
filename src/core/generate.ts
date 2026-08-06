import { join } from "node:path";
import { compileProject } from "../prompt/compiler.js";
import type { ProviderName, GenerationTask } from "./types.js";
import { createProvider } from "../providers/index.js";
import { loadConfig } from "./config.js";
import { pollUntil } from "./poll.js";
import { PorterError } from "./errors.js";
import { acquireGenerationGuard } from "./guard.js";
import { downloadFile, slug, timestamp } from "./io.js";
import { writeManifest } from "./manifest.js";

const terminal = (task: GenerationTask) => ["succeeded", "failed", "cancelled", "expired"].includes(task.status);

export async function generateProject(input: unknown, options: {
  provider?: ProviderName;
  wait?: boolean;
  outputDir?: string;
  force?: boolean;
  onStatus?: (task: GenerationTask) => void;
} = {}) {
  const compiled = compileProject(input, options.provider);
  const cfg = loadConfig();
  const provider = createProvider(compiled.request.provider);
  const release = await acquireGenerationGuard(compiled.request, options.force);
  try {
    let task = await provider.submit(compiled.request);
    options.onStatus?.(task);
    if (options.wait !== false && !terminal(task)) {
      task = await pollUntil({
        fetcher: () => provider.get(task.id, compiled.request.modelKey),
        terminal,
        intervalMs: cfg.pollIntervalMs,
        timeoutMs: cfg.timeoutMs,
        onTick: options.onStatus,
      });
    }
    if (task.status !== "succeeded") {
      if (options.wait === false) return { compiled, task };
      throw new PorterError("API", task.error?.message ?? `Generation ended with status ${task.status}`, false, task.raw);
    }

    let videoPath: string | undefined;
    let manifestPath: string | undefined;
    if (task.videoUrl) {
      const dir = options.outputDir ?? cfg.outputDir;
      const name = `${timestamp()}-${slug(compiled.request.label ?? compiled.request.project)}-${task.id.slice(0, 8)}.mp4`;
      videoPath = join(dir, slug(compiled.request.project), name);
      await downloadFile(task.videoUrl, videoPath);
      manifestPath = await writeManifest(videoPath, {
        schema: "seedance-porter.v1",
        source: "generate",
        createdAt: new Date().toISOString(),
        request: compiled.request,
        task,
        output: { path: videoPath, videoUrl: task.videoUrl, lastFrameUrl: task.lastFrameUrl },
      });
    }
    return { compiled, task, videoPath, manifestPath };
  } finally {
    await release();
  }
}
