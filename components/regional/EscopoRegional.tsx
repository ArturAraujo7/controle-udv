'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { ehCentral, podeVerRegional } from '@/lib/permissoes'
import { resumirRegiao } from '@/lib/regional'
import { supabase } from '@/lib/supabaseClient'
import type { DadosRegionais } from '@/lib/tipos'

const CHAVE_REGIAO = 'guardiao_regiao_admin'

type Contexto = {
  carregando: boolean
  erro: string | null
  dados: DadosRegionais | null
  resumo: ReturnType<typeof resumirRegiao> | null
  agora: Date
  /** Administrador geral pode trocar de região; o Central fica sempre na dele. */
  podeTrocarRegiao: boolean
  trocarRegiao: (regiaoId: number) => void
  recarregar: () => Promise<void>
  nomeNucleo: (id: number | null | undefined) => string
}

const RegionalContext = createContext<Contexto | null>(null)

export function useRegional() {
  const contexto = useContext(RegionalContext)
  if (!contexto) throw new Error('useRegional precisa estar dentro de EscopoRegionalProvider')
  return contexto
}

function lerRegiaoSalva() {
  try {
    const valor = typeof window !== 'undefined' ? window.localStorage.getItem(CHAVE_REGIAO) : null
    return valor ? Number(valor) : null
  } catch {
    return null
  }
}

/**
 * Carrega os dados da região uma vez para todas as telas regionais
 * (via dados_regionais(), que só responde para o Central e o admin geral).
 */
export function EscopoRegionalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile } = useAuth()
  const permitido = podeVerRegional(profile)
  const central = ehCentral(profile)

  const [regiaoEscolhida, setRegiaoEscolhida] = useState<number | null>(lerRegiaoSalva)
  const regiaoParametro = central ? null : regiaoEscolhida
  const [estado, setEstado] = useState<{ chave: string; dados: DadosRegionais | null; erro: string | null } | null>(null)
  const [agora] = useState(() => new Date())
  const chave = `${profile?.id ?? ''}:${regiaoParametro ?? 'padrao'}`

  useEffect(() => {
    if (profile && !permitido) router.replace('/')
  }, [profile, permitido, router])

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.rpc('dados_regionais', { p_regiao_id: regiaoParametro })
    return {
      chave,
      dados: error ? null : (data as DadosRegionais),
      erro: error
        ? error.message.includes('function') || error.code === 'PGRST202'
          ? 'A visão regional precisa das migrations de 14/09/2026 aplicadas no Supabase.'
          : error.message
        : null,
    }
  }, [chave, regiaoParametro])

  useEffect(() => {
    if (!permitido) return
    let ativo = true
    carregar().then(resultado => { if (ativo) setEstado(resultado) })
    return () => { ativo = false }
  }, [permitido, carregar])

  const recarregar = useCallback(async () => {
    setEstado(await carregar())
  }, [carregar])

  const trocarRegiao = useCallback((regiaoId: number) => {
    try { window.localStorage.setItem(CHAVE_REGIAO, String(regiaoId)) } catch { /* sem armazenamento local */ }
    setRegiaoEscolhida(regiaoId)
  }, [])

  const atual = estado?.chave === chave ? estado : null
  const dados = atual?.dados ?? null
  const resumo = useMemo(() => (dados ? resumirRegiao(dados, agora) : null), [dados, agora])

  const nomeNucleo = useCallback(
    (id: number | null | undefined) => dados?.nucleos.find(n => n.id === id)?.nome ?? 'Núcleo',
    [dados]
  )

  if (!profile || !permitido) return null

  return (
    <RegionalContext.Provider
      value={{
        carregando: !atual,
        erro: atual?.erro ?? null,
        dados,
        resumo,
        agora,
        podeTrocarRegiao: !central,
        trocarRegiao,
        recarregar,
        nomeNucleo,
      }}
    >
      {children}
    </RegionalContext.Provider>
  )
}
