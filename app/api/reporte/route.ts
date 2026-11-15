import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import type { RangoReporteDias } from "@/lib/dia-mexico";
import { obtenerReporteDesempeno } from "@/services/reporte";

const rangoSchema = z.enum(["1", "7", "30"]);

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sesion = requireSesion(request);
    const url = new URL(request.url);
    const raw = url.searchParams.get("dias") ?? "1";
    const dias = Number(rangoSchema.parse(raw)) as RangoReporteDias;
    const reporte = await obtenerReporteDesempeno(dias, sesion);
    return NextResponse.json(reporte);
  } catch (error) {
    return jsonError(error);
  }
}
