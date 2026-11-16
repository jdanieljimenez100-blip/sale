"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { PasoBienvenida } from "@/components/entrar/PasoBienvenida";
import { PasoMeseros } from "@/components/entrar/PasoMeseros";
import { PasoPin } from "@/components/entrar/PasoPin";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiClientError, apiFetch } from "@/lib/client-api";
import {
  borrarSlugCookie,
  guardarSlugCookie,
  leerSlugCookie,
  MSG_BLOQUEO,
  MSG_PIN,
  MSG_RESTAURANTE,
  PIN_MAX,
  PIN_MIN,
  type LoginListaRespuesta,
  type MeseroLogin,
  type NegocioLogin,
  type PasoEntrar,
} from "@/lib/entrar";
import { slugValido } from "@/lib/negocio-slug";

export { COOKIE_RESTAURANTE } from "@/lib/entrar";

export function EntrarPantalla({
  slugDesdeUrl,
}: {
  slugDesdeUrl: string | null;
}): ReactElement {
  const router = useRouter();
  const tituloId = useId();
  const pasoRootRef = useRef<HTMLDivElement>(null);
  const enviarRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const [slug, setSlug] = useState<string | null>(slugDesdeUrl);
  const [negocio, setNegocio] = useState<NegocioLogin | null>(null);
  const [meseros, setMeseros] = useState<MeseroLogin[]>([]);
  const [pedirCodigo, setPedirCodigo] = useState(false);
  const [paso, setPaso] = useState<PasoEntrar>(1);
  const [elegido, setElegido] = useState<MeseroLogin | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listo, setListo] = useState(false);
  const [codigoBorrador, setCodigoBorrador] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (slugDesdeUrl) {
      guardarSlugCookie(slugDesdeUrl);
      setSlug(slugDesdeUrl);
      setPedirCodigo(false);
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
      setError(null);
      try {
        const q = slug ? `?r=${encodeURIComponent(slug)}` : "";
        const data = await apiFetch<LoginListaRespuesta>(
          `/api/auth/login-lista${q}`,
        );
        if ("necesitaRestaurante" in data && data.necesitaRestaurante) {
          setPedirCodigo(true);
          setNegocio(null);
          setMeseros([]);
          setPaso(1);
          return;
        }
        if ("meseros" in data) {
          if (slug && data.meseros.length === 0 && !data.negocio) {
            setPedirCodigo(true);
            setNegocio(null);
            setMeseros([]);
            setPaso(1);
            setError(MSG_RESTAURANTE);
            return;
          }
          setPedirCodigo(false);
          setMeseros(data.meseros);
          if (data.negocio) {
            setNegocio(data.negocio);
          } else if (data.slug) {
            setNegocio({ nombre: data.slug, slug: data.slug });
          }
          if (data.slug) {
            setSlug(data.slug);
            guardarSlugCookie(data.slug);
          }
          setPaso(1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [listo, slug]);

  useEffect(() => {
    if (!shake) {
      return undefined;
    }
    const t = window.setTimeout(() => setShake(false), 450);
    return () => window.clearTimeout(t);
  }, [shake]);

  async function enviarPin(): Promise<void> {
    if (!elegido || pin.length < PIN_MIN || bloqueado || busy) {
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
      setPin("");
      if (err instanceof ApiClientError && err.status === 423) {
        setBloqueado(true);
        setError(MSG_BLOQUEO);
      } else {
        setShake(true);
        setError(MSG_PIN);
      }
    } finally {
      setBusy(false);
    }
  }

  enviarRef.current = enviarPin;

  useEffect(() => {
    const root = pasoRootRef.current;
    if (!root || loading) {
      return;
    }
    const heading = root.querySelector<HTMLElement>("h1");
    heading?.focus({ preventScroll: true });
  }, [paso, loading, pedirCodigo, negocio]);

  useEffect(() => {
    if (paso !== 3 || !elegido || bloqueado || busy) {
      return;
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();
        setPin((p) => (p.length >= PIN_MAX ? p : p + event.key));
        setError(null);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void enviarRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paso, elegido, bloqueado, busy]);

  function confirmarCodigo(): void {
    const raw = codigoBorrador.trim().toLowerCase();
    setError(null);
    if (!slugValido(raw)) {
      setError(MSG_RESTAURANTE);
      return;
    }
    guardarSlugCookie(raw);
    setPedirCodigo(false);
    setSlug(raw);
  }

  function cambiarRestaurante(): void {
    borrarSlugCookie();
    setSlug(null);
    setNegocio(null);
    setMeseros([]);
    setElegido(null);
    setPin("");
    setBloqueado(false);
    setCodigoBorrador("");
    setPedirCodigo(true);
    setPaso(1);
    setError(null);
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

  return (
    <div ref={pasoRootRef} className="flex flex-col gap-5">
      <div key={paso} className="entrar-paso flex flex-col gap-5">
        {paso === 1 ? (
          <PasoBienvenida
            tituloId={tituloId}
            mostrarFormCodigo={pedirCodigo || !negocio}
            negocio={negocio}
            codigoBorrador={codigoBorrador}
            onCodigoChange={setCodigoBorrador}
            onConfirmarCodigo={confirmarCodigo}
            onCambiarRestaurante={cambiarRestaurante}
            onContinuar={() => {
              setError(null);
              setPaso(2);
            }}
          />
        ) : null}

        {paso === 2 ? (
          <PasoMeseros
            tituloId={tituloId}
            meseros={meseros}
            onAtras={() => setPaso(1)}
            onElegir={(m) => {
              setElegido(m);
              setPin("");
              setError(null);
              setBloqueado(false);
              setPaso(3);
            }}
          />
        ) : null}

        {paso === 3 && elegido ? (
          <PasoPin
            tituloId={tituloId}
            elegido={elegido}
            pin={pin}
            busy={busy}
            bloqueado={bloqueado}
            shake={shake}
            onVolver={() => {
              setElegido(null);
              setPin("");
              setError(null);
              setBloqueado(false);
              setPaso(2);
            }}
            onDigito={(d) => {
              if (bloqueado) {
                return;
              }
              setPin((p) => (p.length >= PIN_MAX ? p : p + d));
              setError(null);
            }}
            onBorrar={() => setPin((p) => p.slice(0, -1))}
            onEntrar={() => {
              void enviarPin();
            }}
          />
        ) : null}
      </div>

      <div aria-live="assertive" aria-atomic="true" className="min-h-5">
        {error ? (
          <p className="text-center text-[15px] text-peligro" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
