'use client'
import { useCallback, useEffect, useState } from 'react'

import type { MembroSimples } from '@/app/components/SeletorMembro'
import { supabase } from '@/lib/supabaseClient'

/** Membros ativos para os seletores dos formulários, com inclusão rápida de visitantes. */
export function useMembrosSelecao() {
  const [membros, setMembros] = useState<MembroSimples[]>([])

  useEffect(() => {
    let ativo = true
    supabase
      .from('membros')
      .select('id, nome, nome_exibicao, grau, tipo_vinculo, nucleo_origem, ativo')
      .order('nome')
      .then(({ data }) => {
        if (!ativo) return
        const lista = (data ?? []) as (MembroSimples & { ativo: boolean })[]
        setMembros(lista.filter(m => m.ativo !== false))
      })
    return () => { ativo = false }
  }, [])

  const adicionar = useCallback((membro: MembroSimples) => {
    setMembros(lista => [...lista, membro].sort((a, b) => a.nome.localeCompare(b.nome)))
  }, [])

  return { membros, adicionar }
}
