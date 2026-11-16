"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { Boton } from "@/components/ui/Boton";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";

type NegocioResumen = {
  id: string;
  nombre: string;
  slug: string;
};

type YoRespuesta = {
  negocio: NegocioResumen;
  negocios: NegocioResumen[];
};

export function RestaurantesLista(): ReactElement {
  const router = useRouter();
  const [actualId, setActualId] = useState<string | null>(null);
  const [negocios, setNegocios] = useState<NegocioResumen[]>([]);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creadoId, setCreadoId] = useState<string | null>(null);

  async function cargar(): Promise<void> {
    const data = await apiFetch<YoRespuesta>("/api/auth/yo");
    setActualId(data.negocio.id);
    setNegocios(data.negocios);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await cargar();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function cambiarA(negocioId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/auth/cambiar-negocio", {
        method: "POST",
        body: JSON.stringify({ negocioId }),
      });
      window.location.assign("/cuentas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar");
      setBusy(false);
    }
  }

  async function crear(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreadoId(null);
    try {
      const creado = await apiFetch<NegocioResumen>("/api/negocios", {
        method: "POST",
        body: JSON.stringify({ nombre, slug }),
      });
      setNombre("");
      setSlug("");
      setMostrarNuevo(false);
      setCreadoId(creado.id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-linea rounded-hoja border border-linea bg-superficie">
        {negocios.map((n) => {
          const esActual = n.id === actualId;
          return (
            <li
              key={n.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold text-tinta">
                  {n.nombre}
                  {esActual ? (
                    <span className="ml-2 text-[13px] font-semibold text-primario">
                      Actual
                    </span>
                  ) : null}
                </p>
                <p className="font-mono text-[13px] text-tinta-suave">{n.slug}</p>
              </div>
              {!esActual ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void cambiarA(n.id);
                  }}
                  className="pressable min-h-12 shrink-0 rounded-boton border border-linea px-4 text-[15px] font-semibold text-tinta hover:bg-fondo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:opacity-50"
                >
                  Cambiar a este
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {creadoId ? (
        <div
          className="rounded-hoja border border-linea bg-superficie p-4"
          role="status"
        >
          <p className="text-[15px] text-tinta">
            Restaurante creado. ¿Quieres cambiar a él ahora?
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Boton
              disabled={busy}
              onClick={() => {
                void cambiarA(creadoId);
              }}
            >
              Sí, cambiar
            </Boton>
            <Boton
              variante="secundario"
              disabled={busy}
              onClick={() => {
                setCreadoId(null);
                router.refresh();
              }}
            >
              Más tarde
            </Boton>
          </div>
        </div>
      ) : null}

      {mostrarNuevo ? (
        <section className="rounded-hoja border border-linea bg-superficie p-4">
          <h2 className="mb-3 text-[17px] font-semibold text-tinta">
            Nuevo restaurante
          </h2>
          <form
            onSubmit={(e) => {
              void crear(e);
            }}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1 text-[15px] text-tinta">
              Nombre
              <input
                name="nombre"
                autoComplete="organization"
                className="min-h-12 rounded-boton border border-linea px-3"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-[15px] text-tinta">
              Código (slug)
              <input
                name="slug"
                autoComplete="off"
                spellCheck={false}
                className="min-h-12 rounded-boton border border-linea px-3 font-mono text-[15px]"
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
                pattern="[a-z0-9-]{3,40}"
                title="3 a 40 caracteres: minúsculas, números o guion"
                required
              />
            </label>
            <Boton type="submit" disabled={busy} cargando={busy}>
              Crear
            </Boton>
            <Boton
              type="button"
              variante="secundario"
              disabled={busy}
              onClick={() => setMostrarNuevo(false)}
            >
              Cancelar
            </Boton>
          </form>
        </section>
      ) : (
        <Boton
          variante="secundario"
          disabled={busy}
          onClick={() => setMostrarNuevo(true)}
        >
          Nuevo restaurante
        </Boton>
      )}

      {error ? (
        <p className="text-[15px] text-peligro" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
