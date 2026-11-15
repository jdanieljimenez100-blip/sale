import { NextResponse } from "next/server";
import { HttpError, jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { listarPropinasMesero } from "@/services/cobros";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    if (sesion.rol !== "admin" && sesion.meseroId !== id) {
      throw new HttpError("No tienes permiso", 403);
    }
    const propinas = await listarPropinasMesero(id);
    return NextResponse.json({ propinas });
  } catch (error) {
    return jsonError(error);
  }
}
