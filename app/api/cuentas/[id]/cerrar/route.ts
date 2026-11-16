import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { obtenerCuenta } from "@/services/cuentas";
import { cerrarMesa } from "@/services/mesas";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const existente = await obtenerCuenta(id);
    if (!existente) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    assertMismoNegocio(existente.negocio_id, sesion.negocioId);
    const cuenta = await cerrarMesa({ cuentaId: id, sesion });
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
