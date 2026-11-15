"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";

export function SetupPantalla(): ReactElement {
  const router = useRouter();
  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [demoToken, setDemoToken] = useState("");
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await apiFetch("/api/setup");
        setDisponible(true);
      } catch {
        setDisponible(false);
      }
    })();
  }, []);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/setup", {
        method: "POST",
        body: JSON.stringify({ demoToken, nombre, pin }),
      });
      router.replace("/entrar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setBusy(false);
    }
  }

  if (disponible === null) {
    return <p className="p-4">Cargando…</p>;
  }
  if (!disponible) {
    return (
      <p className="rounded-2xl bg-red-100 p-4 text-red-800">
        Setup no disponible (ya hay un admin).
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-4 rounded-2xl bg-white/90 p-4"
    >
      <h1 className="text-2xl font-semibold">Primer admin</h1>
      <p className="text-sm text-neutral-600">
        Usa el DEMO_ACCESS_TOKEN del servidor. PIN de 6 dígitos.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Token de demo
        <input
          className="min-h-12 rounded-xl border px-3"
          value={demoToken}
          onChange={(e) => setDemoToken(e.target.value)}
          autoComplete="off"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          className="min-h-12 rounded-xl border px-3"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        PIN (6 dígitos)
        <input
          className="min-h-12 rounded-xl border px-3"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          inputMode="numeric"
          maxLength={6}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="min-h-14 rounded-xl bg-emerald-800 font-semibold text-white disabled:opacity-50"
      >
        Crear admin
      </button>
      {error ? <p className="text-red-700">{error}</p> : null}
    </form>
  );
}
