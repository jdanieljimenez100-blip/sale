import assert from "node:assert/strict";
import test from "node:test";
import { TEMAS_AYUDA } from "../lib/ayuda/temas";

const CLABE_RE = /[0-9]{18}/;
const ULID_RE = /[0-9A-HJKMNP-TV-Z]{26}/;

function textoCompletoTema(slug: string): string {
  const tema = TEMAS_AYUDA.find((t) => t.slug === slug);
  assert.ok(tema);
  const partes: string[] = [tema.titulo, tema.resumen];
  for (const sec of tema.secciones) {
    partes.push(sec.titulo, ...sec.parrafos);
    if (sec.pasos) {
      partes.push(...sec.pasos);
    }
  }
  return partes.join("\n");
}

void test("temas de ayuda tienen slugs únicos", () => {
  const slugs = TEMAS_AYUDA.map((t) => t.slug);
  assert.equal(slugs.length, new Set(slugs).size);
});

void test("cada tema tiene al menos una sección", () => {
  for (const tema of TEMAS_AYUDA) {
    assert.ok(
      tema.secciones.length >= 1,
      `tema ${tema.slug} sin secciones`,
    );
  }
});

void test("ningún texto de ayuda contiene CLABE ni ULID", () => {
  for (const tema of TEMAS_AYUDA) {
    const texto = textoCompletoTema(tema.slug);
    assert.equal(
      CLABE_RE.test(texto),
      false,
      `posible CLABE en ${tema.slug}`,
    );
    assert.equal(
      ULID_RE.test(texto),
      false,
      `posible ULID en ${tema.slug}`,
    );
  }
});
