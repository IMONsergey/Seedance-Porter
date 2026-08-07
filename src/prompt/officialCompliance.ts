import type { ProjectSpec, ShotSpec } from "../core/schema.js";
import type { ReferenceAsset } from "../core/types.js";
import { PorterError } from "../core/errors.js";

export const BYTEDANCE_OFFICIAL_STANDARD = {
  id: "BOS-2026-07-31",
  guide: "Dreamina Seedance 2.0 series prompt guide",
  verifiedAt: "2026-08-07",
  sourceUpdatedAt: "2026-07-31",
  sources: [
    "https://docs.byteplus.com/en/docs/ModelArk/2222480",
    "https://docs.byteplus.com/en/docs/ModelArk/2291680",
    "https://docs.byteplus.com/en/docs/modelark/1520757",
    "https://seed.bytedance.com/en/blog/seedance-2-0-official-launch",
  ],
} as const;

export type ComplianceSeverity = "error" | "warning" | "info";

export interface ComplianceFinding {
  rule: string;
  severity: ComplianceSeverity;
  message: string;
  path?: string;
}

export interface OfficialComplianceReport {
  standard: typeof BYTEDANCE_OFFICIAL_STANDARD.id;
  verifiedAt: string;
  sourceUpdatedAt: string;
  passed: boolean;
  score: number;
  findings: ComplianceFinding[];
  normalization: string[];
  sources: readonly string[];
}

const cameraMovePatterns = [
  /\b(push(?:-?in)?|dolly\s*in)\b/i,
  /\b(pull(?:-?out)?|dolly\s*out)\b/i,
  /\b(pan(?:ning)?(?:\s+(?:left|right))?)\b/i,
  /\b(tilt(?:ing)?(?:\s+(?:up|down))?)\b/i,
  /\b(track(?:ing)?|follow(?:ing)?|truck(?:ing)?)\b/i,
  /\b(orbit(?:ing)?|circle|arc(?:ing)?)\b/i,
  /\b(crane|jib|pedestal)\b/i,
  /\b(handheld)\b/i,
  /\b(zoom(?:ing)?)\b/i,
];

function countCameraMoves(camera?: string): number {
  if (!camera) return 0;
  return cameraMovePatterns.reduce((count, pattern) => count + (pattern.test(camera) ? 1 : 0), 0);
}

function isComplex(spec: ProjectSpec): boolean {
  return spec.shots.length > 1 || spec.brief.beats.length > 1 || spec.duration >= 10;
}

function generatedTextIntent(spec: ProjectSpec): boolean {
  const haystack = `${spec.brief.objective} ${spec.brief.action} ${spec.brief.beats.join(" ")} ${spec.brief.constraints.join(" ")}`.toLowerCase();
  return /generate (?:text|subtitle|caption)|show (?:text|subtitle|caption)|speech bubble|on-screen text|title card/.test(haystack);
}

function generatedLogoIntent(spec: ProjectSpec): boolean {
  const haystack = `${spec.brief.objective} ${spec.brief.action} ${spec.brief.constraints.join(" ")}`.toLowerCase();
  return /generate (?:a )?logo|show (?:the )?logo|logo appears|brand mark appears/.test(haystack);
}

function needsTwinGuard(spec: ProjectSpec): boolean {
  return spec.references.filter((ref) => ref.role === "identity").length > 1;
}

function motionAdvisory(action: string, path: string): ComplianceFinding[] {
  const findings: ComplianceFinding[] = [];
  if (/\b(very sad|extremely sad|very angry|extremely angry|very nervous|very happy|very anxious)\b/i.test(action)) {
    findings.push({ rule: "BOS-03", severity: "warning", path, message: "Externalize emotion with visible physical behavior instead of relying only on abstract intensity words." });
  }
  if (/\b(sprint|sprinting|violent roll|huge jump|big jump|explosive movement)\b/i.test(action)) {
    findings.push({ rule: "BOS-03", severity: "info", path, message: "High-burst motion is intentional but less stable. Prefer slower coherent motion when creative intent allows, or split the action into separate clips." });
  }
  return findings;
}

