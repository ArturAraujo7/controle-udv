import type { Papel, Perfil, SituacaoUsuario } from './tipos'

/** Rótulos exibidos para cada papel. */
export const PAPEIS: { valor: Papel; rotulo: string; descricao: string }[] = [
  { valor: 'admin', rotulo: 'Administrador geral', descricao: 'Gerencia regiões, núcleos, usuários, configurações e auditoria de todos os núcleos' },
  { valor: 'representante', rotulo: 'Mestre Representante', descricao: 'Registra e edita sessões, preparos, saídas e membros do núcleo' },
  { valor: 'assistente', rotulo: 'Mestre Assistente', descricao: 'Registra e edita sessões, preparos, saídas e membros do núcleo' },
  { valor: 'mestre', rotulo: 'Mestre', descricao: 'Só visualiza os dados do núcleo; não vê o botão + nem as opções de editar' },
  { valor: 'central', rotulo: 'Mestre Central', descricao: 'Vê os dados de todos os núcleos da região, sem alterar nada' },
]

export const SITUACOES: Record<SituacaoUsuario, string> = {
  pendente: 'Pendente',
  ativo: 'Ativo',
  desativado: 'Desativado',
}

const EDITORES: Papel[] = ['admin', 'representante', 'assistente']

export function rotuloPapel(papel: Papel | null | undefined) {
  return PAPEIS.find(p => p.valor === papel)?.rotulo ?? 'Mestre'
}

function ativo(perfil: Pick<Perfil, 'status'> | null | undefined) {
  // Sem a coluna `status` (migration não aplicada) o usuário é tratado como ativo.
  return !perfil?.status || perfil.status === 'ativo'
}

/** Pode registrar e editar dados do próprio núcleo (espelha public.can_edit()). */
export function podeEditar(perfil: Pick<Perfil, 'role' | 'status'> | null | undefined) {
  return !!perfil && ativo(perfil) && EDITORES.includes(perfil.role)
}

/** Administrador geral (espelha public.is_admin()). */
export function ehAdmin(perfil: Pick<Perfil, 'role' | 'status'> | null | undefined) {
  return !!perfil && ativo(perfil) && perfil.role === 'admin'
}

/** Mestre Central: só a visão regional, em leitura (espelha public.eh_central()). */
export function ehCentral(perfil: Pick<Perfil, 'role' | 'status'> | null | undefined) {
  return !!perfil && ativo(perfil) && perfil.role === 'central'
}

export function podeVerRegional(perfil: Pick<Perfil, 'role' | 'status'> | null | undefined) {
  return ehAdmin(perfil) || ehCentral(perfil)
}
