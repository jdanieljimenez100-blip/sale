import { HttpError } from "@/lib/api-error";

/**
 * Compara el negocio del recurso con el de la sesión.
 * Devuelve 404 genérico para no filtrar existencia entre restaurantes.
 */
export function assertMismoNegocio(
  negocioIdDelRecurso: string | null | undefined,
  sesionNegocioId: string,
): void {
  if (!negocioIdDelRecurso || negocioIdDelRecurso !== sesionNegocioId) {
    throw new HttpError("No encontrado", 404);
  }
}
