import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { cobrarTotalCuenta } from "@/services/cobros";
import { obtenerCuenta } from "@/services/cuentas";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const cuenta = await obtenerCuenta(id);
    if (!cuenta) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    assertMismoNegocio(cuenta.negocio_id, sesion.negocioId);
    const cobro = await cobrarTotalCuenta(id, sesion);
    return NextResponse.json({ cobro });
  } catch (error) {
    return jsonError(error);
  }
}
