import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import {
  listarNegociosAccesibles,
  obtenerNegocioPorId,
  obtenerSesionActual,
} from "@/services/auth";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const yo = await obtenerSesionActual(sesion.meseroId);
    if (!yo) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }
    const [negocio, negocios] = await Promise.all([
      obtenerNegocioPorId(sesion.negocioId),
      listarNegociosAccesibles(sesion.meseroId),
    ]);
    if (!negocio) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }
    return NextResponse.json({
      meseroId: yo.meseroId,
      nombre: yo.nombre,
      rol: sesion.rol,
      negocio,
      negocios,
    });
  } catch (error) {
    return jsonError(error);
  }
}
