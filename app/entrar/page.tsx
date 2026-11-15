import type { ReactElement } from "react";
import { AvisoPrivacidadSimplificado } from "@/components/AvisoPrivacidadSimplificado";
import { EntrarPantalla } from "@/components/EntrarPantalla";

export default function EntrarPage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-4 py-8">
      <EntrarPantalla />
      <footer className="mt-auto border-t border-linea pt-4">
        <AvisoPrivacidadSimplificado />
      </footer>
    </main>
  );
}
