"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";

type Yo = { meseroId: string; rol: "mesero" | "admin" };

export function AbrirMesa(): ReactElement {
  const router = useRouter();
  const [mesa, setMesa] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [abierto, setAbierto] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const yo = await apiFetch<Yo>("/api/auth/yo");
      const data = await apiFetch<{ cuenta: { id: string } }>("/api/cuentas/abrir", {
        method: "POST",
        body: JSON.stringify({
          mesa,
          meseroId: yo.meseroId,
        }),
      });
      setMesa("");
      setAbierto(false);
      router.push(`/cuentas/${data.cuenta.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir");
    } finally {
      setBusy(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="min-h-14 w-full rounded-2xl bg-emerald-800 text-lg font-semibold text-white"
      >
        Abrir mesa
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-3 rounded-2xl bg-white/90 p-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        Número de mesa (1–999)
        <input
          className="min-h-12 rounded-xl border px-3"
          value={mesa}
          onChange={(e) => setMesa(e.target.value)}
          inputMode="numeric"
          required
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 flex-1 rounded-xl bg-emerald-800 font-semibold text-white disabled:opacity-50"
        >
          Abrir
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="min-h-12 flex-1 rounded-xl border font-semibold"
        >
          Cancelar
        </button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
