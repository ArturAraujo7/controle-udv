import { ArrowDownLeft, ArrowUpRight, Droplets } from 'lucide-react'

import { IconeLinha, ItemLista, ValorLinha } from '@/components/comum/Lista'
import type { Movimentacao } from '@/lib/estoque'
import { formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'

const ICONE = {
  entrada: ArrowDownLeft,
  consumo: Droplets,
  saida: ArrowUpRight,
}

/** Destino ao tocar: lote, sessão ou edição da saída (só para quem edita). */
export function hrefMovimentacao(mov: Movimentacao, podeEditar: boolean) {
  if (mov.tipo === 'entrada') return `/estoque/${mov.refId}`
  if (mov.tipo === 'consumo') return `/sessoes/${mov.refId}`
  return podeEditar ? `/editar-saida/${mov.refId}` : undefined
}

export function ItemMovimentacao({
  mov,
  podeEditar,
  mostrarSaldo = false,
}: {
  mov: Movimentacao
  podeEditar: boolean
  mostrarSaldo?: boolean
}) {
  const Icone = ICONE[mov.tipo]
  const entrada = mov.tipo === 'entrada'

  return (
    <ItemLista
      href={hrefMovimentacao(mov, podeEditar)}
      inicio={
        <IconeLinha className={cn(entrada && 'bg-primary/10 text-primary', mov.tipo === 'saida' && 'bg-destructive/10 text-destructive')}>
          <Icone />
        </IconeLinha>
      }
      titulo={mov.titulo}
      subtitulo={`${formatarData(mov.data)} · ${mov.subtitulo}`}
      fim={
        <ValorLinha
          valor={`${entrada ? '+' : '−'}${formatarNumero(mov.quantidade)} L`}
          detalhe={mostrarSaldo ? `saldo ${formatarNumero(mov.saldoApos)} L` : undefined}
          className={entrada ? 'text-primary' : undefined}
        />
      }
    />
  )
}
