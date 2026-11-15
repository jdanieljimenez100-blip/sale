import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { uuidSchema } from "@/lib/uuid";
import { crearCobroApp } from "@/services/cobros";

const bodySchema = z.object({
  cuentaId: uuidSchema.optional(),
  meseroId: uuidSchema.optional(),
  tipo: z.literal("consumo"),
  montoCentavos: z.number().int().positive(),
  concepto: z.string().min(1).max(120),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    requireSesion(request);
    const json: unknown = await request.json();
    if (
      typeof json === "object" &&
      json !== null &&
      "tipo" in json &&
      (json as { tipo?: unknown }).tipo === "propina"
    ) {
      return NextResponse.json(
        { error: "Usa POST /api/cobros/[id]/propina para propinas" },
        { status: 400 },
      );
    }
    const input = bodySchema.parse(json);
    const cobro = await crearCobroApp(input);
    return NextResponse.json({ cobro });
  } catch (error) {
    return jsonError(error);
  }
}
