import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { DEMO_TOKEN_HEADER, demoTokenValido } from "@/lib/demo-auth";
import { getServerEnv } from "@/lib/env";
import { pesosDesdePey } from "@/lib/pey/money-bridge";
import type { PeyWebhookPayload } from "@/lib/pey";
import { createServiceClient } from "@/lib/supabase/server";
import {
  aplicarPagoWebhook,
  obtenerCobroPorPeyQrId,
} from "@/services/cobros";
import { obtenerConfigPey } from "@/services/pey-config";

export type WebhookPeyResult =
  | { status: 200; body: { ok: true; applied: boolean; cobroId: string | null } }
  | { status: 200; body: { ok: true; ignored: true } }
  | { status: 400 | 401 | 500; body: { error: string } };

type PayloadVerificado = {
  eventId: string;
  payload: Record<string, unknown>;
};

function esCobroNoEncontrado(message: string): boolean {
  return /cobro no encontrado/i.test(message);
}

function leerTipo(payload: Record<string, unknown>): string | null {
  return typeof payload.type === "string" ? payload.type : null;
}

function comoPeyPayment(
  payload: Record<string, unknown>,
): PeyWebhookPayload | null {
  if (
    typeof payload.codiQrId !== "string" ||
    typeof payload.transactionId !== "string" ||
    typeof payload.amount !== "number" ||
    typeof payload.apiKeyId !== "string" ||
    typeof payload.concept !== "string" ||
    typeof payload.datePaid !== "number" ||
    typeof payload.type !== "string"
  ) {
    return null;
  }
  return {
    amount: payload.amount,
    apiKeyId: payload.apiKeyId,
    bankAccountId:
      typeof payload.bankAccountId === "string"
        ? payload.bankAccountId
        : undefined,
    codiQrId: payload.codiQrId,
    concept: payload.concept,
    datePaid: payload.datePaid,
    numRef: typeof payload.numRef === "string" ? payload.numRef : undefined,
    transactionId: payload.transactionId,
    type: payload.type,
  };
}

async function verificarConSecreto(
  secret: string,
  request: Request,
): Promise<PayloadVerificado> {
  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const wh = new Webhook(secret);
  wh.verify(rawBody, headers);
  const parsed: unknown = JSON.parse(rawBody);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Payload de webhook pey incompleto");
  }
  const eventId = request.headers.get("webhook-id");
  if (!eventId) {
    throw new Error("Falta header webhook-id");
  }
  return { eventId, payload: parsed as Record<string, unknown> };
}

async function verificarMock(request: Request): Promise<PayloadVerificado> {
  if (!demoTokenValido(request.headers.get(DEMO_TOKEN_HEADER))) {
    throw new Error("Webhook mock sin token de demo válido");
  }
  const rawBody = await request.text();
  const parsed: unknown = JSON.parse(rawBody);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Webhook mock incompleto");
  }
  const payload = parsed as Record<string, unknown>;
  const tx =
    typeof payload.transactionId === "string" ? payload.transactionId : "x";
  const eventId =
    request.headers.get("webhook-id") ?? `mock_event_${tx}`;
  return { eventId, payload };
}

async function registrarWebhookOk(
  negocioId: string,
  apiKeyId: string | undefined,
): Promise<"ok" | "api_key_mismatch"> {
  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from("negocios")
    .select("pey_api_key_id")
    .eq("id", negocioId)
    .maybeSingle();

  if (
    row?.pey_api_key_id &&
    apiKeyId &&
    row.pey_api_key_id !== apiKeyId
  ) {
    return "api_key_mismatch";
  }

  await supabase
    .from("negocios")
    .update({ pey_webhook_ultimo_at: new Date().toISOString() })
    .eq("id", negocioId);

  // Solo setea apiKeyId la primera vez (WHERE pey_api_key_id IS NULL)
  if (!row?.pey_api_key_id && apiKeyId) {
    await supabase
      .from("negocios")
      .update({ pey_api_key_id: apiKeyId })
      .eq("id", negocioId)
      .is("pey_api_key_id", null);
  }

  return "ok";
}

async function aplicarPagoSiCorresponde(args: {
  eventId: string;
  payload: PeyWebhookPayload;
  negocioId: string;
  logTag: string;
}): Promise<WebhookPeyResult> {
  const cobro = await obtenerCobroPorPeyQrId(args.payload.codiQrId);
  if (!cobro || cobro.negocio_id !== args.negocioId) {
    console.info(args.logTag, {
      peyQrId: args.payload.codiQrId,
      applied: false,
      reason: "cobro_desconocido",
    });
    return {
      status: 200,
      body: { ok: true, applied: false, cobroId: null },
    };
  }

  const amountCentavos = pesosDesdePey(args.payload.amount);
  if (amountCentavos !== cobro.monto_centavos) {
    console.info(args.logTag, {
      peyQrId: args.payload.codiQrId,
      amountCentavos,
      applied: false,
      reason: "monto_mismatch",
    });
    return {
      status: 200,
      body: { ok: true, applied: false, cobroId: cobro.id },
    };
  }

  const result = await aplicarPagoWebhook({
    eventId: args.eventId,
    payload: args.payload,
    negocioId: args.negocioId,
  });
  console.info(args.logTag, {
    peyQrId: args.payload.codiQrId,
    amountCentavos,
    applied: result.applied,
  });
  return { status: 200, body: { ok: true, ...result } };
}

