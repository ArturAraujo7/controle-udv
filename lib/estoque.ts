/**
 * Regras de estoque — funções puras, compartilhadas por Início, Estoque,
 * Sessões e Relatórios (testes em __tests__/estoque.test.ts).
 *
 * Estoque = Σ preparos − Σ consumos de sessão − Σ saídas
 */
import { chaveMes } from './formato'
import type { ConsumoSessao, Preparo, Saida, Sessao } from './tipos'

const arredondar = (n: number) => Math.round(n * 100) / 100

export type PreparoComSaldo = Preparo & {
  consumido_sessoes: number
  saido: number
  total_consumido: number
  saldo: number
  /** Saldo restante em % da quantidade inicial (0–100). */
  percentual: number
  em_maturacao: boolean
  /** Data da última entrada, consumo ou saída deste lote. */
  ultima_movimentacao: string
}

export function ehSessaoHistorica(sessao: Pick<Sessao, 'quantidade_participantes'>) {
  return sessao.quantidade_participantes === 0
}

/** Em maturação enquanto não passa a data de liberação (sem data = até mudar o status). */
export function emMaturacao(preparo: Pick<Preparo, 'status' | 'data_liberacao'>, hoje: string) {
  return preparo.status === 'Em Maturação' && (!preparo.data_liberacao || preparo.data_liberacao > hoje)
}

export function totalPorSessao(consumos: Pick<ConsumoSessao, 'id_sessao' | 'quantidade_consumida'>[]) {
  const mapa = new Map<number, number>()
  for (const c of consumos) {
    mapa.set(c.id_sessao, arredondar((mapa.get(c.id_sessao) ?? 0) + Number(c.quantidade_consumida || 0)))
  }
  return mapa
}

const maisRecente = (a: string, b: string) => (new Date(a).getTime() >= new Date(b).getTime() ? a : b)

export function calcularSaldos(
  preparos: Preparo[],
  consumos: Pick<ConsumoSessao, 'id_sessao' | 'id_preparo' | 'quantidade_consumida'>[],
  saidas: Pick<Saida, 'preparo_id' | 'quantidade' | 'data_saida'>[],
  opcoes: { hoje: string; sessoes?: Pick<Sessao, 'id' | 'data_realizacao'>[] }
): PreparoComSaldo[] {
  const dataSessao = new Map((opcoes.sessoes ?? []).map(s => [s.id, s.data_realizacao]))
  const consumido = new Map<number, number>()
  const saido = new Map<number, number>()
  const ultima = new Map<number, string>()

  for (const c of consumos) {
    consumido.set(c.id_preparo, (consumido.get(c.id_preparo) ?? 0) + Number(c.quantidade_consumida || 0))
    const data = dataSessao.get(c.id_sessao)
    if (data) ultima.set(c.id_preparo, maisRecente(ultima.get(c.id_preparo) ?? data, data))
  }
  for (const s of saidas) {
    if (s.preparo_id == null) continue
    saido.set(s.preparo_id, (saido.get(s.preparo_id) ?? 0) + Number(s.quantidade || 0))
    ultima.set(s.preparo_id, maisRecente(ultima.get(s.preparo_id) ?? s.data_saida, s.data_saida))
  }

  return preparos.map(p => {
    const inicial = Number(p.quantidade_preparada || 0)
    const deSessoes = consumido.get(p.id) ?? 0
    const deSaidas = saido.get(p.id) ?? 0
    const total = deSessoes + deSaidas
    const saldo = arredondar(inicial - total)
    const entrada = (p.tipo === 'Doação' && p.data_chegada) || p.data_preparo
    return {
      ...p,
      consumido_sessoes: arredondar(deSessoes),
      saido: arredondar(deSaidas),
      total_consumido: arredondar(total),
      saldo,
      percentual: inicial > 0 ? Math.max(0, Math.min(100, (saldo / inicial) * 100)) : 0,
      em_maturacao: emMaturacao(p, opcoes.hoje),
      ultima_movimentacao: maisRecente(ultima.get(p.id) ?? entrada, entrada),
    }
  })
}

/** Saldo disponível; lotes em maturação só entram se a configuração pedir. */
export function estoqueDisponivel(lotes: PreparoComSaldo[], somarMaturacao = false) {
  return arredondar(
    lotes.reduce((acc, lote) => (lote.em_maturacao && !somarMaturacao ? acc : acc + lote.saldo), 0)
  )
}

/** Lote com saldo que não se move há mais de `dias`. */
export function lotesParados(lotes: PreparoComSaldo[], dias: number, agora = new Date()) {
  const limite = agora.getTime() - dias * 86_400_000
  return lotes.filter(l => l.saldo > 0 && !l.em_maturacao && new Date(l.ultima_movimentacao).getTime() < limite)
}

export type TipoMovimentacao = 'entrada' | 'consumo' | 'saida'

export type Movimentacao = {
  id: string
  tipo: TipoMovimentacao
  data: string
  /** id do preparo, sessão ou saída de origem. */
  refId: number
  titulo: string
  subtitulo: string
  quantidade: number
  /** Saldo total do estoque logo após esta movimentação. */
  saldoApos: number
}

