import type { RangoReporteDias } from "@/lib/dia-mexico";

export type CobroParaReporte = {
  id: string;
  mesero_id: string | null;
  cuenta_id: string | null;
  tipo: "consumo" | "propina";
  monto_centavos: number;
  cobro_origen_id: string | null;
  created_at: string;
  pagado_at: string | null;
};

export type ResenaParaReporte = {
  id: string;
  cobro_id: string;
  mesero_id: string;
  estrellas: number;
  comentario: string | null;
  created_at: string;
  mesa: string | null;
};

export type MeseroNombre = { id: string; nombre: string };

export type ResenaResumen = {
  id: string;
  estrellas: number;
  comentario: string | null;
  createdAt: string;
  mesa: string | null;
};

export type FilaMeseroReporte = {
  meseroId: string;
  nombre: string;
  ventasCentavos: number;
  pagosAtendidos: number;
  ticketPromedioCentavos: number | null;
  propinasCentavos: number;
  pctPropinaReal: number | null;
  pagosConPropina: number;
  pctPagosConPropina: number | null;
  estrellasPromedio: number | null;
  numResenas: number;
  tiempoCobroSegundosPromedio: number | null;
  cocinaCentavos: number | null;
  ultimasResenas: ResenaResumen[];
};

export type ReporteDesempeno = {
  rangoDias: RangoReporteDias;
  desdeIso: string;
  ventasCentavos: number;
  propinasCentavos: number;
  pagosCobrados: number;
  ticketPromedioCentavos: number | null;
  pctPropinaPromedio: number | null;
  estrellasPromedio: number | null;
  repartoCocinaPct: number;
  porMesero: FilaMeseroReporte[];
};

/** División segura; null si no hay base. */
export function ratioONull(numerador: number, denominador: number): number | null {
  if (denominador === 0) {
    return null;
  }
  return numerador / denominador;
}

/** Porcentaje con 1 decimal, o "—" si null. */
export function formatearPct1(valor: number | null): string {
  if (valor == null || !Number.isFinite(valor)) {
    return "—";
  }
  return `${(valor * 100).toFixed(1)}%`;
}

/** Número con 1 decimal o "—". */
export function formatearDecimal1(valor: number | null): string {
  if (valor == null || !Number.isFinite(valor)) {
    return "—";
  }
  return valor.toFixed(1);
}

export function formatearSegundosPromedio(segundos: number | null): string {
  if (segundos == null || !Number.isFinite(segundos)) {
    return "—";
  }
  if (segundos < 60) {
    return `${Math.round(segundos)} s`;
  }
  const min = Math.floor(segundos / 60);
  const seg = Math.round(segundos % 60);
  return `${min} min ${seg} s`;
}