function errorAuthOPayload(error: unknown, logTag: string): WebhookPeyResult {
  const message = error instanceof Error ? error.message : "webhook inválido";
  if (
    /Falta PEY_WEBHOOK_SECRET|PEY_MODE=real requiere|Invalid environment|Variables de entorno inválidas|env inválido|SUPABASE_SERVICE_ROLE|Falta webhook secret|Faltan PEY_API_KEY|Falta PEY_SECRETS_KEY|Negocio no encontrado/i.test(
      message,
    )
  ) {
    console.error(logTag, "config_fail");
    return { status: 500, body: { error: "Configuración de pey incompleta" } };
  }
  if (
    error instanceof WebhookVerificationError ||
    /firma|signature|token de demo|Missing required headers|Webhook mock sin token|Webhook no auténtico/i.test(
      message,
    )
  ) {
    console.error(logTag, "auth_fail");
    return { status: 401, body: { error: "Webhook no auténtico" } };
  }
  console.error(logTag, "payload_fail");
  return { status: 400, body: { error: message } };
}

async function despacharEvento(args: {
  eventId: string;
  payload: Record<string, unknown>;
  negocioId: string;
  logTag: string;
}): Promise<WebhookPeyResult> {
  const tipo = leerTipo(args.payload);
  const apiKeyId =
    typeof args.payload.apiKeyId === "string"
      ? args.payload.apiKeyId
      : undefined;

  const reg = await registrarWebhookOk(args.negocioId, apiKeyId);
  if (reg === "api_key_mismatch") {
    console.error(args.logTag, "auth_fail");
    return { status: 401, body: { error: "Webhook no auténtico" } };
  }

  if (tipo === "codi.qr.payment_received") {
    const payment = comoPeyPayment(args.payload);
    if (!payment) {
      return { status: 400, body: { error: "Payload de webhook pey incompleto" } };
    }
    return aplicarPagoSiCorresponde({
      eventId: args.eventId,
      payload: payment,
      negocioId: args.negocioId,
      logTag: args.logTag,
    });
  }

  // bank.account.updated y cualquier otro tipo documentado/no manejado
  return { status: 200, body: { ok: true, ignored: true } };
}

/**
 * Webhook legacy: solo restaurantes con `usa_pey_entorno` (demo / env).
 */
export async function procesarWebhookPey(
  request: Request,
): Promise<WebhookPeyResult> {
  const logTag = "[webhook/pey]";
  const supabase = createServiceClient();
  const { data: negocio } = await supabase
    .from("negocios")
    .select("id")
    .eq("usa_pey_entorno", true)
    .order("slug", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!negocio) {
    console.error(logTag, "auth_fail");
    return { status: 401, body: { error: "Webhook no auténtico" } };
  }

  let verified: PayloadVerificado;
  try {
    const mode = getServerEnv().PEY_MODE;
    if (mode === "mock") {
      verified = await verificarMock(request);
    } else {
      const config = await obtenerConfigPey(negocio.id);
      verified = await verificarConSecreto(config.webhookSecret, request);
    }
  } catch (error) {
    return errorAuthOPayload(error, logTag);
  }

  try {
    return await despacharEvento({
      eventId: verified.eventId,
      payload: verified.payload,
      negocioId: negocio.id,
      logTag,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db error";
    if (esCobroNoEncontrado(message)) {
      return {
        status: 200,
        body: { ok: true, applied: false, cobroId: null },
      };
    }
    console.error(logTag, "db_fail");
    return { status: 500, body: { error: "Error de base de datos" } };
  }
}

/**
 * Webhook por restaurante: firma con el secreto cifrado de ese negocio.
 * Negocio inválido o sin secreto → 401 genérico (no revelar existencia).
 */
export async function procesarWebhookPeyNegocio(
  request: Request,
  negocioId: string,
): Promise<WebhookPeyResult> {
  const logTag = "[webhook/pey/negocio]";
  const uuidOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      negocioId,
    );
  if (!uuidOk) {
    console.error(logTag, "auth_fail");
    return { status: 401, body: { error: "Webhook no auténtico" } };
  }

  const supabase = createServiceClient();
  const { data: negocio } = await supabase
    .from("negocios")
    .select("id, pey_webhook_secret_cifrado, usa_pey_entorno")
    .eq("id", negocioId)
    .maybeSingle();

  if (!negocio) {
    console.error(logTag, "auth_fail");
    return { status: 401, body: { error: "Webhook no auténtico" } };
  }

  let verified: PayloadVerificado;
  try {
    const mode = getServerEnv().PEY_MODE;
    if (mode === "mock" && !negocio.pey_webhook_secret_cifrado) {
      // Mock sin llaves propias: solo si usa entorno (mismo token demo)
      if (!negocio.usa_pey_entorno) {
        console.error(logTag, "auth_fail");
        return { status: 401, body: { error: "Webhook no auténtico" } };
      }
      verified = await verificarMock(request);
    } else if (!negocio.pey_webhook_secret_cifrado && !negocio.usa_pey_entorno) {
      console.error(logTag, "auth_fail");
      return { status: 401, body: { error: "Webhook no auténtico" } };
    } else {
      const config = await obtenerConfigPey(negocioId);
      if (mode === "mock") {
        // En mock preferimos token demo; si hay secreto cifrado igual se puede usar
        verified = await verificarMock(request);
      } else {
        verified = await verificarConSecreto(config.webhookSecret, request);
      }
    }
  } catch (error) {
    return errorAuthOPayload(error, logTag);
  }

  try {
    return await despacharEvento({
      eventId: verified.eventId,
      payload: verified.payload,
      negocioId,
      logTag,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "db error";
    if (esCobroNoEncontrado(message)) {
      return {
        status: 200,
        body: { ok: true, applied: false, cobroId: null },
      };
    }
    console.error(logTag, "db_fail");
    return { status: 500, body: { error: "Error de base de datos" } };
  }
}
