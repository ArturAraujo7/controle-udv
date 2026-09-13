'use client'
import { useCallback, useEffect, useState } from 'react'

import { buscarTodos } from '@/lib/consultas'
import { supabase } from '@/lib/supabaseClient'
import type { ConsumoSessao, Preparo, Saida, Sessao } from '@/lib/tipos'

type Dados = {
  carregando: boolean
  erro: string | null
  preparos: Preparo[]
  consumos: ConsumoSessao[]
  saidas: Saida[]
  sessoes: Sessao[]
}

const VAZIO: Dados = { carregando: true, erro: null, preparos: [], consumos: [], saidas: [], sessoes: [] }

async function buscarDadosEstoque(): Promise<Dados> {
  try {
    const [preparos, consumos, saidas, sessoes] = await Promise.all([
      buscarTodos<Preparo>((de, ate) => supabase.from('preparos').select('*').order('id').range(de, ate)),
      buscarTodos<ConsumoSessao>((de, ate) =>
        supabase.from('consumos_sessao').select('id, id_sessao, id_preparo, quantidade_consumida').order('id').range(de, ate)
      ),
      buscarTodos<Saida>((de, ate) => supabase.from('saidas').select('*').order('id').range(de, ate)),
      buscarTodos<Sessao>((de, ate) => supabase.from('sessoes').select('*').order('id').range(de, ate)),
    ])
    return { carregando: false, erro: null, preparos, consumos, saidas, sessoes }
  } catch (e) {
    return { ...VAZIO, carregando: false, erro: e instanceof Error ? e.message : 'Erro ao carregar' }
  }
}

/** Todas as tabelas que compõem o estoque. Os cálculos ficam em lib/estoque.ts. */
export function useDadosEstoque() {
  const [dados, setDados] = useState<Dados>(VAZIO)

  useEffect(() => {
    let ativo = true
    buscarDadosEstoque().then(d => {
      if (ativo) setDados(d)
    })
    return () => { ativo = false }
  }, [])

  const recarregar = useCallback(async () => {
    setDados(await buscarDadosEstoque())
  }, [])

  return { ...dados, recarregar }
}
