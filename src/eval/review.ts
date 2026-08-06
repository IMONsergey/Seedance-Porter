import { scoreTake, type TakeScore } from "./scorer.js";
import { readManifest, saveManifest, type TakeDecision, type PorterReview } from "../core/manifest.js";
import { PorterError } from "../core/errors.js";
import { ledgerPath, recordReview } from "../projects/ledger.js";
import { extractLastFrame } from "../media/ffmpeg.js";

export async function reviewTake(manifestPath: string, scores: TakeScore, options: {
  decision?: TakeDecision;
  observedEndState?: string;
  notes?: string;
  extractFrame?: boolean;
} = {}) {
  const manifest = await readManifest(manifestPath);
  const analysis = scoreTake(scores);
  const decision = options.decision ?? (analysis.verdict as TakeDecision);
  let lastFramePath: string | undefined = manifest.evaluation?.lastFramePath;

  if (options.extractFrame) {
    if (!manifest.output?.path) throw new PorterError("INVALID_INPUT", "Manifest has no local video path to extract a final frame from.");
    lastFramePath = await extractLastFrame(manifest.output.path);
  }

  const review: PorterReview = {
    reviewedAt: new Date().toISOString(),
    decision,
    scores: { ...scores },
    score: analysis.score,
    verdict: analysis.verdict,
    weakest: analysis.weakest,
    nextRetakeLever: analysis.nextRetakeLever,
    observedEndState: options.observedEndState,
    lastFramePath,
    notes: options.notes,
  };
  manifest.evaluation = review;
  await saveManifest(manifestPath, manifest);
  const ledger = await recordReview(manifestPath, manifest, review);
  return { manifestPath, review, ledgerPath: ledgerPath(manifest.request.project), ledger };
}
