import type { ReactElement } from "react";
import { PagadoPantalla } from "@/components/PagadoPantalla";
import { DemoTokenBar } from "@/components/DemoTokenBar";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function PagadoPage({
  params,
}: Props): Promise<ReactElement> {
  const { id } = await params;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-4 py-8">
      <DemoTokenBar />
      <PagadoPantalla cobroId={id} />
    </main>
  );
}
