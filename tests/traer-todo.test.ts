import assert from "node:assert/strict";
import test from "node:test";
import { traerTodo } from "../lib/supabase/traer-todo";

void test("traerTodo junta páginas hasta agotar", async () => {
  const llamadas: Array<[number, number]> = [];
  const filas = await traerTodo<{ id: number }>(async (from, to) => {
    llamadas.push([from, to]);
    if (from === 0) {
      return {
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i })),
        error: null,
      };
    }
    return {
      data: Array.from({ length: 3 }, (_, i) => ({ id: 1000 + i })),
      error: null,
    };
  });
  assert.equal(filas.length, 1003);
  assert.deepEqual(llamadas, [
    [0, 999],
    [1000, 1999],
  ]);
});

void test("traerTodo propaga error de página", async () => {
  await assert.rejects(
    () =>
      traerTodo(async () => ({
        data: null,
        error: { message: "falló" },
      })),
    /falló/,
  );
});
