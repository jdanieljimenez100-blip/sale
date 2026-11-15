import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { listarCuentasConResumen } from "@/services/cuentas";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    requireSesion(request);
    const { cuentas, resumen } = await listarCuentasConResumen();
    return NextResponse.json({ cuentas, resumen });
  } catch (error) {
    return jsonError(error);
  }
}
