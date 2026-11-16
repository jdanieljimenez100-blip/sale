/** Slug de restaurante: minúsculas, dígitos y guion. */
export const SLUG_NEGOCIO_RE = /^[a-z0-9-]{3,40}$/;

export function slugValido(slug: string): boolean {
  return SLUG_NEGOCIO_RE.test(slug);
}
