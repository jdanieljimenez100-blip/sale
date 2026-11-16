import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { BotonImprimir } from "@/components/BotonImprimir";
import { MeseroChrome } from "@/components/MeseroChrome";
import { requireSesion } from "@/lib/auth/require";
import type { RangoReporteDias } from "@/lib/dia-mexico";
import { formatearMxn } from "@/lib/money";
import {
  formatearDecimal1,
  formatearPct1,
} from "@/lib/reporte";
import { formatearFechaPagoCdmx } from "@/lib/ticket";
import { obtenerNegocio } from "@/services/negocios";
import {
  listarPagosRango,
  obtenerReporteDesempeno,
} from "@/services/reporte";

function etiquetaRango(dias: RangoReporteDias): string {
  if (dias === 1) {
    return "Hoy";
  }
  if (dias === 7) {
    return "Últimos 7 días";
  }
  return "Últimos 30 días";
}

function parseDias(raw: string | undefined): RangoReporteDias {
  if (raw === "7" || raw === "30") {
    return Number(raw) as RangoReporteDias;
  }
  return 1;
}

export default async function ReporteImprimirPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}): Promise<ReactElement> {
  const params = await searchParams;
  const dias = parseDias(params.dias);

  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const host = h.get("host") ?? "localhost";
  const request = new Request(`http://${host}/reporte/imprimir`, {
    headers: { cookie, host },
  });

  let sesion;
  try {
    sesion = await requireSesion(request);
  } catch {
    redirect("/entrar");
  }

  const [reporte, pagos, negocio] = await Promise.all([
    obtenerReporteDesempeno(dias, sesion),
    listarPagosRango(dias, sesion),
    obtenerNegocio(sesion.negocioId),
  ]);

  const esAdmin = sesion.rol === "admin";
  const generado = formatearFechaPagoCdmx(new Date());
  const incluirCocina = esAdmin && reporte.repartoCocinaPct > 0;

  return (
    <MeseroChrome>
      <style>{`
        @media print {
          @page { size: letter; margin: 12mm; }
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          nav[aria-label="Navegación principal"] { display: none !important; }
          header.sticky { display: none !important; }
          main {
            max-width: none !important;
            padding: 0 !important;
            min-height: 0 !important;
          }
          .print-sheet { border: none !important; box-shadow: none !important; }
          .print-row { break-inside: avoid; }
          .tabular { font-variant-numeric: tabular-nums; }
        }
      `}</style>

      <div className="no-print flex flex-col gap-3">
        <header>
          <h1 className="text-[28px] font-semibold text-tinta text-pretty">
            Imprimir reporte
          </h1>
          <p className="mt-1 text-[15px] text-tinta-suave">
            Revisa el resumen y guarda o imprime en PDF.
          </p>
        </header>
        <BotonImprimir />
      </div>

      <article className="print-sheet mt-4 flex flex-col gap-5 rounded-hoja border border-linea bg-superficie p-4">
        <header className="border-b border-linea pb-3">
          <h2 className="text-[22px] font-semibold text-tinta">
            {negocio.nombre}
          </h2>
          <p className="mt-1 text-[15px] text-tinta-suave">
            Desempeño · {etiquetaRango(dias)}
          </p>
          <p className="text-[15px] tabular text-tinta-suave">
            Generado: {generado} (CDMX)
          </p>
        </header>

        <section aria-label="Totales">
          <h3 className="text-[17px] font-semibold text-tinta">Totales</h3>
          <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[13px] text-tinta-suave">Ventas</dt>
              <dd className="text-[17px] font-semibold tabular text-tinta">
                {formatearMxn(reporte.ventasCentavos)}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-tinta-suave">Propinas</dt>
              <dd className="text-[17px] font-semibold tabular text-tinta">
                {formatearMxn(reporte.propinasCentavos)}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-tinta-suave">Pagos</dt>
              <dd className="text-[17px] font-semibold tabular text-tinta">
                {reporte.pagosCobrados}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-tinta-suave">Ticket promedio</dt>
              <dd className="text-[17px] font-semibold tabular text-tinta">
                {reporte.ticketPromedioCentavos == null
                  ? "—"
                  : formatearMxn(Math.round(reporte.ticketPromedioCentavos))}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-tinta-suave">Estrellas</dt>
              <dd className="text-[17px] font-semibold tabular text-tinta">
                {formatearDecimal1(reporte.estrellasPromedio)}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-label="Por mesero">
          <h3 className="text-[17px] font-semibold text-tinta">
            {esAdmin ? "Por mesero" : "Mi desempeño"}
          </h3>
          {reporte.porMesero.length === 0 ? (
            <p className="mt-2 text-[15px] text-tinta-suave">
              Sin cobros en este periodo.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-[15px]">
                <thead>
                  <tr className="border-b border-linea text-tinta-suave">
                    <th className="py-2 pr-2 font-medium">Mesero</th>
                    <th className="py-2 pr-2 font-medium">Ventas</th>
                    <th className="py-2 pr-2 font-medium">Propinas</th>
                    <th className="py-2 pr-2 font-medium">Pagos</th>
                    <th className="py-2 pr-2 font-medium">Ticket</th>
                    <th className="py-2 pr-2 font-medium">% propina</th>
                    <th className="py-2 pr-2 font-medium">★</th>
                    {incluirCocina ? (
                      <th className="py-2 pr-2 font-medium">Cocina</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {reporte.porMesero.map((m) => (
                    <tr
                      key={m.meseroId}
                      className="print-row border-b border-linea"
                    >
                      <td className="py-2 pr-2 font-medium text-tinta">
                        {m.nombre}
                      </td>
                      <td className="py-2 pr-2 tabular">
                        {formatearMxn(m.ventasCentavos)}
                      </td>
                      <td className="py-2 pr-2 tabular">
                        {formatearMxn(m.propinasCentavos)}
                      </td>
                      <td className="py-2 pr-2 tabular">{m.pagosAtendidos}</td>
                      <td className="py-2 pr-2 tabular">
                        {m.ticketPromedioCentavos == null
                          ? "—"
                          : formatearMxn(Math.round(m.ticketPromedioCentavos))}
                      </td>
                      <td className="py-2 pr-2 tabular">
                        {formatearPct1(m.pctPropinaReal)}
                      </td>
                      <td className="py-2 pr-2 tabular">
                        {formatearDecimal1(m.estrellasPromedio)}
                      </td>
                      {incluirCocina ? (
                        <td className="py-2 pr-2 tabular">
                          {formatearMxn(m.cocinaCentavos ?? 0)}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {incluirCocina ? (
            <p className="mt-2 text-[15px] text-tinta-suave">
              Reparto a cocina ({reporte.repartoCocinaPct}%): Sale no mueve este
              dinero.
            </p>
          ) : null}
        </section>

        <section aria-label="Pagos">
          <h3 className="text-[17px] font-semibold text-tinta">Pagos</h3>
          {pagos.length === 0 ? (
            <p className="mt-2 text-[15px] text-tinta-suave">
              No hay pagos en este periodo.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-[15px]">
                <thead>
                  <tr className="border-b border-linea text-tinta-suave">
                    <th className="py-2 pr-2 font-medium">Hora</th>
                    <th className="py-2 pr-2 font-medium">Mesa</th>
                    <th className="py-2 pr-2 font-medium">Mesero</th>
                    <th className="py-2 pr-2 font-medium">Tipo</th>
                    <th className="py-2 pr-2 font-medium">Monto</th>
                    <th className="py-2 pr-2 font-medium">Ref.</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p, i) => (
                    <tr
                      key={`${p.hora}-${p.mesa}-${i}`}
                      className="print-row border-b border-linea"
                    >
                      <td className="py-2 pr-2 tabular">{p.hora}</td>
                      <td className="py-2 pr-2">{p.mesa}</td>
                      <td className="py-2 pr-2">{p.mesero}</td>
                      <td className="py-2 pr-2">{p.tipo}</td>
                      <td className="py-2 pr-2 tabular">
                        {formatearMxn(p.montoCentavos)}
                      </td>
                      <td className="py-2 pr-2 tabular">
                        {p.peyUltimos4 ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </article>
    </MeseroChrome>
  );
}
