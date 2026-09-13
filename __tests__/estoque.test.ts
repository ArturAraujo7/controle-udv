import {
  agruparPorMes, calcularSaldos, consumoMedioPorSessao, emMaturacao, estimarAutonomia,
  estoqueDisponivel, lotesParados, montarMovimentacoes, serieSaldoMensal,
} from '@/lib/estoque'
import { rotuloMes, separarDataHora, variacaoPercentual } from '@/lib/formato'
import type { ConsumoSessao, Preparo, Saida, Sessao } from '@/lib/tipos'

const preparo = (p: Partial<Preparo> & { id: number }): Preparo => ({
  tipo: 'Local', data_preparo: '2026-01-10', data_chegada: null, nucleo_origem: null,
  mestre_preparo: 'João', mestre_preparo_id: null, procedencia_mariri: null, procedencia_chacrona: null,
  quantidade_preparada: 10, grau: '1', status: 'Disponível', data_liberacao: null, observacoes: null,
  user_id: null, created_at: '2026-01-10T00:00:00Z', ...p,
})

const sessao = (s: Partial<Sessao> & { id: number }): Sessao => ({
  data_realizacao: '2026-02-01T20:00:00+00:00', tipo: 'Escala', dirigente: 'M. Fulano', dirigente_id: null,
  dirigente_2_id: null, tipo_delegacao: null, explanador: null, explanador_id: null, leitor_documentos: null,
  leitor_documentos_id: null, quantidade_participantes: 30, user_id: null, created_at: '2026-02-01T00:00:00Z', ...s,
})

const saida = (s: Partial<Saida> & { id: number }): Saida => ({
  data_saida: '2026-03-01', quantidade: 1, destino: 'Núcleo X', preparo_id: 1, observacoes: null,
  created_at: '2026-03-01T00:00:00Z', ...s,
})

const consumo = (c: Partial<ConsumoSessao> & { id: number }): ConsumoSessao => ({
  id_sessao: 1, id_preparo: 1, quantidade_consumida: 1, ...c,
})

describe('calcularSaldos', () => {
  it('desconta consumos e saídas de cada lote', () => {
    const [lote] = calcularSaldos(
      [preparo({ id: 1, quantidade_preparada: 10 })],
      [consumo({ id: 1, quantidade_consumida: 2.5 }), consumo({ id: 2, quantidade_consumida: 1.2 })],
      [saida({ id: 1, quantidade: 0.3 })],
      { hoje: '2026-09-13' }
    )
    expect(lote.consumido_sessoes).toBe(3.7)
    expect(lote.saido).toBe(0.3)
    expect(lote.saldo).toBe(6)
    expect(lote.percentual).toBe(60)
  })

  it('usa a data mais recente de consumo ou saída como última movimentação', () => {
    const [lote] = calcularSaldos(
      [preparo({ id: 1 })],
      [consumo({ id: 1, id_sessao: 7 })],
      [saida({ id: 1, data_saida: '2026-04-02' })],
      { hoje: '2026-09-13', sessoes: [{ id: 7, data_realizacao: '2026-05-01T20:00:00+00:00' }] }
    )
    expect(lote.ultima_movimentacao).toBe('2026-05-01T20:00:00+00:00')
  })
})

describe('maturação', () => {
  it('considera em maturação até a data de liberação', () => {
    expect(emMaturacao({ status: 'Em Maturação', data_liberacao: '2026-10-01' }, '2026-09-13')).toBe(true)
    expect(emMaturacao({ status: 'Em Maturação', data_liberacao: '2026-09-01' }, '2026-09-13')).toBe(false)
    expect(emMaturacao({ status: 'Disponível', data_liberacao: null }, '2026-09-13')).toBe(false)
  })

  it('só soma lotes em maturação quando configurado', () => {
    const lotes = calcularSaldos(
      [preparo({ id: 1, quantidade_preparada: 5 }), preparo({ id: 2, quantidade_preparada: 8, status: 'Em Maturação' })],
      [], [], { hoje: '2026-09-13' }
    )
    expect(estoqueDisponivel(lotes)).toBe(5)
    expect(estoqueDisponivel(lotes, true)).toBe(13)
  })
})

