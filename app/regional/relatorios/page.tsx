'use client'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'

import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { Indicador } from '@/components/comum/Indicadores'
import { IconeLinha, ItemLista, ListaCard, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { CarregandoRegional } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { GraficoComparativo, GraficoLinhasNucleos, corDoNucleo, mesesDoPeriodo } from '@/components/regional/Graficos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { baixarCSV } from '@/lib/csv'
import { ehSessaoHistorica, serieSaldoMensal, totalPorSessao } from '@/lib/estoque'
import { formatarData, formatarHora, formatarNumero, hojeISO, variacaoPercentual } from '@/lib/formato'
import { dadosDoNucleo, indicadoresPeriodo } from '@/lib/regional'
import { cn } from '@/lib/utils'

type Ordem = 'nome' | 'sessoes' | 'consumo' | 'perCapita' | 'estoque'

const SECOES = [
  { id: 'consolidado', rotulo: 'Consolidado' },
  { id: 'comparativo', rotulo: 'Comparativo' },
  { id: 'por-nucleo', rotulo: 'Por núcleo' },
]

const deslocarDias = (iso: string, dias: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export default function RelatoriosRegionais() {
  const { dados, resumo, agora } = useRegional()
  const anoAtual = agora.getFullYear()
  const hoje = hojeISO(agora)
  const [escolha, setEscolha] = useState(String(anoAtual))
  const [desde, setDesde] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('nome')
  const [secaoAtiva, setSecaoAtiva] = useState(SECOES[0].id)
  const refImpressao = useRef<HTMLDivElement>(null)

  const periodo = useMemo(() => {
    if (escolha === 'todos') return { inicio: null, fim: null, anterior: null, rotulo: 'Histórico total' }
    if (escolha === 'desde') {
      if (!desde) return { inicio: hoje, fim: hoje, anterior: null, rotulo: 'Escolha a data inicial' }
      const dias = Math.round((new Date(hoje).getTime() - new Date(desde).getTime()) / 86_400_000)
      return {
        inicio: desde,
        fim: hoje,
        anterior: { inicio: deslocarDias(desde, -dias - 1), fim: deslocarDias(desde, -1) },
        rotulo: `A partir de ${formatarData(desde)}`,
      }
    }
    const ano = Number(escolha)
    return {
      inicio: `${ano}-01-01`,
      fim: `${ano}-12-31`,
      anterior: { inicio: `${ano - 1}-01-01`, fim: ano === anoAtual ? `${ano - 1}-${hoje.slice(5)}` : `${ano - 1}-12-31` },
      rotulo: `Ano ${ano}`,
    }
  }, [escolha, desde, hoje, anoAtual])

  const relatorio = useMemo(() => {
    if (!dados || !resumo) return null
    const atual = indicadoresPeriodo(dados, periodo.inicio, periodo.fim)
    const anterior = periodo.anterior ? indicadoresPeriodo(dados, periodo.anterior.inicio, periodo.anterior.fim) : null

    const linhas = resumo.resumos.map(r => {
      const d = dadosDoNucleo(dados, r.nucleo.id)
      const ind = indicadoresPeriodo(d, periodo.inicio, periodo.fim)
      return { resumo: r, indice: dados.nucleos.findIndex(n => n.id === r.nucleo.id), ...ind }
    })

    const meses = mesesDoPeriodo(agora, escolha === 'todos' || escolha === 'desde' ? undefined : Number(escolha))
    const seriesEstoque = resumo.resumos.map((r, i) => {
      const serie = serieSaldoMensal(r.movimentacoes, 120, agora)
      const porChave = new Map(serie.map(p => [p.chave, p.saldo]))
      return { nome: r.nucleo.nome, indice: dados.nucleos.findIndex(n => n.id === r.nucleo.id) ?? i, valores: meses.map(m => porChave.get(m) ?? 0) }
    })
    const totalRegiao = [{ nome: 'Região', indice: 0, valores: meses.map((_, i) => seriesEstoque.reduce((a, s) => a + s.valores[i], 0)) }]

    return { atual, anterior, linhas, meses, seriesEstoque, totalRegiao }
  }, [dados, resumo, periodo, agora, escolha])

  const imprimir = useReactToPrint({
    contentRef: refImpressao,
    documentTitle: `Relatorio_Regional_${(dados?.regiao?.nome ?? 'regiao').replace(/\W+/g, '_')}_${periodo.rotulo.replace(/\W+/g, '_')}`,
  })

  if (!dados || !resumo || !relatorio) return <><Cabecalho titulo="Relatórios" /><CarregandoRegional /></>

  const { atual, anterior, linhas } = relatorio
  const variacao = (valor: number, chave: keyof typeof atual) => (anterior ? variacaoPercentual(valor, anterior[chave]) : undefined)

  const ordenadas = [...linhas].sort((a, b) => {
    switch (ordem) {
      case 'sessoes': return b.realizadas - a.realizadas
      case 'consumo': return b.consumo - a.consumo
      case 'perCapita': return b.perCapitaMl - a.perCapitaMl
      case 'estoque': return b.resumo.estoque - a.resumo.estoque
      default: return a.resumo.nucleo.nome.localeCompare(b.resumo.nucleo.nome)
    }
  })

  const exportarComparativo = () => {
    baixarCSV(`comparativo-${dados.regiao?.nome ?? 'regiao'}-${periodo.rotulo}`, [
      ['Núcleo', 'Sessões', 'Participantes', 'Consumo (L)', 'Consumo por pessoa (ml)', 'Preparos', 'Estoque atual (L)'],
      ...ordenadas.map(l => [l.resumo.nucleo.nome, l.realizadas, l.participantes, formatarNumero(l.consumo), Math.round(l.perCapitaMl), l.preparos, formatarNumero(l.resumo.estoque)]),
      ['Região', atual.realizadas, atual.participantes, formatarNumero(atual.consumo), Math.round(atual.perCapitaMl), atual.preparos, formatarNumero(resumo.estoque)],
    ])
  }

  const exportarSessoes = () => {
    const porSessao = totalPorSessao(dados.consumos)
    const nomeDe = new Map(dados.nucleos.map(n => [n.id, n.nome]))
    const dentro = (iso: string) => (!periodo.inicio || iso.slice(0, 10) >= periodo.inicio) && (!periodo.fim || iso.slice(0, 10) <= periodo.fim)
    baixarCSV(`sessoes-${dados.regiao?.nome ?? 'regiao'}-${periodo.rotulo}`, [
      ['Núcleo', 'Data', 'Hora', 'Tipo', 'Dirigente', 'Leitor', 'Explanador', 'Participantes', 'Consumo (L)'],
      ...[...dados.sessoes]
        .filter(s => dentro(s.data_realizacao))
        .sort((a, b) => a.data_realizacao.localeCompare(b.data_realizacao))
        .map(s => [
          nomeDe.get(s.nucleo_id) ?? '',
          formatarData(s.data_realizacao),
          formatarHora(s.data_realizacao),
          s.tipo,
          s.dirigente,
          s.leitor_documentos,
          s.explanador,
          ehSessaoHistorica(s) ? '' : s.quantidade_participantes,
          ehSessaoHistorica(s) ? '' : formatarNumero(porSessao.get(s.id) ?? 0),
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
              <Button variant="outline" className="print:hidden">
                <Download /> <span className="hidden sm:inline">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onSelect={() => imprimir()}><Printer /> Relatório regional (PDF)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={exportarComparativo}><FileSpreadsheet /> Comparativo entre núcleos (CSV)</DropdownMenuItem>
              <DropdownMenuItem onSelect={exportarSessoes}><FileSpreadsheet /> Sessões da região (CSV)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <FaixaRegional />

      <div className="sticky top-14 z-20 -mx-4 mb-4 space-y-2 border-b bg-background/90 px-4 py-2.5 backdrop-blur print:hidden md:mx-0 md:rounded-b-xl md:px-0">
        <ChipsFiltro
          rotulo="Período"
          valor={escolha}
          onChange={setEscolha}
          opcoes={[
            { valor: String(anoAtual), rotulo: String(anoAtual) },
            { valor: String(anoAtual - 1), rotulo: String(anoAtual - 1) },
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

      <div ref={refImpressao} className="print:bg-white print:p-0 print:text-black">
        <style dangerouslySetInnerHTML={{ __html: '@media print { @page { margin: 15mm; } }' }} />
        <div className="mb-8 hidden flex-col items-center gap-2 border-b pb-5 print:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/PDF/header.svg" alt="Guardião" className="h-14 w-auto" />
          <p className="text-sm font-semibold">Relatório regional · {dados.regiao?.nome}</p>
          <p className="text-[10px] uppercase tracking-widest">Período: <span className="font-bold">{periodo.rotulo}</span></p>
        </div>

        <Secao id="consolidado" titulo="Consolidado da região" className="mt-0 scroll-mt-48" acao={<span className="print:hidden">{periodo.rotulo}</span>}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador rotulo="Sessões" valor={atual.realizadas} variacao={variacao(atual.realizadas, 'realizadas')} />
            <Indicador rotulo="Participantes" valor={formatarNumero(atual.participantes)} variacao={variacao(atual.participantes, 'participantes')} />
            <Indicador rotulo="Consumo total" valor={formatarNumero(atual.consumo)} unidade="L" variacao={variacao(atual.consumo, 'consumo')} />
            <Indicador rotulo="Por pessoa" valor={Math.round(atual.perCapitaMl)} unidade="ml" variacao={variacao(atual.perCapitaMl, 'perCapitaMl')} />
          </div>
          <Card className="mt-4 print:break-inside-avoid">
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Estoque da região ao longo do período</p>
              <GraficoLinhasNucleos meses={relatorio.meses} series={relatorio.totalRegiao} formatarValor={v => `${formatarNumero(v)} L`} altura={200} />
            </CardContent>
          </Card>
        </Secao>

        <Secao
          id="comparativo"
          titulo="Comparativo entre núcleos"
          className="scroll-mt-48 print:break-before-page"
          acao={
            <Select value={ordem} onValueChange={v => setOrdem(v as Ordem)}>
              <SelectTrigger size="sm" className="min-w-36 print:hidden" aria-label="Ordenar"><SelectValue /></SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="nome">Ordenar por nome</SelectItem>
                <SelectItem value="sessoes">Mais sessões</SelectItem>
                <SelectItem value="consumo">Maior consumo</SelectItem>
                <SelectItem value="perCapita">Maior consumo por pessoa</SelectItem>
                <SelectItem value="estoque">Maior estoque</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          {linhas.length === 0 ? (
            <Vazio>Nenhum núcleo ativo na região.</Vazio>
          ) : (
            <Card className="overflow-hidden py-0 print:border-none print:shadow-none">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Núcleo</TableHead>
                      <TableHead className="text-right">Sessões</TableHead>
                      <TableHead className="text-right">Part.</TableHead>
                      <TableHead className="text-right">Consumo</TableHead>
                      <TableHead className="text-right">ml/pessoa</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordenadas.map(l => (
                      <TableRow key={l.resumo.nucleo.id}>
                        <TableCell>
                          <Link href={`/regional/nucleos/${l.resumo.nucleo.id}`} className="inline-flex items-center gap-2 font-medium hover:underline">
                            <span className="size-2.5 rounded-full print:hidden" style={{ background: corDoNucleo(l.indice) }} />
                            {l.resumo.nucleo.nome}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{l.realizadas}</TableCell>
                        <TableCell className="text-right tabular-nums">{l.participantes}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatarNumero(l.consumo)} L</TableCell>
                        <TableCell className="text-right tabular-nums">{Math.round(l.perCapitaMl)}</TableCell>
                        <TableCell className={cn('text-right tabular-nums', l.resumo.abaixoMinimo && 'text-amber-600 dark:text-amber-400')}>
                          {formatarNumero(l.resumo.estoque)} L
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Região</TableCell>
                      <TableCell className="text-right tabular-nums">{atual.realizadas}</TableCell>
                      <TableCell className="text-right tabular-nums">{atual.participantes}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatarNumero(atual.consumo)} L</TableCell>
                      <TableCell className="text-right tabular-nums">{Math.round(atual.perCapitaMl)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatarNumero(resumo.estoque)} L</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {linhas.some(l => l.perCapitaMl > 0) && (
            <Card className="mt-4 print:break-inside-avoid">
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">Consumo por pessoa em cada núcleo (ml)</p>
                <GraficoComparativo
                  dados={ordenadas.map(l => ({ nome: l.resumo.nucleo.nome, valor: Math.round(l.perCapitaMl) }))}
                  formatarValor={v => `${v} ml`}
                  altura={Math.max(160, linhas.length * 44)}
                />
              </CardContent>
            </Card>
          )}
        </Secao>

        <Secao id="por-nucleo" titulo="Por núcleo" className="scroll-mt-48">
          <Card className="print:break-inside-avoid">
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Estoque de cada núcleo ao longo do período</p>
              <GraficoLinhasNucleos meses={relatorio.meses} series={relatorio.seriesEstoque} formatarValor={v => `${formatarNumero(v)} L`} />
            </CardContent>
          </Card>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ordenadas.map(l => (
              <Link key={l.resumo.nucleo.id} href={`/regional/nucleos/${l.resumo.nucleo.id}`} className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Card className="py-3.5 transition-shadow hover:ring-primary/30 print:break-inside-avoid">
                  <CardContent className="space-y-2">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="size-2.5 rounded-full" style={{ background: corDoNucleo(l.indice) }} />
                      {l.resumo.nucleo.nome}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Sessões</p><p className="text-base font-semibold tabular-nums">{l.realizadas}</p></div>
                      <div><p className="text-muted-foreground">Consumo</p><p className="text-base font-semibold tabular-nums">{formatarNumero(l.consumo)} L</p></div>
                      <div><p className="text-muted-foreground">Preparos</p><p className="text-base font-semibold tabular-nums">{l.preparos}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Secao>

        <Secao titulo="Relatórios prontos" className="print:hidden">
          <ListaCard>
            <ItemLista onClick={() => imprimir()} inicio={<IconeLinha><Printer /></IconeLinha>} titulo="Relatório regional" subtitulo="PDF com consolidado, comparativo e núcleos do período" />
            <ItemLista onClick={exportarComparativo} inicio={<IconeLinha><FileSpreadsheet /></IconeLinha>} titulo="Comparativo entre núcleos" subtitulo="CSV com sessões, consumo e estoque de cada núcleo" />
            <ItemLista onClick={exportarSessoes} inicio={<IconeLinha><FileSpreadsheet /></IconeLinha>} titulo="Sessões da região" subtitulo="CSV com todas as sessões do período" />
          </ListaCard>
        </Secao>
      </div>
    </>
  )
}
