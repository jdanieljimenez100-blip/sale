const TAMANO_PAGINA = 1000;

type PaginaResultado<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/**
 * Lee todas las filas de una consulta Supabase en páginas de 1000
 * usando `.range(from, to)` hasta agotar resultados.
 */
export async function traerTodo<T>(
  pedirPagina: (
    from: number,
    to: number,
  ) => PromiseLike<PaginaResultado<T>>,
): Promise<T[]> {
  const todos: T[] = [];
  let from = 0;
  for (;;) {
    const to = from + TAMANO_PAGINA - 1;
    const { data, error } = await pedirPagina(from, to);
    if (error) {
      throw new Error(error.message);
    }
    const filas = data ?? [];
    todos.push(...filas);
    if (filas.length < TAMANO_PAGINA) {
      break;
    }
    from += TAMANO_PAGINA;
  }
  return todos;
}
