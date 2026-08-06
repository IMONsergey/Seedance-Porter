import { ProjectSchema, type ProjectSpec } from "../core/schema.js";
import type { CompiledProject, GenerationMode, ProviderName } from "../core/types.js";
import { PorterError } from "../core/errors.js";
import { getModel, getRoute } from "../models/registry.js";
import { mapReferences, referenceContract } from "./referenceMapper.js";
import { planShots, renderShots } from "./shotPlanner.js";
import { renderDirectorRead, resolveDirectorRead } from "./directorRead.js";

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

function productionLocks(spec: ProjectSpec): string[] {
  const locks = spec.brief.constraints.map((value) => {
    const trimmed = value.trim();
    if (/^no\s+/i.test(trimmed)) return `Keep the result free of ${trimmed.replace(/^no\s+/i, "")}.`;
    if (/^do not\s+/i.test(trimmed)) return `Production lock: ${trimmed.replace(/^do not\s+/i, "Avoid ")}.`;
    return `Production lock: ${trimmed}.`;
  });
  return locks;
}

function lintPrompt(prompt: string, spec: ProjectSpec): string[] {
  const warnings: string[] = [];
  const words = prompt.trim().split(/\s+/).filter(Boolean).length;
  if (words < 30) warnings.push(`Prompt is only ${words} words; complex scenes may be underspecified.`);
  if (words > 260) warnings.push(`Prompt is ${words} words; detail dropout risk is high. Consider splitting the shot.`);
  if (spec.shots.length > 4) warnings.push("More than four shots in one generation is fragile; prefer multiple clips and edit them together.");
  if (spec.duration > 10 && (spec.brief.beats.length > 2 || spec.shots.length > 2)) warnings.push("Long multi-beat generations drift more often; consider 4-8 second clips.");
  if (/logo|packaging|label|interface|ui|text/i.test(`${spec.brief.subject} ${spec.brief.objective}`)) warnings.push("Critical typography/logos should be replaced or composited in post even when a reference is provided.");
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

  const sections = [
    `${spec.brief.subject}. ${spec.brief.action}. ${spec.brief.environment}.`,
    ...referenceContract(refs),
    ...renderDirectorRead(read),
    ...continuityLines(spec),
    ...renderShots(shots),
  ];
  if (spec.brief.style) sections.push(`Visual language: ${spec.brief.style}.`);
  if (spec.brief.camera && shots.every((s) => !s.camera)) sections.push(`Camera: ${spec.brief.camera}.`);
  if (spec.brief.lighting && shots.every((s) => !s.lighting)) sections.push(`Light: ${spec.brief.lighting}.`);
  if (spec.brief.sound && shots.every((s) => !s.sound)) sections.push(`Audio: ${spec.brief.sound}.`);
  sections.push(...productionLocks(spec));
  sections.push("Keep subject geometry, object ownership, spatial direction and material identity temporally consistent across the shot.");

  const prompt = sections.filter(Boolean).join("\n");
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
    warnings: lintPrompt(prompt, spec),
  };
}
