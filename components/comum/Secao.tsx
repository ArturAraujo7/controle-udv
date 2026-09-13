import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Bloco de conteúdo com título e ação opcional à direita. */
export function Secao({
  titulo,
  acao,
  id,
  className,
  children,
}: {
  titulo: React.ReactNode
  acao?: React.ReactNode
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn('mt-8 scroll-mt-20 first:mt-0', className)}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight">{titulo}</h2>
        {acao && <div className="shrink-0 text-sm text-muted-foreground">{acao}</div>}
      </div>
      {children}
    </section>
  )
}

export function LinkSecao({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 rounded-md font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
      <ChevronRight className="size-3.5" />
    </Link>
  )
}

/** Título da tela, com link de voltar e ações opcionais. */
export function Cabecalho({
  titulo,
  descricao,
  acoes,
  voltar,
  className,
}: {
  titulo: React.ReactNode
  descricao?: React.ReactNode
  acoes?: React.ReactNode
  voltar?: { href: string; rotulo: string }
  className?: string
}) {
  return (
    <div className={cn('mb-5', className)}>
      {voltar && <VoltarLink {...voltar} />}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight md:text-2xl">{titulo}</h1>
          {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
        </div>
        {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
      </div>
    </div>
  )
}

export function VoltarLink({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <Link
      href={href}
      className="-ml-1.5 mb-2 inline-flex items-center gap-0.5 rounded-md px-1 py-1 text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ChevronLeft className="size-4" />
      {rotulo}
    </Link>
  )
}
