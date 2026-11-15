import { crearCobroApp } from "@/services/cobros";
import { obtenerCuenta } from "@/services/cuentas";
import type { Database } from "@/lib/supabase/types";
import { avanceDivision } from "@/services/dividir-avance";

export { avanceDivision };

type CobroRow = Database["public"]["Tables"]["cobros"]["Row"];

export async function dividirCuentaIgual(
  cuentaId: string,
  partes: number,
): Promise<CobroRow[]> {
  if (!Number.isInteger(partes) || partes < 2) {
    throw new Error("Se necesitan al menos 2 partes");
  }
  const cuenta = await obtenerCuenta(cuentaId);
  if (!cuenta) {
    throw new Error("Cuenta no encontrada");
  }
  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;
  if (restante <= 0) {
    throw new Error("Nada por cobrar");
  }

  const base = Math.floor(restante / partes);
  const sobra = restante - base * partes;
  const montos: number[] = Array.from({ length: partes }, (_, index) =>
    index === 0 ? base + sobra : base,
  ).filter((monto) => monto > 0);

  const cobros: CobroRow[] = [];
  for (let i = 0; i < montos.length; i += 1) {
    const monto = montos[i];
    if (monto === undefined) {
      continue;
    }
    const cobro = await crearCobroApp({
      cuentaId,
      meseroId: cuenta.mesero_id,
      tipo: "consumo",
      montoCentavos: monto,
      concepto: `Mesa ${cuenta.mesa} — parte ${i + 1} de ${montos.length}`,
    });
    cobros.push(cobro);
  }
  return cobros;
}

export async function dividirCuentaPorMontos(
  cuentaId: string,
  montosCentavos: number[],
): Promise<CobroRow[]> {
  if (montosCentavos.length < 2) {
    throw new Error("Se necesitan al menos 2 montos");
  }
  if (montosCentavos.some((m) => !Number.isInteger(m) || m <= 0)) {
    throw new Error("Montos inválidos");
  }
  const cuenta = await obtenerCuenta(cuentaId);
  if (!cuenta) {
    throw new Error("Cuenta no encontrada");
  }
  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;
  const suma = montosCentavos.reduce((a, b) => a + b, 0);
  if (suma !== restante) {
    throw new Error(`La suma debe ser exactamente ${restante} centavos`);
  }

  const cobros: CobroRow[] = [];
  for (let i = 0; i < montosCentavos.length; i += 1) {
    const monto = montosCentavos[i];
    if (monto === undefined) {
      continue;
    }
    const cobro = await crearCobroApp({
      cuentaId,
      meseroId: cuenta.mesero_id,
      tipo: "consumo",
      montoCentavos: monto,
      concepto: `Mesa ${cuenta.mesa} — parte ${i + 1} de ${montosCentavos.length}`,
    });
    cobros.push(cobro);
  }
  return cobros;
}
