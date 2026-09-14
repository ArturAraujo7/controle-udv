'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Package } from 'lucide-react'

import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { BarraSaldo, ResumoLinha } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { SubNav } from '@/components/layout/SubNav'
import { CarregandoRegional } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { GraficoLinhasNucleos, mesesDoPeriodo } from '@/components/regional/Graficos'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { serieSaldoMensal, totalPorSessao } from '@/lib/estoque'
import { formatarData, formatarNumero } from '@/lib/formato'
import { fluxoEntreNucleos } from '@/lib/regional'
import { cn } from '@/lib/utils'

const SUBNAV_ESTOQUE_REGIONAL = [
  { href: '/regional/estoque', rotulo: 'Por núcleo' },
  { href: '/regional/estoque/movimentacoes', rotulo: 'Movimentações' },
]

type Filtro = 'todos' | 'baixo' | 'maturacao'

export default function EstoqueRegional() {
  const { dados, resumo, agora, nomeNucleo } = useRegional()
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const calculos = useMemo(() => {
    if (!dados || !resumo) return null
    const ano = String(agora.getFullYear())
    const porSessao = totalPorSessao(dados.consumos)
    const entradas = dados.preparos
      .filter(p => ((p.tipo === 'Doação' && p.data_chegada) || p.data_preparo).startsWith(ano))
      .reduce((a, p) => a + Number(p.quantidade_preparada), 0)
    const baixas =
      dados.sessoes.filter(s => s.data_realizacao.startsWith(ano)).reduce((a, s) => a + (porSessao.get(s.id) ?? 0), 0) +
      dados.saidas.filter(s => s.data_saida.startsWith(ano)).reduce((a, s) => a + Number(s.quantidade), 0)

    const meses = mesesDoPeriodo(agora)
    const series = resumo.resumos.map(r => ({
      nome: r.nucleo.nome,
      indice: dados.nucleos.findIndex(n => n.id === r.nucleo.id),
      valores: serieSaldoMensal(r.movimentacoes, 12, agora).map(p => p.saldo),
    }))

    return { entradas, baixas, meses, series, fluxo: fluxoEntreNucleos(dados), maior: Math.max(1, ...resumo.resumos.map(r => r.estoque)) }
  }, [dados, resumo, agora])

  if (!dados || !resumo || !calculos) return <><Cabecalho titulo="Estoque" /><CarregandoRegional /></>

  const ano = agora.getFullYear()
  const filtrados = resumo.resumos.filter(r =>
    filtro === 'todos' ? true : filtro === 'baixo' ? r.abaixoMinimo : r.lotesEmMaturacao > 0
  )

  return (
    <>
      <Cabecalho titulo="Estoque" />
      <FaixaRegional />
      <SubNav itens={SUBNAV_ESTOQUE_REGIONAL} />

      <ResumoLinha
        itens={[
          { rotulo: 'Estoque da região', valor: `${formatarNumero(resumo.estoque)} L` },
          { rotulo: `Entradas em ${ano}`, valor: `+${formatarNumero(calculos.entradas)} L`, className: 'text-primary' },
          { rotulo: `Saídas e consumo em ${ano}`, valor: `−${formatarNumero(calculos.baixas)} L` },
        ]}
      />

      {calculos.series.length > 0 && (
        <Card className="mt-4">
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Estoque de cada núcleo nos últimos 12 meses</p>
            <GraficoLinhasNucleos meses={calculos.meses} series={calculos.series} formatarValor={v => `${formatarNumero(v)} L`} />
          </CardContent>
        </Card>
      )}

      <ChipsFiltro
        className="mt-5"
        rotulo="Filtrar núcleos"
        valor={filtro}
        onChange={setFiltro}
        opcoes={[
          { valor: 'todos', rotulo: 'Todos', contagem: resumo.resumos.length },
          { valor: 'baixo', rotulo: 'Abaixo do mínimo', contagem: resumo.resumos.filter(r => r.abaixoMinimo).length },
          { valor: 'maturacao', rotulo: 'Com lote em maturação', contagem: resumo.resumos.filter(r => r.lotesEmMaturacao > 0).length },
        ]}
      />

      <div className="mt-4 space-y-3">
        {filtrados.length === 0 ? (
          <Vazio icone={<Package />}>Nenhum núcleo neste filtro.</Vazio>
        ) : (
          filtrados.map(r => (
            <Link
              key={r.nucleo.id}
              href={`/regional/nucleos/${r.nucleo.id}?aba=estoque`}
              className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="py-4 transition-shadow hover:ring-primary/30">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {(r.abaixoMinimo || r.lotesEmMaturacao > 0) && (
                        <div className="mb-1.5 flex flex-wrap gap-1.5">
                          {r.abaixoMinimo && (
                            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                              Abaixo do mínimo
                            </Badge>
                          )}
                          {r.lotesEmMaturacao > 0 && <Badge variant="secondary">{r.lotesEmMaturacao} em maturação</Badge>}
                        </div>
                      )}
                      <h3 className="truncate font-medium">{r.nucleo.nome}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[r.nucleo.cidade, `${r.lotesComSaldo} ${r.lotesComSaldo === 1 ? 'lote' : 'lotes'} com saldo`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn('text-xl font-semibold leading-none tabular-nums', r.abaixoMinimo && 'text-amber-600 dark:text-amber-400')}>
                        {formatarNumero(r.estoque)}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">L</span>
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {r.autonomia !== null ? `≈ ${r.autonomia} sessões` : 'sem consumo recente'}
                      </p>
                    </div>
                  </div>
                  <BarraSaldo percentual={(r.estoque / calculos.maior) * 100} tom={r.abaixoMinimo ? 'alerta' : 'normal'} />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Consumo médio {formatarNumero(r.consumoMedio)} L/sessão · mínimo {formatarNumero(r.minimo)} L</span>
                    <span className="font-medium text-primary">Ver núcleo ›</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {calculos.fluxo.length > 0 && (
        <Secao titulo="Fluxo entre núcleos" acao="saídas para núcleos da região">
          <ListaCard>
            {calculos.fluxo.slice(0, 10).map(f => (
              <ItemLista
                key={f.chave}
                titulo={<span className="inline-flex items-center gap-1.5">{nomeNucleo(f.origemId)} <ArrowRight className="size-3.5" /> {nomeNucleo(f.destinoId)}</span>}
                subtitulo={[formatarData(f.data), f.motivo].filter(Boolean).join(' · ')}
                fim={<ValorLinha valor={`${formatarNumero(f.quantidade)} L`} />}
              />
            ))}
          </ListaCard>
        </Secao>
      )}
    </>
  )
}
