'use client'
import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import type { Nucleo, Regiao } from '@/lib/tipos'

type Estrutura = { carregando: boolean; indisponivel: boolean; regioes: Regiao[]; nucleos: Nucleo[] }

async function carregarEstrutura(): Promise<Estrutura> {
  const [regioes, nucleos] = await Promise.all([
    supabase.from('regioes').select('*').order('nome'),
    supabase.from('nucleos').select('*').order('nome'),
  ])
  if (regioes.error || nucleos.error) {
    return { carregando: false, indisponivel: true, regioes: [], nucleos: [] }
  }
  return {
    carregando: false,
    indisponivel: false,
    regioes: regioes.data as Regiao[],
    nucleos: nucleos.data as Nucleo[],
  }
}

/** Regiões e núcleos cadastrados (nomes são visíveis a todos os usuários). */
export function useEstrutura() {
  const [estado, setEstado] = useState<Estrutura>({ carregando: true, indisponivel: false, regioes: [], nucleos: [] })

  useEffect(() => {
    let ativo = true
    carregarEstrutura().then(e => { if (ativo) setEstado(e) })
    return () => { ativo = false }
  }, [])

  const recarregar = useCallback(async () => {
    setEstado(await carregarEstrutura())
  }, [])

  const nomeNucleo = useCallback((id: number | null | undefined) => estado.nucleos.find(n => n.id === id)?.nome ?? null, [estado.nucleos])
  const nomeRegiao = useCallback((id: number | null | undefined) => estado.regioes.find(r => r.id === id)?.nome ?? null, [estado.regioes])

  return { ...estado, recarregar, nomeNucleo, nomeRegiao }
}
