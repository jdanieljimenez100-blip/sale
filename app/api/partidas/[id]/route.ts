import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import { quitarPartida } from "@/services/mesas";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(
  request: Request,
  context: Params,
): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const { id } = await context.params;
    const cuenta = await quitarPartida({ partidaId: id, sesion });
    return NextResponse.json({ cuenta });
  } catch (error) {
    return jsonError(error);
  }
}
