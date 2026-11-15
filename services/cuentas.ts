import { inicioDelDiaMexicoCity } from "@/lib/dia-mexico";
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
  mesero_nombre: string;
};

export type CuentaListaItem = CuentaRow & {
  mesero_nombre: string;
  pagado_consumo_centavos: number;
  restante_centavos: number;
};

export type ResumenMesas = {
  cobradoHoyCentavos: number;
  porCobrarCentavos: number;
  mesasAbiertas: number;
};

export { calcularEstadoCuenta };

export async function listarCuentasConResumen(): Promise<{
  cuentas: CuentaListaItem[];
  cerradasHoy: CuentaListaItem[];
  resumen: ResumenMesas;
}> {
  const supabase = createServiceClient();
  const inicioHoy = inicioDelDiaMexicoCity();

  const [
    { data: cuentas, error },
    { data: cerradas, error: cerradasError },
    { data: meseros, error: meserosError },
    { data: cobros, error: cobrosError },
    { data: cobrosHoy, error: hoyError },
  ] = await Promise.all([
    supabase
      .from("cuentas")
      .select("*")
      .is("cerrada_at", null)
      .order("mesa", { ascending: true }),
    supabase
      .from("cuentas")
      .select("*")
      .not("cerrada_at", "is", null)
      .gte("cerrada_at", inicioHoy.toISOString())
      .order("cerrada_at", { ascending: false }),
    supabase.from("meseros").select("id, nombre"),
    supabase
      .from("cobros")
      .select("cuenta_id, tipo, estado, monto_centavos")
      .eq("tipo", "consumo")
      .eq("estado", "pagado"),
    supabase
      .from("cobros")
      .select("monto_centavos")
      .eq("estado", "pagado")
      .gte("pagado_at", inicioHoy.toISOString()),
  ]);

  if (error || cerradasError || meserosError || cobrosError || hoyError) {
    throw new Error("No se pudieron listar las mesas");
  }

  const nombres = new Map((meseros ?? []).map((m) => [m.id, m.nombre] as const));
  const pagadoPorCuenta = new Map<string, number>();
  for (const c of cobros ?? []) {
    if (!c.cuenta_id) {
      continue;
    }
    pagadoPorCuenta.set(
      c.cuenta_id,
      (pagadoPorCuenta.get(c.cuenta_id) ?? 0) + c.monto_centavos,
    );
  }

  function aItem(cuenta: CuentaRow): CuentaListaItem {
    const pagado = pagadoPorCuenta.get(cuenta.id) ?? 0;
    return {
      ...cuenta,
      mesero_nombre: nombres.get(cuenta.mesero_id) ?? "Mesero",
      pagado_consumo_centavos: pagado,
      restante_centavos: Math.max(0, cuenta.total_centavos - pagado),
    };
  }

  const items = (cuentas ?? []).map(aItem);
  const cerradasHoy = (cerradas ?? []).map(aItem);

  const abiertas = items.filter((c) => c.estado !== "pagada");
  const resumen: ResumenMesas = {
    cobradoHoyCentavos: (cobrosHoy ?? []).reduce((s, c) => s + c.monto_centavos, 0),
    porCobrarCentavos: abiertas.reduce((s, c) => s + c.restante_centavos, 0),
    mesasAbiertas: abiertas.length,
  };

  return { cuentas: items, cerradasHoy, resumen };
}

export async function listarCuentas(): Promise<CuentaRow[]> {
  const { cuentas } = await listarCuentasConResumen();
  return cuentas;
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
    throw new Error("No se pudo leer la mesa");
  }
  if (!cuenta) {
    return null;
  }

  const [
    { data: partidas, error: partidasError },
    { data: cobros, error: cobrosError },
    { data: mesero, error: meseroError },
  ] = await Promise.all([
    supabase.from("partidas").select("*").eq("cuenta_id", cuentaId),
    supabase.from("cobros").select("*").eq("cuenta_id", cuentaId).order("created_at"),
    supabase
      .from("meseros")
      .select("nombre")
      .eq("id", cuenta.mesero_id)
      .maybeSingle(),
  ]);

  if (partidasError || cobrosError || meseroError) {
    throw new Error("No se pudo cargar el detalle de la mesa");
  }

  const pagadoConsumo = (cobros ?? [])
    .filter((cobro) => cobro.tipo === "consumo" && cobro.estado === "pagado")
    .reduce((suma, cobro) => suma + cobro.monto_centavos, 0);

  return {
    ...cuenta,
    partidas: partidas ?? [],
    cobros: cobros ?? [],
    pagado_consumo_centavos: pagadoConsumo,
    mesero_nombre: mesero?.nombre ?? "Mesero",
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
    throw new Error("No se pudo actualizar el estado de la mesa");
  }
  return estado;
}
