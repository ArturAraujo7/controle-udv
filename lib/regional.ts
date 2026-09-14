/**
 * Cálculos da visão regional (Mestre Central) — funções puras sobre o resultado
 * de dados_regionais(). Testes em __tests__/regional.test.ts.
 */
import {
  calcularSaldos, consumoMedioPorSessao, ehSessaoHistorica, estimarAutonomia, estoqueDisponivel,
  inicioMesesAtras, montarMovimentacoes, totalPorSessao, type Movimentacao, type PreparoComSaldo,
} from './estoque'
import { hojeISO } from './formato'
import type { DadosRegionais } from './tipos'

export type NucleoDaRegiao = DadosRegionais['nucleos'][number]

const arredondar = (n: number) => Math.round(n * 100) / 100
const texto = (v: string | null | undefined) => !!v && v.trim() !== ''
const normalizar = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^nucleo\s+/, '').trim()

/** Recorte dos dados regionais de um único núcleo. */
export function dadosDoNucleo(dados: DadosRegionais, nucleoId: number) {
  const doNucleo = <T extends { nucleo_id: number }>(lista: T[]) => lista.filter(item => item.nucleo_id === nucleoId)
  return {
    sessoes: doNucleo(dados.sessoes),
    consumos: doNucleo(dados.consumos),
    preparos: doNucleo(dados.preparos),
    saidas: doNucleo(dados.saidas),
    membros: doNucleo(dados.membros),
    leituras: doNucleo(dados.leituras),
    historias: doNucleo(dados.historias),
    visitantes: doNucleo(dados.visitantes),
    graus: doNucleo(dados.graus),
    responsaveis: dados.responsaveis.filter(r => r.nucleo_id === nucleoId),
  }
}

export type ResumoNucleo = {
  nucleo: NucleoDaRegiao
  lotes: PreparoComSaldo[]
  movimentacoes: Movimentacao[]
  estoque: number
  minimo: number
  abaixoMinimo: boolean
  consumoMedio: number
  autonomia: number | null
  sessoesAno: number
  participantesAno: number
  consumoAno: number
  ultimaSessao: string | null
  diasSemSessao: number | null
  lotesComSaldo: number
  lotesEmMaturacao: number
  pendencias: number
}

export function resumirNucleo(dados: DadosRegionais, nucleo: NucleoDaRegiao, agora = new Date()): ResumoNucleo {
  const d = dadosDoNucleo(dados, nucleo.id)
  const config = nucleo.configuracao
  const lotes = calcularSaldos(d.preparos, d.consumos, d.saidas, { hoje: hojeISO(agora), sessoes: d.sessoes })
  const estoque = estoqueDisponivel(lotes, config?.somar_maturacao_no_saldo ?? false)
  const minimo = Number(config?.estoque_minimo_litros ?? 10)
  const consumoMedio = consumoMedioPorSessao(d.sessoes, d.consumos, inicioMesesAtras(6, agora))
  const porSessao = totalPorSessao(d.consumos)

  const ano = String(agora.getFullYear())
  const realizadas = d.sessoes
    .filter(s => !ehSessaoHistorica(s))
    .sort((a, b) => b.data_realizacao.localeCompare(a.data_realizacao))
  const doAno = realizadas.filter(s => s.data_realizacao.startsWith(ano))
  const ultimaSessao = realizadas[0]?.data_realizacao ?? null

  const pendencias =
    d.sessoes.filter(s =>
      (texto(s.dirigente) && !s.dirigente_id) ||
      (texto(s.leitor_documentos) && !s.leitor_documentos_id) ||
      (texto(s.explanador) && !s.explanador_id)
    ).length +
    d.preparos.filter(p => texto(p.mestre_preparo) && !p.mestre_preparo_id).length

  return {
    nucleo,
    lotes,
    movimentacoes: montarMovimentacoes({ preparos: d.preparos, sessoes: d.sessoes, consumos: d.consumos, saidas: d.saidas }),
    estoque,
    minimo,
    abaixoMinimo: estoque < minimo,
    consumoMedio,
    autonomia: estimarAutonomia(estoque, consumoMedio),
    sessoesAno: doAno.length,
    participantesAno: doAno.reduce((a, s) => a + s.quantidade_participantes, 0),
    consumoAno: arredondar(doAno.reduce((a, s) => a + (porSessao.get(s.id) ?? 0), 0)),
    ultimaSessao,
    diasSemSessao: ultimaSessao ? Math.floor((agora.getTime() - new Date(ultimaSessao).getTime()) / 86_400_000) : null,
    lotesComSaldo: lotes.filter(l => l.saldo > 0).length,
    lotesEmMaturacao: lotes.filter(l => l.em_maturacao).length,
    pendencias,
  }
}

