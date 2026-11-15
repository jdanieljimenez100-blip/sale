import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readJson(relativePath: string): unknown {
  const fileUrl = new URL(relativePath, import.meta.url);
  return JSON.parse(readFileSync(fileUrl, "utf8")) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

void test("TypeScript estricto está activo", () => {
  const raw = readJson("../tsconfig.json");
  assert.equal(isRecord(raw), true);
  if (!isRecord(raw)) {
    return;
  }
  const compilerOptions = raw["compilerOptions"];
  assert.equal(isRecord(compilerOptions), true);
  if (!isRecord(compilerOptions)) {
    return;
  }
  assert.equal(compilerOptions["strict"], true);
  assert.equal(compilerOptions["noUncheckedIndexedAccess"], true);
});

void test("npm run check cubre lint, typecheck y test", () => {
  const raw = readJson("../package.json");
  assert.equal(isRecord(raw), true);
  if (!isRecord(raw)) {
    return;
  }
  const scripts = raw["scripts"];
  assert.equal(isRecord(scripts), true);
  if (!isRecord(scripts)) {
    return;
  }
  const check = scripts["check"];
  assert.equal(typeof check, "string");
  if (typeof check !== "string") {
    return;
  }
  assert.match(check, /lint/);
  assert.match(check, /typecheck/);
  assert.match(check, /test/);
  assert.equal(scripts["lint"], "eslint .");
  assert.equal(scripts["typecheck"], "tsc --noEmit");
});
