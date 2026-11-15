import { NextResponse } from "next/server";
import { DemoAuthError } from "@/lib/demo-auth";
import { ZodError } from "zod";

function mensajeParaUsuario(error: unknown): string {
  if (error instanceof DemoAuthError) {
    return "Falta el token de este dispositivo. Ábrelo en Ajustes.";
  }
  if (error instanceof ZodError) {
    return "Revisa los datos e inténtalo de nuevo.";
  }
  const message = error instanceof Error ? error.message : "";
  if (
    /supabase|PGRST|permission denied|JWT|rpc|fetch failed|ECONN|en el servidor/i.test(
      message,
    )
  ) {
    return "No se pudo completar. Revisa la conexión o el token en Ajustes.";
  }
  if (message.length > 0 && message.length < 160 && !/stack|at\s+/i.test(message)) {
    return message;
  }
  return "Algo salió mal. Inténtalo de nuevo.";
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof DemoAuthError) {
    return NextResponse.json(
      { error: mensajeParaUsuario(error) },
      { status: error.status },
    );
  }
  const raw = error instanceof Error ? error.message : "Error desconocido";
  console.error("[api]", raw);
  return NextResponse.json(
    { error: mensajeParaUsuario(error) },
    { status: 400 },
  );
}
