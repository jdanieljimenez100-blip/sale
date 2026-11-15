import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { crearResenaDesdeConsumo } from "@/services/resenas";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  estrellas: z.number().int().min(1).max(5),
  comentario: z
    .string()
    .max(280)
    .optional()
    .nullable()
    .transform((v) => (v == null ? null : v)),
});

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    await requireSesion(request);
    const { id } = await context.params;
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);

    const resena = await crearResenaDesdeConsumo({
      cobroConsumoId: id,
      estrellas: body.estrellas,
      comentario: body.comentario,
    });

    return NextResponse.json({ resena });
  } catch (error) {
    return jsonError(error);
  }
}
