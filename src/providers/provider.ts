import type { GenerationRequest, GenerationTask, ProviderName } from "../core/types.js";

export interface SeedanceProvider {
  readonly name: ProviderName;
  submit(request: GenerationRequest): Promise<GenerationTask>;
  get(taskId: string, modelKey: string): Promise<GenerationTask>;
  cancel?(taskId: string, modelKey: string): Promise<GenerationTask>;
}

export function normalizeStatus(status: string): GenerationTask["status"] {
  const value = status.toLowerCase();
  if (["succeeded", "completed", "complete", "success"].includes(value)) return "succeeded";
  if (["failed", "error"].includes(value)) return "failed";
  if (["cancelled", "canceled"].includes(value)) return "cancelled";
  if (value === "expired") return "expired";
  if (["running", "processing", "in_progress"].includes(value)) return "running";
  return "queued";
}
