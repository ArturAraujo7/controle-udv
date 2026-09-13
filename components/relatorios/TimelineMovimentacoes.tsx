'use client'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, History } from 'lucide-react'

import { ListaCard, Vazio } from '@/components/comum/Lista'
import { ItemMovimentacao } from '@/components/estoque/ItemMovimentacao'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Movimentacao } from '@/lib/estoque'

const POR_PAGINA = 20

/** Extrato do período com saldo acumulado; na impressão mostra todas as linhas. */
export function TimelineMovimentacoes({
  movimentacoes,
  loading,
  podeEditar,
  mostrarTudo = false,
}: {
  movimentacoes: Movimentacao[]
  loading: boolean
  podeEditar: boolean
  mostrarTudo?: boolean
}) {
  const [pagina, setPagina] = useState(1)

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  if (movimentacoes.length === 0) {
    return <Vazio icone={<History />}>Nenhuma movimentação registrada no período.</Vazio>
  }

  const totalPaginas = Math.ceil(movimentacoes.length / POR_PAGINA)
  const paginaValida = Math.min(pagina, totalPaginas)
  const visiveis = mostrarTudo
    ? movimentacoes
    : movimentacoes.slice((paginaValida - 1) * POR_PAGINA, paginaValida * POR_PAGINA)

  return (
    <div className="space-y-3">
      <p className="px-1 text-xs text-muted-foreground">
        Entradas, consumos e saídas do período, com o saldo total do estoque após cada movimentação.
      </p>
      <ListaCard className="print:ring-0">
        {visiveis.map(mov => (
          <ItemMovimentacao key={mov.id} mov={mov} podeEditar={podeEditar} mostrarSaldo />
        ))}
      </ListaCard>

      {!mostrarTudo && totalPaginas > 1 && (
        <div className="flex items-center justify-between print:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPagina(Math.max(1, paginaValida - 1))}
            disabled={paginaValida === 1}
            aria-label="Página anterior"
          >
            <ArrowLeft />
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            Página {paginaValida} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPagina(Math.min(totalPaginas, paginaValida + 1))}
            disabled={paginaValida === totalPaginas}
            aria-label="Próxima página"
          >
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  )
}
