import { dirname, extname, join, basename } from "node:path";
import { readJson, writeJson } from "./io.js";
import type { GenerationRequest, GenerationTask } from "./types.js";
import type { ProjectSpec } from "./schema.js";

export type TakeDecision = "accept" | "retake" | "reject";

export interface PorterReview {
  reviewedAt: string;
  decision: TakeDecision;
  scores: Record<string, number>;
  score: number;
  verdict: string;
  weakest?: { dimension: string; value: number };
  nextRetakeLever?: string | null;
  observedEndState?: string;
  lastFramePath?: string;
  notes?: string;
}

export interface PorterManifest {
  schema: "seedance-porter.v1";
  source: "generate" | "import";
  createdAt: string;
  projectSpec?: ProjectSpec;
  request: GenerationRequest;
  task: GenerationTask;
  output?: { path?: string; videoUrl?: string; lastFrameUrl?: string };
  evaluation?: PorterReview;
}

export function manifestPathForVideo(videoPath: string): string {
  const ext = extname(videoPath);
  const stem = basename(videoPath, ext);
  return join(dirname(videoPath), `${stem}.porter.json`);
}

export async function readManifest(path: string): Promise<PorterManifest> {
  return readJson<PorterManifest>(path);
}

export async function saveManifest(path: string, manifest: PorterManifest): Promise<void> {
  await writeJson(path, manifest);
}

export async function writeManifest(videoPath: string, manifest: PorterManifest): Promise<string> {
  const path = manifestPathForVideo(videoPath);
  await saveManifest(path, manifest);
  return path;
}
