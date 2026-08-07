import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listModels } from "../models/registry.js";
import { compileProject } from "../prompt/compiler.js";
import { generateProject } from "../core/generate.js";
import { scoreTake } from "../eval/scorer.js";
import { reviewTake } from "../eval/review.js";
import { prepareContinuation } from "../projects/continuation.js";
import { loadLedger } from "../projects/ledger.js";
import { planVariants } from "../projects/variants.js";

const server = new McpServer({ name: "seedance-porter", version: "0.4.0" });
const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });

server.tool("seedance_models", "List current dated Seedance model/provider capabilities", {}, async () => text(listModels()));

server.tool(
  "seedance_compile",
  "Compile a structured project into an official-guide-aligned Seedance prompt, reference map and compliance report without spending credits",
  {
    project: z.any().describe("Porter project JSON object"),
    provider: z.enum(["byteplus", "fal", "muapi"]).optional(),
  },
  async ({ project, provider }) => text(compileProject(project, provider)),
);

server.tool(
  "seedance_validate_official",
  "Validate a project against Porter's source-dated official ByteDance/BytePlus Seedance prompting standard without spending credits",
  {
    project: z.any().describe("Porter project JSON object"),
    provider: z.enum(["byteplus", "fal", "muapi"]).optional(),
  },
  async ({ project, provider }) => text(compileProject(project, provider).officialCompliance),
);

server.tool(
  "seedance_generate",
  "Validate official compliance and generate a Seedance clip. This can spend provider credits; the call is blocked before provider submission when official compliance fails.",
  {
    project: z.any().describe("Porter project JSON object"),
    provider: z.enum(["byteplus", "fal", "muapi"]).optional(),
    wait: z.boolean().default(true),
    force: z.boolean().default(false),
  },
  async ({ project, provider, wait, force }) => text(await generateProject(project, { provider, wait, force })),
);

const scoreShape = {
  identityOrProductFidelity: z.number().min(0).max(5),
  motionPhysics: z.number().min(0).max(5),
  cameraComposition: z.number().min(0).max(5),
  temporalContinuity: z.number().min(0).max(5),
  audioSync: z.number().min(0).max(5),
  artifactControl: z.number().min(0).max(5),
  briefMatch: z.number().min(0).max(5),
};

server.tool(
  "seedance_score_take",
  "Evaluate a generated take and get a one-variable retake instruction",
  scoreShape,
  async (scores) => text(scoreTake(scores)),
);

server.tool(
  "seedance_review_take",
  "Persist a take review into its .porter.json manifest and project continuity ledger. Can optionally extract a final frame using local ffmpeg.",
  {
    manifestPath: z.string(),
    ...scoreShape,
    decision: z.enum(["accept", "retake", "reject"]).optional(),
    observedEndState: z.string().optional(),
    notes: z.string().optional(),
    extractFrame: z.boolean().default(false),
  },
  async ({ manifestPath, decision, observedEndState, notes, extractFrame, ...scores }) => text(await reviewTake(manifestPath, scores, { decision, observedEndState, notes, extractFrame })),
);

server.tool(
  "seedance_prepare_continuation",
  "Compile a next clip from an accepted previous take's observed final state and final-frame anchor. Does not spend credits.",
  {
    project: z.any(),
    fromManifestPath: z.string(),
    provider: z.enum(["byteplus", "fal", "muapi"]).optional(),
  },
  async ({ project, fromManifestPath, provider }) => text(await prepareContinuation(project, fromManifestPath, provider)),
);

server.tool(
  "seedance_ledger",
  "Read the local accepted/rejected take history for a Porter project",
  { project: z.string() },
  async ({ project }) => text(await loadLedger(project)),
);

server.tool(
  "seedance_plan_variants",
  "Plan a bounded 1-8 seed sweep without spending credits. Each compiled variant includes official compliance; paid generation later uses the hard gate.",
  {
    project: z.any(),
    count: z.number().int().min(1).max(8).default(3),
    seedStart: z.number().int().min(0).optional(),
    provider: z.enum(["byteplus", "fal", "muapi"]).optional(),
  },
  async ({ project, count, seedStart, provider }) => text(planVariants(project, { count, seedStart, provider })),
);

const transport = new StdioServerTransport();
await server.connect(transport);
