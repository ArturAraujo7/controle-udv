import { cn } from '@/lib/utils'

/** Dia e mês empilhados — início de linhas de sessão. */
export function DataBloco({ iso, className }: { iso: string; className?: string }) {
  const data = new Date(iso)
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' })
  const mes = data.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')

  return (
    <span
      className={cn('flex size-11 flex-col items-center justify-center rounded-lg bg-muted leading-none', className)}
      aria-hidden="true"
    >
      <span className="text-base font-semibold tabular-nums">{dia}</span>
      <span className="mt-0.5 text-[10px] uppercase text-muted-foreground">{mes}</span>
    </span>
  )
}
