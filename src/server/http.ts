import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { listModels } from "../models/registry.js";
import { compileProject } from "../prompt/compiler.js";
import { generateProject } from "../core/generate.js";
import { scoreTake, TakeScoreSchema } from "../eval/scorer.js";
import { reviewTake } from "../eval/review.js";
import { prepareContinuation } from "../projects/continuation.js";
import { loadLedger } from "../projects/ledger.js";
import { planVariants } from "../projects/variants.js";
import { doctorSnapshot } from "../core/config.js";
import type { ProviderName } from "../core/types.js";

const host = process.env.PORTER_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORTER_PORT ?? "4173", 10);
const token = process.env.PORTER_STUDIO_TOKEN;
const root = join(process.cwd(), "studio");

const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

function json(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value, null, 2));
}

function authorized(req: IncomingMessage): boolean {
  if (!token) return true;
  return req.headers.authorization === `Bearer ${token}`;
}

async function body(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += part.length;
    if (total > 2_000_000) throw new Error("Request body too large");
    chunks.push(part);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function api(req: IncomingMessage, res: ServerResponse, pathname: string) {
  if (!authorized(req)) return json(res, 401, { ok: false, error: "Unauthorized" });
  if (req.method === "GET" && pathname === "/api/health") return json(res, 200, { ok: true, service: "seedance-porter", ...doctorSnapshot() });
  if (req.method === "GET" && pathname === "/api/models") return json(res, 200, listModels());
  if (req.method === "POST" && pathname === "/api/compile") {
    const input = await body(req);
    return json(res, 200, compileProject(input.project ?? input, input.provider as ProviderName | undefined));
  }
  if (req.method === "POST" && pathname === "/api/score") {
    const input = await body(req);
    return json(res, 200, scoreTake(input.scores ?? input));
  }
  if (req.method === "POST" && pathname === "/api/review") {
    const input = await body(req);
    const scores = TakeScoreSchema.parse(input.scores);
    return json(res, 200, await reviewTake(input.manifestPath, scores, {
      decision: input.decision,
      observedEndState: input.observedEndState,
      notes: input.notes,
      extractFrame: input.extractFrame,
    }));
  }
  if (req.method === "POST" && pathname === "/api/continuation") {
    const input = await body(req);
    return json(res, 200, await prepareContinuation(input.project, input.fromManifestPath, input.provider as ProviderName | undefined));
  }
  if (req.method === "POST" && pathname === "/api/ledger") {
    const input = await body(req);
    return json(res, 200, await loadLedger(input.project));
  }
  if (req.method === "POST" && pathname === "/api/variants/plan") {
    const input = await body(req);
    return json(res, 200, planVariants(input.project, { count: input.count ?? 3, seedStart: input.seedStart, provider: input.provider as ProviderName | undefined }));
  }
  if (req.method === "POST" && pathname === "/api/generate") {
    const input = await body(req);
    const result = await generateProject(input.project ?? input, {
      provider: input.provider as ProviderName | undefined,
      wait: input.wait ?? true,
      force: input.force ?? false,
      outputDir: input.outputDir,
    });
    return json(res, 200, result);
  }
  return json(res, 404, { ok: false, error: "Unknown API route" });
}

async function staticFile(res: ServerResponse, pathname: string) {
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const safe = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  const path = join(root, safe);
  if (!path.startsWith(root)) return json(res, 403, { ok: false, error: "Forbidden" });
  try {
    const data = await readFile(path);
    res.writeHead(200, { "Content-Type": mime[extname(path)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    const fallback = await readFile(join(root, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fallback);
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);
    if (url.pathname.startsWith("/api/")) await api(req, res, url.pathname);
    else await staticFile(res, url.pathname);
  } catch (error) {
    const anyError = error as any;
    json(res, 500, { ok: false, code: anyError?.code, error: anyError?.message ?? String(error), details: anyError?.details });
  }
});

server.listen(port, host, () => {
  console.log(`Seedance Porter Studio: http://${host}:${port}`);
  if (host !== "127.0.0.1" && host !== "localhost" && !token) console.warn("WARNING: Studio is bound beyond localhost without PORTER_STUDIO_TOKEN.");
});
