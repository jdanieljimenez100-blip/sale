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
      className="flex flex-col gap-2 rounded-2xl bg-white/80 p-3 text-sm sm:flex-row sm:items-end"
    >
      <label className="flex flex-1 flex-col gap-1">
        <span>Token de este dispositivo</span>
        <input
          className="min-h-12 rounded-xl border border-neutral-300 px-3"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="off"
          name={DEMO_TOKEN_STORAGE_KEY}
        />
      </label>
      <button
        type="submit"
        className="min-h-12 rounded-xl bg-neutral-900 px-4 font-semibold text-white"
      >
        Guardar
      </button>
      {saved ? <p className="text-emerald-700">Listo</p> : null}
    </form>
  );
}
