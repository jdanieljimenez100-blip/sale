import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { uuidSchema } from "@/lib/uuid";
import { abrirMesa } from "@/services/mesas";

const bodySchema = z.object({
  mesa: z.string().min(1).max(3),
  meseroId: uuidSchema.optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);
    const cuenta = await abrirMesa({
      mesa: body.mesa,
      meseroId: body.meseroId ?? sesion.meseroId,
      negocioId: sesion.negocioId,
      sesion,
    });
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
