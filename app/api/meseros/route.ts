import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { peyUlidSchema } from "@/lib/pey-ulid";
import { crearMesero, listarMeserosPublicos } from "@/services/meseros";

const crearSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
  peyBankAccountId: peyUlidSchema.optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const meseros = await listarMeserosPublicos(sesion.negocioId);
    return NextResponse.json({ meseros });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request, { rol: "admin" });
    const json: unknown = await request.json();
    const input = crearSchema.parse(json);
    const mesero = await crearMesero({
      nombre: input.nombre,
      negocioId: sesion.negocioId,
      peyBankAccountId: input.peyBankAccountId,
    });
    return NextResponse.json({ mesero });
  } catch (error) {
    return jsonError(error);
  }
}
