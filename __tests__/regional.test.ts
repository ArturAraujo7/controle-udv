import { alertasDaRegiao, atividadeRecente, fluxoEntreNucleos, indicadoresPeriodo, resumirNucleo, resumirRegiao } from '@/lib/regional'
import type { DadosRegionais } from '@/lib/tipos'

const configuracao = (nucleo_id: number, minimo = 10) => ({
  nucleo_id, logo_arquivo: null, estoque_minimo_litros: minimo, dias_lote_parado: 90, somar_maturacao_no_saldo: false,
  calendario_padrao: null, exigir_leitor_explanador: true, assinatura_relatorio: null, resumo_mensal_email: false,
})

const base = (): DadosRegionais => ({
  regiao: { id: 1, nome: 'Região Teste', created_at: '2026-01-01' },
  nucleos: [
    { id: 1, nome: 'Núcleo Alfa', regiao_id: 1, cidade: null, ativo: true, created_at: '2026-01-01', configuracao: configuracao(1, 5) },
    { id: 2, nome: 'Núcleo Beta', regiao_id: 1, cidade: null, ativo: true, created_at: '2026-01-01', configuracao: configuracao(2, 10) },
  ],
  preparos: [
    {
      id: 10, nucleo_id: 1, tipo: 'Local', data_preparo: '2026-01-10', data_chegada: null, nucleo_origem: null, mestre_preparo: 'João',
      mestre_preparo_id: null, procedencia_mariri: null, procedencia_chacrona: null, quantidade_preparada: 20, grau: '1',
      status: 'Disponível', user_id: null, created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 20, nucleo_id: 2, tipo: 'Local', data_preparo: '2026-02-01', data_chegada: null, nucleo_origem: null, mestre_preparo: 'Pedro',
      mestre_preparo_id: 5, procedencia_mariri: null, procedencia_chacrona: null, quantidade_preparada: 8, grau: '1',
      status: 'Disponível', user_id: null, created_at: '2026-02-01T10:00:00Z',
    },
  ],
  sessoes: [
    {
      id: 100, nucleo_id: 1, data_realizacao: '2026-09-06T20:00:00+00:00', tipo: 'Escala', dirigente: 'M. Fulano', dirigente_id: 7,
      dirigente_2_id: null, tipo_delegacao: null, explanador: 'Ciclano', explanador_id: null, leitor_documentos: null,
      leitor_documentos_id: null, quantidade_participantes: 30, user_id: null, created_at: '2026-09-06T23:00:00Z',
    },
  ],
  consumos: [{ id: 1, nucleo_id: 1, id_sessao: 100, id_preparo: 10, quantidade_consumida: 2 }],
  saidas: [
    { id: 50, nucleo_id: 1, data_saida: '2026-09-01', quantidade: 3, destino: 'Beta', preparo_id: 10, observacoes: null, motivo: 'Doação', created_at: '2026-09-01T12:00:00Z' },
  ],
  membros: [], chamadas: [], historias: [], visitantes: [], graus: [], responsaveis: [],
})

const agora = new Date('2026-09-14T12:00:00Z')

describe('resumirNucleo', () => {
  it('calcula estoque, mínimo, sessões e pendências de cada núcleo', () => {
    const dados = base()
    const alfa = resumirNucleo(dados, dados.nucleos[0], agora)
    expect(alfa.estoque).toBe(15)
    expect(alfa.abaixoMinimo).toBe(false)
    expect(alfa.sessoesAno).toBe(1)
    expect(alfa.consumoAno).toBe(2)
    expect(alfa.diasSemSessao).toBe(7)
    expect(alfa.pendencias).toBe(2) // explanador em texto + mestre do preparo em texto

    const beta = resumirNucleo(dados, dados.nucleos[1], agora)
    expect(beta.estoque).toBe(8)
    expect(beta.abaixoMinimo).toBe(true)
    expect(beta.diasSemSessao).toBeNull()
  })
})

describe('região', () => {
  it('soma o estoque e ordena os alertas por gravidade', () => {
    const regiao = resumirRegiao(base(), agora)
    expect(regiao.estoque).toBe(23)
    expect(regiao.alertas.map(a => a.chave)).toEqual(['estoque-2', 'sessao-2', 'pendencias-1'])
    expect(alertasDaRegiao([])).toEqual([])
  })

  it('identifica saídas entre núcleos da região pelo nome', () => {
    expect(fluxoEntreNucleos(base())).toEqual([
      { chave: 'fluxo-50', origemId: 1, destinoId: 2, data: '2026-09-01', quantidade: 3, motivo: 'Doação' },
    ])
  })

  it('lista a atividade recente pela data de registro', () => {
    expect(atividadeRecente(base(), 3).map(a => a.chave)).toEqual(['sessao-100', 'saida-50', 'preparo-20'])
  })

  it('calcula indicadores do período', () => {
    const ind = indicadoresPeriodo(base(), '2026-01-01', '2026-12-31')
    expect(ind).toMatchObject({ sessoes: 1, realizadas: 1, participantes: 30, consumo: 2, preparos: 2 })
    expect(Math.round(ind.perCapitaMl)).toBe(67)
  })
})
