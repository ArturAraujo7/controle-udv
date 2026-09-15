'use client'
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { GRAUS_MEMBRO, MOTIVOS_SAIDA, TIPOS_COM_LEITURA, TIPOS_DELEGACAO, TIPOS_SESSAO } from '@/lib/constants'
import type { ItemLista, NomeLista } from '@/lib/tipos'

/** Valores usados quando a tabela `listas_sistema` não existe ou está vazia. */
const PADRAO: Record<NomeLista, readonly string[]> = {
  tipos_sessao: TIPOS_SESSAO,
  graus: GRAUS_MEMBRO,
  tipos_delegacao: TIPOS_DELEGACAO,
  motivos_saida: MOTIVOS_SAIDA,
  chamadas: [],
  historias: [],
  nucleos: [],
}

type Resultado = { itens: ItemLista[]; indisponivel: boolean }

const cache = new Map<string, Resultado>()
const chaveDe = (lista: NomeLista, regiaoId: number | null) => `${regiaoId ?? 'sem-regiao'}:${lista}`

async function carregarLista(lista: NomeLista, regiaoId: number | null): Promise<Resultado> {
  const consulta = (porRegiao: boolean) => {
    let q = supabase.from('listas_sistema').select('*').eq('lista', lista)
    if (porRegiao && regiaoId) q = q.eq('regiao_id', regiaoId)
    return q.order('ordem').order('nome')
  }

  let resposta = await consulta(true)
  // Antes da migration de núcleos as listas não tinham região.
  if (resposta.error && regiaoId) resposta = await consulta(false)

  const resultado = resposta.error
    ? { itens: [], indisponivel: true }
    : { itens: resposta.data as ItemLista[], indisponivel: false }
  if (!resposta.error) cache.set(chaveDe(lista, regiaoId), resultado)
  return resultado
}

export function invalidarLista(lista: NomeLista) {
  for (const chave of [...cache.keys()]) {
    if (chave.endsWith(`:${lista}`)) cache.delete(chave)
  }
}

/**
 * Itens completos de uma lista (inclui arquivados). Por padrão usa a região do
 * usuário; a administração passa `regiaoId` para editar outra região.
 */
export function useItensLista(lista: NomeLista, regiaoId?: number | null) {
  const { regiaoId: regiaoUsuario } = useAuth()
  const regiao = regiaoId !== undefined ? regiaoId : regiaoUsuario
  const chave = chaveDe(lista, regiao)

  const [resultado, setResultado] = useState<{ chave: string; dados: Resultado } | null>(
    () => (cache.has(chave) ? { chave, dados: cache.get(chave)! } : null)
  )

  useEffect(() => {
    if (cache.has(chave)) return
    let ativo = true
    carregarLista(lista, regiao).then(dados => {
      if (ativo) setResultado({ chave, dados })
    })
    return () => { ativo = false }
  }, [chave, lista, regiao])

  const recarregar = useCallback(async () => {
    const dados = await carregarLista(lista, regiao)
    setResultado({ chave, dados })
  }, [chave, lista, regiao])

  const atual = resultado?.chave === chave ? resultado.dados : cache.get(chave)
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

/** Se o tipo de sessão tem leitura de documentos e explanação (por padrão, Escala e Escala Anual). */
export function useTipoTemLeitura(tipo: string) {
  const { itens } = useItensLista('tipos_sessao')
  const item = itens?.find(i => i.nome === tipo)
  if (item && typeof item.tem_leitura_explanacao === 'boolean') return item.tem_leitura_explanacao
  return TIPOS_COM_LEITURA.includes(tipo)
}
