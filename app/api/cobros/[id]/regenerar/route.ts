import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { regenerarCobro } from "@/services/cobros";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    requireSesion(request);
    const { id } = await context.params;
    const cobro = await regenerarCobro(id);
    return NextResponse.json({ cobro });
  } catch (error) {
    return jsonError(error);
  }
}
