/** Validación pura de reseña del comensal. */

export type InputResena = {
  estrellas: number;
  comentario?: string | null;
};

export type DecisionResena = {
  estrellas: number;
  comentario: string | null;
};

export function validarInputResena(input: InputResena): DecisionResena {
  if (
    !Number.isInteger(input.estrellas) ||
    input.estrellas < 1 ||
    input.estrellas > 5
  ) {
    throw new Error("Las estrellas deben ser un entero entre 1 y 5");
  }
  if (input.comentario == null) {
    return { estrellas: input.estrellas, comentario: null };
  }
  if (typeof input.comentario !== "string") {
    throw new Error("El comentario debe ser texto");
  }
  const comentario = input.comentario.trim();
  if (comentario.length === 0) {
    return { estrellas: input.estrellas, comentario: null };
  }
  if (comentario.length > 280) {
    throw new Error("El comentario no puede pasar de 280 caracteres");
  }
  return { estrellas: input.estrellas, comentario };
}
