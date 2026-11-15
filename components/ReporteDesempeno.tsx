"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from "react";
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
  const [dias, setDias] = useState<RangoReporteDias>(1);
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orden, setOrden] = useState<{ col: Columna; asc: boolean }>({
    col: "ventasCentavos",
    asc: false,
  });
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = useCallback(async (rango: RangoReporteDias): Promise<void> => {
    try {
      const data = await apiFetch<Reporte>(`/api/reporte?dias=${rango}`, {
        withDemoToken: true,
      });
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
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }
  if (!reporte) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando reporte…</p>;
  }

  const filas = [...reporte.porMesero].sort((a, b) => {
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
    <div className="rounded-2xl bg-white/90 p-4">
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="text-xl font-semibold">{valor}</p>
    </div>
  );

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
            className={`min-h-12 flex-1 rounded-xl px-2 text-sm font-semibold ${
              dias === valor
                ? "bg-emerald-800 text-white"
                : "bg-white/90 text-neutral-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tarjeta("Ventas", formatearMxn(reporte.ventasCentavos))}
        {tarjeta("Propinas", formatearMxn(reporte.propinasCentavos))}
        {tarjeta("Pagos cobrados", String(reporte.pagosCobrados))}
        {tarjeta(
          "Ticket promedio",
          reporte.ticketPromedioCentavos == null
            ? "—"
            : formatearMxn(Math.round(reporte.ticketPromedioCentavos)),
        )}
        {tarjeta("% propina promedio", formatearPct1(reporte.pctPropinaPromedio))}
        {tarjeta("★ promedio", formatearDecimal1(reporte.estrellasPromedio))}
      </div>

      <section className="rounded-2xl bg-white/90 p-4">
        <h2 className="text-lg font-semibold">Desempeño por mesero</h2>
        {filas.length === 0 ? (
          <p className="mt-2 text-neutral-600">Sin cobros en este periodo.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b text-neutral-600">
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
                      className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50"
                      onClick={() =>
                        setAbierto((id) =>
                          id === m.meseroId ? null : m.meseroId,
                        )
                      }
                    >
                      <td className="py-3 pr-2 font-medium">{m.nombre}</td>
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
                        <td colSpan={9} className="bg-neutral-50 px-3 py-3">
                          {m.cocinaCentavos != null ? (
                            <p className="mb-2 text-sm text-neutral-700">
                              Le toca a cocina: {formatearMxn(m.cocinaCentavos)}
                            </p>
                          ) : null}
                          <p className="mb-2 font-medium">Últimas reseñas</p>
                          {m.ultimasResenas.length === 0 ? (
                            <p className="text-neutral-600">Sin reseñas aún.</p>
                          ) : (
                            <ul className="flex flex-col gap-2">
                              {m.ultimasResenas.map((r) => (
                                <li
                                  key={r.id}
                                  className="rounded-xl bg-white px-3 py-2 text-sm"
                                >
                                  <span className="font-medium">
                                    {"★".repeat(r.estrellas)}
                                  </span>
                                  <span className="ml-2 text-neutral-600">
                                    Mesa {r.mesa ?? "—"} ·{" "}
                                    {new Date(r.createdAt).toLocaleDateString(
                                      "es-MX",
                                    )}
                                  </span>
                                  {r.comentario ? (
                                    <p className="mt-1 whitespace-pre-wrap text-neutral-800">
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
        {reporte.repartoCocinaPct > 0 ? (
          <p className="mt-3 text-sm text-neutral-600">
            Sale no mueve dinero: este reparto se paga por fuera.
          </p>
        ) : null}
      </section>
    </div>
  );
}
