import { HttpError } from "@/lib/api-error";
import { getPeyClient } from "@/lib/pey";
import { cifrarSecreto } from "@/lib/secretos";
import { createServiceClient } from "@/lib/supabase/server";
import { peyUlidUltimos4, registrarBitacora } from "@/services/bitacora";
import { aadPey } from "@/services/pey-config";

export type NegocioPeyPublico = {
  configurado: boolean;
  apiKeyUltimos4: string | null;
  webhookUrl: string;
  ultimoWebhookAt: string | null;
  cuentaRestaurante: {
    ultimos4: string | null;
    codiStatus: string | null;
  };
};

export async function obtenerPeyPublico(
  negocioId: string,
  origin: string,
): Promise<NegocioPeyPublico> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("negocios")
    .select(
      "pey_api_key_cifrada, pey_webhook_secret_cifrado, pey_api_key_ultimos4, pey_webhook_ultimo_at, pey_bank_account_id, pey_bank_account_codi_status, usa_pey_entorno",
    )
    .eq("id", negocioId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Negocio no encontrado");
  }

  const configurado = Boolean(
    (data.pey_api_key_cifrada && data.pey_webhook_secret_cifrado) ||
      data.usa_pey_entorno,
  );

  return {
    configurado,
    apiKeyUltimos4: data.pey_api_key_ultimos4,
    webhookUrl: `${origin}/api/webhooks/pey/${negocioId}`,
    ultimoWebhookAt: data.pey_webhook_ultimo_at,
    cuentaRestaurante: {
      ultimos4: peyUlidUltimos4(data.pey_bank_account_id),
      codiStatus: data.pey_bank_account_codi_status,
    },
  };
}

export async function actualizarPeyNegocio(input: {
  negocioId: string;
  actorMeseroId: string;
  origin: string;
  apiKey?: string;
  webhookSecret?: string;
  bankAccountId?: string;
}): Promise<NegocioPeyPublico> {
  const supabase = createServiceClient();
  const { data: actual, error: readError } = await supabase
    .from("negocios")
    .select("pey_api_key_cifrada, pey_webhook_secret_cifrado, usa_pey_entorno")
    .eq("id", input.negocioId)
    .maybeSingle();

  if (readError || !actual) {
    throw new Error("Negocio no encontrado");
  }

  const update: {
    pey_api_key_cifrada?: string;
    pey_webhook_secret_cifrado?: string;
    pey_api_key_ultimos4?: string;
    pey_api_key_id?: string | null;
    pey_bank_account_id?: string;
    pey_bank_account_codi_status?: string | null;
  } = {};

  let apiKeyUltimos4Bitacora: string | null = null;

  if (input.apiKey !== undefined) {
    update.pey_api_key_cifrada = cifrarSecreto(
      input.apiKey,
      aadPey(input.negocioId, "apiKey"),
    );
    update.pey_api_key_ultimos4 = input.apiKey.slice(-4);
    update.pey_api_key_id = null;
    apiKeyUltimos4Bitacora = update.pey_api_key_ultimos4;
  }

  if (input.webhookSecret !== undefined) {
    update.pey_webhook_secret_cifrado = cifrarSecreto(
      input.webhookSecret,
      aadPey(input.negocioId, "webhookSecret"),
    );
  }

  // Persistir llaves antes de verificar bank account (el cliente las necesita)
  if (Object.keys(update).length > 0) {
    const { error: keysError } = await supabase
      .from("negocios")
      .update(update)
      .eq("id", input.negocioId);
    if (keysError) {
      throw new Error("No se pudo guardar la configuración de pey");
    }
  }

  if (input.bankAccountId !== undefined) {
    const tieneLlavesTrasUpdate = Boolean(
      (input.apiKey ?? actual.pey_api_key_cifrada) &&
        (input.webhookSecret ?? actual.pey_webhook_secret_cifrado),
    );
    if (!tieneLlavesTrasUpdate && !actual.usa_pey_entorno) {
      throw new HttpError("Conecta pey en Ajustes antes de cobrar", 409);
    }

    const pey = await getPeyClient(input.negocioId);
    const cuenta = await pey.obtenerCuentaBancaria(input.bankAccountId);
    if (!cuenta) {
      throw new HttpError("Esa cuenta no pertenece a esta API key", 400);
    }

    const { error: bankError } = await supabase
      .from("negocios")
      .update({
        pey_bank_account_id: input.bankAccountId,
        pey_bank_account_codi_status: cuenta.codiStatus,
      })
      .eq("id", input.negocioId);
    if (bankError) {
      throw new Error("No se pudo guardar la cuenta pey del restaurante");
    }
  }

  if (apiKeyUltimos4Bitacora) {
    await registrarBitacora(
      input.actorMeseroId,
      "pey_llaves_actualizar",
      { apiKeyUltimos4: apiKeyUltimos4Bitacora },
      input.negocioId,
    );
  }

  return obtenerPeyPublico(input.negocioId, input.origin);
}
