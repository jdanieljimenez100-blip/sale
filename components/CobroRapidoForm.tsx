"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Monto } from "@/components/ui/Monto";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import { pesosTextoACentavos } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type CrearResponse = { cobro: Cobro };
type MenuResponse = { items: MenuItem[] };
type Yo = { meseroId: string };

type LineaMenu = {
  menuItemId: string;
  nombre: string;
  precioCentavos: number;
  cantidad: number;
};

function centavosAPesosTexto(centavos: number): string {
  const enteros = Math.floor(centavos / 100);
  const frac = centavos % 100;
  return `${enteros}.${String(frac).padStart(2, "0")}`;
}

function conceptoDesdeLineas(lineas: LineaMenu[]): string {
  if (lineas.length === 0) {
    return "Cobro rápido";
  }
  const texto = lineas
    .map((l) => `${l.cantidad}× ${l.nombre}`)
    .join(", ");
  return texto.length <= 120 ? texto : `${texto.slice(0, 117)}…`;
}

export function CobroRapidoForm(): ReactElement {
  const router = useRouter();
  const [pesos, setPesos] = useState("0.00");
  const [concepto, setConcepto] = useState("Cobro rápido");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [categoria, setCategoria] = useState("");
  const [lineas, setLineas] = useState<LineaMenu[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<MenuResponse>("/api/menu");
        setMenu(data.items);
        const cats = [...new Set(data.items.map((i) => i.categoria))];
        if (cats[0]) {
          setCategoria(cats[0]);
        }
      } catch {
        setMenu([]);
      } finally {
        setMenuLoading(false);
      }
    })();
  }, []);

  const categorias = useMemo(() => {
    const set = new Set(menu.map((i) => i.categoria));
    return [...set];
  }, [menu]);

  const itemsCategoria = useMemo(
    () => menu.filter((i) => i.categoria === categoria),
    [menu, categoria],
  );

  const totalMenuCentavos = useMemo(
    () =>
      lineas.reduce(
        (acc, l) => acc + l.cantidad * l.precioCentavos,
        0,
      ),
    [lineas],
  );

  const previewCentavos = ((): number => {
    if (lineas.length > 0) {
      return totalMenuCentavos;
    }
    if (!pesos.trim()) {
      return 0;
    }
    try {
      return pesosTextoACentavos(pesos);
    } catch {
      return 0;
    }
  })();

  function sincronizarDesdeLineas(next: LineaMenu[]): void {
    setLineas(next);
    const total = next.reduce(
      (acc, l) => acc + l.cantidad * l.precioCentavos,
      0,
    );
    setPesos(centavosAPesosTexto(total));
    setConcepto(conceptoDesdeLineas(next));
  }

  function agregarDelMenu(item: MenuItem): void {
    setError(null);
    const next = [...lineas];
    const idx = next.findIndex((l) => l.menuItemId === item.id);
    if (idx >= 0) {
      const actual = next[idx];
      if (!actual) {
        return;
      }
      next[idx] = { ...actual, cantidad: actual.cantidad + 1 };
    } else {
      next.push({
        menuItemId: item.id,
        nombre: item.nombre,
        precioCentavos: item.precio_centavos,
        cantidad: 1,
      });
    }
    sincronizarDesdeLineas(next);
  }

  function quitarUno(menuItemId: string): void {
    const next = lineas
      .map((l) =>
        l.menuItemId === menuItemId
          ? { ...l, cantidad: l.cantidad - 1 }
          : l,
      )
      .filter((l) => l.cantidad > 0);
    sincronizarDesdeLineas(next);
  }

  function onPesosManual(valor: string): void {
    setPesos(valor);
    if (lineas.length > 0) {
      setLineas([]);
      if (concepto === conceptoDesdeLineas(lineas) || concepto.includes("×")) {
        setConcepto("Cobro rápido");
      }
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const yo = await apiFetch<Yo>("/api/auth/yo");
      const montoCentavos =
        lineas.length > 0
          ? totalMenuCentavos
          : pesosTextoACentavos(pesos);
      if (montoCentavos <= 0) {
        throw new Error("El monto debe ser mayor a cero");
      }
      const data = await apiFetch<CrearResponse>("/api/cobros", {
        method: "POST",
        body: JSON.stringify({
          meseroId: yo.meseroId,
          tipo: "consumo",
          montoCentavos,
          concepto: concepto.trim() || "Cobro rápido",
        }),
      });
      router.push(`/cobros/${data.cobro.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-4 pb-28"
    >
      <label className="flex flex-col gap-2 text-[15px] text-tinta">
        Monto en pesos
        <input
          name="monto"
          autoComplete="off"
          className="min-h-14 rounded-boton border border-linea bg-superficie px-4 font-mesa text-[32px] font-bold tabular text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          value={pesos}
          onChange={(e) => onPesosManual(e.target.value)}
          inputMode="decimal"
          placeholder="0.01…"
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-[15px] text-tinta">
        Concepto
        <input
          name="concepto"
          autoComplete="off"
          className="min-h-14 rounded-boton border border-linea bg-superficie px-4 text-[17px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          maxLength={120}
          required
        />
      </label>

      <section className="rounded-hoja border border-linea bg-superficie">
        <h2 className="border-b border-linea px-4 py-3 text-[17px] font-semibold text-tinta">
          Sumar del menú
        </h2>
        <div className="flex flex-col gap-3 p-3">
          {menuLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : categorias.length === 0 ? (
            <p className="px-1 text-[15px] text-tinta-suave">
              No hay platillos activos. Puedes cobrar solo con monto.
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
                    onClick={() => agregarDelMenu(item)}
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

          {lineas.length > 0 ? (
            <ul className="divide-y divide-linea rounded-boton border border-linea">
              {lineas.map((l) => (
                <li
                  key={l.menuItemId}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-[15px]"
                >
                  <span className="min-w-0 font-medium text-tinta">
                    {l.cantidad}× {l.nombre}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular text-tinta">
                      <Monto centavos={l.cantidad * l.precioCentavos} />
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => quitarUno(l.menuItemId)}
                      className="pressable min-h-11 min-w-11 rounded-boton text-[15px] font-semibold text-peligro focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                      aria-label={`Quitar uno de ${l.nombre}`}
                    >
                      −
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {error ? (
        <p className="text-peligro" role="alert">
          {error}
        </p>
      ) : null}
      <div
        className="barra-accion-fija fixed inset-x-0 z-30 mx-auto max-w-lg bg-superficie px-4 pt-2"
        style={{
          bottom: "calc(4rem + env(safe-area-inset-bottom))",
        }}
      >
        <Boton type="submit" tamano="lg" disabled={busy || previewCentavos <= 0}>
          {previewCentavos > 0 ? (
            <>
              Cobrar <Monto centavos={previewCentavos} />
            </>
          ) : (
            "Cobrar"
          )}
        </Boton>
      </div>
    </form>
  );
}
