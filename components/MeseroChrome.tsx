import type { ReactElement, ReactNode } from "react";
import { EncabezadoSesion } from "@/components/EncabezadoSesion";
import { NavInferior } from "@/components/NavInferior";
import { SesionGate } from "@/components/SesionGate";

export function MeseroChrome({
  children,
  rol,
}: {
  children: ReactNode;
  rol?: "admin";
}): ReactElement {
  return (
    <SesionGate rol={rol}>
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)] pt-0">
        <EncabezadoSesion />
        {children}
        <NavInferior />
      </main>
    </SesionGate>
  );
}
