import { z } from "zod";

export const TakeScoreSchema = z.object({
  identityOrProductFidelity: z.number().min(0).max(5),
  motionPhysics: z.number().min(0).max(5),
  cameraComposition: z.number().min(0).max(5),
  temporalContinuity: z.number().min(0).max(5),
  audioSync: z.number().min(0).max(5),
  artifactControl: z.number().min(0).max(5),
  briefMatch: z.number().min(0).max(5),
});

export type TakeScore = z.infer<typeof TakeScoreSchema>;

const weights: Record<keyof TakeScore, number> = {
  identityOrProductFidelity: 1.5,
  motionPhysics: 1.2,
  cameraComposition: 1,
  temporalContinuity: 1.3,
  audioSync: 0.8,
  artifactControl: 1.1,
  briefMatch: 1.5,
};

const levers: Record<keyof TakeScore, string> = {
  identityOrProductFidelity: "Strengthen the identity/product reference role and simplify competing visual references.",
  motionPhysics: "Reduce simultaneous actions; give one dominant action and a clearer physical endpoint.",
  cameraComposition: "Lock one camera path, shot size and endpoint instead of stacking movements.",
  temporalContinuity: "Shorten the clip or split it; explicitly lock wardrobe, environment and spatial direction.",
  audioSync: "Use fewer audio events and tie each critical sound to one visible event/timestamp.",
  artifactControl: "Reduce scene complexity, hands/contacts and fine text; plan critical graphics for post-production.",
  briefMatch: "Move the core subject/action/objective into the first sentence and remove decorative instructions.",
};

export function scoreTake(input: unknown) {
  const score = TakeScoreSchema.parse(input);
  const entries = Object.entries(score) as Array<[keyof TakeScore, number]>;
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const weighted = entries.reduce((sum, [key, value]) => sum + value * weights[key], 0) / totalWeight;
  const [weakest, weakestValue] = entries.sort((a, b) => a[1] - b[1])[0];
  const fatal = score.identityOrProductFidelity < 2 || score.briefMatch < 2 || score.temporalContinuity < 1.5;
  const verdict = fatal || weighted < 2.8 ? "reject" : weighted < 4.1 ? "retake" : "accept";
  return {
    score: Number(weighted.toFixed(2)),
    verdict,
    weakest: { dimension: weakest, value: weakestValue },
    nextRetakeLever: verdict === "accept" ? null : levers[weakest],
    rule: verdict === "retake" ? "Change one production variable only; preserve seed and all successful locks when the provider supports it." : undefined,
  };
}
