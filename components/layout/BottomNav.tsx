'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV_PRINCIPAL, estaAtiva } from './rotas'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {NAV_PRINCIPAL.map(({ href, label, icon: Icon }) => {
          const ativa = estaAtiva(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativa ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors',
                  ativa ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
