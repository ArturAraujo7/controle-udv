'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarDays, ChevronRight, Clock, Database } from 'lucide-react'

import { ChangelogModal } from '@/components/ChangelogModal'
import { useAuth } from '@/components/AuthProvider'
import { DataBloco } from '@/components/comum/DataBloco'
import { Indicador } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ValorLinha, Vazio } from '@/components/comum/Lista'
import { LinkSecao, Secao } from '@/components/comum/Secao'
import { ItemMovimentacao } from '@/components/estoque/ItemMovimentacao'
import { SparklineSaldo } from '@/components/estoque/SparklineSaldo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import {
  calcularSaldos, consumoMedioPorSessao, ehSessaoHistorica, estimarAutonomia, estoqueDisponivel,
  inicioMesesAtras, lotesParados, montarMovimentacoes, serieSaldoMensal, totalPorSessao,
} from '@/lib/estoque'
import {
  anoDe, formatarDataExtensa, formatarNumero, hojeISO, saudacao, variacaoPercentual,
} from '@/lib/formato'
import { podeEditar } from '@/lib/permissoes'
import type { Sessao } from '@/lib/tipos'

export default function Inicio() {
  const router = useRouter()
  const { profile } = useAuth()
  const { config } = useConfiguracoes()
  const { carregando, erro, preparos, consumos, saidas, sessoes } = useDadosEstoque()
  const [agora] = useState(() => new Date())
  const hoje = hojeISO(agora)
  const editor = podeEditar(profile)

  // Sem nome cadastrado, o perfil precisa ser completado antes de usar o app.
  useEffect(() => {
    if (profile && !profile.full_name) router.push('/perfil')
  }, [profile, router])

  const resumo = useMemo(() => {
    const lotes = calcularSaldos(preparos, consumos, saidas, { hoje, sessoes })
    const estoque = estoqueDisponivel(lotes, config.somar_maturacao_no_saldo)
    const movimentacoes = montarMovimentacoes({ preparos, sessoes, consumos, saidas })
    const media = consumoMedioPorSessao(sessoes, consumos, inicioMesesAtras(6, agora))
    const porSessao = totalPorSessao(consumos)

    const reais = sessoes
      .filter(s => !ehSessaoHistorica(s))
      .sort((a, b) => b.data_realizacao.localeCompare(a.data_realizacao))

    // Compara com o mesmo intervalo (1º de janeiro até hoje) do ano anterior.
    const diaMes = hoje.slice(5)
    const doAno = (ano: number) =>
      reais.filter(s => anoDe(s.data_realizacao) === ano && s.data_realizacao.slice(5, 10) <= diaMes)
    const consumo = (lista: Sessao[]) => lista.reduce((acc, s) => acc + (porSessao.get(s.id) ?? 0), 0)
    const participantesMedio = (lista: Sessao[]) =>
      lista.length ? lista.reduce((acc, s) => acc + s.quantidade_participantes, 0) / lista.length : 0

    const atual = doAno(agora.getFullYear())
    const anterior = doAno(agora.getFullYear() - 1)
    const ultima = reais[0] ?? null

    return {
      estoque,
      movimentacoes,
      media,
      serie: serieSaldoMensal(movimentacoes, 12, agora),
      autonomia: estimarAutonomia(estoque, media),
      parados: lotesParados(lotes, config.dias_lote_parado, agora).length,
      ultima,
      consumoUltima: ultima ? porSessao.get(ultima.id) ?? 0 : 0,
      ano: {
        sessoes: atual.length,
        sessoesVar: variacaoPercentual(atual.length, anterior.length),
        consumo: consumo(atual),
        consumoVar: variacaoPercentual(consumo(atual), consumo(anterior)),
        mediaSessao: atual.length ? consumo(atual) / atual.length : 0,
        participantes: participantesMedio(atual),
        participantesVar: variacaoPercentual(participantesMedio(atual), participantesMedio(anterior)),
      },
    }
  }, [preparos, consumos, saidas, sessoes, hoje, agora, config.somar_maturacao_no_saldo, config.dias_lote_parado])

  const primeiroNome = profile?.full_name?.split(' ')[0]
  const estoqueBaixo = !carregando && !erro && resumo.estoque < config.estoque_minimo_litros

  return (
    <>
      <ChangelogModal />

      <div className="mb-6">
        <p className="text-sm text-muted-foreground">{formatarDataExtensa(hoje)}</p>
        <h1 className="mt-0.5 text-3xl font-semibold tracking-tight md:text-2xl">
          {saudacao(agora)}{primeiroNome ? `, ${primeiroNome}` : ''}
        </h1>
      </div>

      {erro && (
        <div className="mb-4">
          <Vazio>Não foi possível carregar os dados: {erro}</Vazio>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Estoque */}
        <Link href="/estoque" className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Card className="h-full transition-shadow hover:ring-primary/30">
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Estoque disponível</p>
                <span className="inline-flex items-center text-sm font-medium text-primary">
                  Ver estoque <ChevronRight className="size-4" />
                </span>
              </div>
              {carregando ? (
                <Skeleton className="h-11 w-36" />
              ) : (
                <p className="text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums">
                  {formatarNumero(resumo.estoque)}
                  <span className="ml-1.5 text-lg font-normal text-muted-foreground">L</span>
                </p>
              )}
              <p className="pt-1 text-sm text-muted-foreground">
                {carregando ? (
                  <Skeleton className="h-4 w-48" />
                ) : resumo.autonomia !== null ? (
                  <>
                    ≈ <strong className="font-medium text-foreground">{resumo.autonomia} {resumo.autonomia === 1 ? 'sessão' : 'sessões'}</strong>{' '}
                    no consumo médio de {formatarNumero(resumo.media)} L
                  </>
                ) : (
                  'Sem consumo recente para estimar a autonomia'
                )}
              </p>
              <div className="pt-2">
                {carregando ? <Skeleton className="h-14" /> : <SparklineSaldo serie={resumo.serie} />}
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="space-y-4">
          {estoqueBaixo && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">Estoque abaixo de {formatarNumero(config.estoque_minimo_litros)} L</p>
                <p className="mt-0.5 opacity-80">Considere agendar um preparo.</p>
              </div>
              {editor && (
                <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-300 bg-transparent dark:border-amber-500/40">
                  <Link href="/novo-preparo">Registrar preparo</Link>
                </Button>
              )}
            </div>
          )}

          {!carregando && resumo.parados > 0 && (
            <Link
              href="/estoque"
              className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm transition-colors hover:bg-muted/50"
            >
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                {resumo.parados} {resumo.parados === 1 ? 'lote' : 'lotes'} sem movimento há mais de {config.dias_lote_parado} dias
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          )}

          <Secao titulo="Última sessão" acao={<LinkSecao href="/sessoes">Todas</LinkSecao>} className="mt-0">
            {carregando ? (
              <Skeleton className="h-[70px] rounded-xl" />
            ) : resumo.ultima ? (
              <ListaCard>
                <ItemLista
                  href={`/sessoes/${resumo.ultima.id}`}
                  inicio={<DataBloco iso={resumo.ultima.data_realizacao} />}
                  titulo={resumo.ultima.tipo}
                  subtitulo={[resumo.ultima.dirigente, `${resumo.ultima.quantidade_participantes} participantes`]
                    .filter(Boolean)
                    .join(' · ')}
                  fim={<ValorLinha valor={`${formatarNumero(resumo.consumoUltima)} L`} detalhe="consumo" />}
                />
              </ListaCard>
            ) : (
              <Vazio
                icone={<CalendarDays />}
                acao={editor && (
                  <Button variant="outline" asChild><Link href="/nova-sessao">Registrar sessão</Link></Button>
                )}
              >
                Nenhuma sessão registrada ainda.
              </Vazio>
            )}
          </Secao>
        </div>
      </div>

      <Secao titulo={`Este ano · ${agora.getFullYear()}`} acao={<LinkSecao href="/relatorios">Relatórios</LinkSecao>}>
        <div className="-mx-4 grid auto-cols-[minmax(10.5rem,1fr)] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid-flow-row md:grid-cols-4 md:px-0 [&::-webkit-scrollbar]:hidden">
          <Indicador rotulo="Sessões" valor={resumo.ano.sessoes} variacao={resumo.ano.sessoesVar} carregando={carregando} />
          <Indicador
            rotulo="Consumo"
            valor={formatarNumero(resumo.ano.consumo)}
            unidade="L"
            variacao={resumo.ano.consumoVar}
            carregando={carregando}
          />
          <Indicador
            rotulo="Média por sessão"
            valor={formatarNumero(resumo.ano.mediaSessao)}
            unidade="L"
            carregando={carregando}
            detalhe="vegetal servido"
          />
          <Indicador
            rotulo="Participantes por sessão"
            valor={Math.round(resumo.ano.participantes)}
            variacao={resumo.ano.participantesVar}
            carregando={carregando}
          />
        </div>
      </Secao>

      <Secao titulo="Movimentações recentes" acao={<LinkSecao href="/estoque/movimentacoes">Ver extrato</LinkSecao>}>
        {carregando ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[62px] rounded-xl" />)}
          </div>
        ) : resumo.movimentacoes.length === 0 ? (
          <Vazio icone={<Database />}>Nenhuma movimentação registrada ainda.</Vazio>
        ) : (
          <ListaCard>
            {resumo.movimentacoes.slice(0, 5).map(mov => (
              <ItemMovimentacao key={mov.id} mov={mov} podeEditar={editor} />
            ))}
          </ListaCard>
        )}
      </Secao>
    </>
  )
}
