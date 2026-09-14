import { ehSessaoHistorica } from './estoque'
import { formatarData, formatarNumero } from './formato'
import type { ChamadaSessao, Preparo, Sessao } from './tipos'

export type PapelParticipacao = 'dirigente' | 'delegacao' | 'leitor' | 'explanador' | 'chamada' | 'preparo'

export const ROTULO_PARTICIPACAO: Record<PapelParticipacao, string> = {
  dirigente: 'Dirigiu',
  delegacao: 'Dirigiu · delegação',
  leitor: 'Leu documentos',
  explanador: 'Fez explanação',
  chamada: 'Fez chamada',
  preparo: 'Mestre do preparo',
}

export type Participacao = {
  chave: string
  papel: PapelParticipacao
  sessaoId: number | null
  preparoId: number | null
  data: string
  titulo: string
  subtitulo: string
}

/** Tudo que um membro fez: dirigiu, leu, explanou, fez chamada ou foi mestre do preparo. Mais recente primeiro. */
export function participacoesDoMembro(
  membroId: number,
  { sessoes, chamadas, preparos }: { sessoes: Sessao[]; chamadas: ChamadaSessao[]; preparos: Preparo[] }
): Participacao[] {
  const lista: Participacao[] = []

  for (const s of sessoes) {
    const base = { sessaoId: s.id, preparoId: null, data: s.data_realizacao, titulo: `${s.tipo} · ${formatarData(s.data_realizacao)}` }
    const publico = ehSessaoHistorica(s) ? 'Registro histórico' : `${s.quantidade_participantes} participantes`
    if (s.dirigente_id === membroId) {
      lista.push({ ...base, chave: `d-${s.id}`, papel: 'dirigente', subtitulo: publico })
    }
    if (s.dirigente_2_id === membroId) {
      lista.push({ ...base, chave: `d2-${s.id}`, papel: 'delegacao', subtitulo: s.tipo_delegacao || 'Delegação' })
    }
    if (s.leitor_documentos_id === membroId) {
      lista.push({ ...base, chave: `l-${s.id}`, papel: 'leitor', subtitulo: `Dirigente: ${s.dirigente || '—'}` })
    }
    if (s.explanador_id === membroId) {
      lista.push({ ...base, chave: `e-${s.id}`, papel: 'explanador', subtitulo: `Dirigente: ${s.dirigente || '—'}` })
    }
  }

  const sessaoPorId = new Map(sessoes.map(s => [s.id, s]))
  for (const c of chamadas) {
    if (c.membro_id !== membroId) continue
    const s = sessaoPorId.get(c.id_sessao)
    if (!s) continue
    lista.push({
      chave: `c-${c.id}`,
      papel: 'chamada',
      sessaoId: s.id,
      preparoId: null,
      data: s.data_realizacao,
      titulo: `${s.tipo} · ${formatarData(s.data_realizacao)}`,
      subtitulo: [c.chamada, c.autor].filter(Boolean).join(' · '),
    })
  }

  for (const p of preparos) {
    if (p.mestre_preparo_id !== membroId) continue
    lista.push({
      chave: `p-${p.id}`,
      papel: 'preparo',
      sessaoId: null,
      preparoId: p.id,
      data: p.data_preparo,
      titulo: `Preparo · ${formatarData(p.data_preparo)}`,
      subtitulo: [p.grau && `Grau ${p.grau}`, `${formatarNumero(p.quantidade_preparada)} L`].filter(Boolean).join(' · '),
    })
  }

  return lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
}
