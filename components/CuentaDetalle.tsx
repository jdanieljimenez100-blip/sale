"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useSesion } from "@/components/SesionContext";
import { EstadoBadge } from "@/components/EstadoBadge";
import { Boton } from "@/components/ui/Boton";
import { Hoja } from "@/components/ui/Hoja";
import { Monto } from "@/components/ui/Monto";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import { etiquetaEstadoCobro } from "@/lib/money";
import type { CobroRow, CuentaConDetalle } from "@/services/cuentas";
import type { Database } from "@/lib/supabase/types";

type Props = { cuentaId: string };
type CuentaResponse = { cuenta: CuentaConDetalle };
type CobrarResponse = { cobro: CobroRow };
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type MenuResponse = { items: MenuItem[] };

function horaCorta(iso: string | null): string {
  if (!iso) {
    return "";
  }
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function CuentaDetalle({ cuentaId }: Props): ReactElement {
  const router = useRouter();
  const yo = useSesion();
  const esAdmin = yo.rol === "admin";
  const [cuenta, setCuenta] = useState<CuentaConDetalle | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [categoria, setCategoria] = useState<string>("");
  const [hojaMenu, setHojaMenu] = useState(false);
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [qty, setQty] = useState(1);
  const [notas, setNotas] = useState("");
  const [mostrarOtro, setMostrarOtro] = useState(false);
  const [desc, setDesc] = useState("");
  const [cant, setCant] = useState("1");
  const [precio, setPrecio] = useState("");
  const [notasOtro, setNotasOtro] = useState("");
  const [confirmarQuitarId, setConfirmarQuitarId] = useState<string | null>(
    null,
  );

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<CuentaResponse>(`/api/cuentas/${cuentaId}`);
      setCuenta(data.cuenta);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, [cuentaId]);

  function aplicarCuentaRespuesta(siguiente: CuentaConDetalle): void {
    if (
      !Array.isArray(siguiente.partidas) ||
      !Array.isArray(siguiente.cobros)
    ) {
      void cargar();
      return;
    }
    setCuenta(siguiente);
  }

  const cargarMenu = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<MenuResponse>("/api/menu");
      setMenu(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el menú");
    }
  }, []);

  useEffect(() => {
    void cargar();
    void cargarMenu();
    const timer = window.setInterval(() => {
      void cargar();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [cargar, cargarMenu]);

  useEffect(() => {
    if (!confirmarQuitarId) {
      return;
    }
    const t = window.setTimeout(() => setConfirmarQuitarId(null), 3000);
    return () => window.clearTimeout(t);
  }, [confirmarQuitarId]);

  const categorias = useMemo(() => {
    const set = new Set(menu.map((i) => i.categoria));
    return [...set];
  }, [menu]);

  useEffect(() => {
    if (categorias.length === 0) {
      return;
    }
    if (!categoria || !categorias.includes(categoria)) {
      setCategoria(categorias[0] ?? "");
    }
  }, [categorias, categoria]);

  const itemsCategoria = useMemo(
    () => menu.filter((i) => i.categoria === categoria),
    [menu, categoria],
  );

  async function cobrarTotal(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<CobrarResponse>(
        `/api/cuentas/${cuentaId}/cobrar`,
        { method: "POST" },
      );
      router.push(`/cobros/${data.cobro.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cobrar");
      setBusy(false);
    }
  }

  function abrirSheet(item: MenuItem): void {
    setSheetItem(item);
    setQty(1);
    setNotas("");
  }

  async function agregarDelMenu(): Promise<void> {
    if (!sheetItem) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<CuentaResponse>(
        `/api/cuentas/${cuentaId}/partidas`,
        {
          method: "POST",
          body: JSON.stringify({
            menuItemId: sheetItem.id,
            cantidad: qty,
            notas: notas.trim() || null,
          }),
        },
      );
      aplicarCuentaRespuesta(data.cuenta);
      setSheetItem(null);
      setHojaMenu(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  async function agregarOtro(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<CuentaResponse>(
        `/api/cuentas/${cuentaId}/partidas`,
        {
          method: "POST",
          body: JSON.stringify({
            descripcion: desc,
            cantidad: Number.parseInt(cant, 10),
            precioPesos: precio,
            notas: notasOtro.trim() || null,
          }),
        },
      );
      aplicarCuentaRespuesta(data.cuenta);
      setDesc("");
      setCant("1");
      setPrecio("");
      setNotasOtro("");
      setMostrarOtro(false);
      setHojaMenu(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  async function quitarConfirmado(partidaId: string): Promise<void> {
    setBusy(true);
    setError(null);
    setConfirmarQuitarId(null);
    try {
      const data = await apiFetch<CuentaResponse>(
        `/api/partidas/${partidaId}`,
        { method: "DELETE" },
      );
      aplicarCuentaRespuesta(data.cuenta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar");
    } finally {
      setBusy(false);
    }
  }

  function onQuitarToque(partidaId: string): void {
    if (confirmarQuitarId === partidaId) {
      void quitarConfirmado(partidaId);
      return;
    }
    setConfirmarQuitarId(partidaId);
  }

  async function cerrar(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<CuentaResponse>(
        `/api/cuentas/${cuentaId}/cerrar`,
        { method: "POST" },
      );
      if (
        !Array.isArray(data.cuenta.partidas) ||
        !Array.isArray(data.cuenta.cobros)
      ) {
        await cargar();
      }
      router.push("/cuentas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar");
      setBusy(false);
    }
  }

  if (error && !cuenta) {
    return (
      <p className="rounded-hoja bg-peligro/10 p-4 text-peligro" role="alert">
        {error}
      </p>
    );
  }
  if (!cuenta) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const partidas = cuenta.partidas ?? [];
  const cobros = cuenta.cobros ?? [];
  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;
  const propinas = cobros.filter(
    (c) => c.tipo === "propina" && c.estado === "pagado",
  );
  const historial = cobros.filter((c) => c.tipo === "consumo");
  const hayConsumo = historial.some(
    (c) => c.estado === "pendiente" || c.estado === "pagado",
  );
  const editable = cuenta.estado !== "pagada" && !cuenta.cerrada_at;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-mesa text-[32px] font-bold leading-none text-tinta">
            Mesa {cuenta.mesa}
          </h1>
          {cuenta.estado === "pagada" ? (
            <p className="mt-2 text-[15px] text-tinta-suave">
              de <Monto centavos={cuenta.total_centavos} /> ·{" "}
              {cuenta.mesero_nombre}
            </p>
          ) : (
            <>
              <p className="mt-2 font-mesa text-[48px] font-bold leading-none tabular text-tinta">
                Falta <Monto centavos={restante} />
              </p>
              <p className="mt-1 text-[15px] text-tinta-suave">
                de <Monto centavos={cuenta.total_centavos} /> ·{" "}
                {cuenta.mesero_nombre}
              </p>
            </>
          )}
        </div>
        <EstadoBadge estado={cuenta.estado} />
      </div>

      {cuenta.estado === "pagada" ? (
        <div className="flex items-center gap-3 rounded-hoja bg-pagada-bg px-4 py-3 text-pagada-fg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path
              d="M7 12.5 10.5 16 17 8"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="min-w-0">
            <p className="font-semibold">Mesa pagada</p>
            {propinas.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-[13px]">
                {propinas.map((p) => (
                  <li key={p.id}>
                    {p.concepto}: <Monto centavos={p.monto_centavos} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px]">Sin propinas registradas.</p>
            )}
          </div>
        </div>
      ) : null}

      <section className="rounded-hoja border border-linea bg-superficie">
        <div className="flex items-center justify-between gap-2 border-b border-linea px-4 py-3">
          <h2 className="text-[17px] font-semibold text-tinta">Partidas</h2>
          {editable ? (
            <button
              type="button"
              onClick={() => setHojaMenu(true)}
              className="pressable min-h-12 rounded-boton px-3 text-[15px] font-semibold text-primario focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              + Agregar partida
            </button>
          ) : null}
        </div>
        {partidas.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-tinta-suave">
            Sin partidas todavía.
          </p>
        ) : (
          <ul className="divide-y divide-linea">
            {partidas.map((partida) => (
              <li
                key={partida.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-[15px]"
              >
                <span className="min-w-0">
                  <span className="font-medium text-tinta">
                    {partida.cantidad}× {partida.descripcion}
                  </span>
                  {partida.notas ? (
                    <span className="mt-0.5 block text-[13px] text-tinta-suave">
                      {partida.notas}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-2 tabular text-tinta">
                  <Monto
                    centavos={partida.cantidad * partida.precio_centavos}
                  />
                  {editable && !hayConsumo ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onQuitarToque(partida.id)}
                      className={`pressable min-h-11 rounded-boton px-2 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
                        confirmarQuitarId === partida.id
                          ? "bg-peligro text-white"
                          : "text-peligro underline underline-offset-2"
                      }`}
                    >
                      {confirmarQuitarId === partida.id
                        ? "¿Quitar? Sí"
                        : "Quitar"}
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-linea px-4 py-3 text-right text-[17px] font-semibold tabular text-tinta">
          Total <Monto centavos={cuenta.total_centavos} />
        </p>
      </section>

      <section className="rounded-hoja border border-linea bg-superficie">
        <h2 className="border-b border-linea px-4 py-3 text-[17px] font-semibold text-tinta">
          Cobros
        </h2>
        {historial.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-tinta-suave">
            Aún no hay cobros.
          </p>
        ) : (
          <ul className="divide-y divide-linea">
            {historial.map((cobro) => (
              <li key={cobro.id}>
                <Link
                  href={`/cobros/${cobro.id}`}
                  className="pressable flex min-h-12 items-center justify-between gap-2 px-4 text-[15px] text-tinta hover:bg-fondo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primario"
                >
                  <span>
                    {etiquetaEstadoCobro(cobro.estado)} ·{" "}
                    <Monto centavos={cobro.monto_centavos} />
                  </span>
                  <span className="text-tinta-suave">
                    {horaCorta(cobro.pagado_at ?? cobro.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="rounded-hoja bg-peligro/10 p-3 text-peligro" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className="barra-accion-fija fixed inset-x-0 z-30 mx-auto max-w-lg bg-superficie px-4 pt-2"
        style={{
          bottom: "calc(4rem + env(safe-area-inset-bottom))",
        }}
      >
        {cuenta.estado === "pagada" && !cuenta.cerrada_at ? (
          <Boton
            tamano="lg"
            disabled={busy}
            onClick={() => {
              void cerrar();
            }}
          >
            Cerrar mesa
          </Boton>
        ) : null}

        {cuenta.estado !== "pagada" ? (
          <div className="flex gap-2">
            <Link
              href={`/cuentas/${cuentaId}/dividir`}
              className="pressable inline-flex min-h-14 w-1/3 items-center justify-center rounded-boton border border-linea bg-superficie text-[15px] font-semibold text-tinta hover:bg-fondo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
            >
              Dividir
            </Link>
            <button
              type="button"
              disabled={busy || restante <= 0}
              onClick={() => {
                void cobrarTotal();
              }}
              className="pressable inline-flex min-h-14 w-2/3 items-center justify-center rounded-boton bg-primario text-[17px] font-semibold text-primario-tinta hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:opacity-50"
            >
              {restante <= 0 ? (
                "Cuenta cubierta"
              ) : (
                <>
                  Cobrar <Monto centavos={restante} />
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>

      <Hoja
        abierta={hojaMenu && !sheetItem}
        onCerrar={() => {
          setHojaMenu(false);
          setMostrarOtro(false);
        }}
        titulo="Agregar partida"
      >
        {categorias.length === 0 ? (
          <p className="text-[15px] text-tinta-suave">
            Aún no hay platillos activos.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="tablist">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={categoria === cat}
                  onClick={() => setCategoria(cat)}
                  className={`pressable min-h-12 rounded-boton px-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario ${
                    categoria === cat
                      ? "bg-primario text-primario-tinta"
                      : "border border-linea text-tinta"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {itemsCategoria.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={busy}
                  onClick={() => abrirSheet(item)}
                  className="pressable flex min-h-12 flex-col items-start justify-center rounded-boton border border-linea bg-fondo px-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:opacity-50"
                >
                  <span className="font-semibold leading-tight text-tinta">
                    {item.nombre}
                  </span>
                  <span className="mt-1 text-[15px] tabular text-tinta-suave">
                    <Monto centavos={item.precio_centavos} />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {esAdmin ? (
          mostrarOtro ? (
            <form
              onSubmit={(e) => void agregarOtro(e)}
              className="flex flex-col gap-2 border-t border-linea pt-3"
            >
              <p className="text-[15px] font-medium text-tinta">Otro (libre)</p>
              <input
                name="descripcion"
                autoComplete="off"
                className="min-h-12 rounded-boton border border-linea px-3"
                placeholder="Descripción…"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
                maxLength={80}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="cantidad"
                  autoComplete="off"
                  className="min-h-12 rounded-boton border border-linea px-3"
                  placeholder="Cantidad…"
                  value={cant}
                  onChange={(e) => setCant(e.target.value)}
                  inputMode="numeric"
                  required
                />
                <input
                  name="precio"
                  autoComplete="off"
                  className="min-h-12 rounded-boton border border-linea px-3"
                  placeholder="Precio pesos…"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  inputMode="decimal"
                  required
                />
              </div>
              <input
                name="notasOtro"
                autoComplete="off"
                className="min-h-12 rounded-boton border border-linea px-3"
                placeholder="Notas (opcional)…"
                value={notasOtro}
                onChange={(e) => setNotasOtro(e.target.value)}
                maxLength={120}
              />
              <Boton type="submit" disabled={busy}>
                Guardar partida
              </Boton>
              <Boton
                type="button"
                variante="secundario"
                onClick={() => setMostrarOtro(false)}
              >
                Cancelar
              </Boton>
            </form>
          ) : (
            <Boton
              variante="secundario"
              onClick={() => setMostrarOtro(true)}
            >
              Otro
            </Boton>
          )
        ) : null}
      </Hoja>

      <Hoja
        abierta={sheetItem !== null}
        onCerrar={() => setSheetItem(null)}
        titulo={sheetItem?.nombre}
      >
        {sheetItem ? (
          <>
            <p className="tabular text-tinta-suave">
              <Monto centavos={sheetItem.precio_centavos} />
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Menos"
                disabled={qty <= 1 || busy}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="pressable flex min-h-12 min-w-12 items-center justify-center rounded-boton border border-linea text-2xl font-bold disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-8 text-center text-2xl font-semibold tabular">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Más"
                disabled={qty >= 99 || busy}
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="pressable flex min-h-12 min-w-12 items-center justify-center rounded-boton border border-linea text-2xl font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
            <label className="flex flex-col gap-1 text-[15px]">
              Notas (opcional)
              <input
                name="notas"
                autoComplete="off"
                className="min-h-12 rounded-boton border border-linea px-3"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                maxLength={120}
                placeholder="Sin cebolla, poco picante…"
              />
            </label>
            <Boton
              tamano="lg"
              disabled={busy}
              onClick={() => {
                void agregarDelMenu();
              }}
            >
              Agregar
            </Boton>
            <Boton
              variante="secundario"
              disabled={busy}
              onClick={() => setSheetItem(null)}
            >
              Cancelar
            </Boton>
          </>
        ) : null}
      </Hoja>
    </div>
  );
}
