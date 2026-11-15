import { getServerEnv } from "@/lib/env";
import { createMockPeyClient } from "@/lib/pey/mock";
import { createRealPeyClient } from "@/lib/pey/real";
import type { PeyClient } from "@/lib/pey/types";

export type {
  CrearCobroInput,
  CrearCobroResult,
  PeyClient,
  PeyWebhookPayload,
  VerificarWebhookResult,
} from "@/lib/pey/types";

export function getPeyClient(): PeyClient {
  const mode = getServerEnv().PEY_MODE;
  if (mode === "real") {
    return createRealPeyClient();
  }
  return createMockPeyClient();
}
