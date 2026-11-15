import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { obtenerSesionActual } from "@/services/auth";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sesion = requireSesion(request);
    const yo = await obtenerSesionActual(sesion.meseroId);
    if (!yo) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }
    return NextResponse.json(yo);
  } catch (error) {
    return jsonError(error);
  }
}
