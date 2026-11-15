import { getStoredDemoToken } from "@/lib/demo-token";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { withDemoToken?: boolean },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.withDemoToken) {
    headers.set("x-demo-token", getStoredDemoToken());
  }
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(path, { ...init, headers });
  const json: unknown = await response.json();
  if (!response.ok) {
    let message = "Error de red";
  if (typeof json === "object" && json !== null && "error" in json) {
    const record: { error?: unknown } = json;
    if (typeof record.error === "string") {
      message = record.error;
    }
  }
    throw new Error(message);
  }
  return json as T;
}
