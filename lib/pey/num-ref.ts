/**
 * pey exige numRef con ^[0-9]{1,7}$ (docs.pey.mx → Create QR).
 * Toma solo los dígitos del texto y conserva los últimos 7.
 * Si no queda ningún dígito, devuelve undefined y el campo se omite.
 */
export function normalizarNumRef(texto: string | undefined): string | undefined {
  if (!texto) {
    return undefined;
  }
  const digitos = texto.replace(/\D/g, "").slice(-7);
  return digitos.length > 0 ? digitos : undefined;
}
