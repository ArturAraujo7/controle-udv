'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

/** Controle segmentado feito de links — mantém o voltar do navegador funcionando. */
export function SubNav({ itens, className }: { itens: { href: string; rotulo: string }[]; className?: string }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Seções"
      className={cn('mb-5 grid auto-cols-fr grid-flow-col rounded-lg bg-muted p-[3px]', className)}
    >
      {itens.map(({ href, rotulo }) => {
        const ativo = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              ativo
                ? 'bg-background text-foreground shadow-sm dark:bg-input/40'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {rotulo}
          </Link>
        )
      })}
    </nav>
  )
}

export const SUBNAV_ESTOQUE = [
  { href: '/estoque', rotulo: 'Lotes' },
  { href: '/estoque/movimentacoes', rotulo: 'Movimentações' },
]

export const SUBNAV_SESSOES = [
  { href: '/sessoes', rotulo: 'Sessões' },
  { href: '/membros', rotulo: 'Membros' },
]
