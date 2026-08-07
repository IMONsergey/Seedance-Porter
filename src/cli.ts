#!/usr/bin/env node
import { Command } from "commander";
import { readJson } from "./core/io.js";
import { doctorSnapshot } from "./core/config.js";
import { listModels } from "./models/registry.js";
import { compileProject } from "./prompt/compiler.js";
import { generateProject } from "./core/generate.js";
import { scoreTake, TakeScoreSchema } from "./eval/scorer.js";
import { reviewTake } from "./eval/review.js";
import { prepareContinuation } from "./projects/continuation.js";
import { generateVariants, planVariants } from "./projects/variants.js";
import { loadLedger } from "./projects/ledger.js";
import { extractLastFrame } from "./media/ffmpeg.js";
import type { ProviderName } from "./core/types.js";
import type { TakeDecision } from "./core/manifest.js";
import { PorterError } from "./core/errors.js";

const program = new Command();
program.name("porter").description("Production control layer for ByteDance Seedance").version("0.4.0");

program.command("models")
  .description("List model/provider capabilities from Porter's dated registry")
  .action(() => console.log(JSON.stringify(listModels(), null, 2)));

program.command("doctor")
  .description("Check local configuration without exposing secrets")
  .action(() => console.log(JSON.stringify(doctorSnapshot(), null, 2)));

program.command("compile")
  .argument("<project>", "Path to a Porter project JSON file")
  .option("-p, --provider <provider>", "byteplus | fal | muapi")
  .description("Compile a project brief into a provider-ready Seedance prompt")
  .action(async (path, options) => {
    const input = await readJson(path);
    const result = compileProject(input, options.provider as ProviderName | undefined);
    console.log(JSON.stringify(result, null, 2));
  });

program.command("validate")
  .argument("<project>", "Path to a Porter project JSON file")
  .option("-p, --provider <provider>", "byteplus | fal | muapi")
  .description("Validate a project against the source-dated official ByteDance/BytePlus standard without spending credits")
  .action(async (path, options) => {
    const input = await readJson(path);
    const result = compileProject(input, options.provider as ProviderName | undefined);
    console.log(JSON.stringify(result.officialCompliance, null, 2));
    if (!result.officialCompliance.passed) process.exitCode = 2;
  });

program.command("generate")
  .argument("<project>", "Path to a Porter project JSON file")
  .option("-p, --provider <provider>", "byteplus | fal | muapi")
  .option("-o, --output-dir <path>", "Output root directory")
  .option("--no-wait", "Submit and return without polling when the provider supports tasks")
  .option("--force", "Bypass the 10-minute duplicate paid-request guard")
  .description("Compile, validate, submit, poll, download and write a .porter.json sidecar")
  .action(async (path, options) => {
    const input = await readJson(path);
    const result = await generateProject(input, {
      provider: options.provider as ProviderName | undefined,
      wait: options.wait,
      outputDir: options.outputDir,
      force: options.force,
      onStatus: (task) => process.stderr.write(`[${task.provider}] ${task.id}: ${task.status}\n`),
    });
    console.log(JSON.stringify(result, null, 2));
  });

program.command("score")
  .argument("<scorecard>", "JSON file with seven 0-5 take scores")
  .description("Score a take and return accept/retake/reject plus one retake lever")
  .action(async (path) => console.log(JSON.stringify(scoreTake(await readJson(path)), null, 2)));

program.command("review")
  .argument("<manifest>", "Path to a generated .porter.json manifest")
  .argument("<scorecard>", "JSON file with seven 0-5 take scores")
  .option("--decision <decision>", "accept | retake | reject")
  .option("--end-state <description>", "Observed physical/visual state at the actual end of the accepted clip")
  .option("--notes <notes>", "Review notes")
  .option("--extract-frame", "Extract the final decoded frame with ffmpeg and store it beside the video")
  .description("Review a take, update its manifest and persist it in the project continuity ledger")
  .action(async (manifest, scorecard, options) => {
    const scores = TakeScoreSchema.parse(await readJson(scorecard));
    const decision = options.decision as TakeDecision | undefined;
    if (decision && !["accept", "retake", "reject"].includes(decision)) throw new PorterError("INVALID_INPUT", "decision must be accept, retake or reject");
    console.log(JSON.stringify(await reviewTake(manifest, scores, {
      decision,
      observedEndState: options.endState,
      notes: options.notes,
      extractFrame: options.extractFrame,
    }), null, 2));
  });

program.command("continue")
  .argument("<project>", "Next clip project JSON")
  .requiredOption("--from <manifest>", "Accepted previous take manifest")
  .option("-p, --provider <provider>", "byteplus | fal | muapi")
  .option("--generate", "Generate the prepared continuation; otherwise compile only")
  .option("-o, --output-dir <path>", "Output root directory")
  .description("Anchor the next clip to the reviewed, accepted previous take")
  .action(async (path, options) => {
    const input = await readJson(path);
    const prepared = await prepareContinuation(input, options.from, options.provider as ProviderName | undefined);
    if (!options.generate) return console.log(JSON.stringify(prepared, null, 2));
    const generated = await generateProject(prepared.project, { provider: options.provider as ProviderName | undefined, outputDir: options.outputDir });
    console.log(JSON.stringify({ prepared, generated }, null, 2));
  });

program.command("variants")
  .argument("<project>", "Project JSON to sweep across seeds on routes that explicitly support seed control")
  .option("-n, --count <number>", "Number of variants, maximum 8", (value) => Number.parseInt(value, 10), 3)
  .option("--seed-start <number>", "First seed", (value) => Number.parseInt(value, 10))
  .option("-p, --provider <provider>", "byteplus | fal | muapi")
  .option("--generate", "Actually spend credits and render the planned variants")
  .option("-o, --output-dir <path>", "Output root directory")
  .description("Plan or sequentially generate a bounded provider-supported seed sweep")
  .action(async (path, options) => {
    const input = await readJson(path);
    const args = { count: options.count, seedStart: options.seedStart, provider: options.provider as ProviderName | undefined };
    if (!options.generate) return console.log(JSON.stringify(planVariants(input, args), null, 2));
    console.log(JSON.stringify(await generateVariants(input, {
      ...args,
      outputDir: options.outputDir,
      onVariant: (index, total) => process.stderr.write(`variant ${index}/${total}\n`),
    }), null, 2));
  });

program.command("ledger")
  .argument("<project>", "Project name")
  .description("Read the persistent local take/continuity ledger")
  .action(async (project) => console.log(JSON.stringify(await loadLedger(project), null, 2)));

program.command("last-frame")
  .argument("<video>", "Local generated video")
  .option("-o, --output <path>", "Output PNG path")
  .description("Extract the actual final decoded frame with ffmpeg")
  .action(async (video, options) => console.log(JSON.stringify({ path: await extractLastFrame(video, options.output) }, null, 2)));

program.parseAsync(process.argv).catch((error) => {
  if (error instanceof PorterError) {
    console.error(JSON.stringify({ ok: false, code: error.code, message: error.message, retryable: error.retryable, details: error.details }, null, 2));
    process.exitCode = error.code === "INVALID_INPUT" || error.code === "CONFIG" || error.code === "UNSUPPORTED" ? 2 : error.code === "RATE_LIMITED" ? 4 : 1;
    return;
  }
  console.error(error);
  process.exitCode = 1;
});
