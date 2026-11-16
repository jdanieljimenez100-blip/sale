import { getServerEnv } from "@/lib/env";
import { createMockPeyClient } from "@/lib/pey/mock";
import { createRealPeyClient } from "@/lib/pey/real";
import type { PeyClient, PeyClientCredentials } from "@/lib/pey/types";
import { obtenerConfigPey } from "@/services/pey-config";

export type {
  CrearCobroInput,
  CrearCobroResult,
  PeyClient,
  PeyClientCredentials,
  PeyCuentaBancariaResumen,
  PeyWebhookPayload,
  VerificarWebhookResult,
} from "@/lib/pey/types";

export function createRealPeyClientFromConfig(
  config: PeyClientCredentials,
): PeyClient {
  return createRealPeyClient(config);
}

/**
 * Cliente pey del restaurante. En mock no usa credenciales reales.
 * En real resuelve llaves por negocio (DB cifrada o env si usa_pey_entorno).
 */
export async function getPeyClient(negocioId: string): Promise<PeyClient> {
  const mode = getServerEnv().PEY_MODE;
  if (mode !== "real") {
    return createMockPeyClient();
  }
  const config = await obtenerConfigPey(negocioId);
  return createRealPeyClient({
    apiKey: config.apiKey,
    webhookSecret: config.webhookSecret,
  });
}
