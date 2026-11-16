"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { PropinasAjustes } from "@/components/PropinasAjustes";
import { QrImage } from "@/components/QrImage";
import { Boton } from "@/components/ui/Boton";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";
import {
  estadoConexionPey,
  etiquetaEstadoConexionPey,
} from "@/lib/pey-conexion";
import { formatearFechaPagoCdmx } from "@/lib/ticket";
import type { NegocioPeyPublico } from "@/services/negocio-pey";

type NegocioPerfil = {
  id: string;
  nombre: string;
  slug: string;
};

function ChipConexion({
  pey,
}: {
  pey: NegocioPeyPublico;
}): ReactElement {
  const estado = estadoConexionPey({
    configurado: pey.configurado,
    usaEntorno: pey.usaPeyEntorno,
    ultimoWebhookAt: pey.ultimoWebhookAt,
  });
  const texto = etiquetaEstadoConexionPey(
    estado,
    pey.ultimoWebhookAt,
    formatearFechaPagoCdmx,
  );
  const clase =
    estado === "sin_conectar"
      ? "bg-pendiente-bg text-pendiente-fg"
      : estado === "servidor"
        ? "bg-parcial-bg text-parcial-fg"
        : "bg-pagada-bg text-pagada-fg";
  return (
    <span
      className={`inline-flex min-h-10 items-center rounded-boton px-3 text-sm font-semibold ${clase}`}
    >
      {texto}
    </span>
  );
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export function RestauranteAjustes(): ReactElement {
  const [perfil, setPerfil] = useState<NegocioPerfil | null>(null);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [pey, setPey] = useState<NegocioPeyPublico | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okPerfil, setOkPerfil] = useState(false);
  const [okPey, setOkPey] = useState(false);
  const [busyPerfil, setBusyPerfil] = useState(false);
  const [busyPey, setBusyPey] = useState(false);
  const [busyVerificar, setBusyVerificar] = useState(false);
  const [copiadoWebhook, setCopiadoWebhook] = useState(false);
  const [copiadoEntrar, setCopiadoEntrar] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrigin(window.location.origin);
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, config] = await Promise.all([
          apiFetch<NegocioPerfil>("/api/negocio"),
          apiFetch<NegocioPeyPublico>("/api/negocio/pey"),
        ]);
        setPerfil(p);
        setNombre(p.nombre);
        setSlug(p.slug);
        setPey(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function guardarPerfil(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusyPerfil(true);
    setError(null);
    setOkPerfil(false);
    try {
      const data = await apiFetch<NegocioPerfil>("/api/negocio", {
        method: "PATCH",
        body: JSON.stringify({ nombre, slug }),
      });
      setPerfil(data);
      setNombre(data.nombre);
      setSlug(data.slug);
      setOkPerfil(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusyPerfil(false);
    }
  }

  async function guardarPey(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusyPey(true);
    setError(null);
    setOkPey(false);
    try {
      const body: {
        apiKey?: string;
        webhookSecret?: string;
        bankAccountId?: string;
      } = {};
      if (apiKey.trim()) {
        body.apiKey = apiKey.trim();
      }
      if (webhookSecret.trim()) {
        body.webhookSecret = webhookSecret.trim();
      }
      if (bankAccountId.trim()) {
        body.bankAccountId = bankAccountId.trim();
      }
      if (
        body.apiKey === undefined &&
        body.webhookSecret === undefined &&
        body.bankAccountId === undefined
      ) {
        setError("Escribe la API key, el secreto o la cuenta para guardar");
        return;
      }
      const data = await apiFetch<NegocioPeyPublico>("/api/negocio/pey", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setPey(data);
      setApiKey("");
      setWebhookSecret("");
      setBankAccountId("");
      setOkPey(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar pey");
    } finally {
      setBusyPey(false);
    }
  }

  async function verificarCuenta(): Promise<void> {
    if (!bankAccountId.trim()) {
      setError("Escribe el id de la cuenta bancaria (ULID) para verificar");
      return;
    }
    setBusyVerificar(true);
    setError(null);
    setOkPey(false);
    try {
      const data = await apiFetch<NegocioPeyPublico>("/api/negocio/pey", {
        method: "PUT",
        body: JSON.stringify({ bankAccountId: bankAccountId.trim() }),
      });
      setPey(data);
      setBankAccountId("");
      setOkPey(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar");
    } finally {
      setBusyVerificar(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const entrarUrl =
    perfil && origin ? `${origin}/entrar?r=${encodeURIComponent(perfil.slug)}` : "";

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-hoja border border-linea bg-superficie p-4">
        <h2 className="mb-2 text-[17px] font-semibold text-tinta">
          Nombre y código
        </h2>
        <form
          onSubmit={(e) => {
            void guardarPerfil(e);
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
          <p className="text-[13px] text-tinta-suave">
            Minúsculas, números y guion. Único entre restaurantes.
          </p>
          <Boton type="submit" disabled={busyPerfil} cargando={busyPerfil}>
            Guardar nombre
          </Boton>
        </form>
        {okPerfil ? (
          <p className="mt-2 text-[15px] text-pagada-fg" role="status">
            Guardado.
          </p>
        ) : null}
      </section>

      <PropinasAjustes />

      <section className="rounded-hoja border border-linea bg-superficie p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-[17px] font-semibold text-tinta">
            Conexión con pey
          </h2>
          {pey ? <ChipConexion pey={pey} /> : null}
        </div>

        {pey?.usaPeyEntorno ? (
          <p className="mb-3 text-[15px] text-tinta-suave">
            Usando la configuración del servidor. No hace falta pegar llaves
            aquí.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              void guardarPey(e);
            }}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1 text-[15px] text-tinta">
              API key
              <input
                name="apiKey"
                type="password"
                autoComplete="new-password"
                className="min-h-12 rounded-boton border border-linea px-3"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Pega la API key"
              />
              {pey?.apiKeyUltimos4 ? (
                <span className="text-[13px] text-tinta-suave">
                  Guardada: •••• {pey.apiKeyUltimos4}
                </span>
              ) : (
                <span className="text-[13px] text-tinta-suave">
                  Aún no hay API key guardada.
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-[15px] text-tinta">
              Secreto del webhook
              <input
                name="webhookSecret"
                type="password"
                autoComplete="new-password"
                className="min-h-12 rounded-boton border border-linea px-3"
                value={webhookSecret}
                onChange={(event) => setWebhookSecret(event.target.value)}
                placeholder="Pega el secreto"
              />
            </label>
            <Boton type="submit" disabled={busyPey} cargando={busyPey}>
              Guardar llaves
            </Boton>
          </form>
        )}

        {pey ? (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[15px] font-semibold text-tinta">
              URL del webhook
            </p>
            <p className="break-all rounded-boton border border-linea bg-fondo px-3 py-2 font-mono text-[13px] text-tinta">
              {pey.webhookUrl}
            </p>
            <Boton
              variante="secundario"
              onClick={() => {
                void (async () => {
                  const ok = await copiarTexto(pey.webhookUrl);
                  if (ok) {
                    setCopiadoWebhook(true);
                    window.setTimeout(() => setCopiadoWebhook(false), 2000);
                  } else {
                    setError("No se pudo copiar la URL");
                  }
                })();
              }}
            >
              {copiadoWebhook ? "URL copiada" : "Copiar URL"}
            </Boton>
            <p className="text-[15px] text-tinta-suave">
              Pégala en el portal de pey, en el webhook de ESTA API key.
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[15px] text-tinta">
            Cuenta bancaria del restaurante (ULID)
            <input
              name="bankAccountId"
              autoComplete="off"
              spellCheck={false}
              className="min-h-12 rounded-boton border border-linea px-3 font-mono text-[15px]"
              value={bankAccountId}
              onChange={(event) => setBankAccountId(event.target.value)}
              placeholder="ULID de pey"
            />
          </label>
          {pey?.cuentaRestaurante.ultimos4 ? (
            <p className="text-[13px] text-tinta-suave">
              Guardada: •••• {pey.cuentaRestaurante.ultimos4}
              {pey.cuentaRestaurante.codiStatus
                ? ` · CoDi: ${pey.cuentaRestaurante.codiStatus}`
                : null}
            </p>
          ) : (
            <p className="text-[13px] text-tinta-suave">
              Aún no hay cuenta verificada.
            </p>
          )}
          <Boton
            variante="secundario"
            disabled={busyVerificar}
            cargando={busyVerificar}
            onClick={() => {
              void verificarCuenta();
            }}
          >
            Verificar
          </Boton>
        </div>

        {okPey ? (
          <p className="mt-2 text-[15px] text-pagada-fg" role="status">
            Guardado.
          </p>
        ) : null}
      </section>

      <section className="rounded-hoja border border-linea bg-superficie p-4">
        <h2 className="mb-2 text-[17px] font-semibold text-tinta">
          Dispositivos del salón
        </h2>
        <p className="mb-3 text-[15px] text-tinta-suave">
          Comparte este enlace o el QR para que tabletas y celulares abran el
          login de este restaurante.
        </p>
        {entrarUrl ? (
          <>
            <p className="mb-2 break-all rounded-boton border border-linea bg-fondo px-3 py-2 font-mono text-[13px] text-tinta">
              {entrarUrl}
            </p>
            <Boton
              variante="secundario"
              className="mb-3"
              onClick={() => {
                void (async () => {
                  const ok = await copiarTexto(entrarUrl);
                  if (ok) {
                    setCopiadoEntrar(true);
                    window.setTimeout(() => setCopiadoEntrar(false), 2000);
                  } else {
                    setError("No se pudo copiar el enlace");
                  }
                })();
              }}
            >
              {copiadoEntrar ? "Enlace copiado" : "Copiar enlace"}
            </Boton>
            <QrImage
              value={entrarUrl}
              label={`Entrar restaurante ${perfil?.slug ?? ""}`}
            />
          </>
        ) : null}
      </section>

      {error ? (
        <p className="text-[15px] text-peligro" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
