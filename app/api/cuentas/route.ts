import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { listarCuentas } from "@/services/cuentas";

export async function GET(): Promise<NextResponse> {
  try {
    const cuentas = await listarCuentas();
    return NextResponse.json({ cuentas });
  } catch (error) {
    return jsonError(error);
  }
}
