'use client'
import Link from 'next/link'
import { use, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, ChevronLeft, ChevronRight, Copy, Droplets, History, MoreHorizontal, Music, Pencil, Printer, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { ArquivoAnexo } from '@/components/comum/ArquivoAnexo'
import { Avatar } from '@/components/comum/Avatar'
import { ResumoLinha } from '@/components/comum/Indicadores'
import { IconeLinha, ItemLista, ListaCard, ListaDados, ValorLinha, Vazio } from '@/components/comum/Lista'
import { Cabecalho, Secao, VoltarLink } from '@/components/comum/Secao'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useDadosEstoque } from '@/hooks/useDadosEstoque'
import { calcularSaldos, ehSessaoHistorica, totalPorSessao } from '@/lib/estoque'
import {
  anoDe, formatarData, formatarDataExtensa, formatarDataHora, formatarDiaMes, formatarHora, formatarNumero, hojeISO,
} from '@/lib/formato'
import { nomeMembro, rotuloMestre } from '@/lib/membros'
import { ehAdmin, podeEditar } from '@/lib/permissoes'
import { supabase } from '@/lib/supabaseClient'
import type { ChamadaSessao, Historia, Membro, Visitante } from '@/lib/tipos'

type Extras = {
  carregando: boolean
  membros: Membro[]
  chamadas: ChamadaSessao[]
  historias: Historia[]
  visitantes: Visitante[]
}

type Registro = {
  registradoPor: string | null
  ultimaAlteracao: { quem: string | null; quando: string } | null
}

