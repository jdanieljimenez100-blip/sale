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
        className="flex flex-col gap-2 rounded-hoja border border-linea bg-superficie p-4"
      >
        <h2 className="text-[17px] font-semibold text-tinta">Agregar platillo</h2>
        <input
          name="nombre"
          autoComplete="off"
          className="min-h-12 rounded-boton border border-linea px-3"
          placeholder="Nombre…"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          maxLength={60}
        />
        <input
          name="categoria"
          autoComplete="off"
          className="min-h-12 rounded-boton border border-linea px-3"
          placeholder="Categoría (Tacos, Bebidas…)"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
          maxLength={30}
        />
        <input
          name="precio"
          autoComplete="off"
          className="min-h-12 rounded-boton border border-linea px-3"
          placeholder="Precio en pesos…"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          inputMode="decimal"
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="pressable min-h-12 rounded-boton bg-primario font-semibold text-primario-tinta disabled:opacity-50"
        >
          Agregar
        </button>
      </form>

      {error ? (
        <p className="rounded-hoja bg-peligro/10 p-3 text-peligro" role="alert">
          {error}
        </p>
      ) : null}

      {porCategoria.length === 0 ? (
        <p className="rounded-hoja border border-linea bg-superficie p-4 text-tinta-suave">
          Sin platillos todavía.
        </p>
      ) : (
        porCategoria.map(([cat, list]) => (
          <section
            key={cat}
            className="rounded-hoja border border-linea bg-superficie p-4"
          >
            <h2 className="mb-3 text-[17px] font-semibold text-tinta">{cat}</h2>
            <ul className="flex flex-col gap-3">
              {list.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-col gap-2 border-b border-linea pb-3 last:border-0 last:pb-0 ${
                    item.activo ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-tinta">{item.nombre}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void toggleActivo(item);
                      }}
                      className="pressable min-h-12 rounded-boton border border-linea px-3 text-[15px] font-semibold text-tinta"
                    >
                      {item.activo ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex flex-1 flex-col gap-1 text-[15px] text-tinta">
                      Precio (pesos)
                      <input
                        name={`precio-${item.id}`}
                        autoComplete="off"
                        className="min-h-12 rounded-boton border border-linea px-3 tabular"
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
                      className="pressable mt-5 min-h-12 rounded-boton bg-primario px-4 font-semibold text-primario-tinta disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                  <p className="text-[13px] tabular text-tinta-suave">
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
