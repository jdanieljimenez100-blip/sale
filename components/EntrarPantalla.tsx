"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { Boton } from "@/components/ui/Boton";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";

export const COOKIE_RESTAURANTE = "sale_restaurante";

type MeseroLogin = { id: string; nombre: string };

function leerSlugCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_RESTAURANTE}=`));
  if (!match) {
    return null;
  }
  const valor = decodeURIComponent(match.slice(COOKIE_RESTAURANTE.length + 1));
  return /^[a-z0-9-]{3,40}$/.test(valor) ? valor : null;
}

function guardarSlugCookie(slug: string): void {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_RESTAURANTE}=${encodeURIComponent(slug)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function EntrarPantalla({
  slugDesdeUrl,
}: {
  slugDesdeUrl: string | null;
}): ReactElement {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(slugDesdeUrl);
  const [meseros, setMeseros] = useState<MeseroLogin[]>([]);
  const [necesitaRestaurante, setNecesitaRestaurante] = useState(false);
  const [elegido, setElegido] = useState<MeseroLogin | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (slugDesdeUrl) {
      guardarSlugCookie(slugDesdeUrl);
      setSlug(slugDesdeUrl);
    } else {
      setSlug(leerSlugCookie());
    }
    setListo(true);
  }, [slugDesdeUrl]);

  useEffect(() => {
    if (!listo) {
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const q = slug ? `?r=${encodeURIComponent(slug)}` : "";
        const data = await apiFetch<
          | { meseros: MeseroLogin[]; slug?: string }
          | { necesitaRestaurante: true }
        >(`/api/auth/login-lista${q}`);
        if ("necesitaRestaurante" in data && data.necesitaRestaurante) {
          setNecesitaRestaurante(true);
          setMeseros([]);
        } else if ("meseros" in data) {
          setNecesitaRestaurante(false);
          setMeseros(data.meseros);
          if (data.slug) {
            setSlug(data.slug);
            guardarSlugCookie(data.slug);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [listo, slug]);

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
      const body: { meseroId: string; pin: string; r?: string } = {
        meseroId: elegido.id,
        pin,
      };
      if (slug) {
        body.r = slug;
      }
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.replace("/cuentas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN incorrecto");
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  if (!listo || loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (necesitaRestaurante) {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <p className="text-[15px] font-semibold text-primario">Sale</p>
          <h1 className="mt-2 text-[32px] font-semibold text-tinta text-pretty">
            Elige tu restaurante
          </h1>
          <p className="mt-2 text-[15px] text-tinta-suave">
            Abre el enlace que te compartió tu admin (lleva el nombre del
            restaurante en la dirección).
          </p>
        </header>
      </div>
    );
  }

  if (!elegido) {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <p className="text-[15px] font-semibold text-primario">Sale</p>
          <h1 className="mt-2 text-[32px] font-semibold text-tinta text-pretty">
            ¿Quién atiende?
          </h1>
        </header>
        {meseros.length === 0 ? (
          <p className="rounded-hoja border border-linea bg-superficie p-4 text-tinta-suave">
            No hay meseros con PIN. Ve a{" "}
            <a href="/setup" className="font-semibold text-primario underline">
              /setup
            </a>{" "}
            para el primer admin.
          </p>
        ) : (
          <ul className="divide-y divide-linea rounded-hoja border border-linea bg-superficie">
            {meseros.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setElegido(m)}
                  className="pressable flex min-h-14 w-full items-center px-4 text-left text-[17px] font-semibold text-tinta hover:bg-fondo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primario"
                >
                  {m.nombre}
                </button>
              </li>
            ))}
          </ul>
        )}
        {error ? (
          <p className="text-peligro" role="alert">
            {error}
          </p>
        ) : null}
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
          className="text-[15px] text-tinta-suave underline underline-offset-2"
        >
          Otro mesero
        </button>
        <h1 className="mt-2 text-[32px] font-semibold text-tinta text-pretty">
          Hola, {elegido.nombre}
        </h1>
        <p className="mt-1 text-tinta-suave">Escribe tu PIN</p>
      </header>
      <p
        className="flex min-h-14 items-center justify-center rounded-hoja border border-linea bg-superficie text-[32px] tracking-[0.4em] text-tinta"
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
                aria-label={tecla === "⌫" ? "Borrar" : undefined}
                onClick={() => {
                  if (tecla === "⌫") {
                    setPin((p) => p.slice(0, -1));
                    return;
                  }
                  digito(tecla);
                }}
                className="pressable flex min-h-16 items-center justify-center rounded-boton bg-tinta text-[22px] font-semibold text-primario-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:opacity-50"
              >
                {tecla}
              </button>
            );
          },
        )}
      </div>
      <Boton
        tamano="lg"
        disabled={busy || pin.length < 4}
        onClick={() => {
          void enviar();
        }}
      >
        Entrar
      </Boton>
      {error ? (
        <p className="text-center text-peligro" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
