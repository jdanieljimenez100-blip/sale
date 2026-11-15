import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
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
    requireSesion(request);
    const { id } = await context.params;
    const json: unknown = await request.json();
    const input = bodySchema.parse(json);
    const cobros =
      input.modo === "igual"
        ? await dividirCuentaIgual(id, input.partes)
        : await dividirCuentaPorMontos(id, input.montosCentavos);
    return NextResponse.json({ cobros });
  } catch (error) {
    return jsonError(error);
  }
}
