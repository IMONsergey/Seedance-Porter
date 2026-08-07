import { describe, expect, it } from "vitest";
import { planVariants } from "../src/projects/variants.js";

const project = {
  project: "variant-test",
  model: "seedance-2.0",
  provider: "fal" as const,
  duration: 6,
  resolution: "720p" as const,
  aspectRatio: "16:9" as const,
  generateAudio: false,
  brief: {
    objective: "Verify bounded deterministic planning",
    subject: "A ceramic sphere",
    action: "The sphere rotates once and stops",
    environment: "Neutral studio",
    style: "clean studio product visualization",
    imageQuality: "HD, stable geometry, clean details, natural colors",
    constraints: ["keep the sphere shape unchanged"],
    beats: [],
  },
  references: [],
  shots: [],
};

describe("planVariants", () => {
  it("creates deterministic sequential seed variants on a route that advertises seed control", () => {
    const plan = planVariants(project, { count: 3, seedStart: 100, provider: "fal" });
    expect(plan.map((item) => item.project.seed)).toEqual([100, 101, 102]);
    expect(plan.map((item) => item.compiled.request.seed)).toEqual([100, 101, 102]);
  });

  it("rejects seed sweeps on the verified BytePlus Seedance 2.0 route", () => {
    expect(() => planVariants({ ...project, provider: "byteplus" as const }, { count: 3, seedStart: 100, provider: "byteplus" })).toThrow(/does not support seed control/i);
  });

  it("rejects unbounded sweeps", () => {
    expect(() => planVariants(project, { count: 9, seedStart: 100, provider: "fal" })).toThrow(/1-8/);
  });
});
