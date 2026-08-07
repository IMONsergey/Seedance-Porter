import { PorterError } from "../core/errors.js";
import type { ModelDefinition, ReferenceAsset, ReferenceRole } from "../core/types.js";
import type { ProjectSpec } from "../core/schema.js";

const roleInstruction: Record<ReferenceRole, string> = {
  identity: "identity/character anchor; preserve the explicitly described stable appearance features",
  product: "exact product anchor; preserve proportions, materials, construction, identifying details and brand colors",
  environment: "scene tone-setting reference; preserve the requested environment, spatial relationships and atmosphere",
  motion: "motion reference only; follow the requested action mechanics, timing and movement trajectory",
  camera: "camera/action-rhythm reference only; follow the requested shot language and camera path without borrowing subject identity",
  style: "visual style reference only; follow the requested artistic treatment, material response, grading and texture",
  audio: "rhythmic atmosphere/timbre reference; use its rhythm, timing, ambience or vocal character only as instructed",
  first_frame: "first-frame lock; begin from this composition and subject state",
  last_frame: "last-frame lock; arrive naturally at this composition and subject state",
  endpoint: "endpoint reference; use it as the required final visual state",
};

export function mapReferences(spec: ProjectSpec, model: ModelDefinition): ReferenceAsset[] {
  let imageIndex = 0;
  let videoIndex = 0;
  let audioIndex = 0;

  const mapped = spec.references.map((input, index) => {
    const id = input.id ?? `ref-${index + 1}`;
    let token: string;
    // Canonical Porter prompt tokens follow the official BytePlus guide's
    // human-readable Image N / Video N / Audio N convention. Provider adapters
    // translate them to @Image1-style syntax when a router requires that form.
    if (input.kind === "image") token = `[Image ${++imageIndex}]`;
    else if (input.kind === "video") token = `[Video ${++videoIndex}]`;
    else token = `[Audio ${++audioIndex}]`;
    return { ...input, id, token } as ReferenceAsset;
  });

  if (imageIndex > model.referenceLimits.images) throw new PorterError("INVALID_INPUT", `${model.displayName} supports at most ${model.referenceLimits.images} image references; received ${imageIndex}`);
  if (videoIndex > model.referenceLimits.videos) throw new PorterError("INVALID_INPUT", `${model.displayName} supports at most ${model.referenceLimits.videos} video references; received ${videoIndex}`);
  if (audioIndex > model.referenceLimits.audios) throw new PorterError("INVALID_INPUT", `${model.displayName} supports at most ${model.referenceLimits.audios} audio references; received ${audioIndex}`);
  if (audioIndex > 0 && imageIndex === 0 && videoIndex === 0) throw new PorterError("INVALID_INPUT", "Audio cannot be the only reference; add at least one visual reference.");

  return mapped;
}

export function referenceContract(refs: ReferenceAsset[]): string[] {
  return refs.map((ref) => {
    const base = `${ref.token}: ${roleInstruction[ref.role]}`;
    return `${base}${ref.note ? `. Stable/reference details: ${ref.note}` : ""}.`;
  });
}
