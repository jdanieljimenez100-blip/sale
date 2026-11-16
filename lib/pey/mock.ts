import { randomUUID } from "node:crypto";
import { DEMO_TOKEN_HEADER, demoTokenValido } from "@/lib/demo-auth";
import { centavosParaPey } from "@/lib/pey/money-bridge";
import type {
  CrearCobroInput,
  CrearCobroResult,
  PeyClient,
  PeyCuentaBancariaResumen,
  PeyWebhookPayload,
  VerificarWebhookResult,
} from "@/lib/pey/types";

export function createMockPeyClient(): PeyClient {
  return {
    crearCobro(input: CrearCobroInput): Promise<CrearCobroResult> {
      const peyQrId = `mock_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
      const amountPesos = centavosParaPey(input.montoCentavos);
      const qrString = JSON.stringify({
        TYP: 20,
        mock: true,
        id: peyQrId,
        amount: amountPesos,
        concept: input.concepto,
      });
      return Promise.resolve({ peyQrId, qrString, amountPesos });
    },

    async verificarWebhook(request: Request): Promise<VerificarWebhookResult> {
      // En mock no hay firma de pey: solo aceptamos webhooks que traigan el
      // token de demo (los manda /api/dev/simular-pago). Sin esto, cualquiera
      // podría marcar un cobro como pagado con un POST a la URL pública.
      if (!demoTokenValido(request.headers.get(DEMO_TOKEN_HEADER))) {
        throw new Error("Webhook mock sin token de demo válido");
      }
      const rawBody = await request.text();
      let body: unknown;
      try {
        body = JSON.parse(rawBody) as unknown;
      } catch {
        throw new Error("Webhook mock con JSON inválido");
      }
      if (
        typeof body !== "object" ||
        body === null ||
        !("codiQrId" in body) ||
        !("transactionId" in body) ||
        !("amount" in body) ||
        !("type" in body)
      ) {
        throw new Error("Webhook mock incompleto");
      }
      const payload = body as PeyWebhookPayload;
      if (payload.type !== "codi.qr.payment_received") {
        throw new Error(`Tipo de webhook no soportado: ${payload.type}`);
      }
      const eventId =
        request.headers.get("webhook-id") ?? `mock_event_${payload.transactionId}`;
      return { eventId, payload };
    },

    obtenerCuentaBancaria(id: string): Promise<PeyCuentaBancariaResumen | null> {
      return Promise.resolve({
        id,
        alias: "mock",
        codiStatus: "ACTIVE",
      });
    },
  };
}
