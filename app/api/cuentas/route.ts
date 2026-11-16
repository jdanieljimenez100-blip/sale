import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { listarCuentasConResumen } from "@/services/cuentas";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { cuentas, cerradasHoy, resumen } = await listarCuentasConResumen(
      sesion.negocioId,
    );
    return NextResponse.json({ cuentas, cerradasHoy, resumen });
  } catch (error) {
    return jsonError(error);
  }
}
