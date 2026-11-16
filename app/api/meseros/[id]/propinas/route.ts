import { NextResponse } from "next/server";
import { HttpError, jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { listarPropinasMesero } from "@/services/cobros";
import { obtenerMesero } from "@/services/meseros";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const mesero = await obtenerMesero(id);
    if (!mesero) {
      throw new HttpError("No encontrado", 404);
    }
    assertMismoNegocio(mesero.negocio_id, sesion.negocioId);
    if (sesion.rol !== "admin" && sesion.meseroId !== id) {
      throw new HttpError("No tienes permiso", 403);
    }
    const propinas = await listarPropinasMesero(id, sesion.negocioId);
    return NextResponse.json({ propinas });
  } catch (error) {
    return jsonError(error);
  }
}
