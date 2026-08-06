import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { slug, writeJson } from "../core/io.js";
import type { PorterManifest, PorterReview } from "../core/manifest.js";

export interface LedgerTake {
  taskId: string;
  manifestPath: string;
  provider: string;
  model: string;
  label?: string;
  seed?: number;
  videoPath?: string;
  videoUrl?: string;
  decision: PorterReview["decision"];
  score: number;
  observedEndState?: string;
  lastFramePath?: string;
  reviewedAt: string;
}

export interface ProjectLedger {
  schema: "seedance-porter-ledger.v1";
  project: string;
  updatedAt: string;
  acceptedTakeId?: string;
  takes: LedgerTake[];
}

export function ledgerPath(project: string): string {
  return join(".porter", "projects", slug(project), "ledger.json");
}

export async function loadLedger(project: string): Promise<ProjectLedger> {
  const path = ledgerPath(project);
  try {
    return JSON.parse(await readFile(path, "utf8")) as ProjectLedger;
  } catch (error) {
    const anyError = error as NodeJS.ErrnoException;
    if (anyError.code !== "ENOENT") throw error;
    return { schema: "seedance-porter-ledger.v1", project, updatedAt: new Date(0).toISOString(), takes: [] };
  }
}

export async function recordReview(manifestPath: string, manifest: PorterManifest, review: PorterReview): Promise<ProjectLedger> {
  const project = manifest.request.project;
  const ledger = await loadLedger(project);
  const take: LedgerTake = {
    taskId: manifest.task.id,
    manifestPath,
    provider: manifest.request.provider,
    model: manifest.request.modelKey,
    label: manifest.request.label,
    seed: manifest.request.seed,
    videoPath: manifest.output?.path,
    videoUrl: manifest.output?.videoUrl,
    decision: review.decision,
    score: review.score,
    observedEndState: review.observedEndState,
    lastFramePath: review.lastFramePath,
    reviewedAt: review.reviewedAt,
  };
  const existing = ledger.takes.findIndex((item) => item.taskId === take.taskId);
  if (existing >= 0) ledger.takes[existing] = take;
  else ledger.takes.push(take);
  ledger.updatedAt = new Date().toISOString();
  if (review.decision === "accept") ledger.acceptedTakeId = manifest.task.id;
  await writeJson(ledgerPath(project), ledger);
  return ledger;
}

export async function getAcceptedTake(project: string): Promise<LedgerTake | undefined> {
  const ledger = await loadLedger(project);
  if (!ledger.acceptedTakeId) return undefined;
  return ledger.takes.find((take) => take.taskId === ledger.acceptedTakeId);
}
