'use client'
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import type { Configuracoes } from '@/lib/tipos'

export const CONFIGURACOES_PADRAO: Configuracoes = {
  logo_arquivo: null,
  estoque_minimo_litros: 10,
  dias_lote_parado: 90,
  somar_maturacao_no_saldo: false,
  calendario_padrao: null,
  exigir_leitor_explanador: true,
  assinatura_relatorio: null,
  resumo_mensal_email: false,
}

type Chave = number | 'padrao'

// Compartilhado entre telas para não buscar a mesma linha a cada navegação.
const cache = new Map<Chave, Configuracoes>()

export function normalizarConfiguracoes(dados: Partial<Configuracoes> | null | undefined): Configuracoes {
  return dados
    ? { ...CONFIGURACOES_PADRAO, ...dados, estoque_minimo_litros: Number(dados.estoque_minimo_litros ?? CONFIGURACOES_PADRAO.estoque_minimo_litros) }
    : CONFIGURACOES_PADRAO
}

async function carregarConfiguracoes(nucleoId: number | null): Promise<Configuracoes> {
  let resposta = nucleoId
    ? await supabase.from('configuracoes').select('*').eq('nucleo_id', nucleoId).maybeSingle()
    : null
  // Antes da migration de núcleos a tabela tinha uma linha só, sem nucleo_id.
  if (!resposta || resposta.error) {
    resposta = await supabase.from('configuracoes').select('*').limit(1).maybeSingle()
  }
  const config = normalizarConfiguracoes(resposta.error ? null : resposta.data)
  cache.set(nucleoId ?? 'padrao', config)
  return config
}

export function invalidarConfiguracoes() {
  cache.clear()
}

/**
 * Configurações do núcleo do usuário (ou de `nucleoId`, na administração).
 * Enquanto carrega — ou sem as migrations — devolve os valores padrão.
 */
export function useConfiguracoes(nucleoId?: number | null) {
  const { profile } = useAuth()
  const alvo = nucleoId !== undefined ? nucleoId : profile?.nucleo_id ?? null
  const chave: Chave = alvo ?? 'padrao'

  const [estado, setEstado] = useState<{ chave: Chave; config: Configuracoes } | null>(
    () => (cache.has(chave) ? { chave, config: cache.get(chave)! } : null)
  )

  useEffect(() => {
    if (cache.has(chave)) return
    let ativo = true
    carregarConfiguracoes(alvo).then(config => {
      if (ativo) setEstado({ chave, config })
    })
    return () => { ativo = false }
  }, [chave, alvo])

  const recarregar = useCallback(async () => {
    const config = await carregarConfiguracoes(alvo)
    setEstado({ chave, config })
  }, [chave, alvo])

  const atual = estado?.chave === chave ? estado.config : cache.get(chave)
  return { config: atual ?? CONFIGURACOES_PADRAO, carregado: !!atual, recarregar }
}
