import type { Membro } from './tipos'

/** Nome como aparece nas listas: nome de exibição com prefixo do grau (M. / C.). */
export function nomeMembro(membro: Pick<Membro, 'nome' | 'nome_exibicao' | 'grau'>) {
  const base = membro.nome_exibicao || membro.nome
  if (membro.grau === 'Mestre' && !base.startsWith('M. ')) return `M. ${base}`
  if (membro.grau === 'Corpo do Conselho' && !base.startsWith('C. ')) return `C. ${base}`
  return base
}

/** Mestre do preparo gravado em texto → "M. Fulano" (sem duplicar o prefixo). */
export function rotuloMestre(nome: string | null | undefined) {
  if (!nome) return '—'
  return `M. ${nome.replace(/^M\.\s*/i, '')}`
}

/** "M. João da Silva" → "JS" */
export function iniciais(nome: string | null | undefined) {
  if (!nome) return '?'
  const partes = nome
    .replace(/^(M\.|C\.)\s*/i, '')
    .split(/\s+/)
    .filter(p => p.length > 2 || /^[A-ZÀ-Ú]/.test(p))
  if (partes.length === 0) return nome.slice(0, 1).toUpperCase()
  const primeira = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}
