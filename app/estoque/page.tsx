'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Package, Plus, Search } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { BarraSaldo, ResumoLinha } from '@/components/comum/Indicadores'
import { Vazio } from '@/components/comum/Lista'
import { Cabecalho } from '@/components/comum/Secao'
import { SUBNAV_ESTOQUE, SubNav } from '@/components/layout/SubNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import { calcularSaldos, estoqueDisponivel, lotesParados, totalPorSessao, type PreparoComSaldo } from '@/lib/estoque'
import { formatarData, formatarDiaMes, formatarNumero, hojeISO } from '@/lib/formato'
import { rotuloMestre } from '@/lib/membros'
import { podeEditar } from '@/lib/permissoes'
import { cn } from '@/lib/utils'

type Filtro = 'disponiveis' | 'maturacao' | 'esgotados' | 'todos'

const entradaDe = (l: PreparoComSaldo) => (l.tipo === 'Doação' && l.data_chegada) || l.data_preparo

export default function EstoqueLotes() {
  const { profile } = useAuth()
  const editor = podeEditar(profile)
  const { config } = useConfiguracoes()
  const { carregando, erro, preparos, consumos, saidas, sessoes } = useDadosEstoque()
  const [agora] = useState(() => new Date())
  const [filtro, setFiltro] = useState<Filtro>('disponiveis')
  const [busca, setBusca] = useState('')

  const dados = useMemo(() => {
    const hoje = hojeISO(agora)
    const ano = String(agora.getFullYear())
    const lotes = calcularSaldos(preparos, consumos, saidas, { hoje, sessoes })
      .sort((a, b) => entradaDe(b).localeCompare(entradaDe(a)))

    const porSessao = totalPorSessao(consumos)
    const consumoAno = sessoes
      .filter(s => s.data_realizacao.startsWith(ano))
      .reduce((acc, s) => acc + (porSessao.get(s.id) ?? 0), 0)
    const saidasAno = saidas.filter(s => s.data_saida.startsWith(ano)).reduce((acc, s) => acc + Number(s.quantidade), 0)
    const entradasAno = lotes.filter(l => entradaDe(l).startsWith(ano)).reduce((acc, l) => acc + Number(l.quantidade_preparada), 0)

    return {
      lotes,
      estoque: estoqueDisponivel(lotes, config.somar_maturacao_no_saldo),
      entradasAno,
      saidasAno: consumoAno + saidasAno,
      parados: new Set(lotesParados(lotes, config.dias_lote_parado, agora).map(l => l.id)),
    }
  }, [preparos, consumos, saidas, sessoes, agora, config.somar_maturacao_no_saldo, config.dias_lote_parado])

  const { lotes } = dados
  const disponiveis = lotes.filter(l => l.saldo > 0 && !l.em_maturacao)
  const contagem: Record<Filtro, number> = {
    disponiveis: disponiveis.length,
    maturacao: lotes.filter(l => l.em_maturacao).length,
    esgotados: lotes.filter(l => l.saldo <= 0).length,
    todos: lotes.length,
  }

  const termo = busca.trim().toLowerCase()
  const filtrados = lotes
    .filter(l =>
      filtro === 'todos' ? true
        : filtro === 'disponiveis' ? l.saldo > 0 && !l.em_maturacao
          : filtro === 'maturacao' ? l.em_maturacao
            : l.saldo <= 0
    )
    .filter(l =>
      !termo ||
      [l.mestre_preparo, l.nucleo_origem, l.grau, l.procedencia_mariri, l.procedencia_chacrona]
        .some(v => v?.toLowerCase().includes(termo))
    )

  const ano = agora.getFullYear()
  const coresSerie = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-2)', 'var(--chart-4)']

  return (
    <>
      <Cabecalho
        titulo="Estoque"
        acoes={editor && (
          <div className="hidden gap-2 md:flex">
            <Button variant="outline" asChild>
              <Link href="/nova-saida"><ArrowUpRight /> Registrar saída</Link>
            </Button>
            <Button asChild>
              <Link href="/novo-preparo"><Plus /> Novo preparo</Link>
            </Button>
          </div>
        )}
      />
      <SubNav itens={SUBNAV_ESTOQUE} />

      {erro && <div className="mb-4"><Vazio>Não foi possível carregar o estoque: {erro}</Vazio></div>}

      <ResumoLinha
        carregando={carregando}
        itens={[
          { rotulo: 'Saldo disponível', valor: `${formatarNumero(dados.estoque)} L` },
          { rotulo: `Entradas em ${ano}`, valor: `+${formatarNumero(dados.entradasAno)} L`, className: 'text-primary' },
          { rotulo: `Saídas e consumo em ${ano}`, valor: `−${formatarNumero(dados.saidasAno)} L` },
        ]}
      />

      {!carregando && dados.estoque > 0 && disponiveis.length > 1 && (
        <div className="mt-3">
          <div className="flex h-2.5 gap-px overflow-hidden rounded-full bg-muted" aria-label="Composição do saldo por lote" role="img">
            {disponiveis.map((l, i) => (
              <div
                key={l.id}
                title={`${l.tipo === 'Doação' ? l.nucleo_origem : rotuloMestre(l.mestre_preparo)}: ${formatarNumero(l.saldo)} L`}
                style={{ width: `${(l.saldo / dados.estoque) * 100}%`, background: coresSerie[i % coresSerie.length] }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Quanto cada lote disponível representa do saldo</p>
        </div>
      )}

      <div className="relative mt-5 mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pl-9"
          placeholder="Buscar por mestre, núcleo, grau ou procedência…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          aria-label="Buscar lote"
        />
      </div>

      <ChipsFiltro
        rotulo="Filtrar lotes"
        valor={filtro}
        onChange={setFiltro}
        opcoes={[
          { valor: 'disponiveis', rotulo: 'Disponíveis', contagem: contagem.disponiveis },
          { valor: 'maturacao', rotulo: 'Em maturação', contagem: contagem.maturacao },
          { valor: 'esgotados', rotulo: 'Esgotados', contagem: contagem.esgotados },
          { valor: 'todos', rotulo: 'Todos', contagem: contagem.todos },
        ]}
      />

      <div className="mt-4 space-y-3">
        {carregando ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-xl" />)
        ) : filtrados.length === 0 ? (
          <Vazio
            icone={<Package />}
            acao={lotes.length === 0 && editor && (
              <Button variant="outline" asChild><Link href="/novo-preparo">Registrar primeiro preparo</Link></Button>
            )}
          >
            {lotes.length === 0 ? 'Nenhum preparo registrado ainda.' : 'Nenhum lote neste filtro.'}
          </Vazio>
        ) : (
          filtrados.map(lote => (
            <CartaoLote key={lote.id} lote={lote} parado={dados.parados.has(lote.id)} diasParado={config.dias_lote_parado} />
          ))
        )}
      </div>
    </>
  )
}

function CartaoLote({ lote, parado, diasParado }: { lote: PreparoComSaldo; parado: boolean; diasParado: number }) {
  const doacao = lote.tipo === 'Doação'
  const esgotado = lote.saldo <= 0
  const quaseNoFim = !esgotado && lote.percentual < 20

  return (
    <Link href={`/estoque/${lote.id}`} className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card className={cn('py-4 transition-shadow hover:ring-primary/30', esgotado && 'opacity-80')}>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                <Badge variant="outline">{doacao ? 'Doação recebida' : 'Produção local'}</Badge>
                {lote.em_maturacao && (
                  <Badge variant="secondary">
                    Em maturação{lote.data_liberacao ? ` até ${formatarDiaMes(lote.data_liberacao)}` : ''}
                  </Badge>
                )}
                {parado && (
                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-300" title={`Sem movimento há mais de ${diasParado} dias`}>
                    Parado
                  </Badge>
                )}
              </div>
              <h3 className={cn('truncate font-medium', esgotado && 'text-muted-foreground')}>
                {doacao ? lote.nucleo_origem || 'Doação' : rotuloMestre(lote.mestre_preparo)}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatarData(entradaDe(lote))}
                {lote.grau && ` · Grau ${lote.grau}`}
                {doacao && lote.mestre_preparo && ` · Resp. ${rotuloMestre(lote.mestre_preparo)}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {esgotado ? (
                <Badge variant="secondary">Esgotado</Badge>
              ) : (
                <>
                  <p className={cn('text-xl font-semibold leading-none tabular-nums', quaseNoFim && 'text-amber-600 dark:text-amber-400')}>
                    {formatarNumero(lote.saldo)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">L</span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">restantes</p>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Inicial <span className="text-foreground tabular-nums">{formatarNumero(lote.quantidade_preparada)} L</span></span>
            <span>Consumido <span className="text-foreground tabular-nums">{formatarNumero(lote.total_consumido)} L</span></span>
          </div>

          <BarraSaldo percentual={lote.percentual} tom={esgotado ? 'neutro' : quaseNoFim ? 'alerta' : 'normal'} />
        </CardContent>
      </Card>
    </Link>
  )
}
