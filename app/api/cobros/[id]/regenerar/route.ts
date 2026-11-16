import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { obtenerCobro, regenerarCobro } from "@/services/cobros";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const actual = await obtenerCobro(id);
    if (!actual) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    assertMismoNegocio(actual.negocio_id, sesion.negocioId);
    const cobro = await regenerarCobro(id);
    return NextResponse.json({ cobro });
  } catch (error) {
    return jsonError(error);
  }
}
