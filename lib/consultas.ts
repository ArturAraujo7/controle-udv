/**
 * Busca todas as linhas de uma consulta paginando de 1000 em 1000
 * (limite padrão do PostgREST no Supabase).
 *
 * A consulta precisa ter ordenação estável (ex.: `.order('id')`).
 */
export async function buscarTodos<T>(
  montar: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  lote = 1000
): Promise<T[]> {
  const todos: T[] = []
  for (let de = 0; ; de += lote) {
    const { data, error } = await montar(de, de + lote - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    todos.push(...data)
    if (data.length < lote) break
  }
  return todos
}
