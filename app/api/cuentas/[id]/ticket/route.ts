import { NextResponse } from "next/server";
import { HttpError, jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { puedeModificarMesa } from "@/lib/mesa-reglas";
import { obtenerCuenta } from "@/services/cuentas";
import { obtenerTicketMetaPorCuenta } from "@/services/ticket";

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
      throw new HttpError("Cuenta no encontrada", 404);
    }
    puedeModificarMesa({
      rol: sesion.rol,
      sesionMeseroId: sesion.meseroId,
      cuentaMeseroId: cuenta.mesero_id,
    });
    if (cuenta.estado !== "pagada") {
      return NextResponse.json({
        disponible: false as const,
        mensaje: "El ticket aparece cuando la mesa quede pagada",
      });
    }
    const meta = await obtenerTicketMetaPorCuenta(id);
    if (!meta) {
      return NextResponse.json({
        disponible: false as const,
        mensaje: "El ticket aparece cuando la mesa quede pagada",
      });
    }
    return NextResponse.json({
      disponible: true as const,
      token: meta.token,
      folio: meta.folio,
    });
  } catch (error) {
    return jsonError(error);
  }
}
