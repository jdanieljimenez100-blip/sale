import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { listarLoginPublico, slugValido } from "@/services/auth";

/** Lista pública mínima para /entrar (solo id y nombre de activos con PIN). */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const rRaw = url.searchParams.get("r");
    const r =
      rRaw && slugValido(rRaw.trim().toLowerCase())
        ? rRaw.trim().toLowerCase()
        : null;
    const resultado = await listarLoginPublico(r);
    return NextResponse.json(resultado);
  } catch (error) {
    return jsonError(error);
  }
}
