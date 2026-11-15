"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import {
  DEMO_TOKEN_STORAGE_KEY,
  getStoredDemoToken,
  storeDemoToken,
} from "@/lib/demo-token";

export function DemoTokenBar(): ReactElement {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setToken(getStoredDemoToken());
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    storeDemoToken(token.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-hoja border border-linea bg-superficie p-3 text-[15px] sm:flex-row sm:items-end"
    >
      <label className="flex flex-1 flex-col gap-1 text-tinta">
        <span>Token de este dispositivo</span>
        <input
          className="min-h-12 rounded-boton border border-linea px-3"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          name={DEMO_TOKEN_STORAGE_KEY}
        />
      </label>
      <button
        type="submit"
        className="pressable min-h-12 rounded-boton bg-primario px-4 font-semibold text-primario-tinta"
      >
        Guardar
      </button>
      {saved ? (
        <p className="text-pagada-fg" role="status">
          Listo
        </p>
      ) : null}
    </form>
  );
}
