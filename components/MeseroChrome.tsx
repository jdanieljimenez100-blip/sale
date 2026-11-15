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
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-4 py-8 pb-28">
        <EncabezadoSesion />
        {children}
        <NavInferior />
      </main>
    </SesionGate>
  );
}
