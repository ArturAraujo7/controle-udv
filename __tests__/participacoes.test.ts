import { participacoesDoMembro } from '@/lib/participacoes'
import type { Leitura, Preparo, Sessao } from '@/lib/tipos'

const sessao = (s: Partial<Sessao> & { id: number }): Sessao => ({
  data_realizacao: '2026-09-06T20:00:00+00:00', tipo: 'Escala', dirigente: 'M. Fulano', dirigente_id: null,
  dirigente_2_id: null, tipo_delegacao: null, explanador: null, explanador_id: null, leitor_documentos: null,
  leitor_documentos_id: null, quantidade_participantes: 30, user_id: null, created_at: '2026-09-06T00:00:00Z', ...s,
})

describe('participacoesDoMembro', () => {
  it('reúne funções nas sessões, leituras e preparos sem duplicar a leitura', () => {
    const sessoes = [
      sessao({ id: 1, dirigente_id: 7, data_realizacao: '2026-08-01T20:00:00+00:00' }),
      sessao({ id: 2, leitor_documentos_id: 7, data_realizacao: '2026-09-01T20:00:00+00:00' }),
      sessao({ id: 3, data_realizacao: '2026-07-01T20:00:00+00:00' }),
    ]
    const leituras: Leitura[] = [
      { id: 10, id_sessao: 2, documento: 'Doc A', leitor: null, leitor_id: 7 },
      { id: 11, id_sessao: 3, documento: 'Doc B', leitor: null, leitor_id: 7 },
    ]
    const preparos = [
      { id: 5, data_preparo: '2026-09-10', mestre_preparo_id: 7, grau: '1', quantidade_preparada: 12 } as Preparo,
    ]

    const lista = participacoesDoMembro(7, { sessoes, leituras, preparos })
    expect(lista.map(p => [p.chave, p.papel])).toEqual([
      ['p-5', 'preparo'],
      ['l-2', 'leitor'],
      ['d-1', 'dirigente'],
      ['lt-11', 'leitor'],
    ])
  })
})
