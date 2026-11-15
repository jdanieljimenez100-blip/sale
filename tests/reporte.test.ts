import assert from "node:assert/strict";
import test from "node:test";
import {
  calcularReporteDesempeno,
  filtrarReportePorSesion,
  formatearDecimal1,
  formatearPct1,
  ratioONull,
} from "../lib/reporte";

void test("ratioONull no divide entre cero", () => {
  assert.equal(ratioONull(10, 0), null);
  assert.equal(ratioONull(10, 2), 5);
  assert.equal(formatearPct1(null), "—");
  assert.equal(formatearPct1(0.155), "15.5%");
  assert.equal(formatearDecimal1(null), "—");
  assert.equal(formatearDecimal1(4.26), "4.3");
});

void test("calcularReporteDesempeno propina real vía cobro_origen_id", () => {
  const reporte = calcularReporteDesempeno({
    rangoDias: 1,
    desdeIso: "2026-11-14T06:00:00.000Z",
    repartoCocinaPct: 20,
    meseros: [
      { id: "m1", nombre: "Ana" },
      { id: "m2", nombre: "Luis" },
    ],
    cobros: [
      {
        id: "c1",
        mesero_id: "m1",
        cuenta_id: "u1",
        tipo: "consumo",
        monto_centavos: 1000,
        cobro_origen_id: null,
        created_at: "2026-11-14T12:00:00.000Z",
        pagado_at: "2026-11-14T12:01:00.000Z",
      },
      {
        id: "p1",
        mesero_id: "m1",
        cuenta_id: "u1",
        tipo: "propina",
        monto_centavos: 150,
        cobro_origen_id: "c1",
        created_at: "2026-11-14T12:02:00.000Z",
        pagado_at: "2026-11-14T12:03:00.000Z",
      },
      {
        id: "c2",
        mesero_id: "m1",
        cuenta_id: "u2",
        tipo: "consumo",
        monto_centavos: 500,
        cobro_origen_id: null,
        created_at: "2026-11-14T13:00:00.000Z",
        pagado_at: "2026-11-14T13:02:00.000Z",
      },
    ],
    resenas: [
      {
        id: "r1",
        cobro_id: "c1",
        mesero_id: "m1",
        estrellas: 5,
        comentario: "Excelente",
        created_at: "2026-11-14T12:05:00.000Z",
        mesa: "1",
      },
      {
        id: "r2",
        cobro_id: "c2",
        mesero_id: "m1",
        estrellas: 3,
        comentario: null,
        created_at: "2026-11-14T13:05:00.000Z",
        mesa: "2",
      },
    ],
  });

  assert.equal(reporte.ventasCentavos, 1500);
  assert.equal(reporte.propinasCentavos, 150);
  assert.equal(reporte.pagosCobrados, 2);
  assert.equal(reporte.ticketPromedioCentavos, 750);
  assert.equal(reporte.pctPropinaPromedio, 0.1);
  assert.equal(reporte.estrellasPromedio, 4);
  assert.equal(reporte.porMesero.length, 1);

  const ana = reporte.porMesero[0]!;
  assert.equal(ana.nombre, "Ana");
  assert.equal(ana.ventasCentavos, 1500);
  assert.equal(ana.propinasCentavos, 150);
  assert.equal(ana.pctPropinaReal, 0.1);
  assert.equal(ana.pagosConPropina, 1);
  assert.equal(ana.pctPagosConPropina, 0.5);
  assert.equal(ana.estrellasPromedio, 4);
  assert.equal(ana.numResenas, 2);
  assert.equal(ana.cocinaCentavos, 30);
  assert.equal(ana.ultimasResenas.length, 2);
  assert.equal(ana.ultimasResenas[0]!.mesa, "2");
});

void test("calcularReporteDesempeno sin datos usa null (UI —)", () => {
  const reporte = calcularReporteDesempeno({
    rangoDias: 7,
    desdeIso: "2026-11-08T06:00:00.000Z",
    repartoCocinaPct: 0,
    meseros: [{ id: "m1", nombre: "Ana" }],
    cobros: [],
    resenas: [],
  });
  assert.equal(reporte.ticketPromedioCentavos, null);
  assert.equal(reporte.pctPropinaPromedio, null);
  assert.equal(reporte.estrellasPromedio, null);
  assert.equal(reporte.porMesero.length, 0);
});

void test("filtrarReportePorSesion mesero solo ve su fila", () => {
  const completo = calcularReporteDesempeno({
    rangoDias: 1,
    desdeIso: "2026-11-14T06:00:00.000Z",
    repartoCocinaPct: 0,
    meseros: [
      { id: "m1", nombre: "Ana" },
      { id: "m2", nombre: "Luis" },
    ],
    cobros: [
      {
        id: "c1",
        mesero_id: "m1",
        cuenta_id: "u1",
        tipo: "consumo",
        monto_centavos: 1000,
        cobro_origen_id: null,
        created_at: "2026-11-14T12:00:00.000Z",
        pagado_at: "2026-11-14T12:01:00.000Z",
      },
      {
        id: "c2",
        mesero_id: "m2",
        cuenta_id: "u2",
        tipo: "consumo",
        monto_centavos: 500,
        cobro_origen_id: null,
        created_at: "2026-11-14T13:00:00.000Z",
        pagado_at: "2026-11-14T13:01:00.000Z",
      },
    ],
    resenas: [
      {
        id: "r1",
        cobro_id: "c1",
        mesero_id: "m1",
        estrellas: 5,
        comentario: "secreto ana",
        created_at: "2026-11-14T12:05:00.000Z",
        mesa: "1",
      },
      {
        id: "r2",
        cobro_id: "c2",
        mesero_id: "m2",
        estrellas: 2,
        comentario: "secreto luis",
        created_at: "2026-11-14T13:05:00.000Z",
        mesa: "3",
      },
    ],
  });
  assert.equal(completo.porMesero.length, 2);
  const ana = filtrarReportePorSesion(completo, {
    meseroId: "m1",
    rol: "mesero",
  });
  assert.equal(ana.porMesero.length, 1);
  assert.equal(ana.porMesero[0]!.meseroId, "m1");
  assert.equal(ana.ventasCentavos, 1000);
  assert.equal(ana.pagosCobrados, 1);
  assert.equal(ana.porMesero[0]!.ultimasResenas.length, 1);
  assert.equal(ana.porMesero[0]!.ultimasResenas[0]!.comentario, "secreto ana");
  const admin = filtrarReportePorSesion(completo, {
    meseroId: "m1",
    rol: "admin",
  });
  assert.equal(admin.porMesero.length, 2);
  assert.equal(admin.ventasCentavos, 1500);
});
