'use client'
import Link from 'next/link'
import { use, useEffect } from 'react'
import { CheckCircle2, ChevronRight } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Indicador } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ValorLinha } from '@/components/comum/Lista'
import { Cabecalho, LinkSecao, Secao } from '@/components/comum/Secao'
import { BadgeNucleo, CarregandoRegional } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { corDoNucleo } from '@/components/regional/Graficos'
import { Card, CardContent } from '@/components/ui/card'
import { formatarData, formatarDataExtensa, formatarNumero, hojeISO, saudacao, variacaoPercentual } from '@/lib/formato'
import { atividadeRecente, indicadoresPeriodo } from '@/lib/regional'
import { cn } from '@/lib/utils'

const COR_ALERTA = { alta: 'bg-destructive', media: 'bg-amber-500', baixa: 'bg-muted-foreground/50' }

export default function InicioRegional({ searchParams }: { searchParams: Promise<{ regiao?: string }> }) {
  const { regiao } = use(searchParams)
  const { profile } = useAuth()
  const { dados, resumo, agora, podeTrocarRegiao, trocarRegiao, nomeNucleo } = useRegional()
  const regiaoAtual = dados?.regiao?.id

  // Link "Ver visão regional" da administração abre direto na região escolhida
  useEffect(() => {
    if (regiao && podeTrocarRegiao && Number(regiao) !== regiaoAtual) trocarRegiao(Number(regiao))
  }, [regiao, podeTrocarRegiao, regiaoAtual, trocarRegiao])

  if (!dados || !resumo) return <><Cabecalho titulo="Região" /><CarregandoRegional /></>

  const hoje = hojeISO(agora)
  const ano = agora.getFullYear()
  const atual = indicadoresPeriodo(dados, `${ano}-01-01`, hoje)
  const anterior = indicadoresPeriodo(dados, `${ano - 1}-01-01`, `${ano - 1}-${hoje.slice(5)}`)
  const atividades = atividadeRecente(dados, 6)
  const primeiroNome = profile?.full_name?.split(' ')[0]
  const indiceDe = (id: number) => dados.nucleos.findIndex(n => n.id === id)
  const comEstoque = resumo.resumos.filter(r => r.estoque > 0)

  return (
    <>
      <Cabecalho titulo="Região" />
      <FaixaRegional />

      <div className="mb-5">
        <p className="text-sm text-muted-foreground">{formatarDataExtensa(hoje)}</p>
        <h2 className="mt-0.5 text-2xl font-semibold tracking-tight">
          {saudacao(agora)}{primeiroNome ? `, ${primeiroNome}` : ''}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/regional/estoque" className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Card className="h-full transition-shadow hover:ring-primary/30">
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Estoque na região</p>
                <span className="inline-flex items-center text-sm font-medium text-primary">
                  Por núcleo <ChevronRight className="size-4" />
                </span>
              </div>
              <p className="text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums">
                {formatarNumero(resumo.estoque)}
                <span className="ml-1.5 text-lg font-normal text-muted-foreground">L</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Soma de {resumo.resumos.length} {resumo.resumos.length === 1 ? 'núcleo' : 'núcleos'}
                {resumo.autonomia !== null && ` · autonomia média ≈ ${resumo.autonomia} sessões`}
              </p>
              {comEstoque.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex h-2.5 gap-px overflow-hidden rounded-full bg-muted" role="img" aria-label="Quanto cada núcleo tem do estoque">
                    {comEstoque.map(r => (
                      <div
                        key={r.nucleo.id}
                        title={`${r.nucleo.nome}: ${formatarNumero(r.estoque)} L`}
                        style={{ width: `${(r.estoque / resumo.estoque) * 100}%`, background: corDoNucleo(indiceDe(r.nucleo.id)) }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {comEstoque.map(r => (
                      <span key={r.nucleo.id} className="inline-flex items-center gap-1">
                        <span className="size-2 rounded-full" style={{ background: corDoNucleo(indiceDe(r.nucleo.id)) }} />
                        {r.nucleo.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Secao titulo="Precisa de atenção" acao={resumo.alertas.length || undefined} className="mt-0">
          {resumo.alertas.length === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="size-5 text-primary" />
                Nada pendente nos núcleos da região.
              </CardContent>
            </Card>
          ) : (
            <ListaCard>
              {resumo.alertas.slice(0, 5).map(a => (
                <ItemLista
                  key={a.chave}
                  href={`/regional/nucleos/${a.nucleoId}`}
                  inicio={<span className={cn('block size-2.5 rounded-full', COR_ALERTA[a.gravidade])} aria-hidden="true" />}
                  titulo={a.titulo}
                  subtitulo={a.detalhe}
                  quebrarTexto
                />
              ))}
            </ListaCard>
          )}
        </Secao>
      </div>

      <Secao titulo={`Este ano na região · ${ano}`} acao={<LinkSecao href="/regional/relatorios">Relatórios</LinkSecao>}>
        <div className="-mx-4 grid auto-cols-[minmax(10.5rem,1fr)] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid-flow-row md:grid-cols-4 md:px-0 [&::-webkit-scrollbar]:hidden">
          <Indicador rotulo="Sessões" valor={atual.sessoes} variacao={variacaoPercentual(atual.sessoes, anterior.sessoes)} />
          <Indicador rotulo="Participantes" valor={formatarNumero(atual.participantes)} variacao={variacaoPercentual(atual.participantes, anterior.participantes)} />
          <Indicador rotulo="Consumo" valor={formatarNumero(atual.consumo)} unidade="L" variacao={variacaoPercentual(atual.consumo, anterior.consumo)} />
          <Indicador rotulo="Preparos" valor={atual.preparos} variacao={variacaoPercentual(atual.preparos, anterior.preparos)} />
        </div>
      </Secao>

      <div className="md:grid md:grid-cols-2 md:gap-x-6">
        <Secao titulo="Núcleos" acao={<LinkSecao href="/regional/estoque">Estoque</LinkSecao>}>
          <ListaCard>
            {resumo.resumos.map(r => (
              <ItemLista
                key={r.nucleo.id}
                href={`/regional/nucleos/${r.nucleo.id}`}
                inicio={<span className="block size-3 rounded-full" style={{ background: corDoNucleo(indiceDe(r.nucleo.id)) }} aria-hidden="true" />}
                titulo={r.nucleo.nome}
                subtitulo={[r.nucleo.cidade, `${r.sessoesAno} ${r.sessoesAno === 1 ? 'sessão' : 'sessões'} no ano`].filter(Boolean).join(' · ')}
                fim={
                  <ValorLinha
                    valor={`${formatarNumero(r.estoque)} L`}
                    detalhe={r.abaixoMinimo ? 'abaixo do mínimo' : 'estoque'}
                    className={r.abaixoMinimo ? 'text-amber-600 dark:text-amber-400' : undefined}
                  />
                }
              />
            ))}
          </ListaCard>
        </Secao>

        <Secao titulo="Atividade recente na região">
          {atividades.length === 0 ? (
            <Card><CardContent className="text-sm text-muted-foreground">Nenhum registro ainda.</CardContent></Card>
          ) : (
            <ListaCard>
              {atividades.map(a => (
                <ItemLista
                  key={a.chave}
                  href={a.href}
                  sobre={<BadgeNucleo nome={nomeNucleo(a.nucleoId)} />}
                  titulo={a.titulo}
                  subtitulo={`${formatarData(a.data)} · ${a.subtitulo}`}
                />
              ))}
            </ListaCard>
          )}
        </Secao>
      </div>
    </>
  )
}
