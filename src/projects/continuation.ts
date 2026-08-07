import { ProjectSchema, type ProjectSpec } from "../core/schema.js";
import { readManifest } from "../core/manifest.js";
import { PorterError } from "../core/errors.js";
import type { FaceSource, ProviderName } from "../core/types.js";
import { compileProject } from "../prompt/compiler.js";

function deriveContinuationFaceSource(previous: Awaited<ReturnType<typeof readManifest>>, visualAnchor?: string): FaceSource | undefined {
  const sources = previous.request.references
    .filter((ref) => ref.kind === "image" || ref.kind === "video")
    .map((ref) => ref.faceSource ?? ref.identitySource)
    .filter((value): value is FaceSource => Boolean(value));

  if (!sources.length) return undefined;
  if (sources.every((source) => source === "none")) return "none";
  if (sources.every((source) => source === "none" || source === "non-human")) return "non-human";

  // A provider-returned BytePlus last-frame URL is generated output rather than
  // an arbitrary re-uploaded real-face source. Mark it as trusted-output intent;
  // ModelArk still performs the final account/trust-window eligibility check.
  if (previous.request.provider === "byteplus" && visualAnchor && previous.output?.lastFrameUrl === visualAnchor) {
    return "modelark-trusted-output";
  }

  // Synthetic source projects remain synthetic after a locally extracted frame.
  if (sources.every((source) => ["none", "synthetic"].includes(source))) return "synthetic";
  return undefined;
}

export async function prepareContinuation(nextInput: unknown, fromManifestPath: string, provider?: ProviderName) {
  const previous = await readManifest(fromManifestPath);
  if (!previous.evaluation) throw new PorterError("INVALID_INPUT", "Previous take has not been reviewed. Run `porter review` first.");
  if (previous.evaluation.decision !== "accept") throw new PorterError("INVALID_INPUT", `Previous take decision is ${previous.evaluation.decision}; only accepted takes can anchor continuity.`);

  const next = ProjectSchema.parse(nextInput);
  const observed = previous.evaluation.observedEndState;
  const visualAnchor = previous.output?.lastFrameUrl ?? previous.evaluation.lastFramePath;
  if (!observed && !visualAnchor) throw new PorterError("INVALID_INPUT", "Accepted take has neither an observed end-state description nor a final-frame anchor.");

  const refs = [...next.references];
  if (visualAnchor && !refs.some((ref) => ref.role === "first_frame")) {
    const faceSource = deriveContinuationFaceSource(previous, visualAnchor);
    const targetProvider = provider ?? next.provider ?? (next.model === "seedance-2.5-preview" ? "muapi" : "byteplus");
    if (targetProvider === "byteplus" && !faceSource) {
      throw new PorterError("INVALID_INPUT", "Cannot safely infer faceSource for the accepted take's final-frame continuity reference. Supply an explicit first_frame reference with faceSource, or use a provider-supported trusted/authorized asset flow.");
    }
    refs.unshift({
      id: "previous-accepted-last-frame",
      kind: "image",
      url: visualAnchor,
      role: "first_frame",
      faceSource,
      note: `Exact visual continuity anchor from accepted take ${previous.task.id}.`,
    });
  }

  const merged: ProjectSpec = {
    ...next,
    references: refs,
    continuity: {
      ...next.continuity,
      observedStartState: observed ?? next.continuity?.observedStartState,
    },
  };

  return {
    previous: {
      manifestPath: fromManifestPath,
      taskId: previous.task.id,
      score: previous.evaluation.score,
      observedEndState: observed,
      visualAnchor,
    },
    project: merged,
    compiled: compileProject(merged, provider),
  };
}