describe('lotesParados', () => {
  it('lista lotes com saldo sem movimento há mais de N dias', () => {
    const lotes = calcularSaldos(
      [preparo({ id: 1, data_preparo: '2026-01-01' }), preparo({ id: 2, data_preparo: '2026-09-01' })],
      [], [], { hoje: '2026-09-13' }
    )
    const parados = lotesParados(lotes, 90, new Date('2026-09-13T12:00:00Z'))
    expect(parados.map(l => l.id)).toEqual([1])
  })
})

describe('montarMovimentacoes', () => {
  const dados = {
    preparos: [preparo({ id: 1, quantidade_preparada: 10, data_preparo: '2026-01-10' })],
    sessoes: [
      sessao({ id: 1, data_realizacao: '2026-02-01T20:00:00+00:00' }),
      sessao({ id: 2, data_realizacao: '2026-02-15T20:00:00+00:00', quantidade_participantes: 0 }),
    ],
    consumos: [consumo({ id: 1, id_sessao: 1, quantidade_consumida: 2 })],
    saidas: [saida({ id: 1, data_saida: '2026-03-01', quantidade: 1.5 })],
  }

  it('ordena do mais recente e calcula o saldo acumulado', () => {
    const extrato = montarMovimentacoes(dados)
    expect(extrato.map(m => m.id)).toEqual(['saida-1', 'sessao-1', 'preparo-1'])
    expect(extrato.map(m => m.saldoApos)).toEqual([6.5, 8, 10])
  })

  it('ignora sessões históricas e sessões sem consumo', () => {
    expect(montarMovimentacoes(dados).some(m => m.id === 'sessao-2')).toBe(false)
  })

  it('gera a série mensal de saldo', () => {
    const serie = serieSaldoMensal(montarMovimentacoes(dados), 4, new Date(2026, 3, 15))
    expect(serie).toEqual([
      { chave: '2026-01', saldo: 10 },
      { chave: '2026-02', saldo: 8 },
      { chave: '2026-03', saldo: 6.5 },
      { chave: '2026-04', saldo: 6.5 },
    ])
  })
})

describe('consumo médio e autonomia', () => {
  it('calcula a média só de sessões reais com consumo', () => {
    const sessoes = [sessao({ id: 1 }), sessao({ id: 2 }), sessao({ id: 3, quantidade_participantes: 0 })]
    const consumos = [
      consumo({ id: 1, id_sessao: 1, quantidade_consumida: 2 }),
      consumo({ id: 2, id_sessao: 2, quantidade_consumida: 1 }),
      consumo({ id: 3, id_sessao: 3, quantidade_consumida: 9 }),
    ]
    expect(consumoMedioPorSessao(sessoes, consumos)).toBe(1.5)
    expect(estimarAutonomia(10, 1.5)).toBe(6)
    expect(estimarAutonomia(10, 0)).toBeNull()
  })
})

describe('utilitários de data', () => {
  it('agrupa por mês preservando a ordem', () => {
    const grupos = agruparPorMes(['2026-09-02', '2026-09-01', '2026-08-30'], d => d)
    expect(grupos.map(g => [g.chave, g.itens.length])).toEqual([['2026-09', 2], ['2026-08', 1]])
  })

  it('formata rótulo de mês, separa data/hora e calcula variação', () => {
    expect(rotuloMes('2026-09')).toBe('Setembro de 2026')
    expect(separarDataHora('2026-09-06T20:30:00+00:00')).toEqual({ data: '2026-09-06', hora: '20:30' })
    expect(variacaoPercentual(12, 10)).toBeCloseTo(20)
    expect(variacaoPercentual(5, 0)).toBeNull()
  })
})
