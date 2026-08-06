import "dotenv/config";
import type { ProviderName } from "./types.js";

export interface PorterConfig {
  defaultProvider: ProviderName;
  defaultModel: string;
  outputDir: string;
  pollIntervalMs: number;
  timeoutMs: number;
  byteplusBaseUrl: string;
  muapiBaseUrl: string;
}

const integerEnv = (name: string, fallback: number) => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function loadConfig(): PorterConfig {
  return {
    defaultProvider: (process.env.PORTER_PROVIDER as ProviderName | undefined) ?? "byteplus",
    defaultModel: process.env.PORTER_MODEL ?? "seedance-2.0",
    outputDir: process.env.PORTER_OUTPUT_DIR ?? "outputs",
    pollIntervalMs: integerEnv("PORTER_POLL_INTERVAL_MS", 5000),
    timeoutMs: integerEnv("PORTER_TIMEOUT_MS", 900000),
    byteplusBaseUrl: process.env.BYTEPLUS_BASE_URL ?? "https://ark.ap-southeast.bytepluses.com/api/v3",
    muapiBaseUrl: process.env.MUAPI_BASE_URL ?? "https://api.muapi.ai/api/v1",
  };
}

export function providerKey(provider: ProviderName): string | undefined {
  if (provider === "byteplus") {
    return process.env.BYTEPLUS_API_KEY || process.env.SEEDANCE_API_KEY || process.env.ARK_API_KEY;
  }
  if (provider === "fal") return process.env.FAL_KEY;
  if (provider === "muapi") return process.env.MUAPI_API_KEY;
  return undefined;
}

export function maskSecret(secret?: string): string {
  if (!secret) return "not set";
  if (secret.length <= 8) return `${secret.slice(0, 2)}***`;
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export function doctorSnapshot() {
  const cfg = loadConfig();
  return {
    node: process.version,
    defaults: { provider: cfg.defaultProvider, model: cfg.defaultModel, outputDir: cfg.outputDir },
    providers: {
      byteplus: { key: maskSecret(providerKey("byteplus")), baseUrl: cfg.byteplusBaseUrl },
      fal: { key: maskSecret(providerKey("fal")) },
      muapi: { key: maskSecret(providerKey("muapi")), baseUrl: cfg.muapiBaseUrl, warning: "third-party preview route" },
    },
  };
}
