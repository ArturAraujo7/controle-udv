'use client'
import { useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { Indicador } from '@/components/comum/Indicadores'
import { Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { GraficoConsumoMensal, GraficoSessoesPorMes, GraficoSessoesTipo } from '@/components/relatorios/Graficos'
import { ListaFuncaoLiturgica } from '@/components/relatorios/ListaFuncaoLiturgica'
import { TabelaSessoesPeriodo } from '@/components/relatorios/TabelaSessoesPeriodo'
import { TimelineMovimentacoes } from '@/components/relatorios/TimelineMovimentacoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import { baixarCSV } from '@/lib/csv'
import { calcularSaldos, ehSessaoHistorica, estoqueDisponivel, montarMovimentacoes, totalPorSessao } from '@/lib/estoque'
import { formatarData, formatarHora, formatarNumero, hojeISO, variacaoPercentual } from '@/lib/formato'
import { podeEditar } from '@/lib/permissoes'
import type { ConsumoSessao, Sessao } from '@/lib/tipos'
import { cn } from '@/lib/utils'

type Intervalo = { inicio: string | null; fim: string | null }

const SECOES = [
  { id: 'visao-geral', rotulo: 'Visão geral' },
  { id: 'sessoes-escalas', rotulo: 'Sessões' },
  { id: 'rastreabilidade', rotulo: 'Rastreabilidade' },
]

const dentro = (iso: string, intervalo: Intervalo) => {
  const dia = iso.slice(0, 10)
  return (!intervalo.inicio || dia >= intervalo.inicio) && (!intervalo.fim || dia <= intervalo.fim)
}

const deslocarDias = (iso: string, dias: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function resumir(sessoes: Sessao[], porSessao: Map<number, number>) {
  const reais = sessoes.filter(s => !ehSessaoHistorica(s))
  const participantes = reais.reduce((a, s) => a + s.quantidade_participantes, 0)
  const consumo = reais.reduce((a, s) => a + (porSessao.get(s.id) ?? 0), 0)
  return {
    sessoes: sessoes.length,
    reais: reais.length,
    participantes,
    mediaParticipantes: reais.length ? participantes / reais.length : 0,
    consumo,
    mediaConsumo: reais.length ? consumo / reais.length : 0,
    perCapitaMl: participantes ? (consumo * 1000) / participantes : 0,
  }
}

export default function Relatorios() {
  const { profile, nucleo } = useAuth()
  const editor = podeEditar(profile)
  const nomeNucleo = nucleo?.nome ?? 'Guardião'
  const { config } = useConfiguracoes()
  const { carregando, erro, preparos, consumos, saidas, sessoes } = useDadosEstoque()

  const [agora] = useState(() => new Date())
  const anoAtual = agora.getFullYear()
  const hoje = hojeISO(agora)
  const [escolha, setEscolha] = useState(String(anoAtual))
  const [desde, setDesde] = useState('')
  const [secaoAtiva, setSecaoAtiva] = useState(SECOES[0].id)
  const [imprimindo, setImprimindo] = useState(false)
  const refImpressao = useRef<HTMLDivElement>(null)

  const periodo = useMemo(() => {
    if (escolha === 'todos') {
      return { atual: { inicio: null, fim: null }, anterior: null, rotulo: 'Histórico total' }
    }
    if (escolha === 'desde') {
      if (!desde) return { atual: { inicio: hoje, fim: hoje }, anterior: null, rotulo: 'Escolha a data inicial' }
      const dias = Math.round((new Date(hoje).getTime() - new Date(desde).getTime()) / 86_400_000)
      return {
        atual: { inicio: desde, fim: hoje },
        anterior: { inicio: deslocarDias(desde, -dias - 1), fim: deslocarDias(desde, -1) },
        rotulo: `A partir de ${formatarData(desde)}`,
      }
    }
    const ano = Number(escolha)
    // No ano corrente, compara com o mesmo intervalo (até hoje) do ano anterior
    const fimAnterior = ano === anoAtual ? `${ano - 1}-${hoje.slice(5)}` : `${ano - 1}-12-31`
    return {
      atual: { inicio: `${ano}-01-01`, fim: `${ano}-12-31` },
      anterior: { inicio: `${ano - 1}-01-01`, fim: fimAnterior },
      rotulo: `Ano ${ano}`,
    }
  }, [escolha, desde, hoje, anoAtual])

  const dados = useMemo(() => {
    const porSessao = totalPorSessao(consumos)
    const ordenadas = [...sessoes].sort((a, b) => b.data_realizacao.localeCompare(a.data_realizacao))
    const sessoesPeriodo = ordenadas.filter(s => dentro(s.data_realizacao, periodo.atual))
    const idsPeriodo = new Set(sessoesPeriodo.map(s => s.id))
    const consumosPeriodo: ConsumoSessao[] = consumos.filter(c => idsPeriodo.has(c.id_sessao))

    const atual = resumir(sessoesPeriodo, porSessao)
    const anterior = periodo.anterior
      ? resumir(ordenadas.filter(s => dentro(s.data_realizacao, periodo.anterior!)), porSessao)
      : null

    const lotes = calcularSaldos(preparos, consumos, saidas, { hoje, sessoes })
    const movimentacoes = montarMovimentacoes({ preparos, sessoes, consumos, saidas })
      .filter(m => dentro(m.data, periodo.atual))

    return {
      porSessao,
      sessoesPeriodo,
      consumosPeriodo,
      atual,
      anterior,
      estoque: estoqueDisponivel(lotes, config.somar_maturacao_no_saldo),
      movimentacoes,
    }
  }, [sessoes, consumos, preparos, saidas, periodo, hoje, config.somar_maturacao_no_saldo])

  // Sem controle de vegetal antes de 2026: esses números só aparecem quando fazem sentido.
  const mostrarVegetal = escolha === 'todos' || escolha === 'desde' || Number(escolha) >= 2026
  const variacao = (atual: number, chave: keyof ReturnType<typeof resumir>) =>
    dados.anterior ? variacaoPercentual(atual, dados.anterior[chave]) : undefined

  const imprimir = useReactToPrint({
    contentRef: refImpressao,
    documentTitle: `Relatorio_Guardiao_${periodo.rotulo.replace(/\W+/g, '_')}`,
    onBeforePrint: () => new Promise<void>(resolve => {
      setImprimindo(true)
      setTimeout(resolve, 50)
    }),
    onAfterPrint: () => setImprimindo(false),
  })

  const exportarSessoes = () => {
    baixarCSV(`sessoes-${periodo.rotulo}`, [
      ['Data', 'Hora', 'Tipo', 'Dirigente', 'Delegação', 'Leitor', 'Explanador', 'Participantes', 'Consumo (L)'],
      ...[...dados.sessoesPeriodo].reverse().map(s => [
        formatarData(s.data_realizacao),
        formatarHora(s.data_realizacao),
        s.tipo,
        s.dirigente,
        s.tipo_delegacao,
        s.leitor_documentos,
        s.explanador,
        ehSessaoHistorica(s) ? '' : s.quantidade_participantes,
        ehSessaoHistorica(s) ? '' : formatarNumero(dados.porSessao.get(s.id) ?? 0),
      ]),
    ])
  }

  const exportarMovimentacoes = () => {
    baixarCSV(`movimentacoes-${periodo.rotulo}`, [
      ['Data', 'Tipo', 'Descrição', 'Detalhe', 'Quantidade (L)', 'Saldo após (L)'],
      ...[...dados.movimentacoes].reverse().map(m => [
        formatarData(m.data),
        m.tipo === 'entrada' ? 'Entrada' : m.tipo === 'consumo' ? 'Consumo' : 'Saída',
        m.titulo,
        m.subtitulo,
        `${m.tipo === 'entrada' ? '' : '-'}${formatarNumero(m.quantidade)}`,
        formatarNumero(m.saldoApos),
      ]),
    ])
  }

  const irPara = (id: string) => {
    setSecaoAtiva(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Cabecalho
        titulo="Relatórios"
        acoes={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={carregando} className="print:hidden">
                <Download /> <span className="hidden sm:inline">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => imprimir()}>
                <Printer /> Relatório em PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={exportarSessoes}>
                <FileSpreadsheet /> Sessões (CSV)
              </DropdownMenuItem>
              {mostrarVegetal && (
                <DropdownMenuItem onSelect={exportarMovimentacoes}>
                  <FileSpreadsheet /> Movimentações (CSV)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Período fixo no topo ao rolar */}
      <div className="sticky top-14 z-20 -mx-4 mb-4 space-y-2 border-b bg-background/90 px-4 py-2.5 backdrop-blur print:hidden md:mx-0 md:rounded-b-xl md:px-0">
        <ChipsFiltro
          rotulo="Período"
          valor={escolha}
          onChange={setEscolha}
          opcoes={[
            { valor: String(anoAtual), rotulo: String(anoAtual) },
            { valor: String(anoAtual - 1), rotulo: String(anoAtual - 1) },
            { valor: String(anoAtual - 2), rotulo: String(anoAtual - 2) },
            { valor: 'todos', rotulo: 'Histórico total' },
            { valor: 'desde', rotulo: 'A partir de uma data…' },
          ]}
        />
        {escolha === 'desde' && (
          <div className="flex items-center gap-2">
            <Label htmlFor="desde" className="shrink-0 text-muted-foreground">Início</Label>
            <Input id="desde" type="date" value={desde} max={hoje} onChange={e => setDesde(e.target.value)} className="h-9 w-auto" />
          </div>
        )}
        <nav aria-label="Seções do relatório" className="grid grid-cols-3 rounded-lg bg-muted p-[3px]">
          {SECOES.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => irPara(s.id)}
              className={cn(
                'rounded-md py-1.5 text-xs font-medium transition-colors sm:text-sm',
                secaoAtiva === s.id ? 'bg-background text-foreground shadow-sm dark:bg-input/40' : 'text-muted-foreground'
              )}
            >
              {s.rotulo}
            </button>
          ))}
        </nav>
      </div>

      {erro && <div className="mb-4"><Vazio>Não foi possível carregar os dados: {erro}</Vazio></div>}

      <div ref={refImpressao} className="print:bg-white print:p-0 print:text-black">
        <style dangerouslySetInnerHTML={{ __html: '@media print { @page { margin: 15mm; } }' }} />

        <div className="mb-8 hidden flex-col items-center gap-3 border-b pb-5 print:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/PDF/header.svg" alt="Guardião" className="h-16 w-auto" />
          <p className="text-sm font-semibold">{nomeNucleo}</p>
          <p className="text-[10px] uppercase tracking-widest">
            Período de referência: <span className="font-bold">{periodo.rotulo}</span>
          </p>
        </div>

        <Secao id="visao-geral" titulo="Visão geral" className="mt-0 scroll-mt-44" acao={<span className="print:hidden">{periodo.rotulo}</span>}>
          <div className={cn('grid grid-cols-2 gap-3', mostrarVegetal ? 'lg:grid-cols-5' : 'lg:grid-cols-3')}>
            {mostrarVegetal && (
              <Indicador
                rotulo="Estoque atual"
                valor={formatarNumero(dados.estoque)}
                unidade="L"
                detalhe="Saldo real hoje"
                carregando={carregando}
                className="col-span-2 ring-primary/30 lg:col-span-1"
              />
            )}
            <Indicador
              rotulo="Sessões"
              valor={dados.atual.sessoes}
              detalhe={dados.atual.sessoes !== dados.atual.reais ? `${dados.atual.reais} realizadas` : undefined}
              variacao={variacao(dados.atual.sessoes, 'sessoes')}
              carregando={carregando}
            />
            <Indicador
              rotulo={escolha === 'todos' ? 'Média de participantes' : 'Participantes'}
              valor={escolha === 'todos' ? Math.round(dados.atual.mediaParticipantes) : dados.atual.participantes}
              detalhe={escolha === 'todos' ? 'por sessão realizada' : `média de ${Math.round(dados.atual.mediaParticipantes)} por sessão`}
              variacao={escolha === 'todos' ? undefined : variacao(dados.atual.participantes, 'participantes')}
              carregando={carregando}
            />
            {mostrarVegetal && (
              <>
                <Indicador
                  rotulo="Consumo total"
                  valor={formatarNumero(dados.atual.consumo)}
                  unidade="L"
                  detalhe={`média de ${formatarNumero(dados.atual.mediaConsumo)} L por sessão`}
                  variacao={variacao(dados.atual.consumo, 'consumo')}
                  carregando={carregando}
                />
                <Indicador
                  rotulo="Consumo por pessoa"
                  valor={Math.round(dados.atual.perCapitaMl)}
                  unidade="ml"
                  variacao={variacao(dados.atual.perCapitaMl, 'perCapitaMl')}
                  carregando={carregando}
                />
              </>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 print:block">
            <Card className="print:hidden">
              <CardContent>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Sessões por mês</h3>
                <GraficoSessoesPorMes sessoes={dados.sessoesPeriodo} loading={carregando} />
              </CardContent>
            </Card>
            {mostrarVegetal && (
              <Card className="print:hidden">
                <CardContent>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Consumo mensal (L)</h3>
                  <GraficoConsumoMensal sessoes={dados.sessoesPeriodo} consumos={dados.consumosPeriodo} loading={carregando} />
                </CardContent>
              </Card>
            )}
            <Card className="print:mx-auto print:w-3/4 print:break-inside-avoid print:shadow-none">
              <CardContent>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground print:text-black">Tipos de sessão</h3>
                <GraficoSessoesTipo sessoes={dados.sessoesPeriodo} loading={carregando} />
              </CardContent>
            </Card>
          </div>
        </Secao>

        <Secao id="sessoes-escalas" titulo="Sessões e escalas" className="scroll-mt-44 print:break-before-page">
          <TabelaSessoesPeriodo
            sessoes={dados.sessoesPeriodo}
            loading={carregando}
            periodo={periodo.rotulo}
            nucleoNome={nomeNucleo}
          />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ListaFuncaoLiturgica titulo="Dirigentes" sessoes={dados.sessoesPeriodo} funcaoKey="dirigente" loading={carregando} />
            <ListaFuncaoLiturgica titulo="Leitores" sessoes={dados.sessoesPeriodo} funcaoKey="leitor_documentos" loading={carregando} />
            <ListaFuncaoLiturgica titulo="Explanadores" sessoes={dados.sessoesPeriodo} funcaoKey="explanador" loading={carregando} />
          </div>
        </Secao>

        {mostrarVegetal && (
          <Secao id="rastreabilidade" titulo="Rastreabilidade" className="scroll-mt-44">
            <TimelineMovimentacoes
              movimentacoes={dados.movimentacoes}
              loading={carregando}
              podeEditar={editor}
              mostrarTudo={imprimindo}
            />
          </Secao>
        )}

        {config.assinatura_relatorio && (
          <div className="mt-12 hidden text-center text-sm print:block">
            <div className="mx-auto mb-1 w-64 border-t border-black" />
            {config.assinatura_relatorio}
          </div>
        )}
      </div>
    </>
  )
}
