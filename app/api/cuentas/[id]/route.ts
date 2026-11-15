import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { obtenerCuenta } from "@/services/cuentas";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    requireSesion(request);
    const { id } = await context.params;
    const cuenta = await obtenerCuenta(id);
    if (!cuenta) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
