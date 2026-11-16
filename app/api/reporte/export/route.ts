import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-error";
import { requireSesion } from "@/lib/auth/require";
import type { RangoReporteDias } from "@/lib/dia-mexico";
import {
  centavosATextoPesos,
  filasACsv,
} from "@/lib/reporte-export";
import {
  formatearDecimal1,
  formatearPct1,
} from "@/lib/reporte";
import {
  listarPagosRango,
  obtenerReporteDesempeno,
} from "@/services/reporte";

const querySchema = z.object({
  dias: z.enum(["1", "7", "30"]),
  tipo: z.enum(["resumen", "pagos"]),
});

function fechaArchivoCdmx(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const y = partes.find((p) => p.type === "year")?.value ?? "0000";
  const m = partes.find((p) => p.type === "month")?.value ?? "00";
  const d = partes.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

function csvResponse(csv: string, tipo: "resumen" | "pagos"): NextResponse {
  const fecha = fechaArchivoCdmx();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sale-${tipo}-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function textoTicket(centavos: number | null): string {
  if (centavos == null || !Number.isFinite(centavos)) {
    return "—";
  }
  return centavosATextoPesos(Math.round(centavos));
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const sesion = await requireSesion(request);
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      dias: url.searchParams.get("dias") ?? undefined,
      tipo: url.searchParams.get("tipo") ?? undefined,
    });
    const dias = Number(parsed.dias) as RangoReporteDias;
    const esAdmin = sesion.rol === "admin";

    if (parsed.tipo === "pagos") {
      const pagos = await listarPagosRango(dias, sesion);
      const csv = filasACsv(
        ["Hora", "Mesa", "Mesero", "Tipo", "Monto", "Ref. pey"],
        pagos.map((p) => [
          p.hora,
          p.mesa,
          p.mesero,
          p.tipo,
          centavosATextoPesos(p.montoCentavos),
          p.peyUltimos4 ?? "",
        ]),
      );
      return csvResponse(csv, "pagos");
    }

    const reporte = await obtenerReporteDesempeno(dias, sesion);
    const incluirCocina = esAdmin && reporte.repartoCocinaPct > 0;
    const encabezados = [
      "Mesero",
      "Ventas",
      "Propinas",
      "Pagos",
      "Ticket promedio",
      "% propina",
      "Estrellas",
      "Reseñas",
      ...(incluirCocina ? ["Cocina"] : []),
    ];

    const filas: (string | number)[][] = reporte.porMesero.map((m) => [
      m.nombre,
      centavosATextoPesos(m.ventasCentavos),
      centavosATextoPesos(m.propinasCentavos),
      m.pagosAtendidos,
      textoTicket(m.ticketPromedioCentavos),
      formatearPct1(m.pctPropinaReal),
      formatearDecimal1(m.estrellasPromedio),
      m.numResenas,
      ...(incluirCocina
        ? [centavosATextoPesos(m.cocinaCentavos ?? 0)]
        : []),
    ]);

    if (esAdmin) {
      filas.push([
        "Total",
        centavosATextoPesos(reporte.ventasCentavos),
        centavosATextoPesos(reporte.propinasCentavos),
        reporte.pagosCobrados,
        textoTicket(reporte.ticketPromedioCentavos),
        formatearPct1(reporte.pctPropinaPromedio),
        formatearDecimal1(reporte.estrellasPromedio),
        reporte.porMesero.reduce((s, m) => s + m.numResenas, 0),
        ...(incluirCocina
          ? [
              centavosATextoPesos(
                reporte.porMesero.reduce(
                  (s, m) => s + (m.cocinaCentavos ?? 0),
                  0,
                ),
              ),
            ]
          : []),
      ]);
    }

    return csvResponse(filasACsv(encabezados, filas), "resumen");
  } catch (error) {
    return jsonError(error);
  }
}
