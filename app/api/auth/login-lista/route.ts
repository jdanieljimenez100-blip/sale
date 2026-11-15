import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { listarMeserosActivosLogin } from "@/services/auth";

/** Lista pública mínima para /entrar (solo id y nombre de activos con PIN). */
export async function GET(): Promise<NextResponse> {
  try {
    const meseros = await listarMeserosActivosLogin();
    return NextResponse.json({ meseros });
  } catch (error) {
    return jsonError(error);
  }
}
