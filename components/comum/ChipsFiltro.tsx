'use client'

import { cn } from '@/lib/utils'

export type OpcaoChip<T extends string> = {
  valor: T
  rotulo: string
  contagem?: number
}

/** Filtro de escolha única em chips; rola na horizontal no celular. */
export function ChipsFiltro<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
  className,
}: {
  opcoes: OpcaoChip<T>[]
  valor: T
  onChange: (valor: T) => void
  /** Nome acessível do grupo. */
  rotulo: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={cn(
        '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {opcoes.map(opcao => {
        const ativo = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(opcao.valor)}
            className={cn(
              'h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              ativo
                ? 'border-foreground bg-foreground text-background'
                : 'bg-card text-foreground hover:bg-muted'
            )}
          >
            {opcao.rotulo}
            {opcao.contagem !== undefined && (
              <span className="ml-1.5 tabular-nums opacity-60">{opcao.contagem}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
