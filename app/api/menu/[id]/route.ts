import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { actualizarItem } from "@/services/menu";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const { id } = await context.params;
    const json: unknown = await request.json();
    const item = await actualizarItem(
      sesion.negocioId,
      id,
      json,
      sesion.meseroId,
    );
    return NextResponse.json({ item });
  } catch (error) {
    return jsonError(error);
  }
}
