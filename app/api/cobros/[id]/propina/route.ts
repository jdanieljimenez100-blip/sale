import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { assertDemoToken } from "@/lib/demo-auth";
import { crearPropinaDesdeConsumo } from "@/services/propinas";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.union([
  z.object({ porcentaje: z.number().int() }),
  z.object({ montoCentavos: z.number().int() }),
  z.object({ ninguna: z.literal(true) }),
]);

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    assertDemoToken(request);
    const { id } = await context.params;
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);

    const result = await crearPropinaDesdeConsumo({
      cobroConsumoId: id,
      ...body,
    });

    if ("omitida" in result) {
      return NextResponse.json({ ok: true, omitida: true });
    }
    return NextResponse.json({
      cobro: result.cobro,
      yaExistia: result.yaExistia,
    });
  } catch (error) {
    return jsonError(error);
  }
}
