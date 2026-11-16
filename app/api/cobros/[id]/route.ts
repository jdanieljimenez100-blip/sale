import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { nombreNegocioDeCobro, obtenerCobro } from "@/services/cobros";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const cobro = await obtenerCobro(id);
    if (!cobro) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    assertMismoNegocio(cobro.negocio_id, sesion.negocioId);
    const negocioNombre = await nombreNegocioDeCobro(cobro);
    return NextResponse.json({ cobro, negocioNombre });
  } catch (error) {
    return jsonError(error);
  }
}
