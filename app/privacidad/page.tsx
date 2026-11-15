import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Aviso de privacidad — Sale",
  robots: { index: true, follow: true },
};

export default function PrivacidadPage(): ReactElement {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-8 text-tinta">
      <p className="rounded-hoja border border-parcial-fg/30 bg-parcial-bg px-3 py-2 text-[13px] text-parcial-fg text-pretty">
        Plantilla para la demo; requiere revisión legal antes de uso real.
      </p>

      <h1 className="mt-6 text-[28px] font-bold tracking-tight text-pretty">
        Aviso de privacidad
      </h1>
      <p className="mt-1 text-[13px] text-tinta-suave">
        Actualizado el 15 de noviembre de 2026 · Conforme a la LFPDPPP vigente
        (2025)
      </p>

      <section className="mt-8 flex flex-col gap-3 text-[15px] leading-relaxed">
        <h2 className="text-[17px] font-semibold">Responsable</h2>
        <p>
          <strong>[NOMBRE DEL RESTAURANTE]</strong>, domicilio{" "}
          <strong>[DOMICILIO]</strong>. Contacto de privacidad:{" "}
          <strong>[CORREO DE PRIVACIDAD]</strong>.
        </p>
        <p>
          Sale actúa como <strong>encargado</strong>. pey, Supabase y Vercel
          son proveedores. Región de servidores:{" "}
          <strong>[REGIÓN DE SERVIDORES]</strong>.
        </p>
      </section>

      <section className="mt-8 flex flex-col gap-3 text-[15px] leading-relaxed">
        <h2 className="text-[17px] font-semibold">Datos que recabamos</h2>
        <p>
          <strong>Meseros / admin:</strong> nombre, rol, hash del PIN (nunca el
          PIN en claro), intentos y bloqueo, versión de sesión, referencia ULID
          a la cuenta CoDi en pey (la CLABE no se guarda en Sale) y bitácora de
          acciones (sin PIN; de la cuenta pey solo los últimos 4).
        </p>
        <p>
          <strong>Clientes:</strong> Sale no recibe el nombre ni la cuenta del
          cliente. Solo montos, hora, identificadores de transacción/QR que
          envía pey, reseñas (estrellas y comentario opcional) y el ticket
          público (sin datos del cliente).
        </p>
      </section>

      <section className="mt-8 flex flex-col gap-3 text-[15px] leading-relaxed">
        <h2 className="text-[17px] font-semibold">Finalidades</h2>
        <p>
          <strong>Primarias:</strong> operar el punto de venta, cobrar con CoDi,
          emitir el ticket, calcular propinas, seguridad y bitácora.
        </p>
        <p>
          <strong>Secundarias:</strong> reseñas para medir el servicio. Puede
          omitirlas sin afectar el cobro.
        </p>
        <p>
          Datos patrimoniales: solo la referencia a la cuenta pey del mesero
          para propinas. Plazo de conservación:{" "}
          <strong>[PLAZO DE CONSERVACIÓN]</strong>.
        </p>
      </section>

      <section className="mt-8 flex flex-col gap-3 text-[15px] leading-relaxed">
        <h2 className="text-[17px] font-semibold">Derechos ARCO y cookies</h2>
        <p>
          Para Acceso, Rectificación, Cancelación, Oposición o revocar el
          consentimiento, escriba a{" "}
          <strong>[CORREO DE PRIVACIDAD]</strong>.
        </p>
        <p>
          Cookie necesaria única: <code className="text-[13px]">sale_sesion</code>{" "}
          (httpOnly, sameSite=lax, 12 h). Sin analítica ni rastreo.
        </p>
      </section>

      <section className="mt-8 flex flex-col gap-3 text-[15px] leading-relaxed">
        <h2 className="text-[17px] font-semibold">Cambios</h2>
        <p>
          Las actualizaciones se publican en esta página con nueva fecha. El
          texto completo para revisión legal está en el repositorio (
          <code className="text-[13px]">docs/legal/aviso-privacidad.md</code>
          ).
        </p>
      </section>

      <p className="mt-10">
        <Link
          href="/entrar"
          className="text-[15px] font-medium text-primario underline underline-offset-2"
        >
          Volver a entrar
        </Link>
      </p>
    </main>
  );
}
