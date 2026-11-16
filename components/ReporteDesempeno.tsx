"use client";

import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { Boton } from "@/components/ui/Boton";
import { apiFetch } from "@/lib/client-api";
import type { RangoReporteDias } from "@/lib/dia-mexico";
import { formatearMxn } from "@/lib/money";
import {
  formatearDecimal1,
  formatearPct1,
  formatearSegundosPromedio,
  type FilaMeseroReporte,
  type ReporteDesempeno as Reporte,
} from "@/lib/reporte";

type Columna =
  | "nombre"
  | "ventasCentavos"
  | "pagosAtendidos"
  | "ticketPromedioCentavos"
  | "propinasCentavos"
  | "pctPropinaReal"
  | "pctPagosConPropina"
  | "estrellasPromedio"
  | "tiempoCobroSegundosPromedio";

type Yo = { meseroId: string; rol: "mesero" | "admin" };

function valorOrden(
  fila: FilaMeseroReporte,
  col: Columna,
): string | number {
  const v = fila[col];
  if (v == null) {
    return col === "nombre" ? "" : -1;
  }
  return v;
}

export function ReporteDesempeno(): ReactElement {
  const router = useRouter();
  const [dias, setDias] = useState<RangoReporteDias>(1);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [yo, setYo] = useState<Yo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orden, setOrden] = useState<{ col: Columna; asc: boolean }>({
    col: "ventasCentavos",
    asc: false,
  });
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = useCallback(async (rango: RangoReporteDias): Promise<void> => {
    try {
      const sesion = await apiFetch<Yo>("/api/auth/yo");
      setYo(sesion);
      const data = await apiFetch<Reporte>(`/api/reporte?dias=${rango}`);
      setReporte(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setReporte(null);
    }
  }, []);

  useEffect(() => {
    void cargar(dias);
  }, [cargar, dias]);

  function toggleOrden(col: Columna): void {
    setOrden((prev) =>
      prev.col === col ? { col, asc: !prev.asc } : { col, asc: col === "nombre" },
    );
  }

  if (error) {
    return (
      <p className="rounded-hoja bg-peligro/10 p-4 text-peligro" role="alert">
        {error}
      </p>
    );
  }
  if (!reporte || !yo) {
    return (
      <p className="rounded-hoja border border-linea bg-superficie p-4 text-tinta-suave">
        Cargando reporte…
      </p>
    );
  }

  const esAdmin = yo.rol === "admin";
  const porMesero = esAdmin
    ? reporte.porMesero
    : reporte.porMesero.filter((m) => m.meseroId === yo.meseroId);

  const filas = [...porMesero].sort((a, b) => {
    const va = valorOrden(a, orden.col);
    const vb = valorOrden(b, orden.col);
    if (typeof va === "string" && typeof vb === "string") {
      const cmp = va.localeCompare(vb, "es-MX");
      return orden.asc ? cmp : -cmp;
    }
    const na = typeof va === "number" ? va : -1;
    const nb = typeof vb === "number" ? vb : -1;
    return orden.asc ? na - nb : nb - na;
  });

  const tarjeta = (label: string, valor: string): ReactElement => (
    <div className="rounded-hoja border border-linea bg-superficie p-4">
      <p className="text-[13px] text-tinta-suave">{label}</p>
      <p className="text-[22px] font-semibold tabular text-tinta">{valor}</p>
    </div>
  );

  const ventas = esAdmin
    ? reporte.ventasCentavos
    : (filas[0]?.ventasCentavos ?? 0);
  const propinas = esAdmin
    ? reporte.propinasCentavos
    : (filas[0]?.propinasCentavos ?? 0);
  const pagos = esAdmin
    ? reporte.pagosCobrados
    : (filas[0]?.pagosAtendidos ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="group" aria-label="Periodo">
        {(
          [
            [1, "Hoy"],
            [7, "7 días"],
            [30, "30 días"],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={dias === valor}
            onClick={() => setDias(valor)}
            className={`pressable min-h-12 flex-1 rounded-boton px-2 text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
              dias === valor
                ? "bg-primario text-primario-tinta"
                : "border border-linea bg-superficie text-tinta"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="flex flex-col gap-2 sm:flex-row"
        role="group"
        aria-label="Exportar reporte"
      >
        <div className="flex-1">
          <Boton
            type="button"
            variante="secundario"
            onClick={() => {
              window.location.assign(
                `/api/reporte/export?dias=${dias}&tipo=resumen`,
              );
            }}
          >
            Descargar Excel
          </Boton>
        </div>
        <div className="flex-1">
          <Boton
            type="button"
            variante="secundario"
            onClick={() => {
              window.location.assign(
                `/api/reporte/export?dias=${dias}&tipo=pagos`,
              );
            }}
          >
            Excel de pagos
          </Boton>
        </div>
        <div className="flex-1">
          <Boton
            type="button"
            variante="primario"
            onClick={() => {
              router.push(`/reporte/imprimir?dias=${dias}`);
            }}
          >
            Guardar PDF
          </Boton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tarjeta("Ventas", formatearMxn(ventas))}
        {tarjeta("Propinas", formatearMxn(propinas))}
        {tarjeta("Pagos cobrados", String(pagos))}
        {esAdmin
          ? tarjeta(
              "Ticket promedio",
              reporte.ticketPromedioCentavos == null
                ? "—"
                : formatearMxn(Math.round(reporte.ticketPromedioCentavos)),
            )
          : tarjeta(
              "Ticket promedio",
              filas[0]?.ticketPromedioCentavos == null
                ? "—"
                : formatearMxn(Math.round(filas[0].ticketPromedioCentavos)),
            )}
        {esAdmin
          ? tarjeta(
              "% propina promedio",
              formatearPct1(reporte.pctPropinaPromedio),
            )
          : tarjeta("% propina", formatearPct1(filas[0]?.pctPropinaReal ?? null))}
        {esAdmin
          ? tarjeta("★ promedio", formatearDecimal1(reporte.estrellasPromedio))
          : tarjeta(
              "★ promedio",
              formatearDecimal1(filas[0]?.estrellasPromedio ?? null),
            )}
      </div>

      <section className="rounded-hoja border border-linea bg-superficie p-4">
        <h2 className="text-[17px] font-semibold text-tinta">
          {esAdmin ? "Desempeño por mesero" : "Mi desempeño"}
        </h2>
        {filas.length === 0 ? (
          <p className="mt-2 text-tinta-suave">Sin cobros en este periodo.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-[15px]">
              <thead>
                <tr className="border-b border-linea text-tinta-suave">
                  {(
                    [
                      ["nombre", "Mesero"],
                      ["ventasCentavos", "Ventas"],
                      ["pagosAtendidos", "Pagos"],
                      ["ticketPromedioCentavos", "Ticket"],
                      ["propinasCentavos", "Propinas"],
                      ["pctPropinaReal", "% propina"],
                      ["pctPagosConPropina", "% con tip"],
                      ["estrellasPromedio", "★"],
                      ["tiempoCobroSegundosPromedio", "Tiempo"],
                    ] as const
                  ).map(([col, label]) => (
                    <th key={col} className="py-2 pr-2 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleOrden(col)}
                        className="underline-offset-2 hover:underline"
                      >
                        {label}
                        {orden.col === col ? (orden.asc ? " ↑" : " ↓") : ""}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((m) => (
                  <Fragment key={m.meseroId}>
                    <tr
                      className="cursor-pointer border-b border-linea hover:bg-fondo"
                      onClick={() =>
                        setAbierto((id) =>
                          id === m.meseroId ? null : m.meseroId,
                        )
                      }
                    >
                      <td className="py-3 pr-2 font-medium text-tinta">
                        {m.nombre}
                      </td>
                      <td className="py-3 pr-2">
                        {formatearMxn(m.ventasCentavos)}
                      </td>
                      <td className="py-3 pr-2">{m.pagosAtendidos}</td>
                      <td className="py-3 pr-2">
                        {m.ticketPromedioCentavos == null
                          ? "—"
                          : formatearMxn(Math.round(m.ticketPromedioCentavos))}
                      </td>
                      <td className="py-3 pr-2">
                        {formatearMxn(m.propinasCentavos)}
                      </td>
                      <td className="py-3 pr-2">
                        {formatearPct1(m.pctPropinaReal)}
                      </td>
                      <td className="py-3 pr-2">
                        {formatearPct1(m.pctPagosConPropina)}
                      </td>
                      <td className="py-3 pr-2">
                        {m.estrellasPromedio == null
                          ? "—"
                          : `${formatearDecimal1(m.estrellasPromedio)} (${m.numResenas})`}
                      </td>
                      <td className="py-3 pr-2">
                        {formatearSegundosPromedio(
                          m.tiempoCobroSegundosPromedio,
                        )}
                      </td>
                    </tr>
                    {abierto === m.meseroId ? (
                      <tr>
                        <td colSpan={9} className="bg-fondo px-3 py-3">
                          {m.cocinaCentavos != null && esAdmin ? (
                            <p className="mb-2 text-[15px] text-tinta-suave">
                              Le toca a cocina: {formatearMxn(m.cocinaCentavos)}
                            </p>
                          ) : null}
                          <p className="mb-2 font-medium text-tinta">
                            Últimas reseñas
                          </p>
                          {m.ultimasResenas.length === 0 ? (
                            <p className="text-tinta-suave">Sin reseñas aún.</p>
                          ) : (
                            <ul className="flex flex-col gap-2">
                              {m.ultimasResenas.map((r) => (
                                <li
                                  key={r.id}
                                  className="rounded-boton border border-linea bg-superficie px-3 py-2 text-[15px]"
                                >
                                  <span className="font-medium text-tinta">
                                    {"★".repeat(r.estrellas)}
                                  </span>
                                  <span className="ml-2 text-tinta-suave">
                                    Mesa {r.mesa ?? "—"} ·{" "}
                                    {new Date(r.createdAt).toLocaleDateString(
                                      "es-MX",
                                    )}
                                  </span>
                                  {r.comentario ? (
                                    <p className="mt-1 whitespace-pre-wrap text-tinta">
                                      {r.comentario}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {esAdmin && reporte.repartoCocinaPct > 0 ? (
          <p className="mt-3 text-[15px] text-tinta-suave">
            Sale no mueve dinero: este reparto se paga por fuera.
          </p>
        ) : null}
      </section>
    </div>
  );
}
