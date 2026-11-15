import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { listarPropinasMesero } from "@/services/cobros";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const propinas = await listarPropinasMesero(id);
    return NextResponse.json({ propinas });
  } catch (error) {
    return jsonError(error);
  }
}
