import type { ProjectSpec } from "../core/schema.js";

export interface ResolvedDirectorRead {
  sceneFunction: string;
  turn?: string;
  pov?: string;
  objective?: string;
  obstacle?: string;
  contradiction?: string;
  suppressedBehavior?: string;
  specificDetail?: string;
  genreRefusal?: string;
}

export function resolveDirectorRead(spec: ProjectSpec): ResolvedDirectorRead | undefined {
  if (spec.director) return spec.director;
  const objective = spec.brief.objective.toLowerCase();
  const looksNarrative = /(story|emotion|character|performance|dialog|reveal|tension|relationship|narrative)/i.test(`${objective} ${spec.brief.action}`);
  if (!looksNarrative) return undefined;
  return {
    sceneFunction: spec.brief.objective,
    objective: spec.brief.action,
    specificDetail: spec.brief.endpoint,
  };
}

export function renderDirectorRead(read?: ResolvedDirectorRead): string[] {
  if (!read) return [];
  const parts = [`Scene function: ${read.sceneFunction}.`];
  if (read.turn) parts.push(`Dramatic turn: ${read.turn}.`);
  if (read.pov) parts.push(`POV: ${read.pov}.`);
  if (read.objective) parts.push(`Performance objective: ${read.objective}.`);
  if (read.obstacle) parts.push(`Obstacle/tactic: ${read.obstacle}.`);
  if (read.contradiction) parts.push(`Visible contradiction: ${read.contradiction}.`);
  if (read.suppressedBehavior) parts.push(`Suppressed behavior carried physically: ${read.suppressedBehavior}.`);
  if (read.specificDetail) parts.push(`Non-transferable detail: ${read.specificDetail}.`);
  if (read.genreRefusal) parts.push(`Do not drift into generic genre shorthand; specifically avoid: ${read.genreRefusal}.`);
  return parts;
}
