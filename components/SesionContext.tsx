"use client";

import { createContext, useContext, type ReactElement, type ReactNode } from "react";

export type SesionYo = {
  meseroId: string;
  nombre: string;
  rol: "mesero" | "admin";
};

const SesionContext = createContext<SesionYo | null>(null);

export function SesionProvider({
  yo,
  children,
}: {
  yo: SesionYo;
  children: ReactNode;
}): ReactElement {
  return (
    <SesionContext.Provider value={yo}>{children}</SesionContext.Provider>
  );
}

export function useSesion(): SesionYo {
  const yo = useContext(SesionContext);
  if (!yo) {
    throw new Error("useSesion requiere SesionGate");
  }
  return yo;
}
