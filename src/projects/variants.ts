import { randomInt } from "node:crypto";
import { ProjectSchema, type ProjectSpec } from "../core/schema.js";
import type { ProviderName } from "../core/types.js";
import { getModel, getRoute } from "../models/registry.js";
import { compileProject } from "../prompt/compiler.js";
import { generateProject } from "../core/generate.js";
import { PorterError } from "../core/errors.js";

export function planVariants(input: unknown, options: { count: number; seedStart?: number; provider?: ProviderName }) {
  const spec = ProjectSchema.parse(input);
  const model = getModel(spec.model);
  const provider = options.provider ?? spec.provider ?? (model.lifecycle === "preview" ? "muapi" : "byteplus");
  const route = getRoute(spec.model, provider);
  if (!route.supportsSeed) throw new PorterError("UNSUPPORTED", `${model.displayName} via ${provider} does not support seed control on the verified route. Use another route or a non-seed A/B strategy.`);
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 8) throw new PorterError("INVALID_INPUT", "Variant count must be 1-8.");
  const base = options.seedStart ?? (spec.seed !== undefined && spec.seed >= 0 ? spec.seed : randomInt(1, 2_000_000_000));
  const variants: ProjectSpec[] = Array.from({ length: options.count }, (_, index) => ({
    ...spec,
    provider,
    label: `${spec.label ?? "variant"}-s${base + index}`,
    seed: base + index,
  }));
  return variants.map((project) => ({ project, compiled: compileProject(project, provider) }));
}

export async function generateVariants(input: unknown, options: {
  count: number;
  seedStart?: number;
  provider?: ProviderName;
  outputDir?: string;
  onVariant?: (index: number, total: number) => void;
}) {
  const plan = planVariants(input, options);
  const results: unknown[] = [];
  for (let index = 0; index < plan.length; index += 1) {
    options.onVariant?.(index + 1, plan.length);
    try {
      results.push({ ok: true, ...(await generateProject(plan[index].project, { provider: options.provider, outputDir: options.outputDir })) });
    } catch (error) {
      const anyError = error as any;
      results.push({ ok: false, seed: plan[index].project.seed, code: anyError?.code, error: anyError?.message ?? String(error) });
    }
  }
  return { count: plan.length, results };
}