export function validateOfficialCompliance(spec: ProjectSpec, refs: ReferenceAsset[], shots: ShotSpec[], prompt?: string): OfficialComplianceReport {
  const findings: ComplianceFinding[] = [];
  const normalization: string[] = [
    "Complex shot prompts are rendered as ordered Shot N blocks rather than exact second ranges.",
    "Reference tokens are compiled in canonical Image N / Video N / Audio N form and translated by provider adapters where required.",
  ];

  if (!spec.brief.subject.trim()) findings.push({ rule: "BOS-01", severity: "error", path: "brief.subject", message: "A precise core subject is required." });
  for (const ref of refs.filter((item) => item.role === "identity" || item.role === "product" || item.role === "logo")) {
    if (!ref.note?.trim()) findings.push({
      rule: "BOS-01",
      severity: "error",
      path: `references.${ref.id}.note`,
      message: `${ref.role} reference ${ref.id} needs an explicit source/job note describing exactly what this reference controls.`,
    });
    if (!ref.anchors || ref.anchors.length < 2 || ref.anchors.length > 3) findings.push({
      rule: "BOS-01",
      severity: "error",
      path: `references.${ref.id}.anchors`,
      message: `${ref.role} reference ${ref.id} must declare exactly 2–3 stable identifying anchors, matching the official subject-definition method.`,
    });
  }

  if (isComplex(spec) && shots.length < 2) findings.push({ rule: "BOS-02", severity: "warning", path: "shots", message: "This is a complex/long request but contains only one planned shot. Consider explicit Shot 1 / Shot 2 sequencing." });
  const authored = `${spec.brief.action} ${spec.brief.beats.join(" ")} ${spec.shots.map((s) => s.action).join(" ")}`;
  if (/\[?\d+(?:\.\d+)?\s*(?:s|sec|seconds?)\s*[-–—]\s*\d+/i.test(authored)) findings.push({
    rule: "BOS-02",
    severity: "warning",
    path: "brief/shots",
    message: "Exact per-shot timestamps were detected. The official Seedance 2.0 guide says precise timing constraints are unstable; prefer ordered Shot N sequencing.",
  });

  shots.forEach((shot, index) => {
    const path = `shots.${index}`;
    findings.push(...motionAdvisory(shot.action, `${path}.action`));
    const movements = countCameraMoves(shot.camera);
    if (movements > 1) findings.push({
      rule: "BOS-04",
      severity: "error",
      path: `${path}.camera`,
      message: `Shot ${index + 1} appears to combine ${movements} camera movements. BytePlus recommends one camera movement type per shot. Split the shot or choose the dominant movement.`,
    });
  });

  if (!spec.brief.environment.trim()) findings.push({ rule: "BOS-05", severity: "error", path: "brief.environment", message: "Scene/environment must be explicit." });
  if (!spec.brief.lighting?.trim()) findings.push({ rule: "BOS-05", severity: "warning", path: "brief.lighting", message: "Lighting/color tone is unspecified; the official advanced formula recommends explicit lighting and color control." });
  if (!spec.brief.style?.trim()) findings.push({ rule: "BOS-05", severity: "error", path: "brief.style", message: "Visual style must be explicit for production projects; Porter will not silently invent it." });
  if (!spec.brief.imageQuality?.trim()) normalization.push("No imageQuality was supplied; Porter applies an official-guide-derived conservative quality default.");

  if (refs.length > 5) findings.push({
    rule: "BOS-07",
    severity: "warning",
    path: "references",
    message: `${refs.length} references supplied. BytePlus recommends roughly 4–5 functional assets and warns that too many references can blur priorities and cause style conflict.`,
  });

  if (!spec.brief.constraints.length) findings.push({ rule: "BOS-08", severity: "warning", path: "brief.constraints", message: "No project-specific constraints supplied; official guidance treats constraints as a core control dimension." });

  if (spec.outputPolicy.generatedText === "forbid") {
    normalization.push("Default no-subtitle/no-unrequested-text constraint is appended.");
    if (generatedTextIntent(spec)) findings.push({ rule: "BOS-08", severity: "error", path: "outputPolicy.generatedText", message: "The creative brief asks for generated text/subtitles but outputPolicy.generatedText is forbid. Make the intent explicit by setting it to allow." });
  }

  const logoRefs = refs.filter((ref) => ref.role === "logo");
  if (spec.outputPolicy.generatedLogo === "forbid") {
    normalization.push("Default no-generated-logo constraint is appended.");
    if (generatedLogoIntent(spec) || logoRefs.length) findings.push({ rule: "BOS-08", severity: "error", path: "outputPolicy.generatedLogo", message: "Logo intent/reference conflicts with generatedLogo=forbid. Use reference-only with a dedicated logo reference when brand fidelity matters." });
  } else if (spec.outputPolicy.generatedLogo === "reference-only") {
    if (!logoRefs.length) findings.push({ rule: "BOS-08", severity: "error", path: "references", message: "generatedLogo=reference-only requires at least one reference with role=logo." });
    normalization.push("Logo generation is limited to explicitly supplied logo reference assets.");
  } else if (!logoRefs.length) {
    findings.push({ rule: "BOS-08", severity: "warning", path: "references", message: "Generated logo is allowed without an exact logo reference. Official guidance recommends a reference when strict text/logo presentation matters." });
  }

  if (spec.outputPolicy.generatedWatermark === "forbid") normalization.push("Default no-generated-watermark constraint is appended.");
  if (needsTwinGuard(spec)) normalization.push("Multi-character identity references trigger an anti-duplicate/twin-character constraint.");

  if (prompt) {
    const words = prompt.trim().split(/\s+/).filter(Boolean).length;
    if (words >= 1000) findings.push({ rule: "BOS-12", severity: "error", path: "compiled.prompt", message: `Compiled prompt is ${words} words. Official ModelArk guidance recommends prompts below 1000 words.` });
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const score = Math.max(0, Math.min(100, 100 - errors * 20 - warnings * 5));

  return {
    standard: BYTEDANCE_OFFICIAL_STANDARD.id,
    verifiedAt: BYTEDANCE_OFFICIAL_STANDARD.verifiedAt,
    sourceUpdatedAt: BYTEDANCE_OFFICIAL_STANDARD.sourceUpdatedAt,
    passed: errors === 0,
    score,
    findings,
    normalization,
    sources: BYTEDANCE_OFFICIAL_STANDARD.sources,
  };
}

export function assertOfficialCompliance(report: OfficialComplianceReport): void {
  const blocking = report.findings.filter((f) => f.severity === "error");
  if (!blocking.length) return;
  const details = blocking.map((f) => `${f.rule}${f.path ? ` (${f.path})` : ""}: ${f.message}`).join("\n");
  throw new PorterError("INVALID_INPUT", `Project violates ${report.standard}:\n${details}`, false, report);
}
