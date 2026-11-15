import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { obtenerCobro } from "@/services/cobros";
import { resolverDestinoPropina } from "@/services/propina-destino";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const cobro = await obtenerCobro(id);
    if (!cobro) {
      return NextResponse.json({ error: "Cobro no encontrado" }, { status: 404 });
    }
    const destino = await resolverDestinoPropina({
      meseroId: cobro.mesero_id,
      cuentaId: cobro.cuenta_id,
    });
    return NextResponse.json({
      mensaje: destino.mensaje,
      meseroNombre: destino.meseroNombre,
      mesa: destino.mesa,
      tieneCuentaMesero: destino.tieneCuentaMesero,
    });
  } catch (error) {
    return jsonError(error);
  }
}
