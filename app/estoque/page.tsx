'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Beaker, Plus, Truck, Pencil, Search, Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'

type PreparoComSaldo = {
  id: number
  tipo?: string
  data_preparo: string
  mestre_preparo: string
  nucleo_origem?: string
  quantidade_preparada: number
  grau: string
  status: string
  total_consumido: number
  saldo: number
  user_id?: string
}

export default function GerenciarEstoque() {
  const [preparos, setPreparos] = useState<PreparoComSaldo[]>([])
  const [saldoTotal, setSaldoTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchEstoque() {
      // 1. Busca TUDO: Preparos, Consumos e Saídas
      const { data: dadosPreparos } = await supabase.from('preparos').select('*').order('data_preparo', { ascending: false })

      // Agora buscamos da tabela nova de consumos
      const { data: dadosConsumos } = await supabase.from('consumos_sessao').select('id_preparo, quantidade_consumida')

      const { data: dadosSaidas } = await supabase.from('saidas').select('preparo_id, quantidade')

      let somaTotal = 0

      const listaFinal = dadosPreparos?.map((preparo) => {
        // Filtra consumos DESTE preparo
        const consumosDoPreparo = dadosConsumos?.filter(c => c.id_preparo === preparo.id) || []
        const totalSessoes = consumosDoPreparo.reduce((acc, curr) => acc + curr.quantidade_consumida, 0)

        // Filtra saídas/doações DESTE preparo
        const saidasExtras = dadosSaidas?.filter(s => s.preparo_id === preparo.id) || []
        const totalSaidas = saidasExtras.reduce((acc, curr) => acc + curr.quantidade, 0)

        // Total Consumido = Sessões + Saídas
        const totalConsumido = totalSessoes + totalSaidas

        const saldo = preparo.quantidade_preparada - totalConsumido
        somaTotal += saldo

        return { ...preparo, total_consumido: totalConsumido, saldo: saldo }
      }) || []

      setSaldoTotal(somaTotal)
      setPreparos(listaFinal)
      setLoading(false)
    }
    fetchEstoque()
  }, [])

  const busca = searchTerm.toLowerCase()
  const filtrados = preparos.filter(preparo => {
    const mestre = preparo.mestre_preparo?.toLowerCase() || ''
    const nucleo = preparo.nucleo_origem?.toLowerCase() || ''
    const grau = preparo.grau?.toLowerCase() || ''
    return mestre.includes(busca) || nucleo.includes(busca) || grau.includes(busca)
  })

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
        <Button asChild>
          <Link href="/novo-preparo"><Plus data-slot="icon" /> Novo preparo</Link>
        </Button>
      </div>

      {/* Saldo total */}
      <Card className="mb-6">
        <CardContent className="text-center py-2">
          <p className="text-sm text-muted-foreground">Saldo total disponível</p>
          {loading ? (
            <Skeleton className="h-12 w-40 mx-auto mt-2" />
          ) : (
            <p className="text-4xl font-semibold tabular-nums tracking-tight mt-1">
              {formatarNumero(saldoTotal)}{' '}
              <span className="text-lg font-normal text-muted-foreground">litros</span>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">Lotes individuais</h2>
        {!loading && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {filtrados.length} de {preparos.length}
          </span>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Buscar por mestre, núcleo ou grau…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar preparo"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-xl" />)
        ) : filtrados.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <Package className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {preparos.length === 0
                  ? 'Nenhum preparo registrado ainda.'
                  : 'Nenhum preparo corresponde à busca.'}
              </p>
              {preparos.length === 0 && (
                <Button variant="outline" asChild className="mt-4">
                  <Link href="/novo-preparo">Registrar primeiro preparo</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filtrados.map(preparo => {
            const isDoacao = preparo.tipo === 'Doação'
            const esgotado = preparo.saldo <= 0
            const percentual = preparo.quantidade_preparada > 0
              ? Math.max(0, (preparo.saldo / preparo.quantidade_preparada) * 100)
              : 0

            return (
              <Card key={preparo.id} className={cn('overflow-hidden transition-colors', !esgotado && 'hover:border-primary/40')}>
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-3 p-4 pb-3">
                    <Link href={`/estoque/${preparo.id}`} className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                      <Badge variant="outline" className="mb-2 gap-1">
                        {isDoacao ? <Truck data-slot="icon" /> : <Beaker data-slot="icon" />}
                        {isDoacao ? 'Doação externa' : 'Produção local'}
                      </Badge>

                      <h3 className={cn('font-medium leading-tight truncate', esgotado && 'text-muted-foreground')}>
                        {isDoacao ? preparo.nucleo_origem : `M. ${preparo.mestre_preparo}`}
                      </h3>

                      <p className="text-xs text-muted-foreground mt-1">
                        {formatarData(preparo.data_preparo)} · Grau {preparo.grau}
                        {isDoacao && ` · Resp. M. ${preparo.mestre_preparo}`}
                      </p>
                    </Link>

                    <div className="flex items-start gap-1 shrink-0">
                      <div className="text-right">
                        {esgotado ? (
                          <Badge variant="secondary">Esgotado</Badge>
                        ) : (
                          <>
                            <p className="text-xl font-semibold tabular-nums leading-none">
                              {formatarNumero(preparo.saldo)}
                              <span className="text-sm font-normal text-muted-foreground ml-1">L</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">restantes</p>
                          </>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" asChild aria-label="Editar preparo">
                        <Link href={`/editar-preparo/${preparo.id}`}><Pencil /></Link>
                      </Button>
                    </div>
                  </div>

                  <div className="px-4 pb-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Inicial: <span className="text-foreground tabular-nums">{formatarNumero(preparo.quantidade_preparada)} L</span></span>
                    <span>Consumido: <span className="text-foreground tabular-nums">{formatarNumero(preparo.total_consumido)} L</span></span>
                  </div>

                  {/* Barra de saldo restante */}
                  <div className="h-1 bg-muted" role="presentation">
                    <div className="h-full bg-primary transition-all" style={{ width: `${percentual}%` }} />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </>
  )
}
