import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import {
  actualizarConfigPropinas,
  obtenerConfigPropinasNegocio,
} from "@/services/negocios";

const bodySchema = z.object({
  propinaPorcentajes: z.array(z.number().int().min(1).max(50)).min(1).max(3),
  repartoCocinaPct: z.number().int().min(0).max(50),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    requireSesion(request, { rol: "admin" });
    const config = await obtenerConfigPropinasNegocio();
    return NextResponse.json(config);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    requireSesion(request, { rol: "admin" });
    const json: unknown = await request.json();
    const body = bodySchema.parse(json);
    const config = await actualizarConfigPropinas({
      propinaPorcentajes: body.propinaPorcentajes,
      repartoCocinaPct: body.repartoCocinaPct,
    });
    return NextResponse.json(config);
  } catch (error) {
    return jsonError(error);
  }
}
