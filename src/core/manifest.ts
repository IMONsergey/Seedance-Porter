import { dirname, extname, join, basename } from "node:path";
import { writeJson } from "./io.js";
import type { GenerationRequest, GenerationTask } from "./types.js";

export interface PorterManifest {
  schema: "seedance-porter.v1";
  source: "generate" | "import";
  createdAt: string;
  request: GenerationRequest;
  task: GenerationTask;
  output?: { path?: string; videoUrl?: string; lastFrameUrl?: string };
  evaluation?: unknown;
}

export function manifestPathForVideo(videoPath: string): string {
  const ext = extname(videoPath);
  const stem = basename(videoPath, ext);
  return join(dirname(videoPath), `${stem}.porter.json`);
}

export async function writeManifest(videoPath: string, manifest: PorterManifest): Promise<string> {
  const path = manifestPathForVideo(videoPath);
  await writeJson(path, manifest);
  return path;
}
