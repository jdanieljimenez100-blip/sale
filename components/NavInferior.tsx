"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactElement, type ReactNode } from "react";
import { useSesion } from "@/components/SesionContext";
import { Hoja } from "@/components/ui/Hoja";
import { apiFetch } from "@/lib/client-api";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const ICON_MESAS = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect
      x="14"
      y="14"
      width="7"
      height="7"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const ICON_RAPIDO = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M13 2 4 14h7l-1 8 10-14h-7l0-6z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const ICON_PROP = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 7v10M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ICON_REP = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 19V5M4 19h16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <rect
      x="7"
      y="10"
      width="3"
      height="6"
      rx="0.5"
      fill="currentColor"
    />
    <rect
      x="12"
      y="7"
      width="3"
      height="9"
      rx="0.5"
      fill="currentColor"
    />
    <rect
      x="17"
      y="12"
      width="3"
      height="4"
      rx="0.5"
      fill="currentColor"
    />
  </svg>
);

const ICON_MAS = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="5" cy="12" r="1.75" fill="currentColor" />
    <circle cx="12" cy="12" r="1.75" fill="currentColor" />
    <circle cx="19" cy="12" r="1.75" fill="currentColor" />
  </svg>
);

const ITEMS_BASE: NavItem[] = [
  { href: "/cuentas", label: "Mesas", icon: ICON_MESAS },
  { href: "/cobro-rapido", label: "Rápido", icon: ICON_RAPIDO },
  { href: "/propinas", label: "Propinas", icon: ICON_PROP },
  { href: "/reporte", label: "Reporte", icon: ICON_REP },
];

function linkActivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavInferior(): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { rol } = useSesion();
  const esAdmin = rol === "admin";
  const [masAbierta, setMasAbierta] = useState(false);

  async function salir(): Promise<void> {
    setMasAbierta(false);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // igual redirigimos
    }
    router.replace("/entrar");
  }

  const cols = esAdmin ? "grid-cols-5" : "grid-cols-4";

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-superficie/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navegación principal"
      >
        <ul className={`mx-auto grid h-16 max-w-lg ${cols}`}>
          {ITEMS_BASE.map((item) => {
            const active = linkActivo(pathname, item.href);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  className={`pressable relative flex h-full min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primario ${
                    active ? "text-primario" : "text-tinta-suave hover:text-tinta"
                  }`}
                >
                  {active ? (
                    <span
                      className="absolute inset-x-3 top-0 h-[3px] rounded-b bg-primario"
                      aria-hidden
                    />
                  ) : null}
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
          {esAdmin ? (
            <li className="min-w-0">
              <button
                type="button"
                onClick={() => setMasAbierta(true)}
                aria-expanded={masAbierta}
                aria-haspopup="dialog"
                className={`pressable relative flex h-full min-h-12 w-full flex-col items-center justify-center gap-0.5 px-1 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primario ${
                  masAbierta ||
                  linkActivo(pathname, "/equipo") ||
                  linkActivo(pathname, "/ajustes")
                    ? "text-primario"
                    : "text-tinta-suave hover:text-tinta"
                }`}
              >
                {ICON_MAS}
                <span>Más</span>
              </button>
            </li>
          ) : null}
        </ul>
      </nav>

      {esAdmin ? (
        <Hoja
          abierta={masAbierta}
          onCerrar={() => setMasAbierta(false)}
          titulo="Más"
        >
          <ul className="flex flex-col divide-y divide-linea">
            <li>
              <Link
                href="/equipo"
                onClick={() => setMasAbierta(false)}
                className="pressable flex min-h-14 items-center text-[17px] font-semibold text-tinta hover:bg-fondo"
              >
                Equipo
              </Link>
            </li>
            <li>
              <Link
                href="/ajustes"
                onClick={() => setMasAbierta(false)}
                className="pressable flex min-h-14 items-center text-[17px] font-semibold text-tinta hover:bg-fondo"
              >
                Ajustes
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  void salir();
                }}
                className="pressable flex min-h-14 w-full items-center text-left text-[17px] font-semibold text-peligro hover:bg-fondo"
              >
                Salir
              </button>
            </li>
          </ul>
        </Hoja>
      ) : null}
    </>
  );
}
