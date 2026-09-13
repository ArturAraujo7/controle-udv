'use client'
import { useMemo, useState } from 'react'
import { RelatorioSessao, RelatorioPreparo, RelatorioSaida, RelatorioConsumo } from '@/hooks/useDashboardDados'
import { ArrowDownLeft, ArrowUpRight, History, Database, ArrowRight, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'

// Representação unificada para a Timeline
type Movimentacao = {
  id: string
  data: string
  tipo: 'entrada' | 'saida' | 'consumo' | 'historico'
  etiqueta_tipo: string
  descricao_principal: string
  descricao_secundaria: string
  quantidade: number
  badgeColor: string
  Icon: React.ElementType
}

interface TimelineMovimentacoesProps {
  sessoes: RelatorioSessao[]
  preparos: RelatorioPreparo[]
  saidas: RelatorioSaida[]
  consumos: RelatorioConsumo[]
  loading: boolean
}

export function TimelineMovimentacoes({ sessoes, preparos, saidas, consumos, loading }: TimelineMovimentacoesProps) {
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 20

  const movimentacoes = useMemo(() => {
    const arr: Movimentacao[] = []

    // 1. Preparos (Entradas)
    preparos.forEach(p => {
      arr.push({
        id: `p-${p.id}`,
        data: p.data_preparo, // A data do BD do preparo já vem como Date String (ou ISO sem T00)
        tipo: 'entrada',
        etiqueta_tipo: p.tipo_origem === 'doacao' ? 'Doação Recebida' : 'Preparo Local',
        descricao_principal: p.nucleo_origem ? `Origem: ${p.nucleo_origem}` : (p.mestre_preparo ? `Resp: ${p.mestre_preparo}` : 'Entrada Nova'),
        descricao_secundaria: `Lote #${p.id}`,
        quantidade: p.quantidade_preparada,
        badgeColor: 'bg-primary/10 text-primary border-primary/20',
        Icon: ArrowDownLeft
      })
    })

    // 2. Saídas (Doações Externas)
    saidas.forEach(s => {
      arr.push({
        id: `s-${s.id}`,
        data: s.data_saida,
        tipo: 'saida',
        etiqueta_tipo: 'Saída Autorizada',
        descricao_principal: `Destino: ${s.destino}`,
        descricao_secundaria: s.observacao ? `Obs: ${s.observacao}` : '',
        quantidade: s.quantidade,
        badgeColor: 'bg-destructive/10 text-destructive border-destructive/20',
        Icon: ArrowUpRight
      })
    })

    // 3. Consumos atrelados a Sessões
    sessoes.forEach(sessao => {
      // Diferenciar sessões reais de memórias
      if (sessao.quantidade_participantes === 0) {
        // Registro Histórico -> Não conta litros consumidos na lógica
        arr.push({
          id: `h-${sessao.id}`,
          data: sessao.data_realizacao, // Timestamp de Sessão
          tipo: 'historico',
          etiqueta_tipo: 'Memória Institucional',
          descricao_principal: `${sessao.tipo}`,
          descricao_secundaria: `Dirigente: ${sessao.dirigente || '—'}`,
          quantidade: 0,
          badgeColor: 'bg-muted text-muted-foreground border-transparent',
          Icon: History
        })
      } else {
        // Sessão Real -> Buscar Consumo
        const cons = consumos.filter(c => c.id_sessao === sessao.id)
        const somaConsumo = cons.reduce((acc, c) => acc + c.quantidade_consumida, 0)
        
        arr.push({
          id: `c-${sessao.id}`,
          data: sessao.data_realizacao,
          tipo: 'consumo',
          etiqueta_tipo: `Sessão ${sessao.tipo}`,
          descricao_principal: `Dirigente: ${sessao.dirigente || '—'}`,
          descricao_secundaria: `${sessao.quantidade_participantes} pessoas${sessao.tipo_delegacao ? ` • ${sessao.tipo_delegacao}` : ''}`,
          quantidade: somaConsumo,
          badgeColor: 'bg-secondary text-secondary-foreground border-transparent',
          Icon: Database
        })
      }
    })

    // Ordernar cronológico decrescente
    return arr.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  }, [preparos, saidas, sessoes, consumos])

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  if (movimentacoes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <History className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada no período.</p>
        </CardContent>
      </Card>
    )
  }

  const totalPaginas = Math.ceil(movimentacoes.length / itensPorPagina)
  const itensPaginados = movimentacoes.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina)

  return (
    <Card className="py-0 overflow-hidden print:border-none print:shadow-none">
      <div className="p-4 border-b print:hidden">
        <h3 className="font-medium">Rastreabilidade</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Extrato consolidado de entradas, consumos e saídas</p>
      </div>

      <ul className="divide-y">
        {itensPaginados.map((item) => (
          <li key={item.id} className="flex items-start gap-3 p-4 print:break-inside-avoid">
            <item.Icon className={cn(
              'w-4 h-4 shrink-0 mt-0.5',
              item.tipo === 'entrada' ? 'text-primary'
                : item.tipo === 'saida' ? 'text-destructive'
                  : 'text-muted-foreground'
            )} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate print:text-black">{item.descricao_principal}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.descricao_secundaria}</p>
                </div>

                <div className="text-right shrink-0">
                  {item.tipo !== 'historico' && (
                    <p className={cn(
                      'text-sm font-medium tabular-nums print:text-black',
                      item.tipo === 'entrada' ? 'text-primary' : 'text-destructive'
                    )}>
                      {item.tipo === 'entrada' ? '+' : '−'}{formatarNumero(item.quantidade)}
                      <span className="text-xs font-normal text-muted-foreground ml-0.5">L</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{formatarData(item.data)}</p>
                </div>
              </div>

              <span className={cn(
                'inline-flex items-center text-xs px-2 py-0.5 rounded-md border mt-2',
                item.badgeColor,
                'print:border-gray-400 print:text-black print:bg-transparent'
              )}>
                {item.etiqueta_tipo}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {totalPaginas > 1 && (
        <div className="p-4 border-t flex items-center justify-between print:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            aria-label="Página anterior"
          >
            <ArrowLeft />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
            aria-label="Próxima página"
          >
            <ArrowRight />
          </Button>
        </div>
      )}
    </Card>
  )
}
