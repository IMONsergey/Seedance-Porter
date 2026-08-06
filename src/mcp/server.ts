import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listModels } from "../models/registry.js";
import { compileProject } from "../prompt/compiler.js";
import { generateProject } from "../core/generate.js";
import { scoreTake } from "../eval/scorer.js";

const server = new McpServer({ name: "seedance-porter", version: "0.1.0" });
const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });

server.tool("seedance_models", "List current dated Seedance model/provider capabilities", {}, async () => text(listModels()));

server.tool(
  "seedance_compile",
  "Compile a structured project into a production-ready Seedance prompt and reference map without spending credits",
  {
    project: z.any().describe("Porter project JSON object"),
    provider: z.enum(["byteplus", "fal", "muapi"]).optional(),
  },
  async ({ project, provider }) => text(compileProject(project, provider)),
);

server.tool(
  "seedance_generate",
  "Compile and generate a Seedance clip. This can spend provider credits; use only when explicitly requested.",
  {
    project: z.any().describe("Porter project JSON object"),
    provider: z.enum(["byteplus", "fal", "muapi"]).optional(),
    wait: z.boolean().default(true),
    force: z.boolean().default(false),
  },
  async ({ project, provider, wait, force }) => text(await generateProject(project, { provider, wait, force })),
);

server.tool(
  "seedance_score_take",
  "Evaluate a generated take using Porter's seven-dimension scorecard and get a one-variable retake instruction",
  {
    identityOrProductFidelity: z.number().min(0).max(5),
    motionPhysics: z.number().min(0).max(5),
    cameraComposition: z.number().min(0).max(5),
    temporalContinuity: z.number().min(0).max(5),
    audioSync: z.number().min(0).max(5),
    artifactControl: z.number().min(0).max(5),
    briefMatch: z.number().min(0).max(5),
  },
  async (scores) => text(scoreTake(scores)),
);

const transport = new StdioServerTransport();
await server.connect(transport);
