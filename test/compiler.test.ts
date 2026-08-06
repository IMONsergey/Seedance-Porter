import { describe, expect, it } from "vitest";
import { compileProject } from "../src/prompt/compiler.js";

describe("compileProject", () => {
  it("compiles a minimal text-to-video brief", () => {
    const result = compileProject({
      project: "test",
      model: "seedance-2.0",
      provider: "byteplus",
      duration: 6,
      resolution: "720p",
      aspectRatio: "16:9",
      brief: {
        objective: "Test controlled motion",
        subject: "A red ceramic cup",
        action: "The cup rotates slowly once and stops",
        environment: "Neutral tabletop studio",
        constraints: [],
        beats: []
      },
      references: [],
      shots: []
    });
    expect(result.request.mode).toBe("text-to-video");
    expect(result.request.prompt).toContain("A red ceramic cup");
  });

  it("maps multimodal references and chooses reference-to-video", () => {
    const result = compileProject({
      project: "test-ref",
      model: "seedance-2.5-preview",
      provider: "muapi",
      duration: 8,
      resolution: "720p",
      aspectRatio: "16:9",
      brief: {
        objective: "Test role binding",
        subject: "The subject from the reference",
        action: "Walk forward and stop",
        environment: "Studio",
        constraints: [],
        beats: []
      },
      references: [
        { kind: "image", url: "https://example.com/a.jpg", role: "identity" },
        { kind: "video", url: "https://example.com/a.mp4", role: "camera" }
      ],
      shots: []
    });
    expect(result.request.mode).toBe("reference-to-video");
    expect(result.referenceMap[0].token).toBe("@Image1");
    expect(result.referenceMap[1].token).toBe("@Video1");
  });
});
