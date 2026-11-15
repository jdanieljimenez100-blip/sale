"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useSesion } from "@/components/SesionContext";
import { Boton } from "@/components/ui/Boton";
import { Hoja } from "@/components/ui/Hoja";
import { apiFetch } from "@/lib/client-api";
import type { MeseroPublico } from "@/lib/meseros-types";

export function AbrirMesa({
  triggerClassName = "",
}: {
  triggerClassName?: string;
}): ReactElement {
  const router = useRouter();
  const yo = useSesion();
  const esAdmin = yo.rol === "admin";
  const [mesa, setMesa] = useState("");
  const [meseroId, setMeseroId] = useState(yo.meseroId);
  const [meseros, setMeseros] = useState<MeseroPublico[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto || !esAdmin) {
      return;
    }
    void (async () => {
      try {
        const data = await apiFetch<{ meseros: MeseroPublico[] }>("/api/meseros");
        const activos = data.meseros.filter((m) => m.activo);
        setMeseros(activos);
        setMeseroId((actual) =>
          activos.some((m) => m.id === actual) ? actual : yo.meseroId,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar meseros",
        );
      }
    })();
  }, [abierto, esAdmin, yo.meseroId]);

  function cerrar(): void {
    setAbierto(false);
    setError(null);
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ cuenta: { id: string } }>(
        "/api/cuentas/abrir",
        {
          method: "POST",
          body: JSON.stringify({
            mesa,
            meseroId: esAdmin ? meseroId : yo.meseroId,
          }),
        },
      );
      setMesa("");
      setAbierto(false);
      router.push(`/cuentas/${data.cuenta.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir");
    } finally {
      setBusy(false);
    }
  }

  const etiqueta =
    mesa.trim().length > 0 ? `Abrir mesa ${mesa.trim()}` : "Abrir mesa";

  return (
    <>
      <Boton
        tamano="lg"
        className={triggerClassName}
        onClick={() => setAbierto(true)}
      >
        + Abrir mesa
      </Boton>

      <Hoja abierta={abierto} onCerrar={cerrar} titulo="Abrir mesa">
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-[15px] text-tinta">
            Número de mesa (1–999)
            <input
              name="mesa"
              autoComplete="off"
              className="min-h-12 rounded-boton border border-linea bg-superficie px-3 text-[17px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              inputMode="numeric"
              required
              autoFocus
            />
          </label>
          {esAdmin ? (
            <label className="flex flex-col gap-1 text-[15px] text-tinta">
              Mesero
              <select
                name="meseroId"
                className="min-h-12 rounded-boton border border-linea bg-superficie px-3 text-[17px] text-tinta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario"
                value={meseroId}
                onChange={(e) => setMeseroId(e.target.value)}
                required
              >
                {meseros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                    {m.id === yo.meseroId ? " (tú)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Boton type="submit" tamano="lg" disabled={busy}>
            {busy ? "Abriendo…" : etiqueta}
          </Boton>
          <Boton type="button" variante="secundario" onClick={cerrar}>
            Cancelar
          </Boton>
          {error ? (
            <p className="text-[15px] text-peligro" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </Hoja>
    </>
  );
}
