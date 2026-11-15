"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Boton } from "@/components/ui/Boton";
import { apiFetch } from "@/lib/client-api";

type Config = {
  propinaPorcentajes: number[];
  repartoCocinaPct: number;
};

export function PropinasAjustes(): ReactElement {
  const [porcentajesTexto, setPorcentajesTexto] = useState("10,15,20");
  const [cocina, setCocina] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<Config>("/api/negocio/propinas", {
          withDemoToken: true,
        });
        setPorcentajesTexto(data.propinaPorcentajes.join(","));
        setCocina(String(data.repartoCocinaPct));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      const partes = porcentajesTexto
        .split(/[,;\s]+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => Number.parseInt(p, 10));
      const repartoCocinaPct = Number.parseInt(cocina, 10);
      const data = await apiFetch<Config>("/api/negocio/propinas", {
        method: "PUT",
        withDemoToken: true,
        body: JSON.stringify({
          propinaPorcentajes: partes,
          repartoCocinaPct,
        }),
      });
      setPorcentajesTexto(data.propinaPorcentajes.join(","));
      setCocina(String(data.repartoCocinaPct));
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-hoja border border-linea bg-superficie p-4">
      <h2 className="mb-2 text-[17px] font-semibold text-tinta">Propinas</h2>
      <p className="mb-3 text-[15px] text-tinta-suave">
        Porcentajes que ve el comensal al pagar. Separados por coma (1 a 3).
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[15px] text-tinta">
          Porcentajes sugeridos
          <input
            name="porcentajes"
            autoComplete="off"
            className="min-h-12 rounded-boton border border-linea px-3"
            value={porcentajesTexto}
            onChange={(event) => setPorcentajesTexto(event.target.value)}
            placeholder="10,15,20…"
            inputMode="numeric"
          />
        </label>
        <label className="flex flex-col gap-1 text-[15px] text-tinta">
          % de propinas para cocina (solo informativo)
          <input
            name="cocina"
            autoComplete="off"
            className="min-h-12 rounded-boton border border-linea px-3"
            value={cocina}
            onChange={(event) => setCocina(event.target.value)}
            inputMode="numeric"
          />
        </label>
        <Boton type="submit" disabled={busy}>
          Guardar
        </Boton>
      </form>
      {ok ? (
        <p className="mt-2 text-[15px] text-pagada-fg" role="status">
          Guardado.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-[15px] text-peligro" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
