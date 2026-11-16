import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { assertMismoNegocio } from "@/lib/auth/assert-negocio";
import { requireSesion } from "@/lib/auth/require";
import { uuidSchema } from "@/lib/uuid";
import { crearCobroApp } from "@/services/cobros";
import { obtenerCuenta } from "@/services/cuentas";

const bodySchema = z.object({
  cuentaId: uuidSchema.optional(),
  meseroId: uuidSchema.optional(),
  tipo: z.literal("consumo"),
  montoCentavos: z.number().int().positive(),
  concepto: z.string().min(1).max(120),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
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
    if (input.cuentaId) {
      const cuenta = await obtenerCuenta(input.cuentaId);
      if (!cuenta) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      assertMismoNegocio(cuenta.negocio_id, sesion.negocioId);
    }
    const cobro = await crearCobroApp(input);
    return NextResponse.json({ cobro });
  } catch (error) {
    return jsonError(error);
  }
}
