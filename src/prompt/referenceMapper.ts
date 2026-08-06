import { PorterError } from "../core/errors.js";
import type { ModelDefinition, ReferenceAsset, ReferenceRole } from "../core/types.js";
import type { ProjectSpec } from "../core/schema.js";

const roleInstruction: Record<ReferenceRole, string> = {
  identity: "identity reference; preserve facial features, hair, wardrobe and silhouette",
  product: "exact product reference; preserve proportions, materials, construction and brand colors",
  environment: "environment reference; preserve spatial language, architecture and atmosphere",
  motion: "motion reference only; borrow timing, body mechanics and movement trajectory",
  camera: "camera reference only; borrow framing, camera path and pacing, not subject identity",
  style: "visual style reference only; borrow lighting, material response, grading and texture",
  audio: "audio reference; use its rhythm, timing, ambience or vocal cadence as instructed",
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
    if (input.kind === "image") token = `@Image${++imageIndex}`;
    else if (input.kind === "video") token = `@Video${++videoIndex}`;
    else token = `@Audio${++audioIndex}`;
    return { ...input, id, token } as ReferenceAsset;
  });

  if (imageIndex > model.referenceLimits.images) throw new PorterError("INVALID_INPUT", `${model.displayName} supports at most ${model.referenceLimits.images} image references; received ${imageIndex}`);
  if (videoIndex > model.referenceLimits.videos) throw new PorterError("INVALID_INPUT", `${model.displayName} supports at most ${model.referenceLimits.videos} video references; received ${videoIndex}`);
  if (audioIndex > model.referenceLimits.audios) throw new PorterError("INVALID_INPUT", `${model.displayName} supports at most ${model.referenceLimits.audios} audio references; received ${audioIndex}`);
  if (audioIndex > 0 && imageIndex === 0 && videoIndex === 0) throw new PorterError("INVALID_INPUT", "Audio cannot be the only reference; add at least one visual reference.");

  return mapped;
}

export function referenceContract(refs: ReferenceAsset[]): string[] {
  return refs.map((ref) => `${ref.token} is the ${roleInstruction[ref.role]}${ref.note ? `; ${ref.note}` : ""}.`);
}
