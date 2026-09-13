'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Search, Plus, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  SessionDetailDialog, type ConsumoDetalhado,
} from '@/components/dashboard/SessionDetailDialog'
import { formatarData, formatarNumero } from '@/lib/formato'

type Sessao = {
  id: number
  data_realizacao: string
  tipo: string
  dirigente: string
  quantidade_participantes: number
  quantidade_consumida: number
  user_id?: string
  explanador?: string
  leitor_documentos?: string
  user_name?: string
}

export default function HistoricoSessoes() {
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Estado do diálogo de detalhes
  const [selectedSession, setSelectedSession] = useState<Sessao | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [sessionConsumos, setSessionConsumos] = useState<ConsumoDetalhado[]>([])

  useEffect(() => {
    async function fetchSessoes() {
      // 1. Busca as sessões
      const { data: dadosSessoes } = await supabase.from('sessoes').select('*').order('data_realizacao', { ascending: false })

      // 2. Busca os consumos (apenas totais para a lista)
      const { data: dadosConsumos } = await supabase.from('consumos_sessao').select('id_sessao, quantidade_consumida')

      // 3. Busca perfis de usuários
      const userIds = Array.from(new Set(dadosSessoes?.map((s) => s.user_id).filter(Boolean))) || []
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)

      // 4. Calcula o total por sessão e adiciona nome do usuário
      const sessoesComConsumo = dadosSessoes?.map((sessao) => {
        const consumosDaSessao = dadosConsumos?.filter(c => c.id_sessao === sessao.id) || []
        const totalConsumido = Number(consumosDaSessao.reduce((acc: number, curr) => acc + Number(curr.quantidade_consumida || 0), 0).toFixed(2))
        const profile = profiles?.find((p) => p.id === sessao.user_id)

        return {
          ...sessao,
          quantidade_consumida: totalConsumido,
          user_name: profile?.full_name
        }
      }) || []

      setSessoes(sessoesComConsumo)
      setLoading(false)
    }
    fetchSessoes()
  }, [])

  const handleOpenModal = async (sessao: Sessao) => {
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
      // Cast explícito necessário pois o supabase retorna tipos complexos no join
      setSessionConsumos(data as unknown as ConsumoDetalhado[])
    } else if (error) {
      console.error('Erro ao buscar detalhes:', error)
    }

    setLoadingDetails(false)
  }

  const busca = searchTerm.toLowerCase()
  const filtradas = sessoes.filter(sessao => {
    const dirigente = sessao.dirigente?.toLowerCase() || ''
    const tipo = sessao.tipo?.toLowerCase() || ''
    const data = formatarData(sessao.data_realizacao).toLowerCase()
    return dirigente.includes(busca) || tipo.includes(busca) || data.includes(busca)
  })

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sessões</h1>
        <Button asChild>
          <Link href="/nova-sessao"><Plus data-slot="icon" /> Nova sessão</Link>
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Buscar por dirigente, tipo ou data…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar sessão"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <CalendarDays className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {sessoes.length === 0
                ? 'Nenhuma sessão registrada ainda.'
                : 'Nenhuma sessão corresponde à busca.'}
            </p>
            {sessoes.length === 0 && (
              <Button variant="outline" asChild className="mt-4">
                <Link href="/nova-sessao">Registrar primeira sessão</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Dirigente</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Participantes</TableHead>
                  <TableHead className="text-right">Consumo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map(sessao => {
                  const ehHistorica = sessao.quantidade_participantes === 0
                  return (
                    <TableRow
                      key={sessao.id}
                      onClick={() => handleOpenModal(sessao)}
                      tabIndex={0}
                      role="button"
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleOpenModal(sessao)
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {formatarData(sessao.data_realizacao)}
                        <span className="block sm:hidden text-xs text-muted-foreground mt-0.5 font-normal truncate max-w-[8rem]">
                          {sessao.dirigente}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ehHistorica ? 'outline' : 'secondary'}>
                          {ehHistorica ? 'Histórica' : sessao.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {sessao.dirigente || '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right tabular-nums">
                        {ehHistorica ? '—' : sessao.quantidade_participantes}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium whitespace-nowrap">
                        {ehHistorica ? '—' : `${formatarNumero(sessao.quantidade_consumida)} L`}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <SessionDetailDialog
        sessao={selectedSession}
        consumos={sessionConsumos}
        loading={loadingDetails}
        registradoPor={selectedSession?.user_name}
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
