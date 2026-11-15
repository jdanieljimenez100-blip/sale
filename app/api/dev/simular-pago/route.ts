import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { assertDemoToken, DEMO_TOKEN_HEADER } from "@/lib/demo-auth";
import { getServerEnv } from "@/lib/env";
import { obtenerCobro } from "@/services/cobros";

const bodySchema = z.object({
  cobroId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    ),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertDemoToken(request);
    const env = getServerEnv();
    if (env.PEY_MODE !== "mock") {
      return NextResponse.json(
        { error: "Solo disponible en PEY_MODE=mock" },
        { status: 403 },
      );
    }

    const json: unknown = await request.json();
    const { cobroId } = bodySchema.parse(json);
    const cobro = await obtenerCobro(cobroId);
    if (!cobro) {
      return NextResponse.json({ error: "Cobro no encontrado" }, { status: 404 });
    }

    const payload = {
      amount: cobro.monto_centavos / 100,
      apiKeyId: "mock_api_key",
      codiQrId: cobro.pey_qr_id,
      concept: cobro.concepto,
      datePaid: Math.floor(Date.now() / 1000),
      numRef: "mock",
      transactionId: `mock_tx_${cobro.id.replaceAll("-", "").slice(0, 16)}`,
      type: "codi.qr.payment_received",
    };

    const origin = new URL(request.url).origin;
    const webhookResponse = await fetch(`${origin}/api/webhooks/pey`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "webhook-id": `mock_${payload.transactionId}`,
        [DEMO_TOKEN_HEADER]: env.DEMO_ACCESS_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const result: unknown = await webhookResponse.json();
    return NextResponse.json(
      { ok: webhookResponse.ok, result },
      { status: webhookResponse.status },
    );
  } catch (error) {
    return jsonError(error);
  }
}
