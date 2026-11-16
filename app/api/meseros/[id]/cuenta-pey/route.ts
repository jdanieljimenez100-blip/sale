import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { peyUlidSchema } from "@/lib/pey-ulid";
import { uuidSchema } from "@/lib/uuid";
import { actualizarCuentaPeyMesero, obtenerMesero } from "@/services/meseros";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  peyBankAccountId: peyUlidSchema.nullable(),
});

export async function PATCH(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const { id } = await context.params;
    uuidSchema.parse(id);
    const actual = await obtenerMesero(id);
    if (!actual) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    assertMismoNegocio(actual.negocio_id, sesion.negocioId);
    const json: unknown = await request.json();
    const input = bodySchema.parse(json);
    const mesero = await actualizarCuentaPeyMesero(
      id,
      input.peyBankAccountId,
      sesion.meseroId,
      sesion.negocioId,
    );
    return NextResponse.json({ mesero });
  } catch (error) {
    return jsonError(error);
  }
}
