'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, History } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatarData, formatarNumero } from '@/lib/formato'

export default function DetalheEstoque({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  type Preparo = {
    id: number
    mestre_preparo: string
    grau: string
    quantidade_preparada: number
    status: string
    procedencia_mariri?: string
    procedencia_chacrona?: string
    nucleo_origem?: string
    data_preparo: string
    user_id?: string
    tipo?: string
  }

  type HistoricoItem = {
    id: string
    realId: number
    tipo: string
    titulo: string
    data: string
    quantidade: number
    subtitulo: string
    isSaida: boolean
  }

  const [preparo, setPreparo] = useState<Preparo | null>(null)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // 1. Busca dados do Preparo
      const { data: prep, error: errPrep } = await supabase
        .from('preparos')
        .select('*')
        .eq('id', id)
        .single()

      if (errPrep) {
        toast.error('Preparo não encontrado')
        router.push('/estoque')
        return
      }
      setPreparo(prep)

      // 2. Busca consumos deste preparo (na tabela nova)
      const { data: consumos, error: errConsumos } = await supabase
        .from('consumos_sessao')
        .select(`
          quantidade_consumida,
          sessoes (
            id,
            data_realizacao,
            tipo,
            dirigente,
            quantidade_participantes
          )
        `)
        .eq('id_preparo', id)

      if (errConsumos) {
        console.error('Erro ao buscar consumos:', errConsumos)
      }

      // 3. Busca saídas/doações deste preparo
      const { data: saidas, error: errSaidas } = await supabase
        .from('saidas')
        .select('*')
        .eq('preparo_id', id)
        .order('data_saida', { ascending: false })

      if (errSaidas) {
        console.error('Erro ao buscar saídas:', errSaidas)
      }

      // 4. Formata a lista de sessões a partir dos consumos
      const listaSessoes = consumos?.map((c) => {
        const sessao = c.sessoes as unknown as { id: number, data_realizacao: string, tipo: string, dirigente: string, quantidade_participantes: number }
        if (!sessao) return null

        return {
          id: `sessao-${sessao.id}`,
          realId: sessao.id,
          tipo: 'Sessão',
          titulo: sessao.dirigente || sessao.tipo,
          data: sessao.data_realizacao,
          quantidade: c.quantidade_consumida,
          subtitulo: `${sessao.quantidade_participantes} participantes`,
          isSaida: false
        }
      }).filter(item => item !== null) as HistoricoItem[] || []

      // 5. Formata lista de saídas
      const listaSaidas = saidas?.map(s => ({
        id: `saida-${s.id}`,
        realId: s.id,
        tipo: 'Doação / Saída',
        titulo: s.destino,
        data: s.data_saida,
        quantidade: s.quantidade,
        subtitulo: s.observacoes || 'Saída externa',
        isSaida: true
      })) as HistoricoItem[] || []

      // 6. Unifica e ordena por data (mais recente primeiro)
      const historicoUnificado = [...listaSessoes, ...listaSaidas].sort((a, b) =>
        new Date(b.data).getTime() - new Date(a.data).getTime()
      )

      setHistorico(historicoUnificado)
      setLoading(false)
    }
    loadData()
  }, [id, router])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    )
  }

  if (!preparo) return null

  const saldoAtual = preparo.quantidade_preparada - historico.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0)

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Detalhes do Vegetal</h1>
          <p className="text-sm text-muted-foreground">Lote #{id}</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={preparo.status === 'Esgotado' ? 'secondary' : 'outline'}>
              {preparo.status}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/editar-preparo/${id}`}>Editar</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-muted-foreground">Mestre</p>
              <p className="font-medium">{preparo.mestre_preparo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grau</p>
              <p className="font-medium">{preparo.grau}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quantidade inicial</p>
              <p className="font-medium tabular-nums">{formatarNumero(preparo.quantidade_preparada)} L</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo atual</p>
              <p className="text-xl font-semibold tabular-nums leading-tight">{formatarNumero(saldoAtual)} L</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Mariri</p>
              <p>{preparo.procedencia_mariri || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chacrona</p>
              <p>{preparo.procedencia_chacrona || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <History className="w-4 h-4" /> Histórico de movimentação
      </h2>

      {historico.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <History className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada neste lote.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {historico.map((item) => (
            <Link
              key={item.id}
              href={item.isSaida ? `/editar-saida/${item.realId}` : `/editar-sessao/${item.realId}`}
              className="block bg-card rounded-xl border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {item.isSaida && <Badge variant="secondary">Saída</Badge>}
                    <p className="font-medium text-sm truncate">{item.titulo}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatarData(item.data)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium tabular-nums text-destructive">
                    −{formatarNumero(item.quantidade)}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">L</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-[10rem]">{item.subtitulo}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
