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
import { apiFetch } from "@/lib/client-api";
import { etiquetaEstadoCobro, formatearMxn } from "@/lib/money";
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
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [qty, setQty] = useState(1);
  const [notas, setNotas] = useState("");
  const [mostrarOtro, setMostrarOtro] = useState(false);
  const [desc, setDesc] = useState("");
  const [cant, setCant] = useState("1");
  const [precio, setPrecio] = useState("");
  const [notasOtro, setNotasOtro] = useState("");

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<CuentaResponse>(`/api/cuentas/${cuentaId}`);
      setCuenta(data.cuenta);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, [cuentaId]);

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
      setCuenta(data.cuenta);
      setSheetItem(null);
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
      setCuenta(data.cuenta);
      setDesc("");
      setCant("1");
      setPrecio("");
      setNotasOtro("");
      setMostrarOtro(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  async function quitar(partidaId: string): Promise<void> {
    if (!window.confirm("¿Quitar esta partida?")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/partidas/${partidaId}`, { method: "DELETE" });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar");
    } finally {
      setBusy(false);
    }
  }

  async function cerrar(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/cuentas/${cuentaId}/cerrar`, { method: "POST" });
      router.push("/cuentas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar");
      setBusy(false);
    }
  }

  if (error && !cuenta) {
    return <p className="rounded-2xl bg-red-100 p-4 text-red-800">{error}</p>;
  }
  if (!cuenta) {
    return <p className="rounded-2xl bg-white/70 p-4">Cargando mesa…</p>;
  }

  const restante = cuenta.total_centavos - cuenta.pagado_consumo_centavos;
  const propinas = cuenta.cobros.filter(
    (c) => c.tipo === "propina" && c.estado === "pagado",
  );
  const historial = cuenta.cobros.filter((c) => c.tipo === "consumo");
  const hayConsumo = historial.some(
    (c) => c.estado === "pendiente" || c.estado === "pagado",
  );
  const editable = cuenta.estado !== "pagada" && !cuenta.cerrada_at;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Mesa {cuenta.mesa}</h1>
          <p className="mt-1 text-neutral-700">{cuenta.mesero_nombre}</p>
        </div>
        <EstadoBadge estado={cuenta.estado} />
      </div>

      {cuenta.estado === "pagada" ? (
        <div className="rounded-3xl bg-emerald-700 px-5 py-8 text-center text-white">
          <p className="text-3xl font-bold">Mesa pagada ✓</p>
          {propinas.length > 0 ? (
            <ul className="mt-4 space-y-1 text-left text-sm">
              {propinas.map((p) => (
                <li key={p.id}>
                  {p.concepto}: {formatearMxn(p.monto_centavos)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-emerald-50">Sin propinas registradas.</p>
          )}
        </div>
      ) : (
        <p className="text-4xl font-bold tracking-tight tabular-nums">
          Falta por cobrar {formatearMxn(restante)}
        </p>
      )}

      {editable ? (
        <section className="rounded-2xl bg-white/90 p-4">
          <h2 className="mb-3 text-lg font-semibold">Menú</h2>
          {categorias.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Aún no hay platillos activos.
            </p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2" role="tablist">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={categoria === cat}
                    onClick={() => setCategoria(cat)}
                    className={`min-h-12 rounded-xl px-4 font-semibold ${
                      categoria === cat
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-300 text-neutral-800"
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
                    className="flex min-h-12 flex-col items-start justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-left disabled:opacity-50"
                  >
                    <span className="font-semibold leading-tight">
                      {item.nombre}
                    </span>
                    <span className="mt-1 text-sm tabular-nums text-neutral-700">
                      {formatearMxn(item.precio_centavos)}
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
                className="mt-4 flex flex-col gap-2 border-t pt-3"
              >
                <p className="text-sm font-medium">Otro (libre)</p>
                <input
                  className="min-h-12 rounded-xl border px-3"
                  placeholder="Descripción"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                  maxLength={80}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="min-h-12 rounded-xl border px-3"
                    placeholder="Cantidad"
                    value={cant}
                    onChange={(e) => setCant(e.target.value)}
                    inputMode="numeric"
                    required
                  />
                  <input
                    className="min-h-12 rounded-xl border px-3"
                    placeholder="Precio pesos"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    inputMode="decimal"
                    required
                  />
                </div>
                <input
                  className="min-h-12 rounded-xl border px-3"
                  placeholder="Notas (opcional)"
                  value={notasOtro}
                  onChange={(e) => setNotasOtro(e.target.value)}
                  maxLength={120}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-12 rounded-xl bg-neutral-900 font-semibold text-white"
                >
                  Guardar partida
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarOtro(false)}
                  className="min-h-12 text-sm underline"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarOtro(true)}
                className="mt-3 min-h-12 w-full rounded-xl border font-semibold"
              >
                Otro
              </button>
            )
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl bg-white/90 p-4">
        <h2 className="mb-3 text-lg font-semibold">Partidas</h2>
        <ul className="flex flex-col gap-2">
          {cuenta.partidas.map((partida) => (
            <li
              key={partida.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>
                {partida.cantidad}× {partida.descripcion}
                {partida.notas ? (
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {partida.notas}
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-2 tabular-nums">
                {formatearMxn(partida.cantidad * partida.precio_centavos)}
                {editable && !hayConsumo ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void quitar(partida.id);
                    }}
                    className="text-red-700 underline"
                  >
                    Quitar
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-lg font-semibold tabular-nums">
          Total {formatearMxn(cuenta.total_centavos)}
        </p>
      </section>

      <section className="rounded-2xl bg-white/90 p-4">
        <h2 className="mb-3 text-lg font-semibold">Historial de cobros</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-neutral-600">Aún no hay cobros.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {historial.map((cobro) => (
              <li key={cobro.id}>
                <Link
                  href={`/cobros/${cobro.id}`}
                  className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 text-sm"
                >
                  <span>
                    {etiquetaEstadoCobro(cobro.estado)} ·{" "}
                    {formatearMxn(cobro.monto_centavos)}
                  </span>
                  <span className="text-neutral-500">
                    {horaCorta(cobro.pagado_at ?? cobro.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="rounded-2xl bg-red-100 p-3 text-red-800">{error}</p>
      ) : null}

      {cuenta.estado === "pagada" && !cuenta.cerrada_at ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void cerrar();
          }}
          className="min-h-14 rounded-2xl bg-neutral-900 text-lg font-semibold text-white disabled:opacity-50"
        >
          Cerrar mesa
        </button>
      ) : null}

      {cuenta.estado !== "pagada" ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy || restante <= 0}
            onClick={() => {
              void cobrarTotal();
            }}
            className="min-h-14 rounded-2xl bg-emerald-800 text-lg font-semibold text-white disabled:opacity-50"
          >
            {restante <= 0
              ? "Cuenta cubierta"
              : `Cobrar total (${formatearMxn(restante)})`}
          </button>
          <Link
            href={`/cuentas/${cuentaId}/dividir`}
            className="flex min-h-14 items-center justify-center rounded-2xl border border-emerald-800 text-lg font-semibold text-emerald-900"
          >
            Dividir cuenta
          </Link>
        </div>
      ) : null}

      {sheetItem ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-titulo"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h3 id="sheet-titulo" className="text-xl font-semibold">
              {sheetItem.nombre}
            </h3>
            <p className="mt-1 tabular-nums text-neutral-700">
              {formatearMxn(sheetItem.precio_centavos)}
            </p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Menos"
                disabled={qty <= 1 || busy}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border text-2xl font-bold disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-8 text-center text-2xl font-semibold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Más"
                disabled={qty >= 99 || busy}
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border text-2xl font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
            <label className="mt-4 flex flex-col gap-1 text-sm">
              Notas (opcional)
              <input
                className="min-h-12 rounded-xl border px-3"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                maxLength={120}
                placeholder="Sin cebolla, poco picante…"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void agregarDelMenu();
              }}
              className="mt-4 min-h-14 w-full rounded-xl bg-neutral-900 text-lg font-semibold text-white disabled:opacity-50"
            >
              Agregar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setSheetItem(null)}
              className="mt-2 min-h-12 w-full rounded-xl border font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
