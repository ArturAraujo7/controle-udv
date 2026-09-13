'use client'
import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import type { Configuracoes } from '@/lib/tipos'

export const CONFIGURACOES_PADRAO: Configuracoes = {
  nucleo_nome: 'Núcleo Jardim Real',
  nucleo_regiao: null,
  nucleo_cidade: null,
  logo_arquivo: null,
  estoque_minimo_litros: 10,
  dias_lote_parado: 90,
  somar_maturacao_no_saldo: false,
  calendario_padrao: null,
  exigir_leitor_explanador: true,
  assinatura_relatorio: null,
  resumo_mensal_email: false,
}

// Compartilhado entre telas para não buscar a mesma linha a cada navegação.
let cache: Configuracoes | null = null

async function carregarConfiguracoes(): Promise<Configuracoes> {
  const { data } = await supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle()
  const config: Configuracoes = data
    ? { ...CONFIGURACOES_PADRAO, ...data, estoque_minimo_litros: Number(data.estoque_minimo_litros) }
    : CONFIGURACOES_PADRAO
  cache = config
  return config
}

/**
 * Configurações do núcleo (tabela `configuracoes`). Enquanto carrega — ou se a
 * migration ainda não foi aplicada — devolve os valores padrão.
 */
export function useConfiguracoes() {
  const [config, setConfig] = useState<Configuracoes>(cache ?? CONFIGURACOES_PADRAO)
  const [carregado, setCarregado] = useState(cache !== null)

  useEffect(() => {
    if (cache) return
    let ativo = true
    carregarConfiguracoes().then(c => {
      if (!ativo) return
      setConfig(c)
      setCarregado(true)
    })
    return () => { ativo = false }
  }, [])

  const recarregar = useCallback(async () => {
    const c = await carregarConfiguracoes()
    setConfig(c)
    setCarregado(true)
  }, [])

  return { config, carregado, recarregar }
}
