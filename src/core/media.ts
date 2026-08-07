import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { PorterError } from "./errors.js";
import type { ReferenceKind } from "./types.js";

export function isRemoteSource(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^data:/i.test(value);
}

function isBytePlusAssetSource(value: string): boolean {
  return /^asset:\/\//i.test(value);
}

function mimeFor(path: string, kind: ReferenceKind): string {
  const ext = extname(path).toLowerCase();
  const known: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
  };
  return known[ext] ?? (kind === "image" ? "image/png" : kind === "audio" ? "audio/wav" : "application/octet-stream");
}

export async function resolveBytePlusSource(source: string, kind: ReferenceKind): Promise<string> {
  if (isRemoteSource(source) || isBytePlusAssetSource(source)) return source;
  if (kind === "video") throw new PorterError("UNSUPPORTED", "BytePlus reference videos must currently be reachable by URL/asset reference; upload the local video to controlled storage or ModelArk assets first.");
  const bytes = await readFile(source);
  return `data:${mimeFor(source, kind)};base64,${bytes.toString("base64")}`;
}
