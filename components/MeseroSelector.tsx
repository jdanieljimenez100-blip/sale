"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { apiFetch } from "@/lib/client-api";
import { guardarMeseroDevice, leerMeseroDevice } from "@/lib/mesero-device";
import type { MeseroPublico } from "@/lib/meseros-types";

type ListaResponse = { meseros: MeseroPublico[] };

export function MeseroSelector(): ReactElement {
  const [meseros, setMeseros] = useState<MeseroPublico[]>([]);
  const [selected, setSelected] = useState<string>("");

  const cargar = useCallback(async (): Promise<void> => {
    try {
      const data = await apiFetch<ListaResponse>("/api/meseros");
      setMeseros(data.meseros);
      const saved = leerMeseroDevice();
      if (saved && data.meseros.some((m) => m.id === saved)) {
        setSelected(saved);
      } else if (data.meseros[0]) {
        setSelected(data.meseros[0].id);
        guardarMeseroDevice(data.meseros[0].id);
      }
    } catch {
      // Sin meseros no bloquea la pantalla.
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <label className="flex flex-col gap-1 text-[15px] text-tinta">
      <span className="text-tinta-suave">Atiende:</span>
      <select
        className="min-h-12 rounded-boton border border-linea bg-superficie px-3 text-[17px]"
        value={selected}
        onChange={(event) => {
          const id = event.target.value;
          setSelected(id);
          guardarMeseroDevice(id);
        }}
      >
        {meseros.length === 0 ? (
          <option value="">Cargando…</option>
        ) : (
          meseros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))
        )}
      </select>
    </label>
  );
}
