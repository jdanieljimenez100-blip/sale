import type { ReactElement } from "react";
import { DemoCredenciales } from "@/components/DemoCredenciales";
import { SetupPantalla } from "@/components/SetupPantalla";

export default function SetupPage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-4 py-8">
      <SetupPantalla />
      <DemoCredenciales />
    </main>
  );
}
