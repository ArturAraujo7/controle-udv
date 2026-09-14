'use client'
import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import type { UsuarioAdmin } from '@/lib/tipos'

async function carregarUsuarios(): Promise<{ usuarios: UsuarioAdmin[]; completo: boolean; erro: string | null }> {
  const { data, error } = await supabase.rpc('admin_listar_usuarios')
  if (!error && data) return { usuarios: data as UsuarioAdmin[], completo: true, erro: null }

  // Sem a função (migration pendente): usa só a tabela de perfis.
  const perfis = await supabase.from('profiles').select('id, full_name, email, role').order('full_name')
  if (perfis.error) return { usuarios: [], completo: false, erro: perfis.error.message }
  return {
    usuarios: (perfis.data ?? []).map(p => ({
      ...p,
      status: 'ativo' as const,
      membro_id: null,
      nucleo_id: null,
      regiao_id: null,
      criado_em: '',
      ultimo_acesso: null,
      provedor: null,
    })) as UsuarioAdmin[],
    completo: false,
    erro: null,
  }
}

/** Usuários com situação e dados de acesso (só administradores). */
export function useUsuarios() {
  const [estado, setEstado] = useState<{ carregando: boolean; usuarios: UsuarioAdmin[]; completo: boolean; erro: string | null }>({
    carregando: true, usuarios: [], completo: true, erro: null,
  })

  useEffect(() => {
    let ativo = true
    carregarUsuarios().then(r => { if (ativo) setEstado({ carregando: false, ...r }) })
    return () => { ativo = false }
  }, [])

  const recarregar = useCallback(async () => {
    const r = await carregarUsuarios()
    setEstado({ carregando: false, ...r })
  }, [])

  return { ...estado, recarregar }
}
