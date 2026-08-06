export type PorterErrorCode =
  | "CONFIG"
  | "INVALID_INPUT"
  | "UNSUPPORTED"
  | "RATE_LIMITED"
  | "API"
  | "TIMEOUT"
  | "IO";

export class PorterError extends Error {
  constructor(
    public readonly code: PorterErrorCode,
    message: string,
    public readonly retryable = false,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "PorterError";
  }
}

export async function jsonOrText(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function assertOk(response: Response): Promise<unknown> {
  const body = await jsonOrText(response);
  if (response.ok) return body;
  const anyBody = body as any;
  const message = anyBody?.error?.message ?? anyBody?.message ?? `HTTP ${response.status}`;
  if (response.status === 429) throw new PorterError("RATE_LIMITED", message, true, body);
  throw new PorterError("API", message, response.status >= 500, body);
}
