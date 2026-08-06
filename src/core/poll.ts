import { PorterError } from "./errors.js";

export async function pollUntil<T>(options: {
  fetcher: () => Promise<T>;
  terminal: (value: T) => boolean;
  intervalMs: number;
  timeoutMs: number;
  onTick?: (value: T) => void;
}): Promise<T> {
  const started = Date.now();
  while (true) {
    if (Date.now() - started >= options.timeoutMs) {
      throw new PorterError("TIMEOUT", `Timed out after ${options.timeoutMs}ms`, true);
    }
    const value = await options.fetcher();
    options.onTick?.(value);
    if (options.terminal(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, options.intervalMs));
  }
}
