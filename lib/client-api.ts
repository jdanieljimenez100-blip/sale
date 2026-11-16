export class ApiClientError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { withDemoToken?: boolean },
): Promise<T> {
  const headers = new Headers(init?.headers);
  // withDemoToken queda como no-op: la sesión va en cookie httpOnly.
  void init?.withDemoToken;
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  const json: unknown = await response.json();
  if (!response.ok) {
    let message = "Error de red";
    if (typeof json === "object" && json !== null && "error" in json) {
      const record: { error?: unknown } = json;
      if (typeof record.error === "string") {
        message = record.error;
      }
    }
    throw new ApiClientError(message, response.status);
  }
  return json as T;
}
