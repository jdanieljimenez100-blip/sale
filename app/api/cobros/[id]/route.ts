import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { obtenerCobro } from "@/services/cobros";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const cobro = await obtenerCobro(id);
    if (!cobro) {
      return NextResponse.json({ error: "Cobro no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ cobro });
  } catch (error) {
    return jsonError(error);
  }
}
