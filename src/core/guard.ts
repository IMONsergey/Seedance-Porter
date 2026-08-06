import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PorterError } from "./errors.js";
import type { GenerationRequest } from "./types.js";

const WINDOW_MS = 10 * 60 * 1000;

export function requestFingerprint(request: GenerationRequest): string {
  return createHash("sha256").update(JSON.stringify(request)).digest("hex").slice(0, 16);
}

export async function acquireGenerationGuard(request: GenerationRequest, force = false): Promise<() => Promise<void>> {
  if (request.seed === -1) return async () => undefined;
  const dir = join(".porter", "locks");
  await mkdir(dir, { recursive: true });
  const fingerprint = requestFingerprint(request);
  const path = join(dir, `${fingerprint}.json`);
  try {
    const previous = JSON.parse(await readFile(path, "utf8")) as { createdAt: number };
    const age = Date.now() - previous.createdAt;
    if (!force && age < WINDOW_MS) throw new PorterError("INVALID_INPUT", `Duplicate deterministic generation blocked (${fingerprint}, ${Math.round(age / 1000)}s old). Use --force or change seed/prompt.`);
  } catch (error) {
    if (error instanceof PorterError) throw error;
  }
  await writeFile(path, JSON.stringify({ pid: process.pid, createdAt: Date.now(), fingerprint }));
  // Keep the timestamped guard on disk for the full duplicate window. A stale
  // guard is overwritten by the next allowed call and .porter/ is gitignored.
  return async () => undefined;
}
