import assert from "node:assert/strict";
import test from "node:test";
import { avanceDivision } from "../services/dividir-avance";
import type { Database } from "../lib/supabase/types";

type Cobro = Database["public"]["Tables"]["cobros"]["Row"];

function cobro(
  partial: Pick<Cobro, "tipo" | "estado"> & { id?: string },
): Cobro {
  return {
    id: partial.id ?? "00000000-0000-0000-0000-000000000001",
    cuenta_id: null,
    mesero_id: null,
    tipo: partial.tipo,
    monto_centavos: 1,
    estado: partial.estado,
    pey_qr_id: "x",
    pey_transaction_id: null,
    qr_string: "{}",
    concepto: "t",
    webhook_event_id: null,
    created_at: new Date().toISOString(),
    pagado_at: null,
  };
}

void test("avanceDivision ignora cobros expirados", () => {
  const avance = avanceDivision([
    cobro({ tipo: "consumo", estado: "pagado" }),
    cobro({ tipo: "consumo", estado: "pendiente" }),
    cobro({ tipo: "consumo", estado: "expirado" }),
    cobro({ tipo: "propina", estado: "pagado" }),
  ]);
  assert.equal(avance.pagaron, 1);
  assert.equal(avance.total, 2);
});

void test("avanceDivision sin cobros activos queda en cero", () => {
  const avance = avanceDivision([
    cobro({ tipo: "consumo", estado: "expirado" }),
  ]);
  assert.equal(avance.pagaron, 0);
  assert.equal(avance.total, 0);
});
