import { ProjectSchema, type ProjectSpec } from "../core/schema.js";
import { readManifest } from "../core/manifest.js";
import { PorterError } from "../core/errors.js";
import type { ProviderName } from "../core/types.js";
import { compileProject } from "../prompt/compiler.js";

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
    refs.unshift({
      id: "previous-accepted-last-frame",
      kind: "image",
      url: visualAnchor,
      role: "first_frame",
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
