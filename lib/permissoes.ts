import type { Papel, Perfil, SituacaoUsuario } from './tipos'

/** Rótulos exibidos para cada papel. */
export const PAPEIS: { valor: Papel; rotulo: string; descricao: string }[] = [
  { valor: 'admin', rotulo: 'Administrador', descricao: 'Tudo, incluindo usuários, configurações e auditoria' },
  { valor: 'representante', rotulo: 'Mestre Representante', descricao: 'Registra e edita sessões, preparos, saídas e membros' },
  { valor: 'assistente', rotulo: 'Mestre Assistente', descricao: 'Registra e edita sessões, preparos, saídas e membros' },
  { valor: 'mestre', rotulo: 'Mestre', descricao: 'Só visualiza; não vê o botão + nem as opções de editar' },
]

export const SITUACOES: Record<SituacaoUsuario, string> = {
  pendente: 'Pendente',
  ativo: 'Ativo',
  desativado: 'Desativado',
}

export function rotuloPapel(papel: Papel | null | undefined) {
  return PAPEIS.find(p => p.valor === papel)?.rotulo ?? 'Mestre'
}

function ativo(perfil: Pick<Perfil, 'status'> | null | undefined) {
  // Sem a coluna `status` (migration não aplicada) o usuário é tratado como ativo.
  return !perfil?.status || perfil.status === 'ativo'
}

/** Pode registrar e editar dados (espelha public.can_edit() no banco). */
export function podeEditar(perfil: Pick<Perfil, 'role' | 'status'> | null | undefined) {
  return !!perfil && ativo(perfil) && perfil.role !== 'mestre'
}

/** Espelha public.is_admin() no banco. */
export function ehAdmin(perfil: Pick<Perfil, 'role' | 'status'> | null | undefined) {
  return !!perfil && ativo(perfil) && perfil.role === 'admin'
}
