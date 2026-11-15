import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { cerrarMesa } from "@/services/mesas";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const cuenta = await cerrarMesa({ cuentaId: id, sesion });
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
