import type { ProviderName } from "../core/types.js";
import { PorterError } from "../core/errors.js";
import type { SeedanceProvider } from "./provider.js";
import { BytePlusProvider } from "./byteplus.js";
import { FalProvider } from "./fal.js";
import { MuApiProvider } from "./muapi.js";

export function createProvider(name: ProviderName): SeedanceProvider {
  if (name === "byteplus") return new BytePlusProvider();
  if (name === "fal") return new FalProvider();
  if (name === "muapi") return new MuApiProvider();
  throw new PorterError("CONFIG", `Unknown provider: ${name}`);
}
