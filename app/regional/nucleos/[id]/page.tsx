'use client'
import { use, useMemo, useState } from 'react'
import { CalendarDays, Package, Search, Users } from 'lucide-react'

import { Avatar } from '@/components/comum/Avatar'
import { ChipsFiltro } from '@/components/comum/ChipsFiltro'
import { DataBloco } from '@/components/comum/DataBloco'
import { BarraSaldo, ResumoLinha } from '@/components/comum/Indicadores'
import { ItemLista, ListaCard, ListaDados, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Secao, VoltarLink } from '@/components/comum/Secao'
import { CarregandoRegional, NotaSomenteLeitura, Segmentos } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { agruparPorMes, ehSessaoHistorica, totalPorSessao } from '@/lib/estoque'
import { formatarData, formatarDiaMes, formatarNumero, hojeISO, rotuloMes } from '@/lib/formato'
import { nomeMembro, rotuloMestre } from '@/lib/membros'
import { rotuloPapel } from '@/lib/permissoes'
import { dadosDoNucleo, indicadoresPeriodo, resumirNucleo } from '@/lib/regional'

type Aba = 'geral' | 'estoque' | 'sessoes' | 'membros'

export default function NucleoRegional({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aba?: string }>
}) {
  const { id } = use(params)
  const { aba: abaInicial } = use(searchParams)
  const nucleoId = Number(id)
  const { dados, resumo, agora } = useRegional()
  const [aba, setAba] = useState<Aba>(
    abaInicial === 'estoque' || abaInicial === 'sessoes' || abaInicial === 'membros' ? abaInicial : 'geral'
  )
  const [filtroLotes, setFiltroLotes] = useState<'disponiveis' | 'esgotados' | 'todos'>('disponiveis')
  const [buscaMembro, setBuscaMembro] = useState('')
  const [limiteSessoes, setLimiteSessoes] = useState(30)

  const calculo = useMemo(() => {
    if (!dados) return null
    const nucleo = dados.nucleos.find(n => n.id === nucleoId)
    if (!nucleo) return null
    const r = resumo?.resumos.find(x => x.nucleo.id === nucleoId) ?? resumirNucleo(dados, nucleo, agora)
    const d = dadosDoNucleo(dados, nucleoId)
    const hoje = hojeISO(agora)
    const ano = agora.getFullYear()
    const meses = agora.getMonth() + 1

    const doNucleo = indicadoresPeriodo(d, `${ano}-01-01`, hoje)
    const daRegiao = indicadoresPeriodo(dados, `${ano}-01-01`, hoje)
    const nucleosAtivos = Math.max(1, dados.nucleos.filter(n => n.ativo).length)

    const dirigiu = new Map<number, number>()
    for (const s of d.sessoes) {
      if (!s.data_realizacao.startsWith(String(ano))) continue
      for (const idMembro of [s.dirigente_id, s.dirigente_2_id]) if (idMembro) dirigiu.set(idMembro, (dirigiu.get(idMembro) ?? 0) + 1)
    }

    return {
      nucleo,
      r,
      d,
      doNucleo,
      daRegiao,
      nucleosAtivos,
      meses,
      dirigiu,
      porSessao: totalPorSessao(d.consumos),
      sessoesOrdenadas: [...d.sessoes].sort((a, b) => b.data_realizacao.localeCompare(a.data_realizacao)),
    }
  }, [dados, resumo, agora, nucleoId])

  if (!dados) return <><VoltarLink href="/regional" rotulo="Região" /><CarregandoRegional /></>
  if (!calculo) {
    return (
      <>
        <VoltarLink href="/regional" rotulo="Região" />
        <Vazio>Núcleo não encontrado nesta região.</Vazio>
      </>
    )
  }

  const { nucleo, r, d, doNucleo, daRegiao, nucleosAtivos, meses, dirigiu, porSessao, sessoesOrdenadas } = calculo
  const membrosAtivos = d.membros.filter(m => m.ativo)
  const lotes = [...r.lotes]
    .sort((a, b) => b.data_preparo.localeCompare(a.data_preparo))
    .filter(l => filtroLotes === 'todos' ? true : filtroLotes === 'disponiveis' ? l.saldo > 0 : l.saldo <= 0)

  const perCapitaRegiao = daRegiao.perCapitaMl
  const sessoesMesNucleo = doNucleo.realizadas / meses
  const sessoesMesRegiao = daRegiao.realizadas / meses / nucleosAtivos
  const participacaoRegiao = daRegiao.mediaParticipantes

  const termo = buscaMembro.trim().toLowerCase()
  const membrosFiltrados = [...d.membros]
    .filter(m => !termo || [m.nome, m.nome_exibicao, m.grau].some(v => v?.toLowerCase().includes(termo)))
    .sort((a, b) => Number(b.ativo) - Number(a.ativo) || (a.nome_exibicao || a.nome).localeCompare(b.nome_exibicao || b.nome))

  const itemSessao = (s: (typeof sessoesOrdenadas)[number]) => {
    const historica = ehSessaoHistorica(s)
    return (
      <ItemLista
        key={s.id}
        href={`/regional/sessoes/${s.id}`}
        inicio={<DataBloco iso={s.data_realizacao} />}
        sobre={historica ? <Badge variant="outline">Histórica</Badge> : undefined}
        titulo={s.tipo}
        subtitulo={[s.dirigente, !historica && `${s.quantidade_participantes} participantes`].filter(Boolean).join(' · ') || '—'}
        fim={historica ? undefined : <ValorLinha valor={`${formatarNumero(porSessao.get(s.id) ?? 0)} L`} />}
      />
    )
  }

  return (
    <>
      <VoltarLink href="/regional" rotulo="Região" />
      <FaixaRegional nucleo={nucleo} />

      <div className="mb-5 flex items-center gap-3">
        <Avatar nome={nucleo.nome} arquivo={nucleo.configuracao?.logo_arquivo} className="size-12 rounded-xl text-sm" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{nucleo.nome}</h1>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {r.abaixoMinimo && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                Estoque baixo
              </Badge>
            )}
            <Badge variant="outline">{membrosAtivos.length} membros ativos</Badge>
            {!nucleo.ativo && <Badge variant="secondary">Núcleo inativo</Badge>}
          </div>
        </div>
      </div>

      <Segmentos
        rotulo="Seções do núcleo"
        valor={aba}
        onChange={setAba}
        opcoes={[
          { valor: 'geral', rotulo: 'Visão geral' },
          { valor: 'estoque', rotulo: 'Estoque' },
          { valor: 'sessoes', rotulo: 'Sessões' },
          { valor: 'membros', rotulo: 'Membros' },
        ]}
      />

      {aba === 'geral' && (
        <>
          <ResumoLinha
            itens={[
              { rotulo: 'Estoque', valor: `${formatarNumero(r.estoque)} L`, className: r.abaixoMinimo ? 'text-amber-600 dark:text-amber-400' : undefined },
              { rotulo: 'Sessões no ano', valor: r.sessoesAno },
              { rotulo: 'Média de participantes', valor: Math.round(doNucleo.mediaParticipantes) },
            ]}
          />

          <div className="md:grid md:grid-cols-2 md:gap-x-6">
            <Secao titulo="Responsáveis">
              {d.responsaveis.length === 0 ? (
                <Vazio>Nenhum representante ou assistente com acesso ao Guardião.</Vazio>
              ) : (
                <ListaCard>
                  {d.responsaveis.map((p, i) => (
                    <ItemLista
                      key={`${p.nome}-${i}`}
                      inicio={<Avatar nome={p.nome} />}
                      sobre={<span className="text-[11px] text-muted-foreground">{rotuloPapel(p.papel)}</span>}
                      titulo={p.nome || 'Sem nome'}
                    />
                  ))}
                </ListaCard>
              )}
            </Secao>

            <Secao titulo="Comparado à média da região">
              <ListaDados
                itens={[
                  { rotulo: 'Consumo por pessoa', valor: `${Math.round(doNucleo.perCapitaMl)} ml · região ${Math.round(perCapitaRegiao)} ml` },
                  { rotulo: 'Sessões por mês', valor: `${formatarNumero(Math.round(sessoesMesNucleo * 10) / 10)} · região ${formatarNumero(Math.round(sessoesMesRegiao * 10) / 10)}` },
                  { rotulo: 'Participação média', valor: `${Math.round(doNucleo.mediaParticipantes)} · região ${Math.round(participacaoRegiao)}` },
                  { rotulo: 'Pendências de dados', valor: r.pendencias },
                ]}
              />
            </Secao>

            <Secao titulo="Lotes com saldo" acao={`${r.lotesComSaldo} lotes`}>
              {r.lotesComSaldo === 0 ? (
                <Vazio icone={<Package />}>Nenhum lote com saldo.</Vazio>
              ) : (
                <ListaCard>
                  {r.lotes.filter(l => l.saldo > 0).slice(0, 5).map(l => (
                    <ItemLista
                      key={l.id}
                      href={`/regional/lotes/${l.id}`}
                      titulo={l.tipo === 'Doação' ? l.nucleo_origem || 'Doação' : rotuloMestre(l.mestre_preparo)}
                      subtitulo={`${formatarData(l.data_preparo)}${l.grau ? ` · Grau ${l.grau}` : ''}${l.em_maturacao ? ' · em maturação' : ''}`}
                      fim={<ValorLinha valor={`${formatarNumero(l.saldo)} L`} detalhe="restantes" />}
                    />
                  ))}
                </ListaCard>
              )}
            </Secao>

            <Secao
              titulo="Últimas sessões"
              acao={<button type="button" onClick={() => setAba('sessoes')} className="font-medium text-primary">Ver todas ›</button>}
            >
              {sessoesOrdenadas.length === 0 ? (
                <Vazio icone={<CalendarDays />}>Nenhuma sessão registrada.</Vazio>
              ) : (
                <ListaCard>{sessoesOrdenadas.slice(0, 5).map(itemSessao)}</ListaCard>
              )}
            </Secao>
          </div>
        </>
      )}

      {aba === 'estoque' && (
        <>
          <ResumoLinha
            itens={[
              { rotulo: 'Estoque', valor: `${formatarNumero(r.estoque)} L`, className: r.abaixoMinimo ? 'text-amber-600 dark:text-amber-400' : undefined },
              { rotulo: 'Mínimo do núcleo', valor: `${formatarNumero(r.minimo)} L` },
              { rotulo: 'Autonomia', valor: r.autonomia !== null ? `≈ ${r.autonomia} sessões` : '—' },
            ]}
          />
          <ChipsFiltro
            className="mt-4"
            rotulo="Filtrar lotes"
            valor={filtroLotes}
            onChange={setFiltroLotes}
            opcoes={[
              { valor: 'disponiveis', rotulo: 'Com saldo' },
              { valor: 'esgotados', rotulo: 'Esgotados' },
              { valor: 'todos', rotulo: 'Todos' },
            ]}
          />
          <div className="mt-4 space-y-3">
            {lotes.length === 0 ? (
              <Vazio icone={<Package />}>Nenhum lote neste filtro.</Vazio>
            ) : (
              <ListaCard>
                {lotes.map(l => (
                  <li key={l.id}>
                    <a href={`/regional/lotes/${l.id}`} className="block px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{l.tipo === 'Doação' ? l.nucleo_origem || 'Doação' : rotuloMestre(l.mestre_preparo)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatarData(l.data_preparo)}{l.grau ? ` · Grau ${l.grau}` : ''}
                            {l.em_maturacao && ` · em maturação${l.data_liberacao ? ` até ${formatarDiaMes(l.data_liberacao)}` : ''}`}
                          </p>
                        </div>
                        <ValorLinha valor={l.saldo > 0 ? `${formatarNumero(l.saldo)} L` : 'Esgotado'} detalhe={`de ${formatarNumero(l.quantidade_preparada)} L`} />
                      </div>
                      <BarraSaldo className="mt-2" percentual={l.percentual} tom={l.saldo <= 0 ? 'neutro' : l.percentual < 20 ? 'alerta' : 'normal'} />
                    </a>
                  </li>
                ))}
              </ListaCard>
            )}
          </div>
        </>
      )}

      {aba === 'sessoes' && (
        sessoesOrdenadas.length === 0 ? (
          <Vazio icone={<CalendarDays />}>Nenhuma sessão registrada.</Vazio>
        ) : (
          <div className="space-y-6">
            {agruparPorMes(sessoesOrdenadas.slice(0, limiteSessoes), s => s.data_realizacao).map(grupo => (
              <section key={grupo.chave}>
                <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{rotuloMes(grupo.chave)}</h2>
                <ListaCard>{grupo.itens.map(itemSessao)}</ListaCard>
              </section>
            ))}
            {sessoesOrdenadas.length > limiteSessoes && (
              <Button variant="outline" className="w-full" onClick={() => setLimiteSessoes(l => l + 30)}>
                Mostrar mais ({sessoesOrdenadas.length - limiteSessoes} restantes)
              </Button>
            )}
          </div>
        )
      )}

      {aba === 'membros' && (
        <>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9" placeholder="Buscar membro…" value={buscaMembro} onChange={e => setBuscaMembro(e.target.value)} aria-label="Buscar membro" />
          </div>
          {membrosFiltrados.length === 0 ? (
            <Vazio icone={<Users />}>Nenhum membro encontrado.</Vazio>
          ) : (
            <ListaCard>
              {membrosFiltrados.map(m => {
                const n = dirigiu.get(m.id) ?? 0
                return (
                  <ItemLista
                    key={m.id}
                    href={`/regional/membros/${m.id}`}
                    inicio={<Avatar nome={m.nome_exibicao || m.nome} arquivo={m.foto_arquivo} />}
                    titulo={nomeMembro(m)}
                    subtitulo={[m.grau || 'Sem grau', m.tipo_vinculo === 'Visitante' && 'Visitante', !m.ativo && 'Inativo'].filter(Boolean).join(' · ')}
                    fim={n > 0 ? <ValorLinha valor={`${n}×`} detalhe="dirigiu no ano" /> : undefined}
                  />
                )
              })}
            </ListaCard>
          )}
        </>
      )}

      <NotaSomenteLeitura>
        Visão somente leitura: os registros deste núcleo só podem ser alterados pelos responsáveis do próprio núcleo.
      </NotaSomenteLeitura>
    </>
  )
}