export type Alerta = {
  chave: string
  gravidade: 'alta' | 'media' | 'baixa'
  nucleoId: number
  titulo: string
  detalhe: string
}

/** Sem sessão registrada há mais que isso gera alerta. */
export const DIAS_SEM_SESSAO_ALERTA = 30

export function alertasDaRegiao(resumos: ResumoNucleo[]): Alerta[] {
  const alertas: Alerta[] = []
  for (const r of resumos) {
    const nome = r.nucleo.nome
    if (r.abaixoMinimo) {
      alertas.push({
        chave: `estoque-${r.nucleo.id}`,
        gravidade: 'alta',
        nucleoId: r.nucleo.id,
        titulo: `${nome} · estoque abaixo do mínimo`,
        detalhe: `${r.estoque.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L · mínimo do núcleo ${r.minimo.toLocaleString('pt-BR')} L`,
      })
    }
    if (r.diasSemSessao === null || r.diasSemSessao > DIAS_SEM_SESSAO_ALERTA) {
      alertas.push({
        chave: `sessao-${r.nucleo.id}`,
        gravidade: 'media',
        nucleoId: r.nucleo.id,
        titulo: r.diasSemSessao === null
          ? `${nome} · nenhuma sessão registrada`
          : `${nome} · sem sessão registrada há ${r.diasSemSessao} dias`,
        detalhe: r.ultimaSessao ? `Última: ${new Date(r.ultimaSessao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : 'Confira com o núcleo',
      })
    }
    if (r.pendencias > 0) {
      alertas.push({
        chave: `pendencias-${r.nucleo.id}`,
        gravidade: 'baixa',
        nucleoId: r.nucleo.id,
        titulo: `${nome} · ${r.pendencias} ${r.pendencias === 1 ? 'pendência' : 'pendências'} de dados`,
        detalhe: 'Nomes sem vínculo com o cadastro de membros',
      })
    }
  }
  const peso = { alta: 0, media: 1, baixa: 2 }
  return alertas.sort((a, b) => peso[a.gravidade] - peso[b.gravidade])
}

export function resumirRegiao(dados: DadosRegionais, agora = new Date()) {
  const resumos = dados.nucleos.filter(n => n.ativo).map(n => resumirNucleo(dados, n, agora))
  const estoque = arredondar(resumos.reduce((a, r) => a + r.estoque, 0))
  const consumoMedio = consumoMedioPorSessao(dados.sessoes, dados.consumos, inicioMesesAtras(6, agora))
  return {
    resumos,
    estoque,
    consumoMedio,
    autonomia: estimarAutonomia(estoque, consumoMedio),
    alertas: alertasDaRegiao(resumos),
  }
}

export type AtividadeRegional = {
  chave: string
  tipo: 'sessao' | 'preparo' | 'saida'
  nucleoId: number
  data: string
  registradoEm: string
  titulo: string
  subtitulo: string
  href: string
}

/** Últimos registros feitos na região, do mais recente para o mais antigo. */
export function atividadeRecente(dados: DadosRegionais, limite = 8): AtividadeRegional[] {
  const porSessao = totalPorSessao(dados.consumos)
  const litros = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`
  const lista: AtividadeRegional[] = [
    ...dados.sessoes.map(s => ({
      chave: `sessao-${s.id}`,
      tipo: 'sessao' as const,
      nucleoId: s.nucleo_id,
      data: s.data_realizacao,
      registradoEm: s.created_at,
      titulo: ehSessaoHistorica(s) ? `Registro histórico · ${s.tipo}` : `Sessão ${s.tipo}`,
      subtitulo: ehSessaoHistorica(s)
        ? s.dirigente || '—'
        : `${s.quantidade_participantes} participantes · ${litros(porSessao.get(s.id) ?? 0)}`,
      href: `/regional/sessoes/${s.id}`,
    })),
    ...dados.preparos.map(p => ({
      chave: `preparo-${p.id}`,
      tipo: 'preparo' as const,
      nucleoId: p.nucleo_id,
      data: p.data_preparo,
      registradoEm: p.created_at,
      titulo: p.tipo === 'Doação' ? `Doação recebida · ${litros(Number(p.quantidade_preparada))}` : `Novo preparo · ${litros(Number(p.quantidade_preparada))}`,
      subtitulo: p.tipo === 'Doação' ? `De ${p.nucleo_origem || '—'}` : `M. ${p.mestre_preparo.replace(/^M\.\s*/i, '')}`,
      href: `/regional/lotes/${p.id}`,
    })),
    ...dados.saidas.map(s => ({
      chave: `saida-${s.id}`,
      tipo: 'saida' as const,
      nucleoId: s.nucleo_id,
      data: s.data_saida,
      registradoEm: s.created_at,
      titulo: `Saída de ${litros(Number(s.quantidade))}`,
      subtitulo: `Para ${s.destino}${s.motivo ? ` · ${s.motivo}` : ''}`,
      href: s.preparo_id ? `/regional/lotes/${s.preparo_id}` : `/regional/nucleos/${s.nucleo_id}`,
    })),
  ]
  return lista
    .sort((a, b) => (b.registradoEm || b.data).localeCompare(a.registradoEm || a.data))
    .slice(0, limite)
}

export type FluxoEntreNucleos = {
  chave: string
  origemId: number
  destinoId: number
  data: string
  quantidade: number
  motivo: string | null
}

/** Saídas cujo destino é outro núcleo da mesma região (comparação pelo nome). */
export function fluxoEntreNucleos(dados: DadosRegionais): FluxoEntreNucleos[] {
  const porNome = new Map(dados.nucleos.map(n => [normalizar(n.nome), n.id]))
  return dados.saidas
    .map(s => {
      const destinoId = porNome.get(normalizar(s.destino))
      return destinoId && destinoId !== s.nucleo_id
        ? { chave: `fluxo-${s.id}`, origemId: s.nucleo_id, destinoId, data: s.data_saida, quantidade: Number(s.quantidade), motivo: s.motivo ?? null }
        : null
    })
    .filter((f): f is FluxoEntreNucleos => f !== null)
    .sort((a, b) => b.data.localeCompare(a.data))
}

/** Indicadores de um conjunto de sessões num intervalo de datas (inclusive). */
export function indicadoresPeriodo(
  dados: Pick<DadosRegionais, 'sessoes' | 'consumos' | 'preparos'>,
  inicio: string | null,
  fim: string | null
) {
  const dentro = (iso: string) => {
    const dia = iso.slice(0, 10)
    return (!inicio || dia >= inicio) && (!fim || dia <= fim)
  }
  const porSessao = totalPorSessao(dados.consumos)
  const sessoes = dados.sessoes.filter(s => dentro(s.data_realizacao))
  const realizadas = sessoes.filter(s => !ehSessaoHistorica(s))
  const participantes = realizadas.reduce((a, s) => a + s.quantidade_participantes, 0)
  const consumo = arredondar(realizadas.reduce((a, s) => a + (porSessao.get(s.id) ?? 0), 0))
  return {
    sessoes: sessoes.length,
    realizadas: realizadas.length,
    participantes,
    consumo,
    mediaParticipantes: realizadas.length ? participantes / realizadas.length : 0,
    perCapitaMl: participantes ? (consumo * 1000) / participantes : 0,
    preparos: dados.preparos.filter(p => dentro(p.data_preparo)).length,
  }
}