const ORDEM_TIPO: Record<TipoMovimentacao, number> = { entrada: 0, consumo: 1, saida: 2 }

/**
 * Extrato de tudo que mexeu no estoque, do mais recente para o mais antigo,
 * com o saldo acumulado. Sessões históricas e sessões sem consumo ficam fora.
 */
export function montarMovimentacoes({
  preparos,
  sessoes,
  consumos,
  saidas,
}: {
  preparos: Preparo[]
  sessoes: Sessao[]
  consumos: Pick<ConsumoSessao, 'id_sessao' | 'quantidade_consumida'>[]
  saidas: Saida[]
}): Movimentacao[] {
  const porSessao = totalPorSessao(consumos)
  const lista: Movimentacao[] = []

  for (const p of preparos) {
    const doacao = p.tipo === 'Doação'
    lista.push({
      id: `preparo-${p.id}`,
      tipo: 'entrada',
      data: (doacao && p.data_chegada) || p.data_preparo,
      refId: p.id,
      titulo: doacao ? `Doação de ${p.nucleo_origem || 'outro núcleo'}` : 'Novo preparo',
      subtitulo: [p.mestre_preparo && `M. ${p.mestre_preparo.replace(/^M\.\s*/i, '')}`, p.grau && `Grau ${p.grau}`]
        .filter(Boolean)
        .join(' · '),
      quantidade: Number(p.quantidade_preparada || 0),
      saldoApos: 0,
    })
  }

  for (const s of sessoes) {
    const total = porSessao.get(s.id) ?? 0
    if (ehSessaoHistorica(s) || total === 0) continue
    lista.push({
      id: `sessao-${s.id}`,
      tipo: 'consumo',
      data: s.data_realizacao,
      refId: s.id,
      titulo: `Sessão · ${s.tipo}`,
      subtitulo: [`${s.quantidade_participantes} participantes`, s.dirigente].filter(Boolean).join(' · '),
      quantidade: total,
      saldoApos: 0,
    })
  }

  for (const s of saidas) {
    lista.push({
      id: `saida-${s.id}`,
      tipo: 'saida',
      data: s.data_saida,
      refId: s.id,
      titulo: `Saída para ${s.destino}`,
      subtitulo: [s.motivo, s.observacoes].filter(Boolean).join(' · ') || 'Saída externa',
      quantidade: Number(s.quantidade || 0),
      saldoApos: 0,
    })
  }

  lista.sort(
    (a, b) =>
      new Date(a.data).getTime() - new Date(b.data).getTime() ||
      ORDEM_TIPO[a.tipo] - ORDEM_TIPO[b.tipo] ||
      a.refId - b.refId
  )

  let saldo = 0
  for (const m of lista) {
    saldo += m.tipo === 'entrada' ? m.quantidade : -m.quantidade
    m.saldoApos = arredondar(saldo)
  }

  return lista.reverse()
}

/** Consumo médio por sessão (só sessões reais com consumo), opcionalmente a partir de uma data. */
export function consumoMedioPorSessao(
  sessoes: Pick<Sessao, 'id' | 'data_realizacao' | 'quantidade_participantes'>[],
  consumos: Pick<ConsumoSessao, 'id_sessao' | 'quantidade_consumida'>[],
  desde?: string
) {
  const porSessao = totalPorSessao(consumos)
  const validas = sessoes.filter(
    s => !ehSessaoHistorica(s) && (!desde || s.data_realizacao >= desde) && (porSessao.get(s.id) ?? 0) > 0
  )
  if (validas.length === 0) return 0
  return arredondar(validas.reduce((acc, s) => acc + (porSessao.get(s.id) ?? 0), 0) / validas.length)
}

/** Quantas sessões o estoque atende no consumo médio; `null` sem base. */
export function estimarAutonomia(estoque: number, consumoMedio: number) {
  if (consumoMedio <= 0 || estoque <= 0) return null
  return Math.floor(estoque / consumoMedio)
}

/** Primeiro dia do mês, `meses` atrás, em "YYYY-MM-DD". */
export function inicioMesesAtras(meses: number, agora = new Date()) {
  const d = new Date(agora.getFullYear(), agora.getMonth() - meses, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/**
 * Saldo ao fim de cada um dos últimos `meses` meses (inclui o atual),
 * a partir do extrato em ordem decrescente.
 */
export function serieSaldoMensal(movimentacoes: Movimentacao[], meses = 12, agora = new Date()) {
  const cronologica = [...movimentacoes].reverse()
  const serie: { chave: string; saldo: number }[] = []

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    let saldo = 0
    for (const m of cronologica) {
      if (chaveMes(m.data) > chave) break
      saldo = m.saldoApos
    }
    serie.push({ chave, saldo })
  }
  return serie
}

/** Agrupa itens (já ordenados) por mês, preservando a ordem. */
export function agruparPorMes<T>(itens: T[], dataDe: (item: T) => string) {
  const grupos: { chave: string; itens: T[] }[] = []
  for (const item of itens) {
    const chave = chaveMes(dataDe(item))
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.chave === chave) ultimo.itens.push(item)
    else grupos.push({ chave, itens: [item] })
  }
  return grupos
}
