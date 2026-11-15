"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";

type MeseroLogin = { id: string; nombre: string };

export function EntrarPantalla(): ReactElement {
  const router = useRouter();
  const [meseros, setMeseros] = useState<MeseroLogin[]>([]);
  const [elegido, setElegido] = useState<MeseroLogin | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ meseros: MeseroLogin[] }>(
          "/api/auth/login-lista",
        );
        setMeseros(data.meseros);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, []);

  function digito(d: string): void {
    setPin((p) => (p.length >= 6 ? p : p + d));
    setError(null);
  }

  async function enviar(): Promise<void> {
    if (!elegido || pin.length < 4) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ meseroId: elegido.id, pin }),
      });
      router.replace("/cuentas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN incorrecto");
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  if (!elegido) {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-800">
            Sale
          </p>
          <h1 className="mt-2 text-3xl font-semibold">¿Quién atiende?</h1>
        </header>
        {meseros.length === 0 ? (
          <p className="rounded-2xl bg-white/80 p-4 text-neutral-700">
            No hay meseros con PIN. Ve a{" "}
            <a href="/setup" className="underline">
              /setup
            </a>{" "}
            para el primer admin.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {meseros.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setElegido(m)}
                  className="min-h-14 w-full rounded-2xl bg-white/90 px-4 text-left text-lg font-semibold"
                >
                  {m.nombre}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error ? <p className="text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <button
          type="button"
          onClick={() => {
            setElegido(null);
            setPin("");
            setError(null);
          }}
          className="text-sm text-neutral-600 underline"
        >
          Otro mesero
        </button>
        <h1 className="mt-2 text-3xl font-semibold">Hola, {elegido.nombre}</h1>
        <p className="mt-1 text-neutral-700">Escribe tu PIN</p>
      </header>
      <p
        className="min-h-14 rounded-2xl bg-white/90 text-center text-3xl tracking-[0.4em]"
        aria-live="polite"
      >
        {"•".repeat(pin.length) || " "}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
          (tecla, i) => {
            if (tecla === "") {
              return <div key={`empty-${i}`} />;
            }
            return (
              <button
                key={tecla}
                type="button"
                disabled={busy}
                onClick={() => {
                  if (tecla === "⌫") {
                    setPin((p) => p.slice(0, -1));
                    return;
                  }
                  digito(tecla);
                }}
                className="min-h-16 rounded-2xl bg-neutral-900 text-2xl font-semibold text-white disabled:opacity-50"
              >
                {tecla}
              </button>
            );
          },
        )}
      </div>
      <button
        type="button"
        disabled={busy || pin.length < 4}
        onClick={() => {
          void enviar();
        }}
        className="min-h-14 rounded-2xl bg-emerald-800 text-lg font-semibold text-white disabled:opacity-50"
      >
        Entrar
      </button>
      {error ? <p className="text-center text-red-700">{error}</p> : null}
    </div>
  );
}
