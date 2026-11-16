import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { respuestaCuentaDetalle } from "@/services/cuentas";
import { negocioIdDePartida, quitarPartida } from "@/services/mesas";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const negocioId = await negocioIdDePartida(id);
    assertMismoNegocio(negocioId, sesion.negocioId);
    const fila = await quitarPartida({ partidaId: id, sesion });
    const cuenta = await respuestaCuentaDetalle(fila.id);
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
