import { Webhook } from "standardwebhooks";
import { getServerEnv } from "@/lib/env";
import { centavosParaPey } from "@/lib/pey/money-bridge";
import type {
  CrearCobroInput,
  CrearCobroResult,
  PeyClient,
  PeyWebhookPayload,
  VerificarWebhookResult,
} from "@/lib/pey/types";

type PeyCreateQrResponse = {
  id: string;
  qrString: string;
};

function isCreateQrResponse(value: unknown): value is PeyCreateQrResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "qrString" in value &&
    typeof (value as PeyCreateQrResponse).id === "string" &&
    typeof (value as PeyCreateQrResponse).qrString === "string"
  );
}

export function createRealPeyClient(): PeyClient {
  return {
    async crearCobro(input: CrearCobroInput): Promise<CrearCobroResult> {
      const env = getServerEnv();
      const apiKey = env.PEY_API_KEY;
      if (!apiKey) {
        throw new Error("Falta PEY_API_KEY");
      }
      const amountPesos = centavosParaPey(input.montoCentavos);
      const body: Record<string, string | number> = {
        amount: amountPesos,
        concept: input.concepto,
        expiration: input.expirationSeconds ?? 600,
      };
      if (input.numRef) {
        body.numRef = input.numRef;
      }
      if (input.bankAccountId) {
        body.bankAccountId = input.bankAccountId;
      }

      const response = await fetch("https://api.pey.mx/codi/qr", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`pey create QR falló (${response.status}): ${text.slice(0, 200)}`);
      }

      const json: unknown = await response.json();
      if (!isCreateQrResponse(json)) {
        throw new Error("Respuesta de pey sin id/qrString [NO DOCUMENTADO parcial]");
      }
      return {
        peyQrId: json.id,
        qrString: json.qrString,
        amountPesos,
      };
    },

    async verificarWebhook(request: Request): Promise<VerificarWebhookResult> {
      const env = getServerEnv();
      const secret = env.PEY_WEBHOOK_SECRET;
      if (!secret) {
        throw new Error("Falta PEY_WEBHOOK_SECRET");
      }
      const rawBody = await request.text();
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const wh = new Webhook(secret);
      wh.verify(rawBody, headers);

      const parsed: unknown = JSON.parse(rawBody);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("type" in parsed) ||
        !("codiQrId" in parsed) ||
        !("transactionId" in parsed) ||
        !("amount" in parsed)
      ) {
        throw new Error("Payload de webhook pey incompleto");
      }
      const payload = parsed as PeyWebhookPayload;
      if (payload.type !== "codi.qr.payment_received") {
        throw new Error(`Tipo no soportado: ${payload.type}`);
      }
      const eventId = request.headers.get("webhook-id");
      if (!eventId) {
        throw new Error("Falta header webhook-id");
      }
      return { eventId, payload };
    },
  };
}
