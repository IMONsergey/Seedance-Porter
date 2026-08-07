import { describe, expect, it } from "vitest";
import { compileProject } from "../src/prompt/compiler.js";
import { assertOfficialCompliance } from "../src/prompt/officialCompliance.js";

const compliant = {
  project: "official-guide-test",
  model: "seedance-2.0",
  provider: "byteplus" as const,
  duration: 6,
  resolution: "720p" as const,
  aspectRatio: "16:9" as const,
  generateAudio: false,
  outputPolicy: {
    generatedText: "forbid" as const,
    generatedLogo: "forbid" as const,
    generatedWatermark: "forbid" as const,
  },
  brief: {
    objective: "Create a stable cinematic portrait shot",
    subject: "A woman in a charcoal sweater",
    action: "She slowly raises her right hand to the table and stops",
    environment: "A small pale kitchen with a wooden table",
    camera: "slow push-in",
    lighting: "soft overcast window light from frame-left",
    colorTone: "muted neutral daylight",
    style: "naturalistic contemporary drama",
    imageQuality: "HD, rich details, stable face and hands, natural colors",
    constraints: ["keep the table layout unchanged"],
    beats: [],
  },
  references: [],
  shots: [],
};

describe("ByteDance official Seedance compliance", () => {
  it("renders ordered Shot N blocks instead of exact time ranges", () => {
    const compiled = compileProject(compliant);
    expect(compiled.officialCompliance.passed).toBe(true);
    expect(compiled.request.prompt).toContain("Shot 1:");
    expect(compiled.request.prompt).not.toMatch(/\[0-6s\]/);
  });

  it("blocks compound camera movement inside one shot", () => {
    const compiled = compileProject({
      ...compliant,
      brief: { ...compliant.brief, camera: "slow push-in followed by a clockwise orbit" },
    });
    expect(compiled.officialCompliance.passed).toBe(false);
    expect(compiled.officialCompliance.findings.some((f) => f.rule === "BOS-04" && f.severity === "error")).toBe(true);
    expect(() => assertOfficialCompliance(compiled.officialCompliance)).toThrow(/BOS-04/);
  });

  it("requires a stable description for identity references", () => {
    const compiled = compileProject({
      ...compliant,
      references: [{ kind: "image" as const, url: "https://example.com/person.jpg", role: "identity" as const }],
    });
    expect(compiled.officialCompliance.findings.some((f) => f.rule === "BOS-01" && f.severity === "error")).toBe(true);
  });

  it("warns when reference count exceeds the official recommended working set", () => {
    const references = Array.from({ length: 6 }, (_, index) => ({
      id: `scene-${index + 1}`,
      kind: "image" as const,
      url: `https://example.com/scene-${index + 1}.jpg`,
      role: "environment" as const,
      note: `Scene atmosphere reference ${index + 1}`,
    }));
    const compiled = compileProject({ ...compliant, references });
    expect(compiled.officialCompliance.findings.some((f) => f.rule === "BOS-07" && f.severity === "warning")).toBe(true);
  });

  it("blocks generated-text intent when output policy forbids generated text", () => {
    const compiled = compileProject({
      ...compliant,
      brief: { ...compliant.brief, action: "Show on-screen text HELLO above the subject" },
    });
    expect(compiled.officialCompliance.findings.some((f) => f.rule === "BOS-08" && f.severity === "error")).toBe(true);
  });

  it("requires an explicit logo reference when logo policy is reference-only", () => {
    const compiled = compileProject({
      ...compliant,
      outputPolicy: { ...compliant.outputPolicy, generatedLogo: "reference-only" as const },
    });
    expect(compiled.officialCompliance.findings.some((f) => f.rule === "BOS-08" && f.severity === "error")).toBe(true);
  });
});
