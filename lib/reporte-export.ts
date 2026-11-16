/**
 * Helpers puros para exportar reportes a CSV (Excel).
 * Guarda contra inyección de fórmulas y usa BOM UTF-8 para acentos.
 */

const PREFIJOS_FORMULA = new Set(["=", "+", "-", "@", "\t", "\r", "\n"]);

/** Convierte un valor a celda CSV segura (sin fórmulas). */
export function celdaCsv(valor: string | number | null | undefined): string {
  let texto = valor == null ? "" : String(valor);
  if (texto.length > 0 && PREFIJOS_FORMULA.has(texto[0]!)) {
    texto = `'${texto}`;
  }
  const necesitaComillas =
    texto.includes(",") ||
    texto.includes('"') ||
    texto.includes("\n") ||
    texto.includes("\r");
  if (necesitaComillas) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Une encabezados y filas en CSV con `\r\n` y BOM `\uFEFF` para Excel.
 */
export function filasACsv(
  encabezados: readonly string[],
  filas: readonly (readonly (string | number | null | undefined)[])[],
): string {
  const lineas: string[] = [];
  lineas.push(encabezados.map(celdaCsv).join(","));
  for (const fila of filas) {
    lineas.push(fila.map(celdaCsv).join(","));
  }
  return `\uFEFF${lineas.join("\r\n")}`;
}

/**
 * Centavos enteros → texto "123.45" (punto, 2 decimales).
 * Solo división entera y resto; sin flotantes.
 */
export function centavosATextoPesos(centavos: number): string {
  if (!Number.isInteger(centavos)) {
    throw new Error("El monto debe ser un entero en centavos");
  }
  if (centavos < 0) {
    throw new Error("El monto no puede ser negativo");
  }
  const enteros = Math.floor(centavos / 100);
  const frac = centavos % 100;
  return `${enteros}.${String(frac).padStart(2, "0")}`;
}
