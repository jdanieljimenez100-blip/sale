"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Boton } from "@/components/ui/Boton";
import { Skeleton } from "@/components/ui/Skeleton";
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
    return (
      <div aria-busy="true">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!disponible) {
    return (
      <p className="rounded-hoja bg-peligro/10 p-4 text-peligro" role="alert">
        Setup no disponible (ya hay un admin).
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-4 rounded-hoja border border-linea bg-superficie p-4"
    >
      <h1 className="text-[22px] font-semibold text-tinta">Primer admin</h1>
      <p className="text-[15px] text-tinta-suave">
        Usa el DEMO_ACCESS_TOKEN del servidor. PIN de 6 dígitos.
      </p>
      <label className="flex flex-col gap-1 text-[15px] text-tinta">
        Token de demo
        <input
          name="demoToken"
          autoComplete="off"
          spellCheck={false}
          className="min-h-12 rounded-boton border border-linea px-3"
          value={demoToken}
          onChange={(e) => setDemoToken(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-[15px] text-tinta">
        Nombre
        <input
          name="nombre"
          autoComplete="name"
          className="min-h-12 rounded-boton border border-linea px-3"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-[15px] text-tinta">
        PIN (6 dígitos)
        <input
          name="pin"
          autoComplete="one-time-code"
          className="min-h-12 rounded-boton border border-linea px-3"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          inputMode="numeric"
          maxLength={6}
        />
      </label>
      <Boton type="submit" tamano="lg" disabled={busy}>
        Crear admin
      </Boton>
      {error ? (
        <p className="text-peligro" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
