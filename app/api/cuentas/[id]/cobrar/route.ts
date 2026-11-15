import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { cobrarTotalCuenta } from "@/services/cobros";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const cobro = await cobrarTotalCuenta(id, sesion);
    return NextResponse.json({ cobro });
  } catch (error) {
    return jsonError(error);
  }
}
