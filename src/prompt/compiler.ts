import { ProjectSchema, type ProjectSpec } from "../core/schema.js";
import type { CompiledProject, GenerationMode, ProviderName, ReferenceAsset } from "../core/types.js";
import { PorterError } from "../core/errors.js";
import { getModel, getRoute } from "../models/registry.js";
import { mapReferences, referenceContract } from "./referenceMapper.js";
import { planShots, renderShots } from "./shotPlanner.js";
import { renderDirectorRead, resolveDirectorRead } from "./directorRead.js";
import { validateOfficialCompliance } from "./officialCompliance.js";

const DEFAULT_IMAGE_QUALITY = "HD, rich details, stable structure, natural colors, coherent material texture";

function inferMode(spec: ProjectSpec): GenerationMode {
  if (spec.mode !== "auto") return spec.mode;
  const first = spec.references.some((r) => r.role === "first_frame");
  const last = spec.references.some((r) => r.role === "last_frame" || r.role === "endpoint");
  const visualCount = spec.references.filter((r) => r.kind === "image").length;
  const hasVideoOrAudio = spec.references.some((r) => r.kind === "video" || r.kind === "audio");
  if (first && last) return "first-last-frame";
  if (hasVideoOrAudio || visualCount > 1) return "reference-to-video";
  if (visualCount === 1) return "image-to-video";
  return "text-to-video";
}

function continuityLines(spec: ProjectSpec): string[] {
  if (!spec.continuity) return [];
  const c = spec.continuity;
  const lines: string[] = [];
  if (c.observedStartState) lines.push(`Observed start state from accepted footage: ${c.observedStartState}.`);
  if (c.lockedSubject) lines.push(`Continuity lock — subject: ${c.lockedSubject}.`);
  if (c.lockedWardrobe) lines.push(`Continuity lock — wardrobe: ${c.lockedWardrobe}.`);
  if (c.lockedEnvironment) lines.push(`Continuity lock — environment: ${c.lockedEnvironment}.`);
  if (c.lockedLighting) lines.push(`Continuity lock — lighting: ${c.lockedLighting}.`);
  if (c.requiredEndState) lines.push(`Required final state: ${c.requiredEndState}.`);
  return lines;
}

function productionLocks(spec: ProjectSpec, refs: ReferenceAsset[]): string[] {
  const locks = spec.brief.constraints.map((value) => {
    const trimmed = value.trim();
    if (/^no\s+/i.test(trimmed)) return `Keep the result free of ${trimmed.replace(/^no\s+/i, "")}.`;
    if (/^do not\s+/i.test(trimmed)) return `Constraint: ${trimmed}.`;
    return `Constraint: ${trimmed}.`;
  });

  if (spec.outputPolicy.generatedText === "forbid") {
    locks.push("Keep it subtitle-free. Avoid generating any unrequested text or subtitles.");
  }
  if (spec.outputPolicy.generatedLogo === "forbid") {
    locks.push("Do not generate a logo or invented brand mark.");
  } else if (spec.outputPolicy.generatedLogo === "reference-only") {
    locks.push("Use only the explicitly supplied logo reference; preserve its geometry and do not invent or redesign the mark.");
  }
  if (spec.outputPolicy.generatedWatermark === "forbid") {
    locks.push("Do not generate a watermark.");
  }

  const identities = refs.filter((ref) => ref.role === "identity");
  if (identities.length > 1) {
    locks.push("Keep exactly one instance of each defined character in the same frame. Do not duplicate characters or create twin copies with identical appearance, clothing or accessories.");
  }
  if (refs.some((ref) => ref.role === "product")) {
    locks.push("Preserve the referenced product's geometry, construction, materials and identifying details throughout the video.");
  }

  locks.push("Keep subject identity, object ownership, spatial direction and material properties consistent through the generated sequence.");
  return [...new Set(locks)];
}

