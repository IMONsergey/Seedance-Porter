import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { prepareContinuation } from "../src/projects/continuation.js";

const dirs: string[] = [];

async function manifest(decision: "accept" | "reject" = "accept") {
  const dir = await mkdtemp(join(tmpdir(), "porter-continuation-"));
  dirs.push(dir);
  const path = join(dir, "take.porter.json");
  await writeFile(path, JSON.stringify({
    schema: "seedance-porter.v1",
    source: "generate",
    createdAt: new Date().toISOString(),
    request: {
      project: "continuity-test",
      provider: "byteplus",
      modelKey: "seedance-2.0",
      mode: "text-to-video",
      prompt: "test",
      references: [],
      duration: 6,
      resolution: "720p",
      aspectRatio: "16:9",
      generateAudio: false
    },
    task: { id: "task-1", provider: "byteplus", modelKey: "seedance-2.0", status: "succeeded" },
    output: { lastFrameUrl: "https://example.com/last-frame.png" },
    evaluation: {
      reviewedAt: new Date().toISOString(),
      decision,
      scores: {},
      score: 4.3,
      verdict: decision === "accept" ? "accept" : "reject",
      observedEndState: "The subject is stopped at frame-right, looking left."
    }
  }), "utf8");
  return path;
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

const nextProject = {
  project: "continuity-test",
  model: "seedance-2.0",
  provider: "byteplus" as const,
  duration: 6,
  resolution: "720p" as const,
  aspectRatio: "16:9" as const,
  generateAudio: false,
  brief: {
    objective: "Continue the same action",
    subject: "The same subject",
    action: "The subject turns back toward center and stops",
    environment: "The same room",
    constraints: [],
    beats: []
  },
  references: [],
  shots: []
};

describe("prepareContinuation", () => {
  it("anchors the next project to the accepted take's actual final state", async () => {
    const prepared = await prepareContinuation(nextProject, await manifest("accept"), "byteplus");
    expect(prepared.project.continuity?.observedStartState).toMatch(/frame-right/);
    expect(prepared.project.references[0].role).toBe("first_frame");
    expect(prepared.project.references[0].url).toContain("last-frame.png");
    expect(prepared.compiled.request.prompt).toMatch(/Observed start state/);
  });

  it("refuses to continue from a rejected take", async () => {
    await expect(prepareContinuation(nextProject, await manifest("reject"), "byteplus")).rejects.toThrow(/only accepted takes/i);
  });
});
