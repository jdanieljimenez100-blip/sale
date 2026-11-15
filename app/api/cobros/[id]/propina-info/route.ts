import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { obtenerCobro } from "@/services/cobros";
import { porcentajesPropinaPorCuenta } from "@/services/negocios";
import { resolverDestinoPropina } from "@/services/propina-destino";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    await requireSesion(request);
    const { id } = await context.params;
    const cobro = await obtenerCobro(id);
    if (!cobro) {
      return NextResponse.json({ error: "Cobro no encontrado" }, { status: 404 });
    }
    const destino = await resolverDestinoPropina({
      meseroId: cobro.mesero_id,
      cuentaId: cobro.cuenta_id,
    });
    const porcentajes = await porcentajesPropinaPorCuenta(cobro.cuenta_id);
    return NextResponse.json({
      mensaje: destino.mensaje,
      meseroNombre: destino.meseroNombre,
      mesa: destino.mesa,
      tieneCuentaMesero: destino.tieneCuentaMesero,
      porcentajes,
    });
  } catch (error) {
    return jsonError(error);
  }
}
