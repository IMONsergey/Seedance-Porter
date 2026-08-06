#!/usr/bin/env node
import { Command } from "commander";
import { readJson } from "./core/io.js";
import { doctorSnapshot } from "./core/config.js";
import { listModels } from "./models/registry.js";
import { compileProject } from "./prompt/compiler.js";
import { generateProject } from "./core/generate.js";
import { scoreTake } from "./eval/scorer.js";
import type { ProviderName } from "./core/types.js";
import { PorterError } from "./core/errors.js";

const program = new Command();
program.name("porter").description("Production control layer for ByteDance Seedance").version("0.1.0");

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

program.command("generate")
  .argument("<project>", "Path to a Porter project JSON file")
  .option("-p, --provider <provider>", "byteplus | fal | muapi")
  .option("-o, --output-dir <path>", "Output root directory")
  .option("--no-wait", "Submit and return without polling when the provider supports tasks")
  .option("--force", "Bypass the 10-minute duplicate deterministic request guard")
  .description("Compile, submit, poll, download and write a .porter.json sidecar")
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

program.parseAsync(process.argv).catch((error) => {
  if (error instanceof PorterError) {
    console.error(JSON.stringify({ ok: false, code: error.code, message: error.message, retryable: error.retryable, details: error.details }, null, 2));
    process.exitCode = error.code === "INVALID_INPUT" || error.code === "CONFIG" || error.code === "UNSUPPORTED" ? 2 : error.code === "RATE_LIMITED" ? 4 : 1;
    return;
  }
  console.error(error);
  process.exitCode = 1;
});
