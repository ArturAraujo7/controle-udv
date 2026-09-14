'use client'

import { Globe2 } from 'lucide-react'

import { Vazio } from '@/components/comum/Lista'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useRegional } from './EscopoRegional'

/** Carregamento (ou erro) das telas regionais. */
export function CarregandoRegional() {
  const { erro } = useRegional()
  if (erro) {
    return <Vazio icone={<Globe2 />}>{erro}</Vazio>
  }
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-14 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  )
}

/** Etiqueta com o nome do núcleo, na cor da visão regional. */
export function BadgeNucleo({ nome, className }: { nome: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200', className)}
    >
      {nome}
    </Badge>
  )
}

/** Controle segmentado com botões (abas dentro da mesma tela). */
export function Segmentos<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
  className,
}: {
  opcoes: { valor: T; rotulo: string }[]
  valor: T
  onChange: (valor: T) => void
  rotulo: string
  className?: string
}) {
  return (
    <nav
      aria-label={rotulo}
      className={cn('mb-5 grid auto-cols-fr grid-flow-col rounded-lg bg-muted p-[3px] print:hidden', className)}
    >
      {opcoes.map(o => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          aria-current={valor === o.valor ? 'page' : undefined}
          className={cn(
            'rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm',
            valor === o.valor ? 'bg-background text-foreground shadow-sm dark:bg-input/40' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </nav>
  )
}

export function NotaSomenteLeitura({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 rounded-xl border border-dashed px-4 py-3 text-xs text-muted-foreground print:hidden">
      {children}
    </p>
  )
}
