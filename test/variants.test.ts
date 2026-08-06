import { describe, expect, it } from "vitest";
import { planVariants } from "../src/projects/variants.js";

const project = {
  project: "variant-test",
  model: "seedance-2.0",
  provider: "byteplus" as const,
  duration: 6,
  resolution: "720p" as const,
  aspectRatio: "16:9" as const,
  generateAudio: false,
  brief: {
    objective: "Verify bounded deterministic planning",
    subject: "A ceramic sphere",
    action: "The sphere rotates once and stops",
    environment: "Neutral studio",
    constraints: [],
    beats: [],
  },
  references: [],
  shots: [],
};

describe("planVariants", () => {
  it("creates deterministic sequential seed variants without generation", () => {
    const plan = planVariants(project, { count: 3, seedStart: 100, provider: "byteplus" });
    expect(plan.map((item) => item.project.seed)).toEqual([100, 101, 102]);
    expect(plan.map((item) => item.compiled.request.seed)).toEqual([100, 101, 102]);
  });

  it("rejects unbounded sweeps", () => {
    expect(() => planVariants(project, { count: 9, seedStart: 100, provider: "byteplus" })).toThrow(/1-8/);
  });
});
