import { NextResponse } from "next/server";
import { HttpError, jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import {
  esPartidaMenu,
  partidaBodySchema,
} from "@/lib/partida-input";
import { obtenerCuenta, respuestaCuentaDetalle } from "@/services/cuentas";
import { agregarPartida } from "@/services/mesas";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const cuentaExistente = await obtenerCuenta(id);
    if (!cuentaExistente) {
      throw new HttpError("No encontrado", 404);
    }
    assertMismoNegocio(cuentaExistente.negocio_id, sesion.negocioId);

    const json: unknown = await request.json();
    const body = partidaBodySchema.parse(json);

    if (!esPartidaMenu(body) && sesion.rol !== "admin") {
      throw new HttpError("Solo admin puede agregar un platillo libre", 403);
    }

    if (esPartidaMenu(body)) {
      await agregarPartida({
        cuentaId: id,
        menuItemId: body.menuItemId,
        cantidad: body.cantidad,
        notas: body.notas,
        sesion,
      });
    } else {
      await agregarPartida({
        cuentaId: id,
        descripcion: body.descripcion,
        cantidad: body.cantidad,
        precioPesos: body.precioPesos,
        notas: body.notas,
        sesion,
      });
    }

    const cuenta = await respuestaCuentaDetalle(id);
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
