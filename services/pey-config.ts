import { HttpError } from "@/lib/api-error";
import { getServerEnv } from "@/lib/env";
import { descifrarSecreto } from "@/lib/secretos";
import { createServiceClient } from "@/lib/supabase/server";

export type FuentePey = "base" | "entorno" | "falta";

export type ConfigPey = {
  apiKey: string;
  webhookSecret: string;
  bankAccountRestaurante: string | undefined;
  apiKeyId: string | null;
  fuente: "base" | "entorno";
  usaPeyEntorno: boolean;
  peyApiKeyUltimos4: string | null;
  peyWebhookUltimoAt: string | null;
  peyBankAccountId: string | null;
  peyBankAccountCodiStatus: string | null;
};

/**
 * Regla pura: ¿llaves propias del negocio, entorno demo, o falta conectar?
 * El caller debe lanzar HttpError 409 si el resultado es `"falta"`.
 */
export function decidirFuentePey(input: {
  tieneLlaves: boolean;
  usaPeyEntorno: boolean;
}): FuentePey {
  if (input.tieneLlaves) {
    return "base";
  }
  if (input.usaPeyEntorno) {
    return "entorno";
  }
  return "falta";
}

export function aadPey(negocioId: string, campo: "apiKey" | "webhookSecret"): string {
  return `${negocioId}:${campo}`;
}

/**
 * Resuelve credenciales pey del restaurante (cifradas en DB o env demo).
 * Lanza HttpError 409 si el negocio aún no conectó pey.
 */
export async function obtenerConfigPey(negocioId: string): Promise<ConfigPey> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("negocios")
    .select(
      "id, pey_api_key_cifrada, pey_webhook_secret_cifrado, pey_api_key_ultimos4, pey_api_key_id, pey_webhook_ultimo_at, usa_pey_entorno, pey_bank_account_id, pey_bank_account_codi_status",
    )
    .eq("id", negocioId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Negocio no encontrado");
  }

  const tieneLlaves = Boolean(
    data.pey_api_key_cifrada && data.pey_webhook_secret_cifrado,
  );
  const fuente = decidirFuentePey({
    tieneLlaves,
    usaPeyEntorno: data.usa_pey_entorno,
  });
  if (fuente === "falta") {
    throw new HttpError("Conecta pey en Ajustes antes de cobrar", 409);
  }

  const env = getServerEnv();

  if (fuente === "base") {
    const apiKeyCifrada = data.pey_api_key_cifrada;
    const secretCifrado = data.pey_webhook_secret_cifrado;
    if (!apiKeyCifrada || !secretCifrado) {
      throw new HttpError("Conecta pey en Ajustes antes de cobrar", 409);
    }
    return {
      apiKey: descifrarSecreto(apiKeyCifrada, aadPey(negocioId, "apiKey")),
      webhookSecret: descifrarSecreto(
        secretCifrado,
        aadPey(negocioId, "webhookSecret"),
      ),
      bankAccountRestaurante:
        data.pey_bank_account_id ?? undefined,
      apiKeyId: data.pey_api_key_id,
      fuente: "base",
      usaPeyEntorno: data.usa_pey_entorno,
      peyApiKeyUltimos4: data.pey_api_key_ultimos4,
      peyWebhookUltimoAt: data.pey_webhook_ultimo_at,
      peyBankAccountId: data.pey_bank_account_id,
      peyBankAccountCodiStatus: data.pey_bank_account_codi_status,
    };
  }

  const apiKey = env.PEY_API_KEY;
  const webhookSecret = env.PEY_WEBHOOK_SECRET;
  if (!apiKey || !webhookSecret) {
    throw new Error("Faltan PEY_API_KEY o PEY_WEBHOOK_SECRET en el entorno");
  }

  return {
    apiKey,
    webhookSecret,
    bankAccountRestaurante:
      data.pey_bank_account_id ?? env.PEY_BANK_ACCOUNT_RESTAURANTE ?? undefined,
    apiKeyId: data.pey_api_key_id,
    fuente: "entorno",
    usaPeyEntorno: data.usa_pey_entorno,
    peyApiKeyUltimos4: data.pey_api_key_ultimos4,
    peyWebhookUltimoAt: data.pey_webhook_ultimo_at,
    peyBankAccountId: data.pey_bank_account_id,
    peyBankAccountCodiStatus: data.pey_bank_account_codi_status,
  };
}
