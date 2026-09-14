'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { podeEditar } from '@/lib/permissoes'
import { cn } from '@/lib/utils'
import { BotaoRegistrar } from './QuickActionSheet'
import { ehRotaRegional, estaAtiva, navDaRota } from './rotas'

/** Barra de abas flutuante (celular) com o botão "+" de registro rápido ao lado. */
export function BottomNav() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const itens = navDaRota(pathname)
  const indice = itens.findIndex(item => estaAtiva(pathname, item))
  // A visão regional é somente leitura: sem botão +
  const mostrarRegistrar = !ehRotaRegional(pathname) && podeEditar(profile)

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 flex items-center gap-3 md:hidden print:hidden">
      <nav
        aria-label="Navegação principal"
        className="flex-1 rounded-full border bg-background/85 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/40"
      >
        <div className="relative">
          {indice >= 0 && (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-muted transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(${indice * 100}%)` }}
            />
          )}
          <ul className="relative grid grid-cols-4">
            {itens.map((item, i) => {
              const ativa = i === indice
              const Icone = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={ativa ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      ativa ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <Icone className="size-5" strokeWidth={ativa ? 2.25 : 1.75} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {mostrarRegistrar && <BotaoRegistrar />}
    </div>
  )
}
