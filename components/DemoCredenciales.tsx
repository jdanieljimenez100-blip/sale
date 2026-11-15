import type { ReactElement } from "react";

/**
 * Credenciales de la demo del hackatón (intencionalmente públicas).
 * No son secretos de producción a largo plazo.
 */
export function DemoCredenciales(): ReactElement {
  return (
    <aside className="rounded-hoja border border-linea bg-superficie px-4 py-3 text-[13px] leading-snug text-tinta">
      <p className="font-semibold text-[15px]">Demo — cómo entrar</p>
      <ul className="mt-2 list-none space-y-1 text-tinta-suave">
        <li>
          <span className="text-tinta">Ana</span> /{" "}
          <span className="text-tinta">Luis</span> (mesero): PIN{" "}
          <code className="rounded bg-fondo px-1.5 py-0.5 font-mono text-tinta">
            1245
          </code>
        </li>
        <li>
          <span className="text-tinta">Jorge</span> (admin): PIN{" "}
          <code className="rounded bg-fondo px-1.5 py-0.5 font-mono text-tinta">
            258963
          </code>
        </li>
        <li>
          Setup primer admin (<code className="font-mono">/setup</code>): token{" "}
          <code className="rounded bg-fondo px-1.5 py-0.5 font-mono text-tinta">
            sale-demo-2026
          </code>
        </li>
      </ul>
      <p className="mt-2 text-tinta-suave">
        Entra en <span className="text-tinta">/entrar</span>, elige el nombre y
        teclea el PIN.
      </p>
    </aside>
  );
}
