import assert from "node:assert/strict";
import test from "node:test";
import { peyUlidSchema } from "../lib/pey-ulid";

void test("peyUlidSchema acepta ULID de 26 chars Crockford", () => {
  const id = "01HXYZQR1234567890ABCDEFGH";
  assert.equal(peyUlidSchema.parse(id), id);
});

void test("peyUlidSchema rechaza CLABE u otros", () => {
  assert.throws(() => peyUlidSchema.parse("012180015826225713"));
  assert.throws(() => peyUlidSchema.parse("corto"));
});
