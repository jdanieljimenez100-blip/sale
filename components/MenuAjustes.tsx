"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { apiFetch } from "@/lib/client-api";
import { formatearMxn, pesosTextoACentavos } from "@/lib/money";
import type { Database } from "@/lib/supabase/types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type MenuResponse = { items: MenuItem[] };
type ItemResponse = { item: MenuItem };

function centavosATextoPesos(centavos: number): string {
  const enteros = Math.floor(centavos / 100);
  const frac = centavos % 100;
  if (frac === 0) {
    return String(enteros);
  }
  return `${enteros}.${String(frac).padStart(2, "0")}`;
}

export function MenuAjustes(): ReactElement {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [editPrecio, setEditPrecio] = useState<Record<string, string>>({});

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<MenuResponse>("/api/menu?todos=1");
      setItems(data.items);
      setError(null);
      const precios: Record<string, string> = {};
      for (const item of data.items) {
        precios[item.id] = centavosATextoPesos(item.precio_centavos);
      }
      setEditPrecio(precios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      const list = map.get(item.categoria) ?? [];
      list.push(item);
      map.set(item.categoria, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [items]);

  async function crear(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch<ItemResponse>("/api/menu", {
        method: "POST",
        body: JSON.stringify({
          nombre,
          categoria,
          precioPesos: precio,
        }),
      });
      setNombre("");
      setCategoria("");
      setPrecio("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setBusy(false);
    }
  }

  async function guardarPrecio(id: string): Promise<void> {
    const texto = editPrecio[id];
    if (texto === undefined) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      pesosTextoACentavos(texto);
      await apiFetch<ItemResponse>(`/api/menu/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ precioPesos: texto }),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActivo(item: MenuItem): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch<ItemResponse>(`/api/menu/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !item.activo }),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(e) => void crear(e)}
        className="flex flex-col gap-2 rounded-2xl bg-white/90 p-4"
      >
        <h2 className="text-lg font-semibold">Agregar platillo</h2>
        <input
          className="min-h-12 rounded-xl border px-3"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          maxLength={60}
        />
        <input
          className="min-h-12 rounded-xl border px-3"
          placeholder="Categoría (Tacos, Bebidas…)"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
          maxLength={30}
        />
        <input
          className="min-h-12 rounded-xl border px-3"
          placeholder="Precio en pesos"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          inputMode="decimal"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-xl bg-neutral-900 font-semibold text-white disabled:opacity-50"
        >
          Agregar
        </button>
      </form>

      {error ? (
        <p className="rounded-2xl bg-red-100 p-3 text-red-800">{error}</p>
      ) : null}

      {porCategoria.length === 0 ? (
        <p className="rounded-2xl bg-white/70 p-4 text-neutral-700">
          Sin platillos todavía.
        </p>
      ) : (
        porCategoria.map(([cat, list]) => (
          <section key={cat} className="rounded-2xl bg-white/90 p-4">
            <h2 className="mb-3 text-lg font-semibold">{cat}</h2>
            <ul className="flex flex-col gap-3">
              {list.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-col gap-2 border-b border-neutral-100 pb-3 last:border-0 last:pb-0 ${
                    item.activo ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{item.nombre}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void toggleActivo(item);
                      }}
                      className="min-h-12 rounded-xl border px-3 text-sm font-semibold"
                    >
                      {item.activo ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex flex-1 flex-col gap-1 text-sm">
                      Precio (pesos)
                      <input
                        className="min-h-12 rounded-xl border px-3 tabular-nums"
                        value={editPrecio[item.id] ?? ""}
                        onChange={(e) =>
                          setEditPrecio((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        inputMode="decimal"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void guardarPrecio(item.id);
                      }}
                      className="mt-5 min-h-12 rounded-xl bg-neutral-900 px-4 font-semibold text-white disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 tabular-nums">
                    Actual: {formatearMxn(item.precio_centavos)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
