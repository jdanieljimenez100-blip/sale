import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { obtenerCuenta } from "@/services/cuentas";

type Params = { params: Promise<{ id: string }> };

export async function GET(
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
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
