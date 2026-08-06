import { describe, expect, it } from "vitest";
import { scoreTake } from "../src/eval/scorer.js";

describe("scoreTake", () => {
  it("accepts a strong balanced take", () => {
    const result = scoreTake({
      identityOrProductFidelity: 4.8,
      motionPhysics: 4.3,
      cameraComposition: 4.5,
      temporalContinuity: 4.4,
      audioSync: 4.2,
      artifactControl: 4.4,
      briefMatch: 4.8,
    });
    expect(result.verdict).toBe("accept");
    expect(result.nextRetakeLever).toBeNull();
  });

  it("rejects a visually polished take that loses the product identity", () => {
    const result = scoreTake({
      identityOrProductFidelity: 1.5,
      motionPhysics: 4.8,
      cameraComposition: 4.8,
      temporalContinuity: 4.5,
      audioSync: 4.5,
      artifactControl: 4.5,
      briefMatch: 4.4,
    });
    expect(result.verdict).toBe("reject");
    expect(result.weakest.dimension).toBe("identityOrProductFidelity");
  });
});
