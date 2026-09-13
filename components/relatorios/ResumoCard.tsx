import { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ResumoCardProps {
  titulo: string
  valor: string | number
  subtitulo: string
  /** Ícone opcional exibido junto ao título. */
  icone?: ReactNode
  destaque?: boolean
}

export function ResumoCard({ titulo, valor, subtitulo, icone, destaque = false }: ResumoCardProps) {
  return (
    <Card className={cn(
      'h-full print:break-inside-avoid print:shadow-none',
      destaque && 'border-primary/40'
    )}>
      <CardContent className="flex flex-col h-full justify-between gap-1">
        <p className={cn(
          'text-xs flex items-center gap-1.5',
          destaque ? 'text-primary' : 'text-muted-foreground'
        )}>
          {icone}
          {titulo}
        </p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight print:text-black">{valor}</p>
        <p className="text-xs text-muted-foreground">{subtitulo}</p>
      </CardContent>
    </Card>
  )
}
