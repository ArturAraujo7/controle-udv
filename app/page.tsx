'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Plus, Database, ChevronRight, Users, ArrowUpRight, BarChart3,
  BookOpen, Droplets, CalendarDays,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ChangelogModal } from '@/components/ChangelogModal'
import { useAuth } from '@/components/AuthProvider'
import {
  SessionDetailDialog, type ConsumoDetalhado, type SessaoDetalhe,
} from '@/components/dashboard/SessionDetailDialog'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'

type Movimentacao = {
  id: string
  tipo_movimento: 'entrada' | 'saida' | 'consumo' | 'historico'
  data: string
  titulo: string
  subtitulo: string
  quantidade: number
  detalhesSessao?: SessaoDetalhe
}

const ACOES = [
  { href: '/nova-sessao', icone: Plus, titulo: 'Nova sessão', descricao: 'Registrar ata', destaque: true },
  { href: '/novo-preparo', icone: Database, titulo: 'Preparo', descricao: 'Nova entrada' },
  { href: '/nova-saida', icone: ArrowUpRight, titulo: 'Saída', descricao: 'Registrar doação' },
  { href: '/relatorios', icone: BarChart3, titulo: 'Relatórios', descricao: 'Estatísticas gerais' },
]

export default function Home() {
  const { session } = useAuth()
  const router = useRouter()
  const [estoqueAtual, setEstoqueAtual] = useState<number>(0)
  const [totalSessoes, setTotalSessoes] = useState<number>(0)
  const [ultimasMovimentacoes, setUltimasMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)

  // Estado do diálogo de detalhes
  const [selectedSession, setSelectedSession] = useState<SessaoDetalhe | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sessionConsumos, setSessionConsumos] = useState<ConsumoDetalhado[]>([])

  useEffect(() => {
    async function fetchData() {
      // 1. Verifica se usuario tem nome definido (Forçar Cadastro)
      const user = session?.user
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (!profile?.full_name) {
          router.push('/perfil')
          return // Interrompe o carregamento da dash
        }
      }

      // 2. Buscamos todas as tabelas: preparos, consumos_sessao e saidas
      const { data: preparos } = await supabase.from('preparos').select('id, quantidade_preparada, data_preparo, tipo, grau, nucleo_origem, mestre_preparo')
      // Agora buscamos o consumo na tabela certa
      const { data: consumos } = await supabase.from('consumos_sessao').select('id_sessao, quantidade_consumida')

      // Buscamos sessões com todos os campos necessários para o modal
      const { data: sessoes } = await supabase
        .from('sessoes')
        .select('*') // Trazendo tudo para ter dirigente, explanador, etc.
        .order('data_realizacao', { ascending: false })

      const { data: saidas } = await supabase.from('saidas').select('id, quantidade, data_saida, destino')

      // 2. Calculamos os totais
      const totalEntrada = preparos?.reduce((acc, curr) => acc + (curr.quantidade_preparada || 0), 0) || 0
      // Soma da tabela de consumos
      const totalConsumoSessoes = consumos?.reduce((acc, curr) => acc + (curr.quantidade_consumida || 0), 0) || 0
      const totalSaidasExtras = saidas?.reduce((acc, curr) => acc + (curr.quantidade || 0), 0) || 0

      // 3. Atualizamos a conta final
      // Estoque = Tudo que entrou - (O que bebeu na sessão + O que saiu/doou)
      setEstoqueAtual(totalEntrada - totalConsumoSessoes - totalSaidasExtras)

      const anoAtual = new Date().getFullYear()
      const sessoesDoAno = sessoes?.filter(s => new Date(s.data_realizacao).getFullYear() === anoAtual)

      setTotalSessoes(sessoesDoAno?.length || 0)

      // 4. Montar a lista unificada de movimentações
      const movimentos: Movimentacao[] = []

      if (preparos) {
        preparos.forEach(p => {
          const isDoacao = p.tipo === 'Doação'
          movimentos.push({
            id: `preparo-${p.id}`,
            tipo_movimento: 'entrada',
            data: p.data_preparo,
            titulo: isDoacao ? 'Entrada (Doação)' : 'Novo Preparo',
            subtitulo: isDoacao ? `De: ${p.nucleo_origem || 'Outro núcleo'}` : `Grau ${p.grau} · M. ${p.mestre_preparo}`,
            quantidade: p.quantidade_preparada
          })
        })
      }

      if (sessoes) {
        sessoes.forEach(s => {
          const consumosDaSessao = consumos?.filter(c => c.id_sessao === s.id) || []
          const totalConsumidoNaSessao = consumosDaSessao.reduce((acc, curr) => acc + (curr.quantidade_consumida || 0), 0)

          const isSessaoHistorica = s.quantidade_participantes === 0;

          if (totalConsumidoNaSessao > 0 || isSessaoHistorica) {
            movimentos.push({
              id: `sessao-${s.id}`,
              tipo_movimento: isSessaoHistorica ? 'historico' : 'consumo',
              data: s.data_realizacao,
              titulo: isSessaoHistorica ? `Registro: ${s.tipo || 'Sem Tipo'}` : `Sessão: ${s.tipo || 'Sem Tipo'}`,
              subtitulo: isSessaoHistorica ? `Memória M. ${s.dirigente}` : `${s.quantidade_participantes || 0} participantes`,
              quantidade: totalConsumidoNaSessao,
              detalhesSessao: s
            })
          }
        })
      }

      if (saidas) {
        saidas.forEach(s => {
          if (s.quantidade > 0) {
            movimentos.push({
              id: `saida-${s.id}`,
              tipo_movimento: 'saida',
              data: s.data_saida,
              titulo: 'Saída / Doação',
              subtitulo: `Para: ${s.destino || 'Não informado'}`,
              quantidade: s.quantidade
            })
          }
        })
      }

      // Ordenar do mais recente para o mais antigo e pegar os 5 primeiros
      movimentos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      setUltimasMovimentacoes(movimentos.slice(0, 5))

      setLoading(false)
    }
    fetchData()
  }, [session?.user?.id, router])

  const handleOpenModal = async (sessao: SessaoDetalhe) => {
    setSelectedSession(sessao)
    setLoadingDetails(true)
    setSessionConsumos([])

    // Busca os detalhes do consumo incluindo info do preparo
    const { data, error } = await supabase
      .from('consumos_sessao')
      .select(`
        id,
        quantidade_consumida,
        preparos (
          data_preparo,
          mestre_preparo,
          grau
        )
      `)
      .eq('id_sessao', sessao.id)

    if (data) {
      setSessionConsumos(data as unknown as ConsumoDetalhado[])
    } else if (error) {
      console.error('Erro ao buscar detalhes:', error)
    }

    setLoadingDetails(false)
  }

  return (
    <>
      <ChangelogModal />

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/estoque" className="rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent>
              <CardDescription className="flex items-center gap-1.5 mb-2">
                <Droplets className="w-3.5 h-3.5" /> Estoque
              </CardDescription>
              {loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  {formatarNumero(estoqueAtual)}{' '}
                  <span className="text-base font-normal text-muted-foreground">L</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Disponível hoje</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sessoes" className="rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent>
              <CardDescription className="flex items-center gap-1.5 mb-2">
                <CalendarDays className="w-3.5 h-3.5" /> Sessões
              </CardDescription>
              {loading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <p className="text-3xl font-semibold tabular-nums tracking-tight">{totalSessoes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Realizadas este ano</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Ações */}
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Ações</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {ACOES.map(({ href, icone: Icone, titulo, descricao, destaque }) => (
          <Link key={href} href={href} className="rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <Card className={cn(
              'h-full transition-colors',
              destaque
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                : 'hover:border-primary/40'
            )}>
              <CardContent className="flex flex-col gap-3">
                <Icone className={cn('w-5 h-5', destaque ? 'opacity-90' : 'text-muted-foreground')} />
                <div>
                  <h3 className="font-medium leading-tight">{titulo}</h3>
                  <p className={cn('text-xs mt-0.5', destaque ? 'opacity-80' : 'text-muted-foreground')}>
                    {descricao}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {[
          { href: '/membros', icone: Users, titulo: 'Dados da irmandade', descricao: 'Administrar irmandade e visitantes' },
          { href: '/nova-sessao-historica', icone: BookOpen, titulo: 'Registro histórico', descricao: 'Sessões anteriores a 2026' },
        ].map(({ href, icone: Icone, titulo, descricao }) => (
          <Link key={href} href={href} className="col-span-2 rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Icone className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium leading-tight">{titulo}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{descricao}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Histórico recente */}
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Últimas movimentações</h2>
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[68px] rounded-xl" />)
        ) : ultimasMovimentacoes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Database className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          ultimasMovimentacoes.map(mov => {
            const isEntrada = mov.tipo_movimento === 'entrada'
            const isSaida = mov.tipo_movimento === 'saida'
            const isHistorico = mov.tipo_movimento === 'historico'
            const clicavel = (mov.tipo_movimento === 'consumo' || isHistorico) && mov.detalhesSessao
            const Icone = isEntrada ? Database : isSaida ? ArrowUpRight : isHistorico ? BookOpen : Droplets

            const conteudo = (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <Icone className={cn('w-4 h-4 shrink-0', isEntrada ? 'text-primary' : isSaida ? 'text-destructive' : 'text-muted-foreground')} />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{formatarData(mov.data)}</p>
                    <h3 className="font-medium text-sm leading-tight truncate">{mov.titulo}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{mov.subtitulo}</p>
                  </div>
                </div>
                <div className="shrink-0 ml-3">
                  {isHistorico ? (
                    <span className="text-xs text-muted-foreground">Histórica</span>
                  ) : (
                    <span className={cn('text-sm font-medium tabular-nums', isEntrada ? 'text-primary' : 'text-destructive')}>
                      {isEntrada ? '+' : '−'}{formatarNumero(mov.quantidade)}
                      <span className="text-xs font-normal text-muted-foreground ml-0.5">L</span>
                    </span>
                  )}
                </div>
              </>
            )

            return clicavel ? (
              <button
                key={mov.id}
                type="button"
                onClick={() => handleOpenModal(mov.detalhesSessao!)}
                className="w-full text-left bg-card rounded-xl border p-4 flex items-center justify-between transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {conteudo}
              </button>
            ) : (
              <div key={mov.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
                {conteudo}
              </div>
            )
          })
        )}
      </div>

      <SessionDetailDialog
        sessao={selectedSession}
        consumos={sessionConsumos}
        loading={loadingDetails}
        onOpenChange={aberto => {
          if (!aberto) {
            setSelectedSession(null)
            setSessionConsumos([])
          }
        }}
      />
    </>
  )
}
