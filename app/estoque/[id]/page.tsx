'use client'
import Link from 'next/link'
import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Droplets, History, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { BarraSaldo } from '@/components/comum/Indicadores'
import { IconeLinha, ItemLista, ListaCard, ListaDados, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao } from '@/components/comum/Secao'
import { SparklineSaldo } from '@/components/estoque/SparklineSaldo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { emMaturacao } from '@/lib/estoque'
import { formatarData, formatarDiaMes, formatarNumero, hojeISO } from '@/lib/formato'
import { rotuloMestre } from '@/lib/membros'
import { podeEditar } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'
import type { Preparo, Saida } from '@/lib/tipos'

type ConsumoComSessao = {
  id: number
  quantidade_consumida: number
  sessoes: { id: number; data_realizacao: string; tipo: string; dirigente: string | null; quantidade_participantes: number } | null
}

type Historico = {
  id: string
  tipo: 'sessao' | 'saida'
  refId: number
  data: string
  titulo: string
  subtitulo: string
  quantidade: number
  saldoApos: number
}

export default function DetalheLote({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { profile } = useAuth()
  const editor = podeEditar(profile)

  const [carregando, setCarregando] = useState(true)
  const [preparo, setPreparo] = useState<Preparo | null>(null)
  const [consumos, setConsumos] = useState<ConsumoComSessao[]>([])
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [registradoPor, setRegistradoPor] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const { data: prep, error } = await supabase.from('preparos').select('*').eq('id', id).single()
      if (!ativo) return
      if (error || !prep) {
        toast.error('Lote não encontrado')
        router.replace('/estoque')
        return
      }

      const [resConsumos, resSaidas, resPerfil] = await Promise.all([
        supabase
          .from('consumos_sessao')
          .select('id, quantidade_consumida, sessoes ( id, data_realizacao, tipo, dirigente, quantidade_participantes )')
          .eq('id_preparo', id),
        supabase.from('saidas').select('*').eq('preparo_id', id),
        prep.user_id
          ? supabase.from('profiles').select('full_name').eq('id', prep.user_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      if (!ativo) return

      setPreparo(prep as Preparo)
      setConsumos((resConsumos.data ?? []) as unknown as ConsumoComSessao[])
      setSaidas((resSaidas.data ?? []) as Saida[])
      setRegistradoPor(resPerfil.data?.full_name ?? null)
      setCarregando(false)
    }
    carregar()
    return () => { ativo = false }
  }, [id, router])

  const calculo = useMemo(() => {
    if (!preparo) return null
    const inicial = Number(preparo.quantidade_preparada)
    const eventos = [
      ...consumos.filter(c => c.sessoes).map(c => ({
        id: `sessao-${c.id}`,
        tipo: 'sessao' as const,
        refId: c.sessoes!.id,
        data: c.sessoes!.data_realizacao,
        titulo: `Sessão · ${c.sessoes!.tipo}`,
        subtitulo: [c.sessoes!.dirigente, `${c.sessoes!.quantidade_participantes} participantes`].filter(Boolean).join(' · '),
        quantidade: Number(c.quantidade_consumida),
      })),
      ...saidas.map(s => ({
        id: `saida-${s.id}`,
        tipo: 'saida' as const,
        refId: s.id,
        data: s.data_saida,
        titulo: `Saída para ${s.destino}`,
        subtitulo: [s.motivo, s.observacoes].filter(Boolean).join(' · ') || 'Saída externa',
        quantidade: Number(s.quantidade),
      })),
    ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    let saldo = inicial
    const historico: Historico[] = eventos.map(e => {
      saldo = Math.round((saldo - e.quantidade) * 100) / 100
      return { ...e, saldoApos: saldo }
    })

    const entrada = (preparo.tipo === 'Doação' && preparo.data_chegada) || preparo.data_preparo
    const serie = [{ chave: entrada, saldo: inicial }, ...historico.map(h => ({ chave: h.data, saldo: h.saldoApos }))]
    const consumidoSessoes = eventos.filter(e => e.tipo === 'sessao')

    return {
      inicial,
      saldo,
      percentual: inicial > 0 ? Math.max(0, (saldo / inicial) * 100) : 0,
      historico: [...historico].reverse(),
      serie,
      sessoesAtendidas: consumidoSessoes.length,
      mediaPorSessao: consumidoSessoes.length
        ? consumidoSessoes.reduce((a, e) => a + e.quantidade, 0) / consumidoSessoes.length
        : 0,
    }
  }, [preparo, consumos, saidas])

  if (carregando || !preparo || !calculo) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const doacao = preparo.tipo === 'Doação'
  const maturando = emMaturacao(preparo, hojeISO())
  const esgotado = calculo.saldo <= 0
  const status = maturando
    ? `Em maturação${preparo.data_liberacao ? ` até ${formatarDiaMes(preparo.data_liberacao)}` : ''}`
    : esgotado ? 'Esgotado' : 'Disponível'

  return (
    <>
      <Cabecalho
        voltar={{ href: '/estoque', rotulo: 'Estoque' }}
        titulo={doacao ? preparo.nucleo_origem || 'Doação recebida' : rotuloMestre(preparo.mestre_preparo)}
        descricao={`${formatarData(preparo.data_preparo)}${preparo.grau ? ` · Grau ${preparo.grau}` : ''}`}
        acoes={editor && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/editar-preparo/${preparo.id}`}><Pencil /> Editar</Link>
          </Button>
        )}
      />

      <div className="-mt-2 mb-5 flex flex-wrap gap-1.5">
        <Badge variant="outline">{doacao ? 'Doação recebida' : 'Produção local'}</Badge>
        <Badge variant={maturando || esgotado ? 'secondary' : 'default'}>{status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Saldo do lote</p>
            <p className="text-4xl font-semibold leading-none tracking-tight tabular-nums">
              {formatarNumero(calculo.saldo)}
              <span className="ml-1.5 text-base font-normal text-muted-foreground">
                L restantes de {formatarNumero(calculo.inicial)} L
              </span>
            </p>
            <BarraSaldo percentual={calculo.percentual} tom={esgotado ? 'neutro' : calculo.percentual < 20 ? 'alerta' : 'normal'} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{calculo.sessoesAtendidas} {calculo.sessoesAtendidas === 1 ? 'sessão atendida' : 'sessões atendidas'}</span>
              {calculo.mediaPorSessao > 0 && <span>≈ {formatarNumero(calculo.mediaPorSessao)} L por sessão</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">Saldo ao longo do tempo</p>
            {calculo.serie.length > 1 ? (
              <SparklineSaldo serie={calculo.serie} altura={110} formatarRotulo={formatarData} />
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
            {
              rotulo: 'Mestre do preparo',
              valor: preparo.mestre_preparo_id ? (
                <Link href={`/membros/${preparo.mestre_preparo_id}`} className="text-primary underline-offset-4 hover:underline">
                  {rotuloMestre(preparo.mestre_preparo)}
                </Link>
              ) : rotuloMestre(preparo.mestre_preparo),
            },
            { rotulo: 'Mariri', valor: preparo.procedencia_mariri || '—' },
            { rotulo: 'Chacrona', valor: preparo.procedencia_chacrona || '—' },
            ...(preparo.data_liberacao ? [{ rotulo: 'Liberação prevista', valor: formatarData(preparo.data_liberacao) }] : []),
            { rotulo: 'Registrado por', valor: registradoPor || '—' },
          ]}
        />
      </Secao>

      {preparo.observacoes && (
        <Secao titulo="Observações">
          <Card><CardContent><p className="whitespace-pre-wrap text-sm">{preparo.observacoes}</p></CardContent></Card>
        </Secao>
      )}

      <Secao titulo="Histórico de consumo" acao={`${calculo.historico.length} registros`}>
        {calculo.historico.length === 0 ? (
          <Vazio icone={<History />}>Nenhuma movimentação neste lote.</Vazio>
        ) : (
          <ListaCard>
            {calculo.historico.map(item => (
              <ItemLista
                key={item.id}
                href={item.tipo === 'sessao' ? `/sessoes/${item.refId}` : editor ? `/editar-saida/${item.refId}` : undefined}
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
    </>
  )
}
