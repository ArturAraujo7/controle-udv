import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Cartão de indicador (KPI). */
export function Indicador({
  rotulo,
  valor,
  unidade,
  detalhe,
  variacao,
  carregando,
  className,
}: {
  rotulo: string
  valor: React.ReactNode
  unidade?: string
  detalhe?: React.ReactNode
  /** Variação percentual vs. período anterior; `null` = sem base de comparação. */
  variacao?: number | null
  carregando?: boolean
  className?: string
}) {
  return (
    <Card className={cn('gap-0 py-3.5', className)}>
      <CardContent className="space-y-1">
        <p className="text-xs text-muted-foreground">{rotulo}</p>
        {carregando ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {valor}
            {unidade && <span className="ml-1 text-sm font-normal text-muted-foreground">{unidade}</span>}
          </p>
        )}
        {variacao !== undefined && !carregando && <Variacao valor={variacao} />}
        {detalhe && <p className="text-[11px] text-muted-foreground">{detalhe}</p>}
      </CardContent>
    </Card>
  )
}

export function Variacao({ valor }: { valor: number | null }) {
  if (valor === null || !Number.isFinite(valor)) {
    return <p className="text-[11px] text-muted-foreground">sem base de comparação</p>
  }
  const arredondado = Math.round(valor)
  const sobe = arredondado >= 0
  return (
    <p className={cn('text-[11px] font-medium tabular-nums', sobe ? 'text-primary' : 'text-destructive')}>
      <span aria-hidden="true">{sobe ? '▲' : '▼'}</span> {Math.abs(arredondado)}%
      <span className="font-normal text-muted-foreground"> vs. período anterior</span>
    </p>
  )
}

/** Linha de 2–3 números lado a lado dentro de um cartão. */
export function ResumoLinha({
  itens,
  carregando,
  className,
}: {
  itens: { rotulo: string; valor: React.ReactNode; className?: string }[]
  carregando?: boolean
  className?: string
}) {
  return (
    <Card className={cn('py-3.5', className)}>
      <CardContent className={cn('grid gap-3', itens.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {itens.map(item => (
          <div key={item.rotulo} className="min-w-0">
            <p className="text-[11px] leading-tight text-muted-foreground">{item.rotulo}</p>
            {carregando ? (
              <Skeleton className="mt-1 h-6 w-14" />
            ) : (
              <p className={cn('mt-1 text-lg font-semibold tabular-nums tracking-tight', item.className)}>{item.valor}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** Barra fina de saldo restante. */
export function BarraSaldo({
  percentual,
  tom = 'normal',
  className,
}: {
  percentual: number
  tom?: 'normal' | 'alerta' | 'neutro'
  className?: string
}) {
  const largura = Math.max(0, Math.min(100, percentual))
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-muted', className)} role="presentation">
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none',
          tom === 'alerta' ? 'bg-amber-500' : tom === 'neutro' ? 'bg-muted-foreground/40' : 'bg-primary'
        )}
        style={{ width: `${largura}%` }}
      />
    </div>
  )
}
