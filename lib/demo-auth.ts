import { getServerEnv } from "@/lib/env";

export function assertDemoToken(request: Request): void {
  const token = request.headers.get("x-demo-token");
  const expected = getServerEnv().DEMO_ACCESS_TOKEN;
  if (!token || token !== expected) {
    throw new DemoAuthError("Token de demo inválido");
  }
}

export class DemoAuthError extends Error {
  readonly status = 401;

  constructor(message: string) {
    super(message);
    this.name = "DemoAuthError";
  }
}
