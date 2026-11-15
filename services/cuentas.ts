import { createServiceClient } from "@/lib/supabase/server";
import type { EstadoCuenta, Database } from "@/lib/supabase/types";
import { calcularEstadoCuenta } from "@/services/cuenta-estado";

export type CuentaRow = Database["public"]["Tables"]["cuentas"]["Row"];
export type PartidaRow = Database["public"]["Tables"]["partidas"]["Row"];
export type CobroRow = Database["public"]["Tables"]["cobros"]["Row"];

export type CuentaConDetalle = CuentaRow & {
  partidas: PartidaRow[];
  cobros: CobroRow[];
  pagado_consumo_centavos: number;
};

export { calcularEstadoCuenta };

export async function listarCuentas(): Promise<CuentaRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cuentas")
    .select("*")
    .order("mesa", { ascending: true });
  if (error) {
    throw new Error(`No se pudieron listar cuentas: ${error.message}`);
  }
  return data;
}

export async function obtenerCuenta(
  cuentaId: string,
): Promise<CuentaConDetalle | null> {
  const supabase = createServiceClient();
  const { data: cuenta, error } = await supabase
    .from("cuentas")
    .select("*")
    .eq("id", cuentaId)
    .maybeSingle();
  if (error) {
    throw new Error(`No se pudo leer la cuenta: ${error.message}`);
  }
  if (!cuenta) {
    return null;
  }

  const [{ data: partidas, error: partidasError }, { data: cobros, error: cobrosError }] =
    await Promise.all([
      supabase.from("partidas").select("*").eq("cuenta_id", cuentaId),
      supabase.from("cobros").select("*").eq("cuenta_id", cuentaId),
    ]);

  if (partidasError) {
    throw new Error(`No se pudieron leer partidas: ${partidasError.message}`);
  }
  if (cobrosError) {
    throw new Error(`No se pudieron leer cobros: ${cobrosError.message}`);
  }

  const pagadoConsumo = (cobros ?? [])
    .filter((cobro) => cobro.tipo === "consumo" && cobro.estado === "pagado")
    .reduce((suma, cobro) => suma + cobro.monto_centavos, 0);

  return {
    ...cuenta,
    partidas: partidas ?? [],
    cobros: cobros ?? [],
    pagado_consumo_centavos: pagadoConsumo,
  };
}

export async function recalcularEstadoCuenta(cuentaId: string): Promise<EstadoCuenta> {
  const detalle = await obtenerCuenta(cuentaId);
  if (!detalle) {
    throw new Error("Cuenta no encontrada");
  }
  const estado = calcularEstadoCuenta(
    detalle.total_centavos,
    detalle.pagado_consumo_centavos,
  );
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("sale_set_cuenta_estado", {
    p_cuenta_id: cuentaId,
    p_estado: estado,
  });
  if (error) {
    throw new Error(`No se pudo actualizar estado: ${error.message}`);
  }
  return estado;
}
