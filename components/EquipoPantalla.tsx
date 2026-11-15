"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";
import type { MeseroPublico } from "@/lib/meseros-types";

type ListaResponse = { meseros: MeseroPublico[] };
type CrearResponse = { mesero: MeseroPublico };

function CuentaPeyForm({
  meseroId,
  onSaved,
}: {
  meseroId: string;
  onSaved: () => void;
}): ReactElement {
  const [peyId, setPeyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/meseros/${meseroId}/cuenta-pey`, {
        method: "PATCH",
        withDemoToken: true,
        body: JSON.stringify({ peyBankAccountId: peyId.trim() }),
      });
      setPeyId("");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <input
        className="min-h-12 rounded-xl border px-3 font-mono text-sm"
        value={peyId}
        onChange={(e) => setPeyId(e.target.value)}
        placeholder="ULID pey del mesero"
        maxLength={26}
      />
      <button
        type="button"
        disabled={busy || peyId.trim().length === 0}
        onClick={() => {
          void guardar();
        }}
        className="min-h-12 rounded-xl bg-neutral-900 text-sm font-semibold text-white disabled:opacity-50"
      >
        Guardar cuenta pey
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function EquipoPantalla(): ReactElement {
  const [meseros, setMeseros] = useState<MeseroPublico[]>([]);
  const [nombre, setNombre] = useState("");
  const [peyId, setPeyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<ListaResponse>("/api/meseros");
      setMeseros(data.meseros);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
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
      const body: { nombre: string; peyBankAccountId?: string } = {
        nombre: nombre.trim(),
      };
      const pey = peyId.trim();
      if (pey.length > 0) {
        body.peyBankAccountId = pey;
      }
      await apiFetch<CrearResponse>("/api/meseros", {
        method: "POST",
        withDemoToken: true,
        body: JSON.stringify(body),
      });
      setNombre("");
      setPeyId("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-3">
        {meseros.map((m) => (
          <li key={m.id} className="rounded-2xl bg-white/90 p-4">
            <div className="flex min-h-10 items-center justify-between gap-2">
              <span className="font-medium">{m.nombre}</span>
              <span className="text-sm text-neutral-600">
                {m.tieneCuenta ? "Cuenta pey lista" : "Sin cuenta pey"}
              </span>
            </div>
            {!m.tieneCuenta ? (
              <CuentaPeyForm
                meseroId={m.id}
                onSaved={() => {
                  void cargar();
                }}
              />
            ) : null}
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="flex flex-col gap-3 rounded-2xl bg-white/90 p-4"
      >
        <h2 className="text-lg font-semibold">Agregar mesero</h2>
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="min-h-12 rounded-xl border px-3"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={80}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          ID de cuenta pey (opcional)
          <input
            className="min-h-12 rounded-xl border px-3 font-mono text-sm"
            value={peyId}
            onChange={(e) => setPeyId(e.target.value)}
            placeholder="01H…"
            maxLength={26}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="min-h-14 rounded-2xl bg-emerald-800 text-base font-semibold text-white disabled:opacity-50"
        >
          Guardar mesero
        </button>
      </form>
      {error ? <p className="text-red-700">{error}</p> : null}
    </div>
  );
}
