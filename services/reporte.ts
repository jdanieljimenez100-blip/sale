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
import { createServiceClient } from "@/lib/supabase/server";
import { traerTodo } from "@/lib/supabase/traer-todo";
import { formatearFechaPagoCdmx } from "@/lib/ticket";
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

type CobroReporteRow = {
  id: string;
  mesero_id: string | null;
  cuenta_id: string | null;
  tipo: "consumo" | "propina";
  monto_centavos: number;
  cobro_origen_id: string | null;
  created_at: string;
  pagado_at: string | null;
};

type CobroPagoRow = {
  cuenta_id: string | null;
  mesero_id: string | null;
  tipo: "consumo" | "propina";
  monto_centavos: number;
  pey_transaction_id: string | null;
  pagado_at: string | null;
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
  const desdeIso = desde.toISOString();

  const [cobros, meseros, negocio] = await Promise.all([
    traerTodo<CobroReporteRow>((from, to) =>
      supabase
        .from("cobros")
        .select(
          "id, mesero_id, cuenta_id, tipo, monto_centavos, cobro_origen_id, created_at, pagado_at",
        )
        .eq("negocio_id", negocioId)
        .eq("estado", "pagado")
        .gte("pagado_at", desdeIso)
        .range(from, to),
    ),
    traerTodo<{ id: string; nombre: string }>((from, to) =>
      supabase
        .from("meseros")
        .select("id, nombre")
        .eq("negocio_id", negocioId)
        .range(from, to),
    ),
    supabase
      .from("negocios")
      .select("reparto_cocina_pct")
      .eq("id", negocioId)
      .maybeSingle()
      .then((r) => r.data),
  ]);

  const cobroIds = cobros.filter((c) => c.tipo === "consumo").map((c) => c.id);
  const cuentaIds = [
    ...new Set(
      cobros
        .map((c) => c.cuenta_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  let resenas: ResenaSelect[] = [];
  if (cobroIds.length > 0) {
    resenas = await traerTodo<ResenaSelect>((from, to) =>
      supabase
        .from("resenas")
        .select("id, cobro_id, mesero_id, estrellas, comentario, created_at")
        .in("cobro_id", cobroIds)
        .range(from, to),
    );
  }

  let cuentas: Array<{ id: string; mesa: string }> = [];
  if (cuentaIds.length > 0) {
    cuentas = await traerTodo<{ id: string; mesa: string }>((from, to) =>
      supabase
        .from("cuentas")
        .select("id, mesa")
        .eq("negocio_id", negocioId)
        .in("id", cuentaIds)
        .range(from, to),
    );
  }

  const mesaPorCuenta = new Map(cuentas.map((c) => [c.id, c.mesa] as const));
  const mesaPorCobro = new Map(
    cobros
      .filter((c) => c.cuenta_id)
      .map((c) => [c.id, mesaPorCuenta.get(c.cuenta_id!) ?? null] as const),
  );

  const resenasConMesa: ResenaParaReporte[] = resenas.map((r) => ({
    ...r,
    mesa: mesaPorCobro.get(r.cobro_id) ?? null,
  }));

  const completo = calcularReporteDesempeno({
    rangoDias,
    desdeIso,
    cobros,
    resenas: resenasConMesa,
    meseros,
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
  const desdeIso = desde.toISOString();

  const [cobros, meseros] = await Promise.all([
    traerTodo<CobroPagoRow>((from, to) => {
      let q = supabase
        .from("cobros")
        .select(
          "cuenta_id, mesero_id, tipo, monto_centavos, pey_transaction_id, pagado_at",
        )
        .eq("negocio_id", negocioId)
        .eq("estado", "pagado")
        .gte("pagado_at", desdeIso)
        .order("pagado_at", { ascending: true });
      if (sesion.rol === "mesero") {
        q = q.eq("mesero_id", sesion.meseroId);
      }
      return q.range(from, to);
    }),
    traerTodo<{ id: string; nombre: string }>((from, to) =>
      supabase
        .from("meseros")
        .select("id, nombre")
        .eq("negocio_id", negocioId)
        .range(from, to),
    ),
  ]);

  const cuentaIds = [
    ...new Set(
      cobros
        .map((c) => c.cuenta_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  let cuentas: Array<{ id: string; mesa: string }> = [];
  if (cuentaIds.length > 0) {
    cuentas = await traerTodo<{ id: string; mesa: string }>((from, to) =>
      supabase
        .from("cuentas")
        .select("id, mesa")
        .eq("negocio_id", negocioId)
        .in("id", cuentaIds)
        .range(from, to),
    );
  }

  const mesaPorCuenta = new Map(cuentas.map((c) => [c.id, c.mesa] as const));
  const nombrePorMesero = new Map(
    meseros.map((m) => [m.id, m.nombre] as const),
  );

  return cobros.map((c) => {
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
