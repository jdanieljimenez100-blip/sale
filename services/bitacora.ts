import { createServiceClient } from "@/lib/supabase/server";

/** Últimos 4 chars de un ULID pey (nunca el completo en bitácora). */
export function peyUlidUltimos4(ulid: string | null | undefined): string | null {
  if (!ulid || ulid.length < 4) {
    return ulid ?? null;
  }
  return ulid.slice(-4);
}

/**
 * Registra una acción sensible. Si falla, no tumba la petición.
 */
export async function registrarBitacora(
  meseroId: string | null,
  accion: string,
  detalle: Record<string, unknown> = {},
  negocioId: string | null = null,
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("bitacora").insert({
      mesero_id: meseroId,
      accion,
      detalle,
      negocio_id: negocioId,
    });
    if (error) {
      console.error("[bitacora]", accion, error.message);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    console.error("[bitacora]", accion, msg);
  }
}
