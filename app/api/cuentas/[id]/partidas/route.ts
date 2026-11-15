import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { agregarPartida } from "@/services/mesas";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  descripcion: z.string().min(1).max(80),
  cantidad: z.number().int().min(1).max(99),
  precioPesos: z.string().min(1),
});

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);
    const cuenta = await agregarPartida({
      cuentaId: id,
      descripcion: body.descripcion,
      cantidad: body.cantidad,
      precioPesos: body.precioPesos,
      sesion,
    });
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
