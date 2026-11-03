export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorPayload = { error?: string; message?: string } | null;

/**
 * JSON fetch against our own API. Cookies ride along, errors become ApiError
 * with the server's message, and a hung request can't wedge the UI.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only claim a JSON body when there is one: Fastify rejects an empty body
  // that advertises `application/json` (which is what a bare DELETE looks like).
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (init?.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    signal: AbortSignal.timeout(10_000),
    headers,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const payload = data as ErrorPayload;
    // 429s come from @fastify/rate-limit, whose useful text is in `message`.
    const message =
      (response.status === 429 ? payload?.message : payload?.error) ??
      payload?.error ??
      payload?.message ??
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return data as T;
}
