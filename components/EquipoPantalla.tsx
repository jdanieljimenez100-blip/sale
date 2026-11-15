"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { Boton } from "@/components/ui/Boton";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import type { MeseroPublico } from "@/lib/meseros-types";

type ListaResponse = { meseros: MeseroPublico[] };

export function EquipoPantalla(): ReactElement {
  const [meseros, setMeseros] = useState<MeseroPublico[]>([]);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<ListaResponse>("/api/meseros");
      setMeseros(data.meseros);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/meseros", {
        method: "POST",
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      setNombre("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  async function patch(
    id: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/meseros/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-linea rounded-hoja border border-linea bg-superficie">
        {meseros.map((m) => (
          <li key={m.id} className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-tinta">{m.nombre}</span>
                <span className="text-[13px] text-tinta-suave">
                  {m.rol} · {m.activo ? "activo" : "inactivo"}
                  {m.tienePin ? " · PIN" : " · sin PIN"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="pressable min-h-12 rounded-boton border border-linea px-3 text-[15px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                  onClick={() => {
                    const pin = window.prompt(
                      m.rol === "admin"
                        ? "PIN admin (6 dígitos)"
                        : "PIN mesero (4 dígitos)",
                    );
                    if (pin) {
                      void patch(m.id, { pin });
                    }
                  }}
                >
                  {m.tienePin ? "Reiniciar PIN" : "Poner PIN"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="pressable min-h-12 rounded-boton border border-linea px-3 text-[15px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                  onClick={() => {
                    void patch(m.id, {
                      rol: m.rol === "admin" ? "mesero" : "admin",
                    });
                  }}
                >
                  Rol: {m.rol === "admin" ? "hacer mesero" : "hacer admin"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="pressable min-h-12 rounded-boton border border-linea px-3 text-[15px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                  onClick={() => {
                    void patch(m.id, { activo: !m.activo });
                  }}
                >
                  {m.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="pressable min-h-12 rounded-boton border border-linea px-3 text-[15px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                  onClick={() => {
                    const ulid = window.prompt("ULID pey (vacío para quitar)");
                    if (ulid === null) {
                      return;
                    }
                    void patch(m.id, {
                      peyBankAccountId: ulid.trim() === "" ? null : ulid.trim(),
                    });
                  }}
                >
                  {m.tieneCuenta ? "Cambiar pey" : "Poner pey"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="flex flex-col gap-3 rounded-hoja border border-linea bg-superficie p-4"
      >
        <h2 className="text-[17px] font-semibold text-tinta">Agregar mesero</h2>
        <label className="flex flex-col gap-1 text-[15px] text-tinta">
          Nombre
          <input
            name="nombre"
            autoComplete="off"
            className="min-h-12 rounded-boton border border-linea px-3"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={80}
            placeholder="Nombre…"
          />
        </label>
        <Boton type="submit" tamano="lg" disabled={busy}>
          Guardar mesero
        </Boton>
      </form>
      {error ? (
        <p className="text-peligro" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
