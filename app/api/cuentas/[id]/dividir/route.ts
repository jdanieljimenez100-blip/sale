import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { obtenerCuenta } from "@/services/cuentas";
import {
  dividirCuentaIgual,
  dividirCuentaPorMontos,
} from "@/services/dividir";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.discriminatedUnion("modo", [
  z.object({
    modo: z.literal("igual"),
    partes: z.number().int().min(2).max(20),
  }),
  z.object({
    modo: z.literal("montos"),
    montosCentavos: z.array(z.number().int().positive()).min(2).max(20),
  }),
]);

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
    const json: unknown = await request.json();
    const input = bodySchema.parse(json);
    const cobros =
      input.modo === "igual"
        ? await dividirCuentaIgual(id, input.partes, sesion)
        : await dividirCuentaPorMontos(id, input.montosCentavos, sesion);
    return NextResponse.json({ cobros });
  } catch (error) {
    return jsonError(error);
  }
}
