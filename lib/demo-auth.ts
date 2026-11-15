import { createHash, timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";

/** Header con el secreto compartido de la demo. */
export const DEMO_TOKEN_HEADER = "x-demo-token";

/** Compara el token recibido con DEMO_ACCESS_TOKEN en tiempo constante. */
export function demoTokenValido(token: string | null): boolean {
  if (!token) {
    return false;
  }
  const expected = getServerEnv().DEMO_ACCESS_TOKEN;
  const a = createHash("sha256").update(token).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function assertDemoToken(request: Request): void {
  if (!demoTokenValido(request.headers.get(DEMO_TOKEN_HEADER))) {
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
