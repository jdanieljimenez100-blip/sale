import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { listarCuentasConResumen } from "@/services/cuentas";

export async function GET(): Promise<NextResponse> {
  try {
    const { cuentas, resumen } = await listarCuentasConResumen();
    return NextResponse.json({ cuentas, resumen });
  } catch (error) {
    return jsonError(error);
  }
}
