import type { ReactElement } from "react";
import { CobroPantalla } from "@/components/CobroPantalla";
import { SesionGate } from "@/components/SesionGate";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CobroPage({
  params,
}: Props): Promise<ReactElement> {
  const { id } = await params;
  const permitirSimular = getServerEnv().PEY_MODE === "mock";
  return (
    <SesionGate>
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8">
        <CobroPantalla cobroId={id} permitirSimular={permitirSimular} />
      </main>
    </SesionGate>
  );
}
