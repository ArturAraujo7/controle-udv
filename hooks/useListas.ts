'use client'
import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import { GRAUS_MEMBRO, MOTIVOS_SAIDA, TIPOS_DELEGACAO, TIPOS_SESSAO } from '@/lib/constants'
import type { ItemLista, NomeLista } from '@/lib/tipos'

/** Valores usados quando a tabela `listas_sistema` não existe ou está vazia. */
const PADRAO: Record<NomeLista, readonly string[]> = {
  tipos_sessao: TIPOS_SESSAO,
  graus: GRAUS_MEMBRO,
  tipos_delegacao: TIPOS_DELEGACAO,
  motivos_saida: MOTIVOS_SAIDA,
  documentos: [],
  historias: [],
  nucleos: [],
}

type Resultado = { itens: ItemLista[]; indisponivel: boolean }

const cache = new Map<NomeLista, Resultado>()

async function carregarLista(lista: NomeLista): Promise<Resultado> {
  const { data, error } = await supabase
    .from('listas_sistema')
    .select('*')
    .eq('lista', lista)
    .order('ordem')
    .order('nome')

  const resultado = error
    ? { itens: [], indisponivel: true }
    : { itens: data as ItemLista[], indisponivel: false }
  if (!error) cache.set(lista, resultado)
  return resultado
}

export function invalidarLista(lista: NomeLista) {
  cache.delete(lista)
}

/** Itens completos de uma lista (inclui arquivados) — usado na administração. */
export function useItensLista(lista: NomeLista) {
  const [resultado, setResultado] = useState<{ lista: NomeLista; dados: Resultado } | null>(
    () => (cache.has(lista) ? { lista, dados: cache.get(lista)! } : null)
  )

  useEffect(() => {
    if (cache.has(lista)) return
    let ativo = true
    carregarLista(lista).then(dados => {
      if (ativo) setResultado({ lista, dados })
    })
    return () => { ativo = false }
  }, [lista])

  const recarregar = useCallback(async () => {
    const dados = await carregarLista(lista)
    setResultado({ lista, dados })
  }, [lista])

  const atual = resultado?.lista === lista ? resultado.dados : cache.get(lista)
  return { itens: atual?.itens ?? null, indisponivel: atual?.indisponivel ?? false, recarregar }
}

/**
 * Nomes ativos de uma lista, na ordem configurada. `incluir` garante que um
 * valor já gravado num registro continue selecionável mesmo se foi arquivado.
 */
export function useLista(lista: NomeLista, incluir?: string | null) {
  const { itens } = useItensLista(lista)
  const nomes = itens && itens.length > 0
    ? itens.filter(i => i.ativo).map(i => i.nome)
    : [...PADRAO[lista]]
  if (incluir && !nomes.includes(incluir)) nomes.push(incluir)
  return nomes
}
