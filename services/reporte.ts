import {
  inicioRangoMexicoCity,
  type RangoReporteDias,
} from "@/lib/dia-mexico";
import type { RolSesion } from "@/lib/auth/sesion";
import {
  calcularReporteDesempeno,
  filtrarReportePorSesion,
  type ReporteDesempeno,
  type ResenaParaReporte,
} from "@/lib/reporte";
import { formatearFechaPagoCdmx } from "@/lib/ticket";
import { createServiceClient } from "@/lib/supabase/server";
import { peyUlidUltimos4 } from "@/services/bitacora";

export type {
  FilaMeseroReporte,
  ReporteDesempeno,
  ResenaResumen,
} from "@/lib/reporte";

export {
  calcularReporteDesempeno,
  filtrarReportePorSesion,
  formatearDecimal1,
  formatearPct1,
  formatearSegundosPromedio,
  ratioONull,
} from "@/lib/reporte";

export type PagoReporteFila = {
  hora: string;
  mesa: string;
  mesero: string;
  tipo: "consumo" | "propina";
  montoCentavos: number;
  peyUltimos4: string | null;
};

type ResenaSelect = {
  id: string;
  cobro_id: string;
  mesero_id: string;
  estrellas: number;
  comentario: string | null;
  created_at: string;
};

export async function obtenerReporteDesempeno(
  rangoDias: RangoReporteDias,
  sesion: { meseroId: string; rol: RolSesion; negocioId: string },
): Promise<ReporteDesempeno> {
  const desde = inicioRangoMexicoCity(rangoDias);
  const supabase = createServiceClient();
  const negocioId = sesion.negocioId;

  const [
    { data: cobros, error: cobrosError },
    { data: meseros, error: meserosError },
    { data: negocio },
  ] = await Promise.all([
    supabase
      .from("cobros")
      .select(
        "id, mesero_id, cuenta_id, tipo, monto_centavos, cobro_origen_id, created_at, pagado_at",
      )
      .eq("negocio_id", negocioId)
      .eq("estado", "pagado")
      .gte("pagado_at", desde.toISOString()),
    supabase
      .from("meseros")
      .select("id, nombre")
      .eq("negocio_id", negocioId),
    supabase
      .from("negocios")
      .select("reparto_cocina_pct")
      .eq("id", negocioId)
      .maybeSingle(),
  ]);

  if (cobrosError || meserosError) {
    throw new Error("No se pudo armar el reporte");
  }

  const lista = cobros ?? [];
  const cobroIds = lista.filter((c) => c.tipo === "consumo").map((c) => c.id);
  const cuentaIds = [
    ...new Set(
      lista
        .map((c) => c.cuenta_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  let resenas: ResenaSelect[] = [];
  if (cobroIds.length > 0) {
    const { data } = await supabase
      .from("resenas")
      .select("id, cobro_id, mesero_id, estrellas, comentario, created_at")
      .in("cobro_id", cobroIds);
    resenas = data ?? [];
  }

  let cuentas: Array<{ id: string; mesa: string }> = [];
  if (cuentaIds.length > 0) {
    const { data } = await supabase
      .from("cuentas")
      .select("id, mesa")
      .eq("negocio_id", negocioId)
      .in("id", cuentaIds);
    cuentas = data ?? [];
  }

  const mesaPorCuenta = new Map(cuentas.map((c) => [c.id, c.mesa] as const));
  const mesaPorCobro = new Map(
    lista
      .filter((c) => c.cuenta_id)
      .map((c) => [c.id, mesaPorCuenta.get(c.cuenta_id!) ?? null] as const),
  );

  const resenasConMesa: ResenaParaReporte[] = resenas.map((r) => ({
    ...r,
    mesa: mesaPorCobro.get(r.cobro_id) ?? null,
  }));

  const completo = calcularReporteDesempeno({
    rangoDias,
    desdeIso: desde.toISOString(),
    cobros: lista,
    resenas: resenasConMesa,
    meseros: meseros ?? [],
    repartoCocinaPct: negocio?.reparto_cocina_pct ?? 0,
  });
  return filtrarReportePorSesion(completo, sesion);
}

/** Cobros pagados en el rango (CDMX), listos para exportar o imprimir. */
export async function listarPagosRango(
  rangoDias: RangoReporteDias,
  sesion: { meseroId: string; rol: RolSesion; negocioId: string },
): Promise<PagoReporteFila[]> {
  const desde = inicioRangoMexicoCity(rangoDias);
  const supabase = createServiceClient();
  const negocioId = sesion.negocioId;

  let query = supabase
    .from("cobros")
    .select(
      "cuenta_id, mesero_id, tipo, monto_centavos, pey_transaction_id, pagado_at",
    )
    .eq("negocio_id", negocioId)
    .eq("estado", "pagado")
    .gte("pagado_at", desde.toISOString())
    .order("pagado_at", { ascending: true });

  if (sesion.rol === "mesero") {
    query = query.eq("mesero_id", sesion.meseroId);
  }

  const [{ data: cobros, error: cobrosError }, { data: meseros, error: meserosError }] =
    await Promise.all([
      query,
      supabase
        .from("meseros")
        .select("id, nombre")
        .eq("negocio_id", negocioId),
    ]);

  if (cobrosError || meserosError) {
    throw new Error("No se pudo listar los pagos del reporte");
  }

  const lista = cobros ?? [];
  const cuentaIds = [
    ...new Set(
      lista
        .map((c) => c.cuenta_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  let cuentas: Array<{ id: string; mesa: string }> = [];
  if (cuentaIds.length > 0) {
    const { data } = await supabase
      .from("cuentas")
      .select("id, mesa")
      .eq("negocio_id", negocioId)
      .in("id", cuentaIds);
    cuentas = data ?? [];
  }

  const mesaPorCuenta = new Map(cuentas.map((c) => [c.id, c.mesa] as const));
  const nombrePorMesero = new Map(
    (meseros ?? []).map((m) => [m.id, m.nombre] as const),
  );

  return lista.map((c) => {
    const mesaLabel =
      c.cuenta_id == null
        ? "Cobro rápido"
        : (mesaPorCuenta.get(c.cuenta_id) ?? "—");
    const meseroNombre =
      c.mesero_id == null
        ? "—"
        : (nombrePorMesero.get(c.mesero_id) ?? "Mesero");
    return {
      hora: c.pagado_at ? formatearFechaPagoCdmx(c.pagado_at) : "—",
      mesa: mesaLabel,
      mesero: meseroNombre,
      tipo: c.tipo,
      montoCentavos: c.monto_centavos,
      peyUltimos4: peyUlidUltimos4(c.pey_transaction_id),
    };
  });
}