export function calcularReporteDesempeno(input: {
  rangoDias: RangoReporteDias;
  desdeIso: string;
  cobros: CobroParaReporte[];
  resenas: ResenaParaReporte[];
  meseros: MeseroNombre[];
  repartoCocinaPct: number;
}): ReporteDesempeno {
  const consumos = input.cobros.filter((c) => c.tipo === "consumo");
  const propinas = input.cobros.filter((c) => c.tipo === "propina");
  const ventasCentavos = consumos.reduce((s, c) => s + c.monto_centavos, 0);
  const propinasCentavos = propinas.reduce((s, c) => s + c.monto_centavos, 0);
  const pagosCobrados = consumos.length;
  const ticketPromedioCentavos = ratioONull(ventasCentavos, pagosCobrados);
  const pctPropinaPromedio = ratioONull(propinasCentavos, ventasCentavos);

  const estrellasSum = input.resenas.reduce((s, r) => s + r.estrellas, 0);
  const estrellasPromedio = ratioONull(estrellasSum, input.resenas.length);

  const propinaPorOrigen = new Map<string, number>();
  for (const p of propinas) {
    if (p.cobro_origen_id) {
      propinaPorOrigen.set(
        p.cobro_origen_id,
        (propinaPorOrigen.get(p.cobro_origen_id) ?? 0) + p.monto_centavos,
      );
    }
  }

  const nombres = new Map(input.meseros.map((m) => [m.id, m.nombre] as const));
  const meseroIds = new Set<string>();
  for (const c of consumos) {
    if (c.mesero_id) {
      meseroIds.add(c.mesero_id);
    }
  }

  const porMesero: FilaMeseroReporte[] = [];
  for (const meseroId of meseroIds) {
    const consMesero = consumos.filter((c) => c.mesero_id === meseroId);
    const ventas = consMesero.reduce((s, c) => s + c.monto_centavos, 0);
    let propinasMesero = 0;
    let pagosConPropina = 0;
    for (const c of consMesero) {
      const tip = propinaPorOrigen.get(c.id) ?? 0;
      if (tip > 0) {
        pagosConPropina += 1;
        propinasMesero += tip;
      }
    }

    const resenasMesero = input.resenas
      .filter((r) => r.mesero_id === meseroId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    const estSum = resenasMesero.reduce((s, r) => s + r.estrellas, 0);

    const tiempos: number[] = [];
    for (const c of consMesero) {
      if (!c.pagado_at) {
        continue;
      }
      const ms =
        new Date(c.pagado_at).getTime() - new Date(c.created_at).getTime();
      if (ms >= 0) {
        tiempos.push(ms / 1000);
      }
    }
    const tiempoProm =
      tiempos.length === 0
        ? null
        : tiempos.reduce((s, t) => s + t, 0) / tiempos.length;

    const cocinaCentavos =
      input.repartoCocinaPct > 0
        ? Math.round((propinasMesero * input.repartoCocinaPct) / 100)
        : null;

    porMesero.push({
      meseroId,
      nombre: nombres.get(meseroId) ?? "Mesero",
      ventasCentavos: ventas,
      pagosAtendidos: consMesero.length,
      ticketPromedioCentavos: ratioONull(ventas, consMesero.length),
      propinasCentavos: propinasMesero,
      pctPropinaReal: ratioONull(propinasMesero, ventas),
      pagosConPropina,
      pctPagosConPropina: ratioONull(pagosConPropina, consMesero.length),
      estrellasPromedio: ratioONull(estSum, resenasMesero.length),
      numResenas: resenasMesero.length,
      tiempoCobroSegundosPromedio: tiempoProm,
      cocinaCentavos,
      ultimasResenas: resenasMesero.slice(0, 5).map((r) => ({
        id: r.id,
        estrellas: r.estrellas,
        comentario: r.comentario,
        createdAt: r.created_at,
        mesa: r.mesa,
      })),
    });
  }

  porMesero.sort((a, b) => b.ventasCentavos - a.ventasCentavos);

  return {
    rangoDias: input.rangoDias,
    desdeIso: input.desdeIso,
    ventasCentavos,
    propinasCentavos,
    pagosCobrados,
    ticketPromedioCentavos,
    pctPropinaPromedio,
    estrellasPromedio,
    repartoCocinaPct: input.repartoCocinaPct,
    porMesero,
  };
}

/** Filtra el reporte: admin ve todo; mesero solo su fila y totales propios. */
export function filtrarReportePorSesion(
  reporte: ReporteDesempeno,
  sesion: { meseroId: string; rol: "mesero" | "admin" },
): ReporteDesempeno {
  if (sesion.rol === "admin") {
    return reporte;
  }
  const porMesero = reporte.porMesero.filter(
    (m) => m.meseroId === sesion.meseroId,
  );
  const propia = porMesero[0];
  return {
    ...reporte,
    porMesero,
    ventasCentavos: propia?.ventasCentavos ?? 0,
    propinasCentavos: propia?.propinasCentavos ?? 0,
    pagosCobrados: propia?.pagosAtendidos ?? 0,
    ticketPromedioCentavos: propia?.ticketPromedioCentavos ?? null,
    pctPropinaPromedio: propia?.pctPropinaReal ?? null,
    estrellasPromedio: propia?.estrellasPromedio ?? null,
  };
}