export default function DetalheSessao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const idSessao = Number(id)
  const router = useRouter()
  const { profile } = useAuth()
  const editor = podeEditar(profile)
  const admin = ehAdmin(profile)
  const estoque = useDadosEstoque()

  const [extras, setExtras] = useState<Extras>({ carregando: true, membros: [], chamadas: [], historias: [], visitantes: [] })
  const [registro, setRegistro] = useState<Registro>({ registradoPor: null, ultimaAlteracao: null })
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const sessao = estoque.sessoes.find(s => s.id === idSessao) ?? null
  const autorId = sessao?.user_id ?? null

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const [membros, chamadas, historias, visitantes] = await Promise.all([
        supabase.from('membros').select('*'),
        supabase.from('chamadas_sessao').select('*').eq('id_sessao', idSessao).order('id'),
        supabase.from('historias').select('*').eq('id_sessao', idSessao).order('id'),
        supabase.from('visitantes').select('*').eq('id_sessao', idSessao).order('nome'),
      ])
      if (!ativo) return
      setExtras({
        carregando: false,
        membros: (membros.data ?? []) as Membro[],
        chamadas: (chamadas.data ?? []) as ChamadaSessao[],
        historias: (historias.data ?? []) as Historia[],
        visitantes: (visitantes.data ?? []) as Visitante[],
      })
    }
    carregar()
    return () => { ativo = false }
  }, [idSessao])

  useEffect(() => {
    let ativo = true
    async function carregar() {
      let registradoPor: string | null = null
      let ultimaAlteracao: Registro['ultimaAlteracao'] = null

      if (autorId) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', autorId).maybeSingle()
        registradoPor = data?.full_name ?? null
      }
      if (admin) {
        const { data } = await supabase
          .from('activity_logs')
          .select('created_at, profiles ( full_name )')
          .eq('tabela_afetada', 'sessoes')
          .eq('registro_id', idSessao)
          .eq('acao', 'UPDATE')
          .order('created_at', { ascending: false })
          .limit(1)
        const log = data?.[0] as { created_at: string; profiles: { full_name: string | null } | null } | undefined
        if (log) ultimaAlteracao = { quem: log.profiles?.full_name ?? null, quando: log.created_at }
      }
      if (ativo) setRegistro({ registradoPor, ultimaAlteracao })
    }
    carregar()
    return () => { ativo = false }
  }, [autorId, admin, idSessao])

  const detalhe = useMemo(() => {
    if (!sessao) return null
    const { sessoes, consumos, preparos, saidas } = estoque

    const lotes = new Map(calcularSaldos(preparos, consumos, saidas, { hoje: hojeISO(), sessoes }).map(l => [l.id, l]))
    const consumosSessao = consumos.filter(c => c.id_sessao === sessao.id)
    const total = consumosSessao.reduce((acc, c) => acc + Number(c.quantidade_consumida), 0)
    const historica = ehSessaoHistorica(sessao)

    const ordenadas = [...sessoes].sort((a, b) => a.data_realizacao.localeCompare(b.data_realizacao) || a.id - b.id)
    const indice = ordenadas.findIndex(s => s.id === sessao.id)
    const ano = anoDe(sessao.data_realizacao)
    const ordinal = historica
      ? null
      : ordenadas.filter(s => !ehSessaoHistorica(s) && anoDe(s.data_realizacao) === ano).findIndex(s => s.id === sessao.id) + 1

    // Média das sessões do mesmo tipo nos 12 meses anteriores
    const inicio = new Date(new Date(sessao.data_realizacao).getTime() - 365 * 86_400_000).toISOString()
    const porSessao = totalPorSessao(consumos)
    const mesmoTipo = sessoes.filter(
      s => s.id !== sessao.id && s.tipo === sessao.tipo && !ehSessaoHistorica(s) &&
        s.data_realizacao < sessao.data_realizacao && s.data_realizacao >= inicio
    )
    const media = (valores: number[]) => (valores.length ? valores.reduce((a, v) => a + v, 0) / valores.length : null)

    return {
      historica,
      total,
      consumosSessao: consumosSessao.map(c => ({ ...c, lote: lotes.get(c.id_preparo) })),
      anterior: ordenadas[indice - 1] ?? null,
      proxima: ordenadas[indice + 1] ?? null,
      ordinal,
      mediaParticipantes: media(mesmoTipo.map(s => s.quantidade_participantes)),
      mediaConsumo: media(mesmoTipo.map(s => porSessao.get(s.id) ?? 0)),
    }
  }, [sessao, estoque])

  const excluir = async () => {
    setExcluindo(true)
    const { error } = await supabase.from('sessoes').delete().eq('id', idSessao)
    if (error) {
      toast.error('Erro ao excluir', { description: error.message })
      setExcluindo(false)
      return
    }
    toast.success('Sessão excluída')
    router.replace('/sessoes')
  }

  if (estoque.carregando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  }

  if (!sessao || !detalhe) {
    return (
      <>
        <VoltarLink href="/sessoes" rotulo="Sessões" />
        <Vazio icone={<History />}>Sessão não encontrada.</Vazio>
      </>
    )
  }

  const membroPorId = new Map(extras.membros.map(m => [m.id, m]))
  const pessoa = (idMembro: number | null, texto: string | null | undefined) => {
    const membro = idMembro ? membroPorId.get(idMembro) : undefined
    return {
      idMembro: membro?.id ?? null,
      nome: membro ? nomeMembro(membro) : texto?.trim() || null,
      foto: membro?.foto_arquivo ?? null,
    }
  }

  const nomesDirigentes = (sessao.dirigente || '').split(' / ')
  const condutores = [
    { papel: 'Dirigente', ...pessoa(sessao.dirigente_id, nomesDirigentes[0]) },
    ...(sessao.dirigente_2_id || nomesDirigentes[1]
      ? [{ papel: `Dirigente · ${sessao.tipo_delegacao || 'delegação'}`, ...pessoa(sessao.dirigente_2_id, nomesDirigentes[1]) }]
      : []),
    { papel: 'Leitor de documentos', ...pessoa(sessao.leitor_documentos_id, sessao.leitor_documentos) },
    { papel: 'Explanador', ...pessoa(sessao.explanador_id, sessao.explanador) },
  ]

  const hrefEditar = detalhe.historica ? `/editar-sessao-historica/${sessao.id}` : `/editar-sessao/${sessao.id}`
  const porPessoa = sessao.quantidade_participantes > 0 ? (detalhe.total * 1000) / sessao.quantidade_participantes : 0

  const comparacao = (() => {
    if (detalhe.historica || detalhe.mediaParticipantes === null) return null
    const pct = (atual: number, media: number | null) =>
      media ? Math.round(((atual - media) / media) * 100) : null
    const part = pct(sessao.quantidade_participantes, detalhe.mediaParticipantes)
    const cons = pct(detalhe.total, detalhe.mediaConsumo)
    const texto = (valor: number | null, rotulo: string) =>
      valor === null ? null : `${valor >= 0 ? '▲' : '▼'} ${Math.abs(valor)}% ${rotulo}`
    return [texto(part, 'participantes'), texto(cons, 'consumo')].filter(Boolean).join(' · ')
  })()

  return (
    <>
      <Cabecalho
        voltar={{ href: '/sessoes', rotulo: 'Sessões' }}
        titulo={formatarDataExtensa(sessao.data_realizacao)}
        descricao={
          detalhe.historica
            ? `Memória institucional${sessao.data_aproximada ? ' · data aproximada' : ''}`
            : `${formatarHora(sessao.data_realizacao)} · ${detalhe.ordinal}ª sessão de ${anoDe(sessao.data_realizacao)}`
        }
        acoes={
          <div className="flex items-center gap-2 print:hidden">
            {editor && (
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                <Link href={hrefEditar}><Pencil /> Editar</Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Mais ações">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {editor && (
                  <DropdownMenuItem asChild>
                    <Link href={hrefEditar}><Pencil /> Editar</Link>
                  </DropdownMenuItem>
                )}
                {editor && !detalhe.historica && (
                  <DropdownMenuItem asChild>
                    <Link href={`/nova-sessao?duplicar=${sessao.id}`}><Copy /> Duplicar</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => window.print()}>
                  <Printer /> Exportar ata (PDF)
                </DropdownMenuItem>
                {editor && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirmarExclusao(true)}>
                      <Trash2 /> Excluir sessão
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="-mt-2 mb-4 flex flex-wrap gap-1.5">
        <Badge>{sessao.tipo}</Badge>
        {detalhe.historica && <Badge variant="secondary">Registro histórico</Badge>}
        {sessao.tipo_delegacao && <Badge variant="outline">{sessao.tipo_delegacao}</Badge>}
      </div>

      <nav aria-label="Sessões vizinhas" className="mb-4 flex justify-between gap-3 text-xs print:hidden">
        {detalhe.anterior ? (
          <Link href={`/sessoes/${detalhe.anterior.id}`} className="inline-flex items-center gap-0.5 rounded-md py-1 font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-3.5" /> Anterior · {formatarDiaMes(detalhe.anterior.data_realizacao)}
          </Link>
        ) : <span />}
        {detalhe.proxima && (
          <Link href={`/sessoes/${detalhe.proxima.id}`} className="inline-flex items-center gap-0.5 rounded-md py-1 font-medium text-muted-foreground hover:text-foreground">
            Próxima · {formatarDiaMes(detalhe.proxima.data_realizacao)} <ChevronRight className="size-3.5" />
          </Link>
        )}
      </nav>

      {detalhe.historica ? (
        <div className="flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          <BookOpen className="mt-0.5 size-4 shrink-0" />
          Sessão registrada como memória institucional, sem participantes e sem consumo de vegetal.
        </div>
      ) : (
        <>
          <ResumoLinha
            itens={[
              { rotulo: 'Participantes', valor: sessao.quantidade_participantes },
              { rotulo: 'Consumo', valor: `${formatarNumero(detalhe.total)} L` },
              { rotulo: 'Por pessoa', valor: `${Math.round(porPessoa)} ml` },
            ]}
          />
          {comparacao && (
            <p className="mt-2 px-1 text-xs text-muted-foreground">
              {comparacao} vs. média das sessões de {sessao.tipo} nos 12 meses anteriores
            </p>
          )}
        </>
      )}

      <div className="md:grid md:grid-cols-2 md:gap-x-6">
        <Secao titulo="Condução">
          <ListaCard>
            {condutores.map(c => (
              <ItemLista
                key={c.papel}
                href={c.idMembro ? `/membros/${c.idMembro}` : undefined}
                inicio={<Avatar nome={c.nome} arquivo={c.foto} />}
                sobre={<span className="text-[11px] text-muted-foreground">{c.papel}</span>}
                titulo={c.nome ?? '—'}
                subtitulo={c.nome && !c.idMembro ? 'Nome em texto, sem vínculo com o cadastro' : undefined}
              />
            ))}
          </ListaCard>
        </Secao>

        {!detalhe.historica && (
          <Secao titulo="Vegetal servido" acao={`Total ${formatarNumero(detalhe.total)} L`}>
            {detalhe.consumosSessao.length === 0 ? (
              <Vazio icone={<Droplets />}>Nenhum consumo registrado nesta sessão.</Vazio>
            ) : (
              <ListaCard>
                {detalhe.consumosSessao.map(c => (
                  <ItemLista
                    key={c.id}
                    href={`/estoque/${c.id_preparo}`}
                    inicio={<IconeLinha><Droplets /></IconeLinha>}
                    titulo={
                      c.lote
                        ? c.lote.tipo === 'Doação' ? c.lote.nucleo_origem || 'Doação' : rotuloMestre(c.lote.mestre_preparo)
                        : `Lote #${c.id_preparo}`
                    }
                    subtitulo={c.lote ? `${formatarData(c.lote.data_preparo)}${c.lote.grau ? ` · Grau ${c.lote.grau}` : ''}` : undefined}
                    fim={
                      <ValorLinha
                        valor={`${formatarNumero(c.quantidade_consumida)} L`}
                        detalhe={c.lote ? `saldo atual ${formatarNumero(c.lote.saldo)} L` : undefined}
                      />
                    }
                  />
                ))}
              </ListaCard>
            )}
          </Secao>
        )}

        {extras.chamadas.length > 0 && (
          <Secao titulo="Chamadas" acao={`${extras.chamadas.length} ${extras.chamadas.length === 1 ? 'chamada' : 'chamadas'}`}>
            <ListaCard>
              {extras.chamadas.map(c => {
                const quem = c.membro_id ? membroPorId.get(c.membro_id) : undefined
                return (
                  <ItemLista
                    key={c.id}
                    href={quem ? `/membros/${quem.id}` : undefined}
                    inicio={<IconeLinha><Music /></IconeLinha>}
                    sobre={c.autor ? <span className="text-[11px] text-muted-foreground">{c.autor}</span> : undefined}
                    titulo={c.chamada}
                    subtitulo={`Feita por ${quem ? nomeMembro(quem) : c.pessoa || '—'}`}
                  />
                )
              })}
            </ListaCard>
          </Secao>
        )}

        {extras.historias.length > 0 && (
          <Secao titulo="Histórias contadas">
            <ListaCard>
              {extras.historias.map(h => <ItemLista key={h.id} titulo={h.titulo_historia} quebrarTexto />)}
            </ListaCard>
          </Secao>
        )}

        {extras.visitantes.length > 0 && (
          <Secao titulo="Visitantes" acao={`${extras.visitantes.length} ${extras.visitantes.length === 1 ? 'pessoa' : 'pessoas'}`}>
            <ListaCard>
              {extras.visitantes.map(v => (
                <ItemLista
                  key={v.id}
                  href={v.membro_id ? `/membros/${v.membro_id}` : undefined}
                  inicio={<Avatar nome={v.nome} />}
                  titulo={v.nome}
                  subtitulo={v.nucleo_origem || undefined}
                />
              ))}
            </ListaCard>
          </Secao>
        )}

        {sessao.observacoes && (
          <Secao titulo="Observações">
            <Card><CardContent><p className="whitespace-pre-wrap text-sm">{sessao.observacoes}</p></CardContent></Card>
          </Secao>
        )}

        {(sessao.fonte_registro || sessao.ata_arquivo) && (
          <Secao titulo="Fonte do registro">
            <div className="space-y-3">
              {sessao.fonte_registro && <ListaDados itens={[{ rotulo: 'Origem', valor: sessao.fonte_registro }]} />}
              {sessao.ata_arquivo && <ArquivoAnexo caminho={sessao.ata_arquivo} rotulo="Abrir ata" />}
            </div>
          </Secao>
        )}

        <Secao titulo="Registro">
          <ListaDados
            itens={[
              { rotulo: 'Registrado por', valor: registro.registradoPor || '—' },
              { rotulo: 'Registrado em', valor: formatarDataHora(sessao.created_at) },
              ...(admin
                ? [
                    {
                      rotulo: 'Última alteração',
                      valor: registro.ultimaAlteracao
                        ? `${registro.ultimaAlteracao.quem || 'Sistema'} · ${formatarDataHora(registro.ultimaAlteracao.quando)}`
                        : 'Nenhuma',
                    },
                    {
                      rotulo: 'Histórico de alterações',
                      valor: (
                        <Link
                          href={`/admin/auditoria?tabela=sessoes&registro=${sessao.id}`}
                          className="text-primary underline-offset-4 hover:underline print:hidden"
                        >
                          Ver
                        </Link>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </Secao>
      </div>

      {editor && !extras.carregando && extras.chamadas.length + extras.historias.length === 0 && (
        <p className="mt-4 text-xs text-muted-foreground print:hidden">
          Chamadas, histórias contadas e visitantes podem ser adicionados em Editar.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 print:hidden md:flex">
        {editor && (
          <Button variant="outline" asChild className="h-10">
            <Link href={hrefEditar}><Pencil /> Editar sessão</Link>
          </Button>
        )}
        <Button variant="outline" className={editor ? 'h-10' : 'col-span-2 h-10'} onClick={() => window.print()}>
          <Printer /> Exportar ata (PDF)
        </Button>
      </div>

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              A sessão, os consumos, chamadas, histórias e visitantes vinculados serão removidos e o vegetal volta ao saldo dos lotes.
              A exclusão fica registrada na auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={excluir} disabled={excluindo}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
