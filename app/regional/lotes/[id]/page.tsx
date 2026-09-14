'use client'
import { use } from 'react'
import { ArrowUpRight, Droplets, History, Package } from 'lucide-react'

import { BarraSaldo } from '@/components/comum/Indicadores'
import { IconeLinha, ItemLista, ListaCard, ListaDados, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao, VoltarLink } from '@/components/comum/Secao'
import { SparklineSaldo } from '@/components/estoque/SparklineSaldo'
import { CarregandoRegional, NotaSomenteLeitura } from '@/components/regional/Comum'
import { useRegional } from '@/components/regional/EscopoRegional'
import { FaixaRegional } from '@/components/regional/FaixaRegional'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { emMaturacao } from '@/lib/estoque'
import { formatarData, formatarDiaMes, formatarNumero, hojeISO } from '@/lib/formato'
import { nomeMembro, rotuloMestre } from '@/lib/membros'

export default function LoteRegional({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const idPreparo = Number(id)
  const { dados, agora } = useRegional()

  if (!dados) return <><VoltarLink href="/regional/estoque" rotulo="Estoque" /><CarregandoRegional /></>

  const preparo = dados.preparos.find(p => p.id === idPreparo)
  if (!preparo) {
    return (
      <>
        <VoltarLink href="/regional/estoque" rotulo="Estoque" />
        <Vazio icone={<Package />}>Lote não encontrado na região.</Vazio>
      </>
    )
  }

  const nucleo = dados.nucleos.find(n => n.id === preparo.nucleo_id) ?? null
  const sessaoPorId = new Map(dados.sessoes.map(s => [s.id, s]))
  const mestre = preparo.mestre_preparo_id ? dados.membros.find(m => m.id === preparo.mestre_preparo_id) : undefined

  const eventos = [
    ...dados.consumos
      .filter(c => c.id_preparo === preparo.id)
      .map(c => {
        const s = sessaoPorId.get(c.id_sessao)
        return s
          ? {
              chave: `c-${c.id}`,
              tipo: 'sessao' as const,
              refId: s.id,
              data: s.data_realizacao,
              titulo: `Sessão · ${s.tipo}`,
              subtitulo: [s.dirigente, `${s.quantidade_participantes} participantes`].filter(Boolean).join(' · '),
              quantidade: Number(c.quantidade_consumida),
            }
          : null
      })
      .filter((e): e is NonNullable<typeof e> => e !== null),
    ...dados.saidas
      .filter(s => s.preparo_id === preparo.id)
      .map(s => ({
        chave: `s-${s.id}`,
        tipo: 'saida' as const,
        refId: s.id,
        data: s.data_saida,
        titulo: `Saída para ${s.destino}`,
        subtitulo: [s.motivo, s.observacoes].filter(Boolean).join(' · ') || 'Saída externa',
        quantidade: Number(s.quantidade),
      })),
  ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  const inicial = Number(preparo.quantidade_preparada)
  const historico = eventos.reduce<(typeof eventos[number] & { saldoApos: number })[]>((lista, e) => {
    const antes = lista.length ? lista[lista.length - 1].saldoApos : inicial
    return [...lista, { ...e, saldoApos: Math.round((antes - e.quantidade) * 100) / 100 }]
  }, [])
  const saldo = historico.length ? historico[historico.length - 1].saldoApos : inicial
  const entrada = (preparo.tipo === 'Doação' && preparo.data_chegada) || preparo.data_preparo
  const serie = [{ chave: entrada, saldo: inicial }, ...historico.map(h => ({ chave: h.data, saldo: h.saldoApos }))]
  const percentual = inicial > 0 ? Math.max(0, (saldo / inicial) * 100) : 0
  const doacao = preparo.tipo === 'Doação'
  const maturando = emMaturacao(preparo, hojeISO(agora))
  const esgotado = saldo <= 0

  return (
    <>
      <Cabecalho
        voltar={{ href: `/regional/nucleos/${preparo.nucleo_id}?aba=estoque`, rotulo: nucleo?.nome ?? 'Núcleo' }}
        titulo={doacao ? preparo.nucleo_origem || 'Doação recebida' : rotuloMestre(preparo.mestre_preparo)}
        descricao={`${formatarData(preparo.data_preparo)}${preparo.grau ? ` · Grau ${preparo.grau}` : ''}`}
      />
      <FaixaRegional nucleo={nucleo} />

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Badge variant="outline">{doacao ? 'Doação recebida' : 'Produção local'}</Badge>
        <Badge variant={maturando || esgotado ? 'secondary' : 'default'}>
          {maturando ? `Em maturação${preparo.data_liberacao ? ` até ${formatarDiaMes(preparo.data_liberacao)}` : ''}` : esgotado ? 'Esgotado' : 'Disponível'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Saldo do lote</p>
            <p className="text-4xl font-semibold leading-none tracking-tight tabular-nums">
              {formatarNumero(saldo)}
              <span className="ml-1.5 text-base font-normal text-muted-foreground">L restantes de {formatarNumero(inicial)} L</span>
            </p>
            <BarraSaldo percentual={percentual} tom={esgotado ? 'neutro' : percentual < 20 ? 'alerta' : 'normal'} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">Saldo ao longo do tempo</p>
            {serie.length > 1 ? (
              <SparklineSaldo serie={serie} altura={110} formatarRotulo={formatarData} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Ainda sem consumo neste lote.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Secao titulo="Procedência">
        <ListaDados
          itens={[
            ...(doacao
              ? [
                  { rotulo: 'Núcleo de origem', valor: preparo.nucleo_origem || '—' },
                  { rotulo: 'Data de chegada', valor: formatarData(preparo.data_chegada) },
                ]
              : []),
            { rotulo: 'Mestre do preparo', valor: mestre ? nomeMembro(mestre) : rotuloMestre(preparo.mestre_preparo) },
            { rotulo: 'Mariri', valor: preparo.procedencia_mariri || '—' },
            { rotulo: 'Chacrona', valor: preparo.procedencia_chacrona || '—' },
            { rotulo: 'Núcleo', valor: nucleo?.nome ?? '—' },
          ]}
        />
      </Secao>

      {preparo.observacoes && (
        <Secao titulo="Observações">
          <Card><CardContent><p className="whitespace-pre-wrap text-sm">{preparo.observacoes}</p></CardContent></Card>
        </Secao>
      )}

      <Secao titulo="Histórico de consumo" acao={`${historico.length} registros`}>
        {historico.length === 0 ? (
          <Vazio icone={<History />}>Nenhuma movimentação neste lote.</Vazio>
        ) : (
          <ListaCard>
            {[...historico].reverse().map(item => (
              <ItemLista
                key={item.chave}
                href={item.tipo === 'sessao' ? `/regional/sessoes/${item.refId}` : undefined}
                inicio={
                  <IconeLinha className={item.tipo === 'saida' ? 'bg-destructive/10 text-destructive' : undefined}>
                    {item.tipo === 'saida' ? <ArrowUpRight /> : <Droplets />}
                  </IconeLinha>
                }
                titulo={item.titulo}
                subtitulo={`${formatarData(item.data)} · ${item.subtitulo}`}
                fim={<ValorLinha valor={`−${formatarNumero(item.quantidade)} L`} detalhe={`saldo ${formatarNumero(item.saldoApos)} L`} />}
              />
            ))}
          </ListaCard>
        )}
      </Secao>

      <NotaSomenteLeitura>Visão somente leitura: só o núcleo pode editar este lote.</NotaSomenteLeitura>
    </>
  )
}
