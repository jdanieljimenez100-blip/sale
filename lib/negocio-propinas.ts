/** Validación pura de configuración de propinas del negocio. */

export function validarPropinaPorcentajes(valores: number[]): number[] {
  if (!Array.isArray(valores) || valores.length < 1 || valores.length > 3) {
    throw new Error("Elige entre 1 y 3 porcentajes");
  }
  const limpios: number[] = [];
  for (const v of valores) {
    if (!Number.isInteger(v) || v < 1 || v > 50) {
      throw new Error("Cada porcentaje debe ser un entero entre 1 y 50");
    }
    limpios.push(v);
  }
  return limpios;
}

export function validarRepartoCocinaPct(pct: number): number {
  if (!Number.isInteger(pct) || pct < 0 || pct > 50) {
    throw new Error("El % de cocina debe ser un entero entre 0 y 50");
  }
  return pct;
}