function lintPrompt(prompt: string, spec: ProjectSpec): string[] {
  const warnings: string[] = [];
  const words = prompt.trim().split(/\s+/).filter(Boolean).length;
  if (words < 30) warnings.push(`Porter advisory: prompt is only ${words} words; complex scenes may be underspecified.`);
  if (words > 350) warnings.push(`Porter advisory: prompt is ${words} words; although the official ceiling is below 1000 words, detail dropout risk may improve by splitting the scene.`);
  if (spec.shots.length > 4) warnings.push("Porter advisory: more than four shots in one generation is fragile; prefer multiple clips and edit them together.");
  if (spec.duration > 10 && (spec.brief.beats.length > 2 || spec.shots.length > 2)) warnings.push("Porter advisory: long multi-beat generations can drift; consider separate clips at story/action turning points.");
  if (spec.outputPolicy.generatedText === "allow" && /exact|precise|pixel|brand typography|font/i.test(`${spec.brief.subject} ${spec.brief.objective}`)) {
    warnings.push("Porter advisory: Seedance supports text generation, but exact brand typography should still be quality-checked and may be safer to composite in post.");
  }
  return warnings;
}

export function compileProject(input: unknown, providerOverride?: ProviderName): CompiledProject {
  const spec = ProjectSchema.parse(input);
  const model = getModel(spec.model);
  const provider = providerOverride ?? spec.provider ?? (model.lifecycle === "preview" ? "muapi" : "byteplus");
  const route = getRoute(spec.model, provider);
  let mode = inferMode(spec);

  // fal implements first/last frames through its image-to-video endpoint.
  if (provider === "fal" && mode === "first-last-frame") mode = "image-to-video";

  if (!route.modes.includes(mode)) throw new PorterError("UNSUPPORTED", `${mode} is not configured for ${spec.model} via ${provider}`);
  if (!route.resolutions.includes(spec.resolution)) throw new PorterError("UNSUPPORTED", `${spec.resolution} is not configured for ${spec.model} via ${provider}`);
  if (spec.duration < model.duration.min || spec.duration > model.duration.max) throw new PorterError("INVALID_INPUT", `${spec.model} duration must be ${model.duration.min}-${model.duration.max}s`);
  if (!model.aspectRatios.includes(spec.aspectRatio)) throw new PorterError("INVALID_INPUT", `${spec.aspectRatio} is not supported by ${spec.model}`);

  const refs = mapReferences(spec, model);
  const shots = planShots(spec);
  const read = resolveDirectorRead(spec);
  const imageQuality = spec.brief.imageQuality ?? DEFAULT_IMAGE_QUALITY;

  // The ordering below intentionally follows the official BytePlus advanced
  // prompt formula: precise subject -> action/storyboard -> scene/environment ->
  // lighting/color -> camera inside each Shot N -> style -> quality -> constraints.
  const sections: string[] = [];
  sections.push(`Objective: ${spec.brief.objective}.`);
  sections.push(`Core subject: ${spec.brief.subject}.`);
  if (refs.length) sections.push("Reference definitions:", ...referenceContract(refs));
  sections.push(`Core action intent: ${spec.brief.action}.`);
  sections.push(`Scene/environment: ${spec.brief.environment}.`);

  const lightColor = [spec.brief.lighting, spec.brief.colorTone].filter(Boolean).join(" Color tone: ");
  if (lightColor) sections.push(`Lighting and color tone: ${lightColor}.`);

  const directorLines = renderDirectorRead(read);
  if (directorLines.length) sections.push("Director context:", ...directorLines);
  const continuity = continuityLines(spec);
  if (continuity.length) sections.push("Continuity:", ...continuity);

  sections.push("Ordered storyboard:", ...renderShots(shots));
  if (spec.brief.style) sections.push(`Visual style: ${spec.brief.style}.`);
  sections.push(`Image quality: ${imageQuality}.`);
  sections.push("Constraints:", ...productionLocks(spec, refs));

  const prompt = sections.filter(Boolean).join("\n");
  const officialCompliance = validateOfficialCompliance(spec, refs, shots, prompt);
  const officialWarnings = officialCompliance.findings
    .filter((finding) => finding.severity !== "error")
    .map((finding) => `${finding.rule}: ${finding.message}`);

  return {
    request: {
      project: spec.project,
      label: spec.label,
      provider,
      modelKey: spec.model,
      modelId: route.modelId,
      mode,
      prompt,
      references: refs,
      duration: spec.duration,
      resolution: spec.resolution,
      aspectRatio: spec.aspectRatio,
      generateAudio: spec.generateAudio,
      seed: spec.seed,
      watermark: spec.watermark,
    },
    referenceMap: refs.map((r) => ({ id: r.id, token: r.token!, role: r.role, note: r.note })),
    warnings: [...lintPrompt(prompt, spec), ...officialWarnings],
    officialCompliance,
  };
}
