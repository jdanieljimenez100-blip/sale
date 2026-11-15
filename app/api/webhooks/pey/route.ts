import { NextResponse } from "next/server";
import { getPeyClient } from "@/lib/pey";
import { aplicarPagoWebhook } from "@/services/cobros";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const pey = getPeyClient();
    const verified = await pey.verificarWebhook(request);
    const result = await aplicarPagoWebhook({
      eventId: verified.eventId,
      payload: verified.payload,
    });

    console.info("[webhook/pey]", {
      peyQrId: verified.payload.codiQrId,
      amountCentavosHint: Math.round(verified.payload.amount * 100),
      applied: result.applied,
      cobroId: result.cobroId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "webhook error";
    console.error("[webhook/pey]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
