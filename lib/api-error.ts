import { NextResponse } from "next/server";
import { DemoAuthError } from "@/lib/demo-auth";

export function jsonError(error: unknown): NextResponse {
  if (error instanceof DemoAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Error desconocido";
  console.error("[api]", message);
  return NextResponse.json({ error: message }, { status: 400 });
}
