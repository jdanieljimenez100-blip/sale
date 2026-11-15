import { WebhookVerificationError } from "standardwebhooks";
import { getPeyClient } from "@/lib/pey";
import { pesosDesdePey } from "@/lib/pey/money-bridge";
import type { PeyWebhookPayload } from "@/lib/pey";
import {
  aplicarPagoWebhook,
  obtenerCobroPorPeyQrId,
} from "@/services/cobros";

export type WebhookPeyResult =
  | { status: 200; body: { ok: true; applied: boolean; cobroId: string | null } }
  | { status: 400 | 401 | 500; body: { error: string } };

function esCobroNoEncontrado(message: string): boolean {
  return /cobro no encontrado/i.test(message);
}

export async function procesarWebhookPey(
  request: Request,
): Promise<WebhookPeyResult> {
  let eventId: string;
  let payload: PeyWebhookPayload;

  try {
    const pey = getPeyClient();
    const verified = await pey.verificarWebhook(request);
    eventId = verified.eventId;
    payload = verified.payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : "webhook inválido";
    if (
      error instanceof WebhookVerificationError ||
      /firma|signature|token de demo|Missing required headers/i.test(message)
    ) {
      console.error("[webhook/pey]", "auth_fail");
      return { status: 401, body: { error: "Webhook no auténtico" } };
    }
    console.error("[webhook/pey]", "payload_fail");
    return { status: 400, body: { error: message } };
  }

  try {
    const cobro = await obtenerCobroPorPeyQrId(payload.codiQrId);
    if (!cobro) {
      console.info("[webhook/pey]", {
        peyQrId: payload.codiQrId,
        applied: false,
        reason: "cobro_desconocido",
      });
      return {
        status: 200,
        body: { ok: true, applied: false, cobroId: null },
      };
    }

    const amountCentavos = pesosDesdePey(payload.amount);
    if (amountCentavos !== cobro.monto_centavos) {
      console.info("[webhook/pey]", {
        peyQrId: payload.codiQrId,
        cobroId: cobro.id,
        applied: false,
        reason: "monto_mismatch",
        esperadoCentavos: cobro.monto_centavos,
        recibidoCentavos: amountCentavos,
      });
      return {
        status: 200,
        body: { ok: true, applied: false, cobroId: cobro.id },
      };
    }

    const result = await aplicarPagoWebhook({ eventId, payload });
    console.info("[webhook/pey]", {
      peyQrId: payload.codiQrId,
      amountCentavos,
      applied: result.applied,
      cobroId: result.cobroId,
      tardio: cobro.estado === "expirado",
    });
    return { status: 200, body: { ok: true, ...result } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "db error";
    if (esCobroNoEncontrado(message)) {
      console.info("[webhook/pey]", {
        peyQrId: payload.codiQrId,
        applied: false,
        reason: "cobro_desconocido",
      });
      return {
        status: 200,
        body: { ok: true, applied: false, cobroId: null },
      };
    }
    console.error("[webhook/pey]", "db_fail");
    return { status: 500, body: { error: "Error de base de datos" } };
  }
}
