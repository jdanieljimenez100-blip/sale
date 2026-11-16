import { Webhook } from "standardwebhooks";
import { centavosParaPey } from "@/lib/pey/money-bridge";
import { normalizarNumRef } from "@/lib/pey/num-ref";
import type {
  CrearCobroInput,
  CrearCobroResult,
  PeyClient,
  PeyClientCredentials,
  PeyCuentaBancariaResumen,
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

function resumenCuentaBancaria(
  value: unknown,
): PeyCuentaBancariaResumen | null {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return null;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== "string") {
    return null;
  }
  return {
    id: obj.id,
    alias: typeof obj.alias === "string" ? obj.alias : null,
    codiStatus: typeof obj.codiStatus === "string" ? obj.codiStatus : null,
  };
}

export function createRealPeyClient(config: PeyClientCredentials): PeyClient {
  return {
    async crearCobro(input: CrearCobroInput): Promise<CrearCobroResult> {
      const apiKey = config.apiKey;
      if (!apiKey) {
        throw new Error("Falta API key de pey");
      }
      const amountPesos = centavosParaPey(input.montoCentavos);
      const body: Record<string, string | number> = {
        amount: amountPesos,
        concept: input.concepto,
        expiration: input.expirationSeconds ?? 600,
      };
      const numRef = normalizarNumRef(input.numRef);
      if (numRef) {
        body.numRef = numRef;
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
      const secret = config.webhookSecret;
      if (!secret) {
        throw new Error("Falta webhook secret de pey");
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

    async obtenerCuentaBancaria(
      id: string,
    ): Promise<PeyCuentaBancariaResumen | null> {
      const apiKey = config.apiKey;
      if (!apiKey) {
        throw new Error("Falta API key de pey");
      }
      const response = await fetch(`https://api.pey.mx/bank-account/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`pey bank-account falló (${response.status})`);
      }
      const json: unknown = await response.json();
      return resumenCuentaBancaria(json);
    },
  };
}
