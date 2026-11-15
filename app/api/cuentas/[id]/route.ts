import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { obtenerCuenta } from "@/services/cuentas";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
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
