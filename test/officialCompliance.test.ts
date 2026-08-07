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
  it("uses the verified July 17 official baseline and ordered Shot N blocks", () => {
    const compiled = compileProject(compliant);
    expect(compiled.officialCompliance.standard).toBe("BOS-2026-07-17");
    expect(compiled.officialCompliance.sourceUpdatedAt).toBe("2026-07-17");
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

  it("requires stable anchors and identity provenance for BytePlus identity references", () => {
    const missing = compileProject({
      ...compliant,
      references: [{ kind: "image" as const, url: "https://example.com/person.jpg", role: "identity" as const }],
    });
    expect(missing.officialCompliance.findings.some((f) => f.rule === "BOS-01" && f.severity === "error")).toBe(true);
    expect(missing.officialCompliance.findings.some((f) => f.rule === "BOS-13" && f.severity === "error")).toBe(true);

    const synthetic = compileProject({
      ...compliant,
      references: [{
        kind: "image" as const,
        url: "https://example.com/synthetic-person.jpg",
        role: "identity" as const,
        identitySource: "synthetic" as const,
        anchors: ["dark bob haircut", "charcoal sweater"],
        note: "Synthetic identity and wardrobe source",
      }],
    });
    expect(synthetic.officialCompliance.findings.some((f) => f.rule === "BOS-13" && f.severity === "error")).toBe(false);
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

  it("keeps strict first-last-frame separate from multimodal reference packages", () => {
    const bad = compileProject({
      ...compliant,
      mode: "first-last-frame" as const,
      references: [
        { kind: "image" as const, url: "https://example.com/a.jpg", role: "first_frame" as const },
        { kind: "image" as const, url: "https://example.com/b.jpg", role: "last_frame" as const },
        { kind: "audio" as const, url: "https://example.com/a.mp3", role: "audio" as const },
      ],
    });
    expect(bad.officialCompliance.findings.some((f) => f.rule === "BOS-14" && f.severity === "error")).toBe(true);
  });

  it("rejects seed control on the verified direct BytePlus Seedance 2.0 route", () => {
    expect(() => compileProject({ ...compliant, seed: 42 })).toThrow(/does not support seed control/i);
  });
});
