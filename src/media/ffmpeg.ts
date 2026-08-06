import { mkdir } from "node:fs/promises";
import { dirname, extname } from "node:path";
import { spawn } from "node:child_process";
import { PorterError } from "../core/errors.js";

async function run(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") reject(new PorterError("CONFIG", `${command} is not installed or not on PATH`));
      else reject(new PorterError("IO", `${command} failed to start: ${error.message}`, false, error));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new PorterError("IO", `${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

export async function extractLastFrame(videoPath: string, outputPath?: string): Promise<string> {
  const ext = extname(videoPath);
  const out = outputPath ?? `${videoPath.slice(0, Math.max(0, videoPath.length - ext.length))}.last-frame.png`;
  await mkdir(dirname(out), { recursive: true });
  // Seedance clips are short. Reversing only the final two seconds gives us the
  // true final decoded frame without scanning/reversing the entire movie.
  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error",
    "-sseof", "-2",
    "-i", videoPath,
    "-vf", "reverse",
    "-frames:v", "1",
    "-y", out,
  ]);
  return out;
}
