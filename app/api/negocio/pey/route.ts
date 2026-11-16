import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { peyUlidSchema } from "@/lib/pey-ulid";
import {
  actualizarPeyNegocio,
  obtenerPeyPublico,
} from "@/services/negocio-pey";

const putSchema = z
  .object({
    apiKey: z.string().min(8).max(200).optional(),
    webhookSecret: z.string().min(8).max(500).optional(),
    bankAccountId: peyUlidSchema.optional(),
  })
  .refine(
    (v) =>
      v.apiKey !== undefined ||
      v.webhookSecret !== undefined ||
      v.bankAccountId !== undefined,
    { message: "Envía al menos un campo" },
  );

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const origin = new URL(request.url).origin;
    const config = await obtenerPeyPublico(sesion.negocioId, origin);
    return NextResponse.json(config);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const json: unknown = await request.json();
    const body = putSchema.parse(json);
    const origin = new URL(request.url).origin;
    const config = await actualizarPeyNegocio({
      negocioId: sesion.negocioId,
      actorMeseroId: sesion.meseroId,
      origin,
      apiKey: body.apiKey,
      webhookSecret: body.webhookSecret,
      bankAccountId: body.bankAccountId,
    });
    return NextResponse.json(config);
  } catch (error) {
    return jsonError(error);
  }
}
