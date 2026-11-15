import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";
import {
  esPartidaMenu,
  partidaBodySchema,
  partidaLibreSchema,
} from "../lib/partida-input";

const MENU_UUID = "a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1";

void test("menuItemId debe ser uuid", () => {
  assert.throws(
    () =>
      partidaBodySchema.parse({
        menuItemId: "no-uuid",
        cantidad: 1,
      }),
    ZodError,
  );
  const ok = partidaBodySchema.parse({
    menuItemId: MENU_UUID,
    cantidad: 2,
  });
  assert.ok(esPartidaMenu(ok));
});

void test("notas > 120 → error", () => {
  assert.throws(
    () =>
      partidaBodySchema.parse({
        menuItemId: MENU_UUID,
        cantidad: 1,
        notas: "x".repeat(121),
      }),
    ZodError,
  );
});

void test("rama menú ignora precioPesos (mesero no fija precio)", () => {
  const parsed = partidaBodySchema.parse({
    menuItemId: MENU_UUID,
    cantidad: 1,
    precioPesos: "10.00",
  });
  assert.ok(esPartidaMenu(parsed));
  assert.equal("precioPesos" in parsed, false);
});

void test("rama libre exige precioPesos (solo admin en API)", () => {
  assert.throws(
    () =>
      partidaLibreSchema.parse({
        descripcion: "Extra",
        cantidad: 1,
      }),
    ZodError,
  );
  const libre = partidaBodySchema.parse({
    descripcion: "Extra",
    cantidad: 1,
    precioPesos: "0.01",
  });
  assert.equal(esPartidaMenu(libre), false);
});
